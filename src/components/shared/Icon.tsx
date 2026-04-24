"use client";

// Thin wrapper around Google Material Symbols font. The font is loaded in
// app/layout.tsx; this component just renders the span with a consistent size.
export function Icon({
  name,
  size = 18,
  fill = false,
  className = "",
  title,
}: {
  name: string;
  size?: number;
  fill?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={`material-symbols-rounded ${fill ? "ms-fill" : ""} ${className}`}
      style={{ fontSize: size, lineHeight: 1 }}
      aria-hidden={title ? undefined : true}
      title={title}
    >
      {name}
    </span>
  );
}
