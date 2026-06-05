import { GoogleGenerativeAI } from '@google/generative-ai';
import { Redis } from '@upstash/redis';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import mammoth from 'mammoth';

// ─── Clients ──────────────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Safely initialize Redis if credentials are provided
let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
}

function getSupabaseAdmin() {
    return createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
}

// ─── Core Job Processor ───────────────────────────────────────────────────────

export async function runAnalysisJob({
    analysisId,
    filePath,
    fileName,
    fileType,
    totalMarks,
    syllabus,
    pattern,
}) {
    const supabase = getSupabaseAdmin();

    try {
        console.log(`[Processor] Starting analysis job for ${analysisId}...`);

        // ─── Mark as processing ───────────────────────────────────────────
        await supabase
            .from('analyses')
            .update({ status: 'processing' })
            .eq('id', analysisId);

        // ─── Download question paper from Storage ─────────────────────────
        console.log(`[Processor] Downloading question paper from storage: ${filePath}...`);
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('papers')
            .download(filePath);

        if (downloadError) {
            throw new Error(`Storage download failed: ${downloadError.message}`);
        }

        // Reconstruct a File-like object so processFileInput() works as-is
        const questionPaperFile = new File([fileData], fileName || 'file', {
            type: fileType || 'application/octet-stream',
        });

        // ─── Build contentParts ───────────────────────────────────────────
        const contentParts = [];

        const qpParts = await processFileInput(questionPaperFile, 'Question Paper');
        contentParts.push(...qpParts);

        let syllabusText = null;
        let s = 0;

        if (syllabus) {
            if (syllabus.type === 'text') {
                syllabusText = syllabus.value;
                s = 0;
            } else if (syllabus.type === 'file') {
                console.log(`[Processor] Downloading syllabus from storage: ${syllabus.path}...`);
                const syllabusFile = await downloadAsFile(supabase, syllabus.path, syllabus.name, syllabus.mimeType);
                const syllabusParts = await processFileInput(syllabusFile, 'Syllabus');
                contentParts.push(...syllabusParts);
                s = 1;
            }
        }

        let patternText = null;
        let p = 0;

        if (pattern) {
            if (pattern.type === 'text') {
                patternText = pattern.value;
                p = 0;
            } else if (pattern.type === 'file') {
                console.log(`[Processor] Downloading paper pattern from storage: ${pattern.path}...`);
                const patternFile = await downloadAsFile(supabase, pattern.path, pattern.name, pattern.mimeType);
                const patternParts = await processFileInput(patternFile, 'Paper Pattern');
                contentParts.push(...patternParts);
                p = 1;
            }
        }

        const prompt = buildPrompt(totalMarks, s, p, syllabusText, patternText);
        contentParts.push({ text: prompt });

        // ─── Provider switching with Redis cooldowns ──────────────────

        let geminiCooldownUntil = 0;
        let groqCooldownUntil = 0;

        if (redis) {
            const [geminiCooldown, groqCooldown] = await Promise.all([
                redis.get('cooldown:gemini'),
                redis.get('cooldown:groq'),
            ]);
            const now = Date.now();
            geminiCooldownUntil = geminiCooldown ?? 0;
            groqCooldownUntil = groqCooldown ?? 0;
        }

        let responseText = null;

        // 1️⃣  Gemini 2.0 Flash (primary)
        if (!geminiCooldownUntil) {
            try {
                console.log('[Provider] Trying Gemini...');
                const model = genAI.getGenerativeModel({
                    model: 'gemini-2.5-flash',
                    generationConfig: {
                        temperature: 0,
                        responseMimeType: 'application/json',
                    }
                });
                const result = await model.generateContent(contentParts);
                responseText = result.response.text();
                console.log('[Provider] Gemini succeeded');
            } catch (geminiError) {
                console.error('[Provider] Gemini failed:', geminiError.message);

                // Set cooldown for transient/rate-limit errors so we skip this provider briefly
                if (isRateLimitError(geminiError)) {
                    const delay = getRetryDelay(geminiError.message);
                    if (redis) await redis.set('cooldown:gemini', Date.now() + delay, { px: delay });
                    console.warn(`[Provider] Gemini rate limited — cooldown ${delay / 1000}s`);
                } else if (isTransientError(geminiError)) {
                    const delay = 5000;
                    if (redis) await redis.set('cooldown:gemini', Date.now() + delay, { px: delay });
                    console.warn(`[Provider] Gemini busy — cooldown ${delay / 1000}s`);
                } else {
                    console.warn('[Provider] Gemini permanent error — falling through to next provider');
                }
                // Always fall through to next provider — never throw from a provider catch block
            }
        } else {
            const remaining = Math.ceil((geminiCooldownUntil - Date.now()) / 1000);
            console.log(`[Provider] Gemini still in cooldown (${remaining}s left) — skipping`);
        }

        // 2️⃣  Llama 4 Scout @ Groq
        if (!responseText && !groqCooldownUntil) {
            try {
                console.log('[Provider] Trying Llama 4 Scout @ Groq...');
                const textOnlyPrompt = buildTextOnlyPrompt(contentParts, prompt);
                responseText = await callGroqLlama(textOnlyPrompt);
                console.log('[Provider] Groq succeeded');
            } catch (groqError) {
                console.error('[Provider] Groq failed:', groqError.message);

                // Set cooldown for transient/rate-limit errors so we skip this provider briefly
                if (isRateLimitError(groqError)) {
                    const delay = getRetryDelay(groqError.message);
                    if (redis) await redis.set('cooldown:groq', Date.now() + delay, { px: delay });
                    console.warn(`[Provider] Groq rate limited — cooldown ${delay / 1000}s`);
                } else if (isTransientError(groqError)) {
                    const delay = 5000;
                    if (redis) await redis.set('cooldown:groq', Date.now() + delay, { px: delay });
                    console.warn(`[Provider] Groq busy — cooldown ${delay / 1000}s`);
                } else {
                    console.warn('[Provider] Groq permanent error — falling through to next provider');
                }
                // Always fall through to next provider — never throw from a provider catch block
            }
        } else if (!responseText) {
            const remaining = Math.ceil((groqCooldownUntil - Date.now()) / 1000);
            console.log(`[Provider] Groq still in cooldown (${remaining}s left) — skipping`);
        }

        // 3️⃣  OpenRouter (final fallback)
        if (!responseText) {
            console.log('[Provider] Trying OpenRouter...');
            const textOnlyPrompt = buildTextOnlyPrompt(contentParts, prompt);
            responseText = await callOpenRouter(textOnlyPrompt);
            console.log('[Provider] OpenRouter succeeded');
        }

        // ─── Parse response ───────────────────────────────────────────────

        const cleanJSON = responseText
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        const analysisResult = JSON.parse(cleanJSON);

        // ─── Save result ──────────────────────────────────────────────────

        await supabase
            .from('analyses')
            .update({ status: 'done', report: analysisResult })
            .eq('id', analysisId);

        console.log(`[Processor] Analysis job for ${analysisId} completed successfully.`);
        return { success: true };

    } catch (error) {
        console.error(`[process-job] Error for analysis ${analysisId}:`, error.message);

        await supabase
            .from('analyses')
            .update({ status: 'failed', report: { error: error.message } })
            .eq('id', analysisId);

        throw error;
    }
}

// ─── Helper: download a file from Storage and return a File object ────────────

async function downloadAsFile(supabase, path, name, mimeType) {
    const { data, error } = await supabase.storage.from('papers').download(path);
    if (error) throw new Error(`Storage download failed for ${path}: ${error.message}`);
    return new File([data], name || 'file', { type: mimeType || 'application/octet-stream' });
}

// ─── Provider helpers ─────────────────────────────────────────────────────────

function getRetryDelay(errorMessage) {
    const match = (errorMessage || '').match(/retry in (\d+(\.\d+)?)s/i);
    return match ? Math.ceil(parseFloat(match[1])) * 1000 : 60 * 1000;
}

function isRateLimitError(error) {
    const msg = (error.message || '').toLowerCase();
    const status = error.status || error.statusCode || error?.response?.status;
    return (
        status === 429 ||
        msg.includes('429') ||
        msg.includes('rate limit') ||
        msg.includes('quota') ||
        msg.includes('resource_exhausted') ||
        msg.includes('too many requests')
    );
}

function isTransientError(error) {
    const msg = (error.message || '').toLowerCase();
    const status = error.status || error.statusCode || error?.response?.status;

    const isRateLimit = (
        status === 429 ||
        msg.includes('429') ||
        msg.includes('rate limit') ||
        msg.includes('quota') ||
        msg.includes('resource_exhausted') ||
        msg.includes('too many requests')
    );

    const isBusy = (
        status === 503 ||
        status === 502 ||
        status === 500 ||
        msg.includes('service unavailable') ||
        msg.includes('overloaded') ||
        msg.includes('currently loading') ||
        msg.includes('model is loading') ||
        msg.includes('bad gateway') ||
        msg.includes('server error') ||
        msg.includes('capacity')
    );

    const isTimeout = (
        error.name === 'AbortError' ||
        msg.includes('timeout') ||
        msg.includes('aborted')
    );

    return isRateLimit || isBusy || isTimeout;
}

async function callGroqLlama(prompt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
        const response = await fetch(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 4096,
                    temperature: 0,
                }),
                signal: controller.signal,
            }
        );

        if (!response.ok) {
            const err = await response.text();
            const error = new Error(`Groq error: ${err}`);
            error.status = response.status;
            throw error;
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } finally {
        clearTimeout(timeout);
    }
}

async function callOpenRouter(prompt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
        const response = await fetch(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'meta-llama/llama-4-scout:free',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 4096,
                    temperature: 0,
                }),
                signal: controller.signal,
            }
        );

        if (!response.ok) {
            const err = await response.text();
            const error = new Error(`OpenRouter error: ${err}`);
            error.status = response.status;
            throw error;
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } finally {
        clearTimeout(timeout);
    }
}

// ─── Text-only prompt builder (for text-only fallbacks) ──────────────────────

function buildTextOnlyPrompt(contentParts, finalPrompt) {
    const textPieces = contentParts
        .filter(part => part.text && part.text !== finalPrompt)
        .map(part => part.text);

    const hasImages = contentParts.some(part => part.inlineData);
    const imageNote = hasImages
        ? '\n[Note: The original question paper was an image/PDF. ' +
        'Analyse based on any text context provided above.]\n'
        : '';

    return [...textPieces, imageNote, finalPrompt].join('\n\n');
}

// ─── File processing ──────────────────────────────────────────────────────────

async function processFileInput(file, label) {
    const fileType = file.type || '';
    const fileName = file.name || '';
    const isDocx =
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.endsWith('.docx');

    if (isDocx) {
        const bytes = await file.arrayBuffer();
        const result = await mammoth.convertToMarkdown({ arrayBuffer: bytes });
        return [{ text: `${label} (converted from docx):\n${result.value}` }];
    } else {
        const bytes = await file.arrayBuffer();
        return [
            { text: `${label}:` },
            {
                inlineData: {
                    data: Buffer.from(bytes).toString('base64'),
                    mimeType: fileType || 'application/pdf',
                },
            },
        ];
    }
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(totalMarks, s, p, syllabusText, patternText) {
    let context = `- Total marks stated by teacher: ${totalMarks}\n`;

    if (s === 0 && syllabusText) {
        context += `- Syllabus: ${syllabusText}\n`;
    } else {
        context += `- Syllabus is provided as an attachment\n`;
    }

    if (p === 0 && patternText) {
        context += `- Paper pattern: ${patternText}\n`;
    } else if (p === 1) {
        context += `- Paper pattern is provided as an attachment\n`;
    } else {
        context += `- No paper pattern provided\n`;
    }

    return `
    You are a strict but fair question paper auditor. Your job is to find REAL, MEANINGFUL errors only.

    CONTEXT:
    ${context}

    ━━━ WHAT COUNTS AS AN ERROR ━━━

    LANGUAGE errors (critical) — only flag if it would genuinely confuse a student:
    ✓ Clear spelling mistakes (e.g. "explian" instead of "explain")
    ✓ Grammatically broken sentences that are hard to understand
    ✓ Missing or wrong key technical terms that change meaning
    ✗ DO NOT flag: British vs American spelling differences
    ✗ DO NOT flag: minor stylistic choices or informal phrasing
    ✗ DO NOT flag: punctuation unless it changes the meaning entirely

    STRUCTURE errors (warning) — layout and organisation problems:
    ✓ Questions without numbering or with duplicate numbers
    ✓ Sub-parts labelled inconsistently (mix of a/b/c and i/ii/iii)
    ✓ Instructions missing (e.g. no "Answer any 5" directive)
    ✗ DO NOT flag: personal preference on question ordering

    MARKS errors (critical) — anything that makes marks add up wrongly:
    ✓ Total of all question marks ≠ stated total marks
    ✓ A question has no mark allocation
    ✓ Marks stated in instructions contradict marks on questions
    ✗ DO NOT flag if total marks match exactly

    SYLLABUS errors (warning) — only if syllabus was provided:
    ✓ A question clearly tests a topic not in the syllabus
    ✗ DO NOT flag if no syllabus was provided
    ✗ DO NOT flag related or applied topics as out-of-syllabus

    LOGICAL errors (critical) — questions that cannot be answered correctly:
    ✓ A question has no correct answer or multiple contradicting correct answers
    ✓ A question references a figure/table/appendix that is not in the paper
    ✓ Dates, values, or facts in the question are factually impossible
    ✗ DO NOT flag questions just because they are difficult or unusual

    ━━━ SEVERITY GUIDE ━━━
    critical  → blocks printing, student cannot answer correctly, or marks are wrong
    warning   → should be fixed but paper is still usable

    ━━━ CONSERVATIVE COUNTING RULE ━━━
    - If the same spelling mistake appears in 3 questions, that is 3 separate errors
    - If the same TYPE of mistake appears everywhere, flag the worst 3 and note "and similar in other questions" in the issue description — do not list 20+ identical items
    - A well-written paper of 20 questions should have 0–8 real errors total
    - If you find yourself listing 20+ errors, you are over-flagging — review and remove anything borderline

    ━━━ OUTPUT FORMAT ━━━
    Return ONLY this JSON, no markdown, no explanation:

    {
        "healthScore": 72,
        "verdict": "Needs Revision",
        "totalErrors": 12,
        "critical": 3,
        "warnings": 6,
        "suggestions": 3,
        "priorityFixes": [
            {
                "id": 1,
                "title": "error title",
                "description": "what the error is and why it matters",
                "category": "Marks",
                "severity": "critical"
            }
        ],
        "errorCategories": {
            "language": {
                "title": "Language & Grammar",
                "count": 4,
                "severity": "critical",
                "items": [
                    {
                        "id": 1,
                        "question": "Q2",
                        "type": "Spelling mistake",
                        "issue": "specific description — quote the wrong word and the correction"
                    }
                ]
            },
            "structure": { "title": "Structure & Formatting", "count": 0, "severity": "warning", "items": [] },
            "marks": { "title": "Marks Allocation", "count": 0, "severity": "critical", "items": [] },
            "syllabus": { "title": "Syllabus Alignment", "count": 0, "severity": "warning", "items": [] },
            "logical": { "title": "Logical & Fact Errors", "count": 0, "severity": "critical", "items": [] }
        },
        "cleanQuestions": ["Q1", "Q3"],
        "errorBreakdown": [
            { "label": "Language", "count": 4, "color": "bg-error" },
            { "label": "Structure", "count": 2, "color": "bg-amber-500" },
            { "label": "Marks", "count": 3, "color": "bg-error" },
            { "label": "Syllabus", "count": 2, "color": "bg-amber-500" },
            { "label": "Logical", "count": 1, "color": "bg-error" }
        ]
    }

    ━━━ FINAL RULES ━━━
    - totalErrors = critical + warnings + suggestions (must add up exactly)
    - healthScore: 90–100 = Ready to Print, 70–89 = Needs Revision, 0–69 = Critical Issues Found
    - verdict must match the healthScore range above
    - cleanQuestions: only questions with zero errors of any kind
    - priorityFixes: top 3 most important errors only, sorted by severity
    - color for errorBreakdown: "bg-error" if severity critical, "bg-amber-500" if warning
    `;
}
