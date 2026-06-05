import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { runAnalysisJob } from '@/lib/analysis-processor';

async function handler(request) {
    let payload;
    try {
        payload = await request.json();
    } catch (err) {
        return Response.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { analysisId } = payload;
    if (!analysisId) {
        return Response.json({ error: 'analysisId is required' }, { status: 400 });
    }

    try {
        await runAnalysisJob(payload);
        return Response.json({ success: true });
    } catch (error) {
        console.error(`[process-job] Execution error for analysis ${analysisId}:`, error.message);
        return Response.json(
            { error: error.message || 'Processing failed.' },
            { status: 500 }
        );
    }
}

export const POST = verifySignatureAppRouter(handler);
