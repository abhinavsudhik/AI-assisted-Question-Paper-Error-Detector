import { Client } from '@upstash/qstash';
import { createClient } from '@/lib/supabase/server';
import { runAnalysisJob } from '@/lib/analysis-processor';

const qstash = new Client({ token: process.env.QSTASH_TOKEN });

export async function POST(request) {
    try {
        // ─── Authenticate ─────────────────────────────────────────────────
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return Response.json(
                { error: 'You must be signed in to analyse a paper.' },
                { status: 401 }
            );
        }

        // ─── Parse FormData ───────────────────────────────────────────────
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

        // ─── Upload question paper to Supabase Storage ────────────────────
        const fileExt = (questionPaper.name || 'file').split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const arrayBuffer = await questionPaper.arrayBuffer();
        const { error: uploadError } = await supabase.storage
            .from('papers')
            .upload(filePath, arrayBuffer, {
                contentType: questionPaper.type || 'application/octet-stream',
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError.message);
            return Response.json(
                { error: 'Failed to upload question paper.' },
                { status: 500 }
            );
        }

        // ─── Insert pending analysis row ──────────────────────────────────
        const { data: analysis, error: insertError } = await supabase
            .from('analyses')
            .insert({
                user_id: user.id,
                status: 'pending',
                file_path: filePath,
                file_name: questionPaper.name || 'unknown',
                total_marks: totalMarks,
                report: {},
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('Insert error:', insertError.message);
            return Response.json(
                { error: 'Failed to create analysis record.' },
                { status: 500 }
            );
        }

        // ─── Build the job payload ────────────────────────────────────────
        // Syllabus & pattern can be either text strings or file objects.
        // For files we cannot forward binary through QStash JSON, so we
        // upload them to storage too and pass the path.
        let syllabusPayload = null;
        if (typeof syllabus === 'string' && syllabus) {
            syllabusPayload = { type: 'text', value: syllabus };
        } else if (syllabus && typeof syllabus === 'object' && syllabus.arrayBuffer) {
            const syllabusExt = (syllabus.name || 'file').split('.').pop();
            const syllabusPath = `${user.id}/${Date.now()}_syllabus.${syllabusExt}`;
            const syllabusBuffer = await syllabus.arrayBuffer();
            await supabase.storage.from('papers').upload(syllabusPath, syllabusBuffer, {
                contentType: syllabus.type || 'application/octet-stream',
                upsert: false,
            });
            syllabusPayload = {
                type: 'file',
                path: syllabusPath,
                name: syllabus.name || 'syllabus',
                mimeType: syllabus.type || 'application/octet-stream',
            };
        }

        let patternPayload = null;
        if (typeof pattern === 'string' && pattern) {
            patternPayload = { type: 'text', value: pattern };
        } else if (pattern && typeof pattern === 'object' && pattern.arrayBuffer) {
            const patternExt = (pattern.name || 'file').split('.').pop();
            const patternPath = `${user.id}/${Date.now()}_pattern.${patternExt}`;
            const patternBuffer = await pattern.arrayBuffer();
            await supabase.storage.from('papers').upload(patternPath, patternBuffer, {
                contentType: pattern.type || 'application/octet-stream',
                upsert: false,
            });
            patternPayload = {
                type: 'file',
                path: patternPath,
                name: pattern.name || 'pattern',
                mimeType: pattern.type || 'application/octet-stream',
            };
        }

        // ─── Publish QStash job ───────────────────────────────────────────
        const jobBody = {
            analysisId: analysis.id,
            filePath,
            fileName: questionPaper.name || 'unknown',
            fileType: questionPaper.type || 'application/octet-stream',
            totalMarks,
            syllabus: syllabusPayload,
            pattern: patternPayload,
        };

        const appUrl = process.env.NEXT_PUBLIC_APP_URL;
        const qstashToken = process.env.QSTASH_TOKEN;
        const isLocalDev = !appUrl || appUrl.includes('localhost') || appUrl.includes('127.0.0.1') || !qstashToken;

        if (isLocalDev) {
            console.log('[Analyse] Running analysis job locally in background...');
            // Invoke the job asynchronously and do not await it
            runAnalysisJob(jobBody).catch(err => {
                console.error('[Analyse] Local analysis background runner failed:', err.message);
            });
        } else {
            console.log('[Analyse] Publishing analysis job to Upstash QStash...');
            await qstash.publishJSON({
                url: `${appUrl}/api/process-job`,
                body: jobBody,
                retries: 2,
            });
        }

        // ─── Return immediately ───────────────────────────────────────────
        return Response.json({ success: true, jobId: analysis.id });

    } catch (error) {
        console.error('Analyse submission error:', error.message);
        return Response.json(
            { error: error.message || 'Failed to submit analysis. Please try again.' },
            { status: 500 }
        );
    }
}