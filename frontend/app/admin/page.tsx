'use client';

import { useAuth } from '@/lib/auth/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building, Settings, BarChart3, UserPlus, FileText, Shield, Database } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();

  if (!user) {
    return null; // Le middleware protège déjà cette route
  }

  return (
    <div className="layout-admin p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="space-y-4">
          <h1 className="heading-1">Administration RH</h1>
          <p className="body-text">
            Bonjour <strong>{user.email}</strong>,
            gérez l&apos;ensemble du système d&apos;onboarding de l&apos;organisation.
          </p>
        </header>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collaborateurs</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">247</div>
              <p className="text-xs text-slate-500">total dans l&apos;organisation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Équipes</CardTitle>
              <Building className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-slate-500">équipes actives</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Onboardings</CardTitle>
              <UserPlus className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-slate-500">en cours ce mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
              <BarChart3 className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-slate-500">onboardings réussis</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gestion des Utilisateurs */}
          <Card>
            <CardHeader>
              <CardTitle className="heading-2 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Gestion des utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors">
                  <p className="font-medium text-slate-900">👤 Créer un utilisateur</p>
                  <p className="text-sm text-slate-600">Ajouter un nouveau collaborateur, manager ou admin</p>
                </button>

                <button className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors">
                  <p className="font-medium text-slate-900">📋 Liste des utilisateurs</p>
                  <p className="text-sm text-slate-600">Voir, modifier et gérer tous les comptes</p>
                </button>

                <button className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors">
                  <p className="font-medium text-slate-900">🔐 Gestion des rôles</p>
                  <p className="text-sm text-slate-600">Assigner et modifier les permissions</p>
                </button>

                <button className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors">
                  <p className="font-medium text-slate-900">🏢 Gestion des équipes</p>
                  <p className="text-sm text-slate-600">Organiser les équipes et hiérarchies</p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Système */}
          <Card>
            <CardHeader>
              <CardTitle className="heading-2 flex items-center gap-2">
                <Settings className="h-5 w-5 text-teal-600" />
                Configuration système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors">
                  <p className="font-medium text-slate-900">📝 Modèles d&apos;onboarding</p>
                  <p className="text-sm text-slate-600">Créer et gérer les parcours types</p>
                </button>

                <button className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors">
                  <p className="font-medium text-slate-900">🤖 Configuration IA</p>
                  <p className="text-sm text-slate-600">Paramétrer l&apos;assistant et les connaissances</p>
                </button>

                <button className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors">
                  <p className="font-medium text-slate-900">📊 Paramètres analytics</p>
                  <p className="text-sm text-slate-600">Configurer les rapports et métriques</p>
                </button>

                <button className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors">
                  <p className="font-medium text-slate-900">🔒 Sécurité et conformité</p>
                  <p className="text-sm text-slate-600">RGPD, audit trails et politiques</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics et Rapports */}
        <Card>
          <CardHeader>
            <CardTitle className="heading-2 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Analytics et rapports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <p className="font-medium text-blue-900">Rapport mensuel</p>
                </div>
                <p className="text-sm text-blue-700">15 onboardings ce mois</p>
                <p className="text-xs text-blue-600">Temps moyen: 28 jours</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <p className="font-medium text-green-900">Conformité RGPD</p>
                </div>
                <p className="text-sm text-green-700">100% conforme</p>
                <p className="text-xs text-green-600">Dernier audit: 15/01/2025</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-purple-600" />
                  <p className="font-medium text-purple-900">Base de connaissances</p>
                </div>
                <p className="text-sm text-purple-700">1,247 documents</p>
                <p className="text-xs text-purple-600">Mise à jour: aujourd&apos;hui</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activités Récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="heading-2">Activités récentes du système</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 border-l-4 border-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Nouveau manager créé: Jean Durand (Équipe Marketing)
                  </p>
                  <p className="text-xs text-slate-600">Il y a 1 heure</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 border-l-4 border-blue-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Modèle d&apos;onboarding &quot;Développeur Junior&quot; mis à jour
                  </p>
                  <p className="text-xs text-slate-600">Il y a 3 heures</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Sauvegarde automatique de la base de données effectuée
                  </p>
                  <p className="text-xs text-slate-600">Il y a 6 heures</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 border-l-4 border-purple-400">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Rapport mensuel d&apos;analytics généré et envoyé
                  </p>
                  <p className="text-xs text-slate-600">Hier à 09:00</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}