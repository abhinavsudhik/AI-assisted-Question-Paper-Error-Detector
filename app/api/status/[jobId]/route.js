import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        const { jobId } = await params;

        if (!jobId) {
            return Response.json({ error: 'Job ID is required' }, { status: 400 });
        }

        let supabase;
        let bypassRLS = false;

        // Try using Service Role Admin client to bypass cookie/session issues in dynamic routes on Vercel
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            supabase = createSupabaseAdmin(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );
            bypassRLS = true;
        } else {
            supabase = await createClient();
        }

        const { data: analysis, error } = await supabase
            .from('analyses')
            .select('status, report')
            .eq('id', jobId)
            .single();

        if (error || !analysis) {
            console.error(`Supabase status check error (bypassRLS: ${bypassRLS}):`, error);
            return Response.json(
                { 
                    error: 'Analysis not found', 
                    details: error ? error.message : 'Analysis row is null' 
                },
                { status: 404 }
            );
        }

        return Response.json({
            status: analysis.status,
            report: analysis.status === 'done' ? analysis.report : null,
        });

    } catch (error) {
        console.error('Status check error:', error.message);
        return Response.json(
            { error: 'Failed to check status.' },
            { status: 500 }
        );
    }
}
