'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthActions } from '@/lib/auth/store';
import { AuthApiError } from '@/lib/auth/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ConnexionContent() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const { requestMagicLink } = useAuthActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage({
        type: 'error',
        text: 'Veuillez saisir votre adresse email',
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await requestMagicLink(email);

      setMessage({
        type: 'success',
        text: 'Un lien de connexion a été envoyé à votre adresse email.',
      });

      setEmail('');
    } catch (error) {
      console.error('Erreur demande magic link:', error);

      let errorMessage = 'Une erreur est survenue. Veuillez réessayer.';

      if (error instanceof AuthApiError) {
        switch (error.code) {
          case 'USER_NOT_FOUND':
            errorMessage = 'Cette adresse email n\'est pas reconnue. Contactez votre administrateur.';
            break;
          case 'NETWORK_ERROR':
            errorMessage = 'Impossible de se connecter au serveur.';
            break;
          default:
            errorMessage = error.message;
        }
      }

      setMessage({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-slate-900">
            Connexion
          </CardTitle>
          <CardDescription className="text-slate-600">
            Saisissez votre adresse email pour recevoir un lien de connexion sécurisé
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Adresse email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="votre.email@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full"
                autoComplete="email"
                autoFocus
              />
            </div>

            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full"
            >
              {isLoading ? 'Envoi en cours...' : 'Recevoir le lien de connexion'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              🔒 Connexion sécurisée sans mot de passe
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && redirectPath && (
            <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-600">
              <strong>Dev:</strong> Redirection après connexion → {redirectPath}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-slate-900">
              Chargement...
            </CardTitle>
            <CardDescription className="text-slate-600">
              Préparation de la page de connexion
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <ConnexionContent />
    </Suspense>
  );
}