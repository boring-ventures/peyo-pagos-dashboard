import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

interface User {
  id: string;
  email?: string;
  name?: string;
  role?: string;
}

interface Session {
  user: User;
  expires: Date;
}

// Real implementation using Supabase authentication
export async function auth(): Promise<Session | null> {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return null;
    }

    // Get user profile from database to get role information
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!profile) {
      return null;
    }

    return {
      user: {
        id: session.user.id,
        email: profile.email || session.user.email,
        name: `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
        role: profile.role,
      },
      expires: new Date(
        session.expires_at
          ? session.expires_at * 1000
          : Date.now() + 24 * 60 * 60 * 1000
      ),
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

// Function to get the current user (useful for client components)
export async function getCurrentUser(): Promise<User | null> {
  const session = await auth();
  return session?.user || null;
}
