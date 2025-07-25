"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { canAccessModule } from "@/lib/auth/role-permissions";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useAuth } from "@/providers/auth-provider";

interface DashboardGuardProps {
  children: React.ReactNode;
}

export function DashboardGuard({ children }: DashboardGuardProps) {
  const router = useRouter();
  const { profile, isLoading } = useCurrentUser();
  const { signOut } = useAuth();

  useEffect(() => {
    // Wait for loading to complete
    if (isLoading) return;

    // If no profile found, redirect to sign in
    if (!profile) {
      router.push("/sign-in?error=profile_missing");
      return;
    }

    // Check if user has dashboard access
    if (!canAccessModule(profile.role, "dashboard")) {
      // Sign out the user since they don't have access
      signOut();
      return;
    }
  }, [profile, isLoading, router, signOut]);

  // Show loading while checking permissions
  if (isLoading || !profile) {
    return <LoadingScreen />;
  }

  // Check role access
  if (!canAccessModule(profile.role, "dashboard")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground">
            Only administrators can access this platform.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
