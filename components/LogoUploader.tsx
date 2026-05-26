"use client";

import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LogoUploaderProps = {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  persistAsDataUrl?: boolean;
};

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function LogoUploader({
  label,
  value,
  onChange,
  persistAsDataUrl = false,
}: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (persistAsDataUrl) {
      onChange(await fileToDataUrl(file));
      return;
    }

    onChange(URL.createObjectURL(file));
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="size-14 rounded-md border object-contain"
          />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
            —
          </div>
        )}
        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="max-w-[200px]"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        {value ? (
          <Button type="button" variant="outline" size="sm" onClick={() => onChange(null)}>
            Retirer
          </Button>
        ) : null}
      </div>
    </div>
  );
}
