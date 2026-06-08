"use client";

export interface PhotoAsset {
  id: string;
  label: string | null;
  url: string;
}

export function PhotoBankPicker({
  assets,
  value,
  onChange,
}: {
  assets: PhotoAsset[];
  value: string;
  onChange: (url: string) => void;
}) {
  if (assets.length === 0) {
    return (
      <p className="text-sm text-muted rounded-lg border border-dashed border-border p-4 text-center">
        Aucune photo dans votre banque.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {assets.map((asset) => {
        const selected = value === asset.url;
        return (
          <button
            key={asset.id}
            type="button"
            title={asset.label ?? asset.url}
            onClick={() => onChange(selected ? "" : asset.url)}
            className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
              selected
                ? "border-accent shadow-[0_0_0_2px] shadow-accent/30"
                : "border-border hover:border-accent/50"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.url}
              alt={asset.label ?? ""}
              className="h-full w-full object-cover"
            />
            {selected && (
              <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                <span className="rounded-full bg-accent text-white text-xs px-2 py-0.5 font-medium">
                  ✓
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
