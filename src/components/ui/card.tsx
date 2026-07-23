import type { ComponentPropsWithoutRef } from "react";

type CardPadding = "default" | "lg";

const PADDING_CLASSES: Record<CardPadding, string> = {
  default: "p-8",
  lg: "p-10",
};

interface CardProps extends ComponentPropsWithoutRef<"div"> {
  padding?: CardPadding;
}

/** The `rounded-2xl border border-navy-100 bg-surface p-8` panel duplicated across the app, as one component. */
export function Card({ padding = "default", className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-navy-100 bg-surface ${PADDING_CLASSES[padding]} ${className}`}
      {...props}
    />
  );
}
