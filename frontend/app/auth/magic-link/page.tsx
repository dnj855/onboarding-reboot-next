'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthActions } from '@/lib/auth/store';
import { AuthApiError } from '@/lib/auth/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function MagicLinkContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { validateMagicLink } = useAuthActions();

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Lien de connexion invalide ou manquant.');
        return;
      }

      try {
        await validateMagicLink(token);
        setStatus('success');

        // Redirection immédiate vers l'espace utilisateur (expérience magique)
        router.replace('/user');

      } catch (error) {
        console.error('Erreur validation magic link:', error);

        setStatus('error');

        if (error instanceof AuthApiError) {
          switch (error.code) {
            case 'INVALID_TOKEN':
              setErrorMessage('Ce lien de connexion n\'est pas valide.');
              break;
            case 'EXPIRED_TOKEN':
              setErrorMessage('Ce lien de connexion a expiré.');
              break;
            case 'TOKEN_ALREADY_USED':
              setErrorMessage('Ce lien de connexion a déjà été utilisé.');
              break;
            case 'NETWORK_ERROR':
              setErrorMessage('Impossible de se connecter au serveur.');
              break;
            default:
              setErrorMessage(error.message || 'Une erreur inattendue est survenue.');
          }
        } else {
          setErrorMessage('Une erreur inattendue est survenue.');
        }
      }
    };

    validateToken();
  }, [token, validateMagicLink, router]);

  const handleRetryConnection = () => {
    router.push('/connexion');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        {status === 'loading' && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold text-slate-900">
                Connexion en cours...
              </CardTitle>
              <CardDescription className="text-slate-600">
                Validation de votre lien de connexion
              </CardDescription>
            </CardHeader>

            <CardContent className="text-center">
              <div className="flex justify-center items-center space-x-2 mb-4">
                <svg className="animate-spin h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <p className="text-sm text-slate-600">
                Veuillez patienter...
              </p>
            </CardContent>
          </>
        )}

        {status === 'success' && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold text-green-900">
                ✅ Connexion réussie !
              </CardTitle>
              <CardDescription className="text-slate-600">
                Vous allez être redirigé automatiquement
              </CardDescription>
            </CardHeader>

            <CardContent className="text-center space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  Bienvenue ! Vous êtes maintenant connecté.
                </p>
              </div>

              <Button onClick={handleGoHome} className="w-full">
                Accéder à mon espace
              </Button>
            </CardContent>
          </>
        )}

        {status === 'error' && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold text-red-900">
                ❌ Connexion échouée
              </CardTitle>
              <CardDescription className="text-slate-600">
                Impossible de vous connecter avec ce lien
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  {errorMessage}
                </p>
              </div>

              <div className="space-y-2">
                <Button onClick={handleRetryConnection} className="w-full">
                  Demander un nouveau lien
                </Button>

                <Button onClick={handleGoHome} variant="outline" className="w-full">
                  Retour à l&apos;accueil
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {process.env.NODE_ENV === 'development' && (
          <CardContent className="pt-0">
            <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-600">
              <strong>Dev:</strong> Token = {token || 'manquant'}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-slate-900">
              Chargement...
            </CardTitle>
            <CardDescription className="text-slate-600">
              Préparation de la validation
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <MagicLinkContent />
    </Suspense>
  );
}