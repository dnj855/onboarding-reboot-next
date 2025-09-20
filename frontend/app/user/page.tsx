'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UserPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Affichage de chargement pendant l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-slate-900">
              Chargement de votre espace...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Redirection si non authentifié (le middleware devrait gérer cela, mais sécurité supplémentaire)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-red-900">
              Accès non autorisé
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-600 mb-4">
              Vous devez être connecté pour accéder à cette page.
            </p>
            <Button onClick={() => window.location.href = '/connexion'}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header avec bienvenue personnalisée */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-slate-900">
              🎉 Bienvenue {user.firstName ? `${user.firstName} ${user.lastName}` : user.email} !
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-teal-900 mb-3">
                Votre intégration commence ici
              </h2>
              <p className="text-teal-800 leading-relaxed">
                Bonjour <strong>{user.firstName ? `${user.firstName}` : user.email}</strong> !
                Nous sommes ravis de vous accueillir dans l&apos;équipe.
                {user.managerName && (
                  <>
                    {' '}Votre manager <strong>{user.managerName}</strong> vous accompagnera dans cette nouvelle aventure.
                  </>
                )}
                {' '}Cet espace vous guidera tout au long de votre processus d&apos;intégration.
              </p>
            </div>

            {/* Informations utilisateur */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-slate-700 mb-2">Vos informations</h3>
                <div className="space-y-1 text-sm">
                  {user.firstName && user.lastName && (
                    <p><strong>Nom :</strong> {user.firstName} {user.lastName}</p>
                  )}
                  <p><strong>Email :</strong> {user.email}</p>
                  <p><strong>Rôle :</strong> {user.role}</p>
                  {user.managerName && (
                    <p><strong>Manager :</strong> {user.managerName}</p>
                  )}
                  {user.startDate && (
                    <p><strong>Date d&apos;arrivée :</strong> {new Date(user.startDate).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-slate-700 mb-2">Prochaines étapes</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>✅ Connexion réussie</li>
                  <li>🔄 Découverte de votre espace</li>
                  <li>📋 Processus d&apos;intégration</li>
                  <li>🤝 Rencontre avec votre équipe</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zone chatboard - À développer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">
              💬 Votre Chatboard d&apos;Intégration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                🚧 <strong>Zone en développement</strong> - Votre chatboard interactif sera bientôt disponible ici.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}