import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  // Determine correct browser origin (avoid 0.0.0.0 from internal listener)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host') || url.host;
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  
  // If host is 0.0.0.0, fallback to localhost
  const cleanHost = host.startsWith('0.0.0.0') ? host.replace('0.0.0.0', 'localhost') : host;
  const baseOrigin = `${proto}://${cleanHost}`;

  console.log(`[auth/callback] Incoming request. URL: ${request.url}, host: ${host}, cleanHost: ${cleanHost}, baseOrigin: ${baseOrigin}, hasCode: ${Boolean(code)}`);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      console.log(`[auth/callback] Code exchange successful. Redirecting to ${baseOrigin}${next}`);
      return NextResponse.redirect(`${baseOrigin}${next}`);
    }
    console.error(`[auth/callback] exchangeCodeForSession failed:`, error);
  }

  // Return user to login page with error param
  return NextResponse.redirect(`${baseOrigin}/login?error=auth_callback_failed`);
}
