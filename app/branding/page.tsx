"use client";

import { useBrandingContext } from "@/components/BrandingProvider";
import { LogoUploader } from "@/components/LogoUploader";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_BRANDING } from "@/lib/templates/types";

export default function BrandingPage() {
  const { branding, updateBranding, setBranding, hydrated } = useBrandingContext();

  if (!hydrated) {
    return null;
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Identité de la ligue</CardTitle>
            <CardDescription>
              Logo et couleurs réutilisés sur tous les visuels. Enregistré
              localement dans votre navigateur.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="leagueName">Nom de la ligue</Label>
              <Input
                id="leagueName"
                value={branding.leagueName}
                onChange={(e) =>
                  updateBranding({ leagueName: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="primaryColor">Couleur principale</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) =>
                      updateBranding({ primaryColor: e.target.value })
                    }
                    className="h-10 w-14 cursor-pointer p-1"
                  />
                  <Input
                    value={branding.primaryColor}
                    onChange={(e) =>
                      updateBranding({ primaryColor: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="secondaryColor">Couleur accent</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={branding.secondaryColor}
                    onChange={(e) =>
                      updateBranding({ secondaryColor: e.target.value })
                    }
                    className="h-10 w-14 cursor-pointer p-1"
                  />
                  <Input
                    value={branding.secondaryColor}
                    onChange={(e) =>
                      updateBranding({ secondaryColor: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <LogoUploader
              label="Logo de la ligue"
              value={branding.logoDataUrl}
              onChange={(logoDataUrl) => updateBranding({ logoDataUrl })}
              persistAsDataUrl
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => setBranding(DEFAULT_BRANDING)}
            >
              Réinitialiser
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
