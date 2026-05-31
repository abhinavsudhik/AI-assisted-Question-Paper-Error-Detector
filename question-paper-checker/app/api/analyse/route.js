import { GoogleGenerativeAI } from '@google/generative-ai';
import mammoth from 'mammoth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Module-level provider state ─────────────────────────────────────────────
// These persist across requests for the lifetime of the server process

let geminiCooldownUntil = 0;   // timestamp (ms) when Gemini is usable again; 0 = available now
let hfCooldownUntil = 0;       // timestamp (ms) when HuggingFace is usable again; 0 = available now

function getRetryDelay(errorMessage) {
    // Gemini tells you exactly: "Please retry in 26.4s"
    const match = (errorMessage || '').match(/retry in (\d+(\.\d+)?)s/i);
    return match ? Math.ceil(parseFloat(match[1])) * 1000 : 60 * 1000; // default 60s
}

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request) {
    try {
        const formData = await request.formData();

        const questionPaper = formData.get('questionPaper');
        const syllabus = formData.get('syllabus');
        const totalMarks = formData.get('totalMarks');
        const pattern = formData.get('pattern');

        if (!questionPaper) {
            return Response.json({ error: 'Question paper is required' }, { status: 400 });
        }
        if (!totalMarks) {
            return Response.json({ error: 'Total marks is required' }, { status: 400 });
        }

        // Build contentParts for Gemini (vision-capable: inline base64)
        const contentParts = [];

        const qpParts = await processFileInput(questionPaper, 'Question Paper');
        contentParts.push(...qpParts);

        let syllabusText = null;
        let s = 0;

        if (typeof syllabus === 'string') {
            syllabusText = syllabus;
            s = 0;
        } else if (syllabus && typeof syllabus === 'object' && syllabus.arrayBuffer) {
            const syllabusParts = await processFileInput(syllabus, 'Syllabus');
            contentParts.push(...syllabusParts);
            s = 1;
        }

        let patternText = null;
        let p = 0;

        if (pattern) {
            if (typeof pattern === 'string') {
                patternText = pattern;
                p = 0;
            } else if (typeof pattern === 'object' && pattern.arrayBuffer) {
                const patternParts = await processFileInput(pattern, 'Paper Pattern');
                contentParts.push(...patternParts);
                p = 1;
            }
        }

        const prompt = buildPrompt(totalMarks, s, p, syllabusText, patternText);
        contentParts.push({ text: prompt });

        // ─── Provider switching with cooldown ─────────────────────────────────

        const now = Date.now();

        // Check if cooldowns have expired and log the recovery
        if (geminiCooldownUntil && now > geminiCooldownUntil) {
            console.log('[Provider] Gemini cooldown expired — back to primary');
            geminiCooldownUntil = 0;
        }
        if (hfCooldownUntil && now > hfCooldownUntil) {
            console.log('[Provider] HuggingFace cooldown expired — available again');
            hfCooldownUntil = 0;
        }

        let responseText = null;

        // 1️⃣  Gemini 2.5 Flash (primary — skip if still in cooldown)
        if (!geminiCooldownUntil) {
            try {
                console.log('[Provider] Trying Gemini...');
                const model = genAI.getGenerativeModel({
                    model: 'gemini-2.5-flash',
                    generationConfig: {
                        temperature: 0,        // no randomness
                        responseMimeType: 'application/json',  // forces pure JSON output too
                    }
                });
                const result = await model.generateContent(contentParts);
                responseText = result.response.text();
                console.log('[Provider] Gemini succeeded');
            } catch (geminiError) {
                if (!isRateLimitError(geminiError)) throw geminiError;

                const delay = getRetryDelay(geminiError.message);
                geminiCooldownUntil = Date.now() + delay;
                console.warn(`[Provider] Gemini rate limited — cooldown for ${delay / 1000}s (until ${new Date(geminiCooldownUntil).toISOTimeString()})`);
            }
        } else {
            const remaining = Math.ceil((geminiCooldownUntil - now) / 1000);
            console.log(`[Provider] Gemini still in cooldown (${remaining}s left) — skipping`);
        }

        // 2️⃣  Qwen2.5-VL-7B @ HuggingFace (skip if still in cooldown)
        if (!responseText && !hfCooldownUntil) {
            try {
                console.log('[Provider] Trying Qwen @ HuggingFace...');
                const textOnlyPrompt = buildTextOnlyPrompt(contentParts, prompt);
                responseText = await callQwenHuggingFace(textOnlyPrompt);
                console.log('[Provider] HuggingFace succeeded');
            } catch (hfError) {
                if (!isRateLimitError(hfError)) throw hfError;

                const delay = getRetryDelay(hfError.message);
                hfCooldownUntil = Date.now() + delay;
                console.warn(`[Provider] HuggingFace rate limited — cooldown for ${delay / 1000}s`);
            }
        } else if (!responseText) {
            const remaining = Math.ceil((hfCooldownUntil - now) / 1000);
            console.log(`[Provider] HuggingFace still in cooldown (${remaining}s left) — skipping`);
        }

        // 3️⃣  Qwen2.5-VL-7B @ SambaNova (final fallback — no cooldown tracking needed,
        //     if this also fails we throw and return 500 to the user)
        if (!responseText) {
            console.log('[Provider] Trying Qwen @ SambaNova...');
            const textOnlyPrompt = buildTextOnlyPrompt(contentParts, prompt);
            responseText = await callQwenSambaNova(textOnlyPrompt);
            console.log('[Provider] SambaNova succeeded');
        }

        // ─── Parse response ───────────────────────────────────────────────────

        const cleanJSON = responseText
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        const analysisResult = JSON.parse(cleanJSON);

        return Response.json({ success: true, data: analysisResult });

    } catch (error) {
        console.error('Analysis error:', error.message);
        return Response.json(
            { error: error.message || 'Analysis failed. Please try again.' },
            { status: 500 }
        );
    }
}

// ─── Provider helpers ─────────────────────────────────────────────────────────

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

async function callQwenHuggingFace(prompt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
        const response = await fetch(
            'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-VL-7B-Instruct/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'Qwen/Qwen2.5-VL-7B-Instruct',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 4096,
                }),
                signal: controller.signal,
            }
        );

        if (!response.ok) {
            const err = await response.text();
            const error = new Error(`HuggingFace error: ${err}`);
            error.status = response.status;
            throw error;
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } finally {
        clearTimeout(timeout);
    }
}

async function callQwenSambaNova(prompt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
        const response = await fetch(
            'https://api.sambanova.ai/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.SAMBANOVA_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'Qwen2.5-VL-7B-Instruct',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 4096,
                }),
                signal: controller.signal,
            }
        );

        if (!response.ok) {
            const err = await response.text();
            const error = new Error(`SambaNova error: ${err}`);
            error.status = response.status;
            throw error;
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } finally {
        clearTimeout(timeout);
    }
}

// Flatten contentParts into a single text string for Qwen fallbacks
// (they don't accept base64 inline data via the HF/SambaNova chat API)
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
            "structure": { "count": 0, "severity": "warning", "items": [] },
            "marks": { "count": 0, "severity": "critical", "items": [] },
            "syllabus": { "count": 0, "severity": "warning", "items": [] },
            "logical": { "count": 0, "severity": "critical", "items": [] }
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