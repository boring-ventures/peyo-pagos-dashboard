"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User, Session } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/profile";
import { canAccessModule } from "@/lib/auth/role-permissions";
import { performanceMonitor } from "@/lib/utils/performance-monitor";
import { useUserStore } from "@/store/userStore";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasAccess: (
    module: "dashboard" | "analytics" | "users" | "kyc" | "wallets" | "settings"
  ) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
  hasAccess: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Fetch profile function
  const fetchProfile = async (userId: string) => {
    const startTime = Date.now();
    try {
      // Intentar usar cache primero
      const userStore = useUserStore.getState();
      const cachedUser = userStore.getUserFromCache();
      
      if (cachedUser && cachedUser.id === userId) {
        const responseTime = Date.now() - startTime;
        performanceMonitor.logRequest("auth-provider", userId, true, responseTime);
        
        // Convertir formato de Zustand a Profile
        const profileData: Profile = {
          id: cachedUser.id,
          userId: cachedUser.id,
          email: cachedUser.email,
          firstName: cachedUser.name?.split(' ')[0] || '',
          lastName: cachedUser.name?.split(' ').slice(1).join(' ') || '',
          status: cachedUser.isActive ? 'active' : 'disabled',
          role: cachedUser.role as 'USER' | 'ADMIN' | 'SUPERADMIN',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setProfile(profileData);
        return profileData;
      }

      // Fallback a API call
      const response = await fetch(`/api/profile/${userId}`);
      if (!response.ok) {
        if (response.status === 404) {
          // Profile doesn't exist yet - this is normal for new users
          console.log("Profile not found for new user");
          setProfile(null);
          return null;
        }
        if (response.status === 401 || response.status === 403) {
          // Authentication issues - let user continue signup flow
          console.log("Authentication issue during profile fetch, user may be in signup flow");
          setProfile(null);
          return null;
        }
        // For other errors, still be graceful during signup
        console.error("Failed to fetch profile, status:", response.status);
        setProfile(null);
        return null;
      }
      const data = await response.json();
      
      const responseTime = Date.now() - startTime;
      performanceMonitor.logRequest("auth-provider", userId, true, responseTime);
      
      setProfile(data.profile);
      
      // Actualizar cache con datos frescos
      if (data.profile) {
        const userForStore = {
          id: data.profile.id,
          email: data.profile.email,
          name: `${data.profile.firstName} ${data.profile.lastName}`.trim(),
          role: data.profile.role,
          isActive: data.profile.status === 'active',
          isDeleted: data.profile.status === 'deleted',
          roleId: data.profile.id,
          userPermission: {
            id: data.profile.id,
            userId: data.profile.id,
            permissions: { dashboard: true }, // Asumir permisos básicos
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
        
        userStore.updateCache(userForStore as Parameters<typeof userStore.updateCache>[0]);
      }
      
      return data.profile;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      performanceMonitor.logRequest("auth-provider", userId, false, responseTime);
      console.error("Error fetching profile:", error);
      
      // Don't throw the error during signup flow - let the app continue with null profile
      setProfile(null);
      return null;
    }
  };

  // Check if user has access to a specific module
  const hasAccess = (
    module: "dashboard" | "analytics" | "users" | "kyc" | "wallets" | "settings"
  ) => {
    return canAccessModule(profile?.role, module);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      setIsLoading(false);

      if (event === "SIGNED_OUT") {
        router.push("/sign-in");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    if (data.user) {
      // Fetch and validate user profile
      const userProfile = await fetchProfile(data.user.id);

      // Check if profile exists and has valid role
      if (!userProfile) {
        throw new Error("User profile not found. Please contact support.");
      }

      // Validate that user has access to dashboard
      if (!canAccessModule(userProfile?.role, "dashboard")) {
        throw new Error("You don't have permission to access the dashboard.");
      }
    }

    router.push("/dashboard");
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    router.push("/sign-in");
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, isLoading, signIn, signOut, hasAccess }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
