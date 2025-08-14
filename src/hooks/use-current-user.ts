"use client";

import { useEffect, useState, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@prisma/client";
import { useUserStore } from "@/store/userStore";
import { performanceMonitor } from "@/lib/utils/performance-monitor";

type CurrentUserData = {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  refetch?: () => Promise<void>;
};

export function useCurrentUser(): CurrentUserData {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClientComponentClient();

  const fetchUserData = useCallback(async () => {
    const startTime = Date.now();
    try {
      setIsLoading(true);
      setError(null);

      // Get current user from Supabase
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (userData.user) {
        setUser(userData.user);

        // Intentar usar cache primero
        const userStore = useUserStore.getState();
        const cachedUser = userStore.getUserFromCache();
        
        if (cachedUser && cachedUser.id === userData.user.id) {
          const responseTime = Date.now() - startTime;
          performanceMonitor.logRequest("use-current-user", userData.user.id, true, responseTime);
          
          // Convertir formato de Zustand a Profile
          const profileData: Profile = {
            id: cachedUser.id,
            userId: cachedUser.id,
            email: cachedUser.email,
            firstName: cachedUser.name?.split(' ')[0] || '',
            lastName: cachedUser.name?.split(' ').slice(1).join(' ') || '',
            status: cachedUser.isActive ? 'active' : 'disabled',
            role: cachedUser.role as any,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          setProfile(profileData);
          return;
        }

        // Fallback a API call
        const response = await fetch("/api/profile");

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const profileData = await response.json();
        const responseTime = Date.now() - startTime;
        performanceMonitor.logRequest("use-current-user", userData.user.id, true, responseTime);
        
        setProfile(profileData);
        
        // Actualizar cache con datos frescos
        if (profileData) {
          const userForStore = {
            id: profileData.id,
            email: profileData.email,
            name: `${profileData.firstName} ${profileData.lastName}`.trim(),
            role: profileData.role,
            isActive: profileData.status === 'active',
            isDeleted: profileData.status === 'deleted',
            roleId: profileData.id,
            userPermission: {
              id: profileData.id,
              userId: profileData.id,
              permissions: { dashboard: true }, // Asumir permisos básicos
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          };
          
          userStore.updateCache(userForStore as any);
        }
      }
    } catch (err) {
      const responseTime = Date.now() - startTime;
      performanceMonitor.logRequest("use-current-user", user?.id, false, responseTime);
      console.error("Error fetching user data:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth, user?.id]);

  useEffect(() => {
    fetchUserData();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session) {
            setUser(session.user);

            // Fetch the user's profile when auth state changes
            try {
              const response = await fetch("/api/profile");
              if (response.ok) {
                const profileData = await response.json();
                setProfile(profileData);
              }
            } catch (err) {
              console.error("Error fetching profile:", err);
            }
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth, fetchUserData]);

  return { user, profile, isLoading, error, refetch: fetchUserData };
}
