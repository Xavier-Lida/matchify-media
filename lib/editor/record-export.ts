export async function recordExportEvent(input: {
  templateId: string;
  templateName: string;
  format: "png" | "jpeg" | "html";
}) {
  try {
    await fetch("/api/publications/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: input.templateId,
        format: input.format,
        title: input.templateName,
      }),
    });
  } catch {
    /* historique best-effort */
  }
}
