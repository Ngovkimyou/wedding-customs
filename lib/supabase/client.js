import { createBrowserClient } from "@supabase/ssr";

let browserClient;

/**
 * Return the shared browser client for Client Components.
 *
 * The public Supabase values are read from environment variables so the
 * project never stores deployment-specific configuration in source control.
 */
export function createClient() {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  return browserClient;
}
