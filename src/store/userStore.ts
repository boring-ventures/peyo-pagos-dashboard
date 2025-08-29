import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Definir interfaces según el sistema actual de Peyo
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  isDeleted?: boolean;
  roleId: string;
  userPermission?: {
    id: string;
    userId: string;
    permissions: unknown;
    createdAt: string;
    updatedAt: string;
  };
  // Agregar cualquier otro campo que use Peyo CRM actualmente
}

interface UserState {
  // Estado base existente
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // NUEVAS CARACTERÍSTICAS DE CACHE
  lastFetched: number | null;
  cacheHits: number;
  cacheMisses: number;
  
  // Métodos base existentes
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearUser: () => void;
  
  // NUEVOS MÉTODOS DE CACHE
  isStale: (ttlMinutes?: number) => boolean;
  getUserFromCache: () => User | null;
  updateCache: (user: User) => void;
  getCacheStats: () => { hits: number; misses: number; hitRatio: number };
  incrementCacheHit: () => void;
  incrementCacheMiss: () => void;
}

const DEFAULT_TTL_MINUTES = 15; // Cache válido por 15 minutos

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isLoading: false,
      error: null,
      lastFetched: null,
      cacheHits: 0,
      cacheMisses: 0,

      // Métodos base existentes (PRESERVAR FUNCIONALIDAD)
      setUser: (user) => {
        set({
          user,
          error: null,
          lastFetched: user ? Date.now() : null,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearUser: () => {
        set({
          user: null,
          error: null,
          lastFetched: null,
          // Mantener estadísticas de cache
        });
        // Limpiar localStorage solo para datos de usuario
        try {
          const stored = localStorage.getItem("user-storage");
          if (stored) {
            const data = JSON.parse(stored);
            data.state.user = null;
            data.state.error = null;
            data.state.lastFetched = null;
            localStorage.setItem("user-storage", JSON.stringify(data));
          }
        } catch (error) {
          console.warn("Error clearing user from localStorage:", error);
        }
      },

      // NUEVOS MÉTODOS DE CACHE
      isStale: (ttlMinutes = DEFAULT_TTL_MINUTES) => {
        const { lastFetched } = get();
        if (!lastFetched) return true;
        const now = Date.now();
        const ttlMs = ttlMinutes * 60 * 1000;
        return now - lastFetched > ttlMs;
      },

      getUserFromCache: () => {
        const { user, isStale, incrementCacheHit, incrementCacheMiss } = get();
        
        if (!user) {
          incrementCacheMiss();
          return null;
        }

        if (isStale()) {
          incrementCacheMiss();
          return null;
        }

        incrementCacheHit();
        return user;
      },

      updateCache: (user: User) => {
        set({
          user,
          error: null,
          lastFetched: Date.now(),
        });
      },

      getCacheStats: () => {
        const { cacheHits, cacheMisses } = get();
        const total = cacheHits + cacheMisses;
        const hitRatio = total > 0 ? Math.round((cacheHits / total) * 100) : 0;
        
        return {
          hits: cacheHits,
          misses: cacheMisses,
          hitRatio,
        };
      },

      incrementCacheHit: () => {
        set((state) => ({ cacheHits: state.cacheHits + 1 }));
      },

      incrementCacheMiss: () => {
        set((state) => ({ cacheMisses: state.cacheMisses + 1 }));
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        error: state.error,
        lastFetched: state.lastFetched,
        cacheHits: state.cacheHits,
        cacheMisses: state.cacheMisses,
      }),
    }
  )
);

// Funciones utilitarias para server-side safety
export const getUserStoreSnapshot = () => useUserStore.getState();

export const isStoreAvailable = (): boolean => {
  try {
    return typeof window !== "undefined" && !!useUserStore.getState;
  } catch {
    return false;
  }
};

// Helper para debugging
export const logCacheStats = () => {
  if (isStoreAvailable()) {
    const stats = getUserStoreSnapshot().getCacheStats();
    console.log(`[CACHE] Hits: ${stats.hits}, Misses: ${stats.misses}, Hit Ratio: ${stats.hitRatio}%`);
  }
}; 