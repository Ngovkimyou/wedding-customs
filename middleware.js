import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const AUTH_PATHS = new Set(["/login", "/signup"]);

function copyResponseCookies(source, destination) {
  source.cookies.getAll().forEach((cookie) => destination.cookies.set(cookie));
}

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Always validate the user on the server. Client-only checks can be
  // bypassed by typing a protected URL directly into the address bar.
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isAuthPath = AUTH_PATHS.has(pathname);

  if (!user && !isAuthPath) {
    const signupUrl = request.nextUrl.clone();
    signupUrl.pathname = "/signup";
    signupUrl.search = "";
    const redirectResponse = NextResponse.redirect(signupUrl);
    copyResponseCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (user && isAuthPath) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    const redirectResponse = NextResponse.redirect(homeUrl);
    copyResponseCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|mp3|wav|ogg|m4a|woff|woff2|ico)$).*)",
  ],
};
