import { SupabaseClient } from "@supabase/supabase-js";

/**
 * This middleware extension allows the Supabase client to work with
 * client-side hashed passwords by modifying the auth calls.
 *
 * By applying this middleware, the server will understand that passwords
 * are already hashed and will handle them accordingly.
 */
export const applyPasswordHashMiddleware = (supabase: SupabaseClient) => {
  // Create a wrapper for the original fetch function
  const originalFetch = globalThis.fetch;

  // Override the global fetch to intercept Supabase auth requests
  globalThis.fetch = async (input, init) => {
    // Only modify Supabase auth endpoints for password-related operations
    const url = input instanceof Request ? input.url : input.toString();
    const isSupabaseAuthEndpoint =
      url.includes("/auth/v1") &&
      (url.includes("/signin") ||
        url.includes("/sign-in") ||
        url.includes("/login") ||
        url.includes("/password") ||
        url.includes("/reset") ||
        url.includes("/change"));

    // Check if this is a password-related operation
    const body = init?.body ? JSON.parse(init.body.toString()) : null;
    const hasPassword = body && "password" in body;

    if (isSupabaseAuthEndpoint && hasPassword) {
      // Add the custom header to indicate password is pre-hashed
      init = {
        ...init,
        headers: {
          ...(init?.headers || {}),
          "x-password-hashed": "true",
        },
      };
    }

    // Call the original fetch with potentially modified headers
    return originalFetch(input, init);
  };

  return supabase;
};

export function shouldApplyPasswordHashing(url: string): boolean {
  return (
    url.includes("/signin") ||
    url.includes("/sign-in") ||
    url.includes("/login") ||
    url.includes("/password") ||
    url.includes("/reset") ||
    url.includes("/change")
  );
}
