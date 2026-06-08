"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Impossible de créer le projet.");
      return;
    }

    const { id } = (await res.json()) as { id: string };
    router.push(`/projects/${id}`);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="projectName" className="text-sm font-medium text-foreground">
          Nom du projet
        </label>
        <input
          id="projectName"
          type="text"
          required
          placeholder="Ma ligue, Mon équipe…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
      >
        {loading ? "Création…" : "Nouveau projet"}
      </button>
      {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
</form>
  );
}
