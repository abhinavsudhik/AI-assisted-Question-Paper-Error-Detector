import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
        const supabase = await createClient();
        await supabase.auth.exchangeCodeForSession(code);
    }

    // Use the env variable instead of origin from request
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    return NextResponse.redirect(`${appUrl}/`);
}