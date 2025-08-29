import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// Importar las nuevas funciones de cache
import {
  getUserForMiddleware,
  getCacheStatistics,
  invalidateUserCache,
  checkUserRegistrationStatus,
} from "@/lib/utils/middleware-cache";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Skip auth check for the auth callback route
  if (req.nextUrl.pathname.startsWith("/auth/callback")) {
    return res;
  }

  // If there's no session and the user is trying to access a protected route
  if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If there's a session and the user is trying to access sign-in
  if (session && req.nextUrl.pathname.startsWith("/sign-in")) {
    // Check if user has completed registration by trying to get their profile
    try {
      const userData = await getUserForMiddleware(session.user.id, req);
      if (userData && userData.profile.isActive) {
        // Check if user is admin/superadmin or regular user
        if (userData.profile.role === "ADMIN" || userData.profile.role === "SUPERADMIN") {
          // Admin users go to dashboard
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.pathname = "/dashboard";
          return NextResponse.redirect(redirectUrl);
        } else if (userData.profile.role === "USER") {
          // Check if USER has completed registration
          const registrationStatus = await checkUserRegistrationStatus(session.user.id, req);
          if (registrationStatus.isRegistrationComplete) {
            // User has completed registration but no user dashboard exists yet
            const redirectUrl = req.nextUrl.clone();
            redirectUrl.pathname = "/sign-up";
            redirectUrl.searchParams.set("status", "registration-complete");
            return NextResponse.redirect(redirectUrl);
          } else {
            // User hasn't completed registration, redirect to sign-up
            const redirectUrl = req.nextUrl.clone();
            redirectUrl.pathname = "/sign-up";
            return NextResponse.redirect(redirectUrl);
          }
        }
      } else {
        // User hasn't completed registration, redirect to sign-up
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/sign-up";
        return NextResponse.redirect(redirectUrl);
      }
    } catch {
      console.log("User profile not found, allowing sign-up flow");
      // Profile doesn't exist, let them go to sign-up
      if (!req.nextUrl.pathname.startsWith("/sign-up")) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/sign-up";
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // If there's a session and the user is trying to access sign-up, allow it
  // This handles users who are in the middle of registration process
  if (session && req.nextUrl.pathname.startsWith("/sign-up")) {
    // Let them continue with sign-up flow
    return res;
  }

  // 🚀 CAMBIO PRINCIPAL: Usar cache layer para obtener datos de usuario
  // Solo para rutas del dashboard y solo si hay sesión
  if (session?.user && req.nextUrl.pathname.startsWith("/dashboard")) {
    try {
      const userData = await getUserForMiddleware(session.user.id, req);

      // Si no se pueden obtener datos del usuario, redirigir a sign-up
      if (!userData) {
        console.log(
          `[MIDDLEWARE] ⚠️ No se encontró perfil para ${session.user.id}, redirigiendo a registro`
        );
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/sign-up";
        return NextResponse.redirect(redirectUrl);
      }

      const { profile, cacheSource } = userData;

      // Logging de estadísticas (solo en desarrollo)
      if (process.env.NODE_ENV === "development") {
        console.log(`[MIDDLEWARE] 📊 ${getCacheStatistics()}`);
        console.log(
          `[MIDDLEWARE] 🎯 Fuente de datos: ${cacheSource.toUpperCase()}`
        );
        console.log(`[MIDDLEWARE] 👤 Profile data:`, {
          id: profile.id,
          email: profile.email,
          isActive: profile.isActive,
          isDeleted: profile.isDeleted,
          role: profile.role,
        });
      }

      // Solo validar si el usuario está eliminado (no inactivo para evitar bucles)
      if (profile.isDeleted) {
        console.log(`[MIDDLEWARE] Usuario eliminado: ${session.user.id}`);
        invalidateUserCache(session.user.id);
        await supabase.auth.signOut();
        const signInUrl = new URL("/sign-in", req.url);
        signInUrl.searchParams.set("reason", "user_deleted");
        return NextResponse.redirect(signInUrl);
      }

      // Check if user has completed their registration (for USER role)
      if (profile.role === "USER") {
        try {
          const registrationStatus = await checkUserRegistrationStatus(session.user.id, req);
          
          if (!registrationStatus.isRegistrationComplete) {
            console.log(`[MIDDLEWARE] Usuario con registro incompleto: ${session.user.id} - Redirigiendo a registro`);
            console.log(`[MIDDLEWARE] Estado de registro:`, {
              hasProfile: registrationStatus.hasProfile,
              hasKYCProfile: registrationStatus.hasKYCProfile,
              kycStatus: registrationStatus.kycStatus,
              isComplete: registrationStatus.isRegistrationComplete
            });
            
            const redirectUrl = req.nextUrl.clone();
            redirectUrl.pathname = "/sign-up";
            return NextResponse.redirect(redirectUrl);
          }
          
          // If registration is complete but user is trying to access admin dashboard, 
          // redirect to user-appropriate area (for now, keep them in sign-up until user dashboard is created)
          console.log(`[MIDDLEWARE] Usuario con registro completo pero sin dashboard propio: ${session.user.id}`);
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.pathname = "/sign-up";
          redirectUrl.searchParams.set("status", "registration-complete");
          return NextResponse.redirect(redirectUrl);
          
        } catch (error) {
          console.error(`[MIDDLEWARE] Error verificando estado de registro para ${session.user.id}:`, error);
          // En caso de error, redirigir a sign-up por seguridad
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.pathname = "/sign-up";
          return NextResponse.redirect(redirectUrl);
        }
      }

      // Para usuarios inactivos, solo loggear pero permitir acceso
      if (!profile.isActive) {
        console.log(
          `[MIDDLEWARE] Usuario inactivo detectado: ${session.user.id} - Permitiendo acceso temporal`
        );
        // No redirigir, solo loggear para evitar bucles
      }
    } catch (error) {
      console.error(`[MIDDLEWARE] Error obteniendo datos de usuario:`, error);
      // En caso de error, simplemente continuar (no bloquear acceso)
      // No redirigir para evitar bucles infinitos
    }
  }

  // Note: Role-based access control is handled in the AuthProvider and components
  // to avoid infinite loops and ensure proper session handling

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up", "/auth/callback"],
};
