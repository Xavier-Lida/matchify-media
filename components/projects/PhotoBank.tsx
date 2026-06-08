"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_URL } from "@/lib/env";
import type { ProjectAsset } from "@/lib/types-user";

function publicUrl(filePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/project-photos/${filePath}`;
}

export function PhotoBank({
  projectId,
  userId,
  assets,
}: {
  projectId: string;
  userId: string;
  assets: ProjectAsset[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${userId}/${projectId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("project-photos")
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const res = await fetch(`/api/projects/${projectId}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath, label: file.name }),
    });

    setUploading(false);
    if (!res.ok) {
      setError("Impossible d'enregistrer la photo.");
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
        >
          {uploading ? "Envoi…" : "Ajouter une photo"}
        </button>
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      </div>

      {assets.length === 0 ? (
        <p className="text-sm text-muted">Aucune photo dans la banque.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <figure
              key={asset.id}
              className="rounded-lg border border-border bg-surface overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={publicUrl(asset.file_path)}
                alt={asset.label ?? ""}
                className="aspect-square w-full object-cover"
              />
              <figcaption className="p-2 text-xs text-muted truncate">
                {asset.label ?? asset.file_path.split("/").pop()}
              </figcaption>
              <div className="px-2 pb-2">
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      publicUrl(asset.file_path),
                    );
                  }}
                >
                  Copier l&apos;URL
                </button>
              </div>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
