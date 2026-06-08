import { phosphorIconSrc, type PhosphorIconName } from "@/lib/phosphor-icon"

type PhosphorIconProps = {
  name: PhosphorIconName
  className?: string
  label?: string
}

export function PhosphorIcon({ name, className, label }: PhosphorIconProps) {
  const src = phosphorIconSrc(name)

  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={[
        "inline-block size-[1.125rem] shrink-0 bg-current",
        "[mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
      }}
    />
  )
}
