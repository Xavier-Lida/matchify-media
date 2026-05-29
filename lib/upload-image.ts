const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadImageFile(file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error("Fichier trop volumineux (max 5 Mo).");
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });

  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Échec de l'upload.");
  }

  return data.url;
}
