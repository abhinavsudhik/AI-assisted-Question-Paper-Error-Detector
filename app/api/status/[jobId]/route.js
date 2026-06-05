import { createClient } from '@/lib/supabase/server';

export async function GET(request, { params }) {
    try {
        const { jobId } = await params;

        if (!jobId) {
            return Response.json({ error: 'Job ID is required' }, { status: 400 });
        }

        const supabase = await createClient();

        const { data: analysis, error } = await supabase
            .from('analyses')
            .select('status, report')
            .eq('id', jobId)
            .single();

        if (error || !analysis) {
            return Response.json(
                { error: 'Analysis not found' },
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
