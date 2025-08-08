import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// Importar las nuevas funciones de cache
import {
  getUserForMiddleware,
  getCacheStatistics,
  invalidateUserCache,
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

  // If there's a session and the user is trying to access auth routes
  if (session && req.nextUrl.pathname.startsWith("/sign-in")) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  // 🚀 CAMBIO PRINCIPAL: Usar cache layer para obtener datos de usuario
  // Solo para rutas del dashboard y solo si hay sesión
  if (session?.user && req.nextUrl.pathname.startsWith("/dashboard")) {
    try {
      const userData = await getUserForMiddleware(session.user.id, req);

      // Si no se pueden obtener datos, permitir acceso pero loggear
      if (!userData) {
        console.error(
          `[MIDDLEWARE] ❌ No se pudieron obtener datos de usuario para ${session.user.id}`
        );
        // No redirigir para evitar bucles, solo continuar
        return res;
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
  matcher: ["/dashboard/:path*", "/sign-in", "/auth/callback"],
};
