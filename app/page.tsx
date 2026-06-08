import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { PhosphorIcon } from "@/components/ui/PhosphorIcon";
import type { PhosphorIconName } from "@/lib/phosphor-icon";

// ─── Hero template previews ───────────────────────────────────────────────────

// ─── Feature card ─────────────────────────────────────────────────────────────

function Feature({
  icon,
  title,
  body,
}: {
  icon: PhosphorIconName;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6 space-y-3">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <PhosphorIcon name={icon} className="size-5" />
      </div>
      <h3 className="text-[17px] font-medium text-foreground">
        {title}
      </h3>
      <p className="text-sm text-muted leading-relaxed">{body}</p>
    </div>
  );
}

// ─── Step ────────────────────────────────────────────────────────────────────

function Step({
  n,
  title,
  body,
  last = false,
}: {
  n: string;
  title: string;
  body: string;
  last?: boolean;
}) {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
          {n}
        </div>
        {!last && <div className="mt-2 w-px flex-1 bg-border" />}
      </div>
      <div className="pb-8">
        <p className="text-[16px] font-medium text-foreground">
          {title}
        </p>
        <p className="mt-1.5 text-sm text-muted leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-background">
        {/* Subtle radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 65% 50%, rgba(91,155,213,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto w-full max-w-[1200px] px-6 py-20 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-center">
            {/* Left — text */}
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
                Matchify Media · Ligues de futsal
              </p>
              <h1 className="mt-4 text-[42px] font-normal leading-[1.1] tracking-[-1.26px] text-foreground lg:text-[54px] lg:tracking-[-1.62px]">
                Du contenu foot{" "}
                <span className="text-primary">pro en secondes.</span>
              </h1>
              <p className="mt-5 text-[17px] leading-relaxed text-muted">
                Importez vos données de ligue, choisissez un template, exportez.
                Résultats, classements, annonces et horaires.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-hover)]"
                >
                  Commencer gratuitement →
                </Link>
                <Link
                  href="/templates"
                  className="inline-flex items-center gap-2 rounded-md border border-input bg-surface px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Voir les templates
                </Link>
              </div>
            </div>

            {/* Right — template previews */}
            <div className="relative hidden lg:block w-[360px] h-[460px] shrink-0 select-none">
              {/* Arrière — multi-match, décalé en haut à droite, légèrement incliné */}
              <div
                className="absolute top-0 right-0 rounded-2xl overflow-hidden shadow-xl opacity-85"
                style={{ transform: "rotate(3deg)" }}
              >
                <Image
                  src="/exemples/multi-match-result.png"
                  alt="Résultats de plusieurs matchs"
                  width={210}
                  height={263}
                  className="block"
                  priority
                />
              </div>
              {/* Avant — match individuel, en bas à gauche, inclinaison opposée */}
              <div
                className="absolute bottom-0 left-0 rounded-2xl overflow-hidden shadow-2xl"
                style={{ transform: "rotate(-2deg)" }}
              >
                <Image
                  src="/exemples/match-result.png"
                  alt="Résultat de match"
                  width={230}
                  height={288}
                  className="block"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTEGRATION STRIP ── */}
      <div className="border-y border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-center gap-8 px-6">
          <Image
            src="/intégrations/logo-planiligue.png"
            alt="Planiligue"
            height={28}
            width={125}
            className="object-contain"
          />
          <Image
            src="/intégrations/logo-spordle.png"
            alt="Spordle"
            height={28}
            width={90}
            className="object-contain opacity-50"
          />
          <Image
            src="/intégrations/logo-matchify.png"
            alt="Matchify.ca"
            height={28}
            width={28}
            className="object-contain rounded-md"
          />
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1200px] px-6">

        {/* ── HOW IT WORKS ── */}
        <section className="border-b border-border py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-primary">
                Comment ça marche
              </p>
              <h2 className="mt-3 text-[32px] font-normal leading-tight tracking-[-0.96px] text-foreground">
                Trois étapes,
                <br />
                zéro friction.
              </h2>
              <p className="mt-4 text-sm text-muted leading-relaxed max-w-sm">
                Conçu pour les gestionnaires de ligues et d&apos;équipes qui veulent
                publier rapidement, même sans compétences en design.
              </p>
            </div>
            <div className="mt-2">
              <Step
                n="1"
                title="Connectez votre ligue"
                body="Entrez l'URL de votre tournoi Planiligue ou Spordle. Synchronisez en un clic pour importer scores, classements et horaires."
              />
              <Step
                n="2"
                title="Choisissez un template"
                body="Parcourez le catalogue. Le logiciel détecte automatiquement les données nécessaires et les propose depuis votre ligue."
              />
              <Step
                n="3"
                title="Choisissez une photo et exportez"
                body="Sélectionnez une photo depuis votre banque. L'aperçu se met à jour en temps réel. Téléchargez en PNG haute résolution."
                last
              />
            </div>
          </div>
        </section>

      </main>

      {/* ── FINAL CTA ── */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-[1200px] px-6 py-20 text-center space-y-6">
          <h2 className="text-[36px] font-normal tracking-[-1.08px] text-foreground leading-tight">
            Votre prochaine publication
            <br />
            <span className="text-primary">est à 3 clics.</span>
          </h2>
          <p className="mx-auto max-w-md text-[16px] text-muted">
            Créez un compte, connectez votre ligue, exportez votre premier visuel.
            Gratuit pour commencer.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors"
            >
              Créer un compte gratuit →
            </Link>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 rounded-md border border-input bg-surface px-7 py-3.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Parcourir les templates
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-3 px-6 py-5 text-center sm:flex-row sm:text-left">
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} Matchify Media. Tous droits réservés.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link
              href="/templates"
              className="text-sm text-muted underline-offset-4 transition-colors hover:text-foreground"
            >
              Templates
            </Link>
            <Link
              href="/login"
              className="text-sm text-muted underline-offset-4 transition-colors hover:text-foreground"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="text-sm text-muted underline-offset-4 transition-colors hover:text-foreground"
            >
              S&apos;inscrire
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
