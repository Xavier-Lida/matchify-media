import Link from "next/link";

import { SiteHeader } from "@/components/SiteHeader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TEMPLATE_LIST } from "@/lib/templates/registry";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-10 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Créez vos visuels futsal
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Choisissez un template, remplissez vos données et exportez un PNG
            1080×1350 prêt pour Instagram. Configurez votre ligue une fois dans{" "}
            <Link href="/branding" className="font-medium text-foreground underline">
              Ma ligue
            </Link>
            .
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATE_LIST.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{template.label}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto">
                <Link
                  href={`/templates/${template.id}`}
                  className={cn(buttonVariants(), "w-full")}
                >
                  Utiliser
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
