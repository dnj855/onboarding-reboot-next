'use client';

import { useAuth } from '@/lib/auth/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, CheckCircle, Clock, FileText } from 'lucide-react';

export default function ManagerPage() {
  const { user } = useAuth();

  if (!user) {
    return null; // Le middleware protège déjà cette route
  }

  return (
    <div className="layout-manager p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="space-y-4">
          <h1 className="heading-1">Espace Manager</h1>
          <p className="body-text">
            Bonjour <strong>{user.email}</strong>,
            gérez l&apos;onboarding de votre équipe et suivez les progrès des nouveaux collaborateurs.
          </p>
        </header>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Équipe</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-slate-500">collaborateurs sous votre responsabilité</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-slate-500">onboardings en cours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terminés</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-slate-500">onboardings terminés ce mois</p>
            </CardContent>
          </Card>
        </div>

        {/* Team Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Onboardings */}
          <Card>
            <CardHeader>
              <CardTitle className="heading-2 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Onboardings en cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Marie Dupont</p>
                    <p className="text-sm text-slate-600">Développeuse Frontend - Jour 3/30</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">60% complété</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Thomas Martin</p>
                    <p className="text-sm text-slate-600">Designer UX - Jour 1/30</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">10% complété</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Sophie Laurent</p>
                    <p className="text-sm text-slate-600">Product Manager - Jour 15/30</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">80% complété</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Rapides */}
          <Card>
            <CardHeader>
              <CardTitle className="heading-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors">
                  <p className="font-medium text-slate-900">📋 Créer un parcours d&apos;onboarding</p>
                  <p className="text-sm text-slate-600">Définir les étapes pour un nouveau collaborateur</p>
                </button>

                <button className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors">
                  <p className="font-medium text-slate-900">👥 Gérer mon équipe</p>
                  <p className="text-sm text-slate-600">Voir tous les collaborateurs et leur statut</p>
                </button>

                <button className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors">
                  <p className="font-medium text-slate-900">📊 Rapports et analytics</p>
                  <p className="text-sm text-slate-600">Analyser l&apos;efficacité des onboardings</p>
                </button>

                <button className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors">
                  <p className="font-medium text-slate-900">💬 Messagerie équipe</p>
                  <p className="text-sm text-slate-600">Communiquer avec les nouveaux arrivants</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="heading-2">Notifications récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Marie Dupont a terminé l&apos;étape &quot;Formation sécurité&quot;
                  </p>
                  <p className="text-xs text-slate-600">Il y a 2 heures</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 border-l-4 border-blue-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Nouveau collaborateur Thomas Martin assigné à votre équipe
                  </p>
                  <p className="text-xs text-slate-600">Hier à 14:30</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 border-l-4 border-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Sophie Laurent a terminé son onboarding avec succès
                  </p>
                  <p className="text-xs text-slate-600">Il y a 3 jours</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}