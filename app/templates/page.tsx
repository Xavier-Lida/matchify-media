import { SiteHeader } from "@/components/SiteHeader";
import { TemplatesCatalog } from "@/components/templates/TemplatesCatalog";
import {
  TEMPLATE_TYPES,
  type TemplateType,
} from "@/lib/types";

export const dynamic = "force-dynamic";

function isTemplateType(value: string | undefined): value is TemplateType {
  return TEMPLATE_TYPES.includes(value as TemplateType);
}

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const activeType = isTemplateType(type) ? type : undefined;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6">
        <div className="border-b border-border py-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
            Matchify Media
          </p>
          <h1 className="mt-3 text-[32px] font-normal leading-tight tracking-[-0.96px] text-foreground">
            Templates
          </h1>
        </div>
        <div className="py-6">
          <TemplatesCatalog activeType={activeType} />
        </div>
      </main>
    </>
  );
}
