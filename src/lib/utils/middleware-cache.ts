import { getUserStoreSnapshot, isStoreAvailable } from "@/store/userStore";

// Definir interfaces compatibles con el middleware actual de Peyo
interface MiddlewareProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  isDeleted?: boolean;
  roleId: string;
  permissions: any;
  // Agregar otros campos que necesite Peyo CRM
}

interface MiddlewareUserData {
  profile: MiddlewareProfile;
  cacheSource: "zustand" | "api" | "none";
}

/**
 * Función principal para obtener datos de usuario en middleware
 * Implementa sistema de cache multi-nivel:
 * 1. Zustand Store (cache hit) - ⚡ Instantáneo
 * 2. API Fetch (cache miss) - 🔄 Fallback necesario
 */
export async function getUserForMiddleware(
  userId: string,
  request?: Request
): Promise<MiddlewareUserData | null> {
  const startTime = Date.now();

  // NIVEL 1: Intentar obtener desde Zustand store
  if (isStoreAvailable()) {
    try {
      const store = getUserStoreSnapshot();
      const cachedUser = store.getUserFromCache();

      if (cachedUser && cachedUser.id === userId) {
        const responseTime = Date.now() - startTime;

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[CACHE] ✅ HIT - Usuario ${userId} desde Zustand (${responseTime}ms)`
          );
        }

        // Convertir formato de Zustand a formato de middleware
        return {
          profile: {
            id: cachedUser.id,
            email: cachedUser.email,
            name: cachedUser.name,
            role: cachedUser.role,
            isActive: cachedUser.isActive,
            isDeleted: cachedUser.isDeleted || false,
            roleId: cachedUser.roleId || "",
            permissions: cachedUser.userPermission?.permissions || {},
          },
          cacheSource: "zustand",
        };
      }
    } catch (error) {
      console.error("Error accediendo a Zustand store:", error);
    }
  }

  // NIVEL 2: Fallback a API call
  try {
    const apiResponse = await fetchUserFromAPI(userId, request);
    const responseTime = Date.now() - startTime;

    if (!apiResponse) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[CACHE] ❌ MISS - Usuario ${userId} no encontrado (${responseTime}ms)`
        );
      }
      return null;
    }

    // NIVEL 3: Actualizar cache con datos frescos
    if (isStoreAvailable() && apiResponse.profile) {
      try {
        const store = getUserStoreSnapshot();

        // Convertir formato de API a formato de Zustand
        const userForStore = {
          id: apiResponse.profile.id,
          email: apiResponse.profile.email,
          name: apiResponse.profile.name,
          role: apiResponse.profile.role,
          isActive: apiResponse.profile.isActive,
          isDeleted: apiResponse.profile.isDeleted || false,
          roleId: apiResponse.profile.roleId,
          userPermission: {
            id: apiResponse.profile.id,
            userId: apiResponse.profile.id,
            permissions: apiResponse.profile.permissions,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };

        store.updateCache(userForStore as any);

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[CACHE] 🔄 MISS pero actualizado - Usuario ${userId} desde API (${responseTime}ms)`
          );
        }
      } catch (error) {
        console.error("Error actualizando cache:", error);
      }
    }

    return {
      profile: apiResponse.profile,
      cacheSource: "api",
    };
  } catch (error) {
    console.error("Error en getUserForMiddleware:", error);
    return null;
  }
}

/**
 * Función para hacer fetch a la API de usuarios
 * Compatible con Edge Runtime de Vercel
 */
async function fetchUserFromAPI(
  userId: string,
  request?: Request
): Promise<{ profile: MiddlewareProfile } | null> {
  try {
    // Construir URL de la API de manera compatible con middleware
    const protocol = request?.headers?.get("x-forwarded-proto") || "http";
    const host = request?.headers?.get("host") || "localhost:3000";
    const apiUrl = `${protocol}://${host}/api/profile/${userId}`;

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        // Pasar cookies si están disponibles
        ...(request?.headers?.get("cookie")
          ? { Cookie: request.headers.get("cookie")! }
          : {}),
      },
      // Agregar cache: 'no-store' para evitar cache del navegador
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`API returned ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    // Verificar que la respuesta tenga el formato esperado
    if (!data.profile) {
      console.warn("API response missing profile data:", data);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching from API:", error);
    return null; // Retornar null en lugar de throw para evitar crashes
  }
}

/**
 * Función para obtener estadísticas de cache
 */
export function getCacheStatistics(): string {
  if (!isStoreAvailable()) {
    return "Cache stats: N/A (server-side)";
  }

  try {
    const store = getUserStoreSnapshot();
    const stats = store.getCacheStats();
    return `Cache stats: ${stats.hits} hits, ${stats.misses} misses, ${stats.hitRatio}% hit ratio`;
  } catch {
    return "Cache stats: Error accessing store";
  }
}

/**
 * Función para invalidar cache de usuario específico
 */
export function invalidateUserCache(userId?: string): void {
  if (!isStoreAvailable()) return;

  try {
    const store = getUserStoreSnapshot();
    const currentUser = store.user;

    // Si no se especifica userId o es el usuario actual, limpiar cache
    if (!userId || (currentUser && currentUser.id === userId)) {
      store.clearUser();
      console.log(
        `[CACHE] Cache invalidado para usuario: ${userId || "current"}`
      );
    }
  } catch (error) {
    console.error("Error invalidando cache:", error);
  }
}

/**
 * Función para forzar refresh de cache
 */
export function forceRefreshUserCache(
  userId: string,
  request?: Request
): Promise<MiddlewareUserData | null> {
  // Invalidar cache actual
  invalidateUserCache(userId);

  // Forzar fetch desde API
  return getUserForMiddleware(userId, request);
}
