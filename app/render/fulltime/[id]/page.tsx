import { notFound } from "next/navigation";

import { FullTimeRenderPage } from "@/components/render/FullTimeRenderPage";
import { getRenderPayload } from "@/lib/render/payload-cache";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function FullTimeRenderRoute({ params }: PageProps) {
  const { id } = await params;
  const payload = getRenderPayload(id);

  if (!payload) {
    notFound();
  }

  return <FullTimeRenderPage payload={payload} />;
}
