// Fichier: components/providers/auth-provider.tsx

"use client";

import { useAuthActions, useAuthStore } from "@/lib/auth/store";
import { usePathname } from "next/navigation"; // Importer usePathname
import { useEffect, useState } from "react";

// Définir les routes qui ne nécessitent pas de vérification d'authentification
const publicRoutes = ["/connexion", "/auth/magic-link"];

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname(); // Obtenir la route actuelle
  const [isMounted, setIsMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { refreshAuth } = useAuthActions();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Si la route est publique, on n'a pas besoin d'attendre la vérification d'auth
    const isPublicPage = publicRoutes.includes(pathname);
    if (isPublicPage) {
      setIsReady(true);
      return;
    }

    const initializeAuth = async () => {
      if (!isAuthenticated) {
        try {
          await refreshAuth();
        } catch (error) {
          console.log("Session non trouvée, utilisateur non connecté.");
        }
      }
      setIsReady(true);
    };

    initializeAuth();
  }, [isMounted, isAuthenticated, refreshAuth, pathname]);

  if (!isMounted) {
    return null;
  }

  // Le spinner ne s'affiche que pour les pages protégées
  const isPublicPage = publicRoutes.includes(pathname);

  if (!isReady && !isPublicPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Initialisation de la session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
