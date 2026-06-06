import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

function getSupabaseAdmin() {
    return createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
}

export async function GET(request) {
    const token = request.headers.get('x-recover-secret');

    if (!process.env.RECOVER_SECRET) {
        console.error('[Recover] RECOVER_SECRET environment variable is not defined.');
        return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!token || token !== process.env.RECOVER_SECRET) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = getSupabaseAdmin();
        const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('analyses')
            .update({ 
                status: 'failed', 
                report: { error: 'Analysis timed out. Please try again.' } 
            })
            .eq('status', 'processing')
            .lt('created_at', threeMinutesAgo)
            .select('id');

        if (error) {
            throw error;
        }

        const recoveredCount = data ? data.length : 0;
        console.log(`[Recover] Recovered ${recoveredCount} stuck analyses.`);

        return Response.json({ 
            success: true, 
            recovered: recoveredCount 
        });
    } catch (error) {
        console.error('[Recover] Error running recovery:', error.message);
        return Response.json(
            { error: error.message || 'Recovery failed.' },
            { status: 500 }
        );
    }
}
