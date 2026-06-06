import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { runAnalysisJob } from '@/lib/analysis-processor';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

function getSupabaseAdmin() {
    return createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
}

async function handler(request) {
    let analysisId = null;
    try {
        let payload;
        try {
            payload = await request.json();
            analysisId = payload?.analysisId;
        } catch (err) {
            return Response.json({ error: 'Invalid JSON payload' }, { status: 400 });
        }

        if (!analysisId) {
            return Response.json({ error: 'analysisId is required' }, { status: 400 });
        }

        await runAnalysisJob(payload);
        return Response.json({ success: true });
    } catch (error) {
        console.error(`[process-job] Execution error for analysis ${analysisId}:`, error?.message || error);
        
        if (analysisId) {
            try {
                const supabase = getSupabaseAdmin();
                let errorMessage = error?.message || 'Processing failed.';
                if (errorMessage === 'timeout' || errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('aborted')) {
                    errorMessage = "Analysis timed out. The document may be too large or complex. Please try a smaller file or try again.";
                }
                
                await supabase
                    .from('analyses')
                    .update({ 
                        status: 'failed', 
                        report: { error: errorMessage } 
                    })
                    .eq('id', analysisId);
            } catch (supabaseError) {
                console.error(`[process-job] Failed to write error to Supabase:`, supabaseError.message);
            }
        }

        return Response.json(
            { error: error?.message || 'Processing failed.' },
            { status: 500 }
        );
    }
}

export const POST = verifySignatureAppRouter(handler);
