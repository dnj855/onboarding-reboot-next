import { ButtonOnboarding } from "@/components/ui/button-onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, CheckCircle, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="layout-chloe p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="text-center space-y-4">
          <h1 className="heading-1">Bienvenue sur Onboarding.ai</h1>
          <p className="body-text max-w-2xl mx-auto">
            Votre parcours d&apos;intégration personnalisé commence ici.
            L&apos;IA est là pour vous accompagner à chaque étape.
          </p>
        </header>

        {/* Demo Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chat Demo Card */}
          <Card className="transition-smooth hover:shadow-md">
            <CardHeader>
              <CardTitle className="heading-2 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-teal-600" strokeWidth={2} />
                Assistant IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Chat Messages Demo */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-slate-100 text-slate-600">IA</AvatarFallback>
                  </Avatar>
                  <div className="bg-slate-100 rounded-lg p-3 max-w-xs">
                    <p className="text-sm text-slate-900">
                      Bonjour ! Je suis votre assistant d&apos;onboarding.
                      Comment puis-je vous aider aujourd&apos;hui ?
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <div className="bg-teal-600 text-white rounded-lg p-3 max-w-xs">
                    <p className="text-sm">
                      J&apos;aimerais en savoir plus sur mon équipe.
                    </p>
                  </div>
                  <Avatar>
                    <AvatarFallback className="bg-teal-100 text-teal-600">C</AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* Input Demo */}
              <div className="flex gap-2">
                <Input
                  placeholder="Tapez votre message..."
                  className="flex-1"
                />
                <ButtonOnboarding variant="primary">
                  Envoyer
                </ButtonOnboarding>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Demo Card */}
          <Card className="transition-smooth hover:shadow-md">
            <CardHeader>
              <CardTitle className="heading-2 flex items-center gap-2">
                <Clock className="h-5 w-5 text-teal-600" strokeWidth={2} />
                Mon Parcours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Timeline Items */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Accueil et présentation</p>
                    <p className="caption-text">Complété le 15 janvier</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Rencontre avec l&apos;équipe</p>
                    <p className="caption-text">Complété le 16 janvier</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-slate-300 rounded-full">
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Formation aux outils</p>
                    <p className="caption-text">Prévu pour demain</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Typography Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="heading-2">Design System Demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <h2 className="heading-1">Heading 1 - text-3xl font-semibold</h2>
                <h3 className="heading-2">Heading 2 - text-2xl font-medium</h3>
                <p className="body-text">Body text - text-base text-slate-600</p>
                <p className="caption-text">Caption text - text-sm text-slate-400</p>
              </div>

              <div className="flex flex-wrap gap-3 sm:gap-4">
                <ButtonOnboarding variant="primary">Button Primary</ButtonOnboarding>
                <ButtonOnboarding variant="secondary">Button Secondary</ButtonOnboarding>
                <ButtonOnboarding variant="outline">Button Outline</ButtonOnboarding>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
