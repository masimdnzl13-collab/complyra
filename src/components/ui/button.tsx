import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "default" | "sm";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white shadow-premium hover:bg-accent-600",
  secondary: "border border-navy-200 text-navy-900 hover:bg-navy-50",
  ghost: "text-navy-600 hover:bg-navy-50 hover:text-navy-900",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: "h-12 px-6 text-sm",
  sm: "h-10 px-4 text-sm",
};

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl font-medium transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50";

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

interface ButtonAsLink extends CommonProps, ComponentPropsWithoutRef<typeof Link> {
  href: string;
}

interface ButtonAsButton extends CommonProps, ComponentPropsWithoutRef<"button"> {
  href?: undefined;
}

type ButtonProps = ButtonAsLink | ButtonAsButton;

/** Shared button primitive — resembles Stripe: filled/outlined/ghost, 150ms hover, subtle scale + shadow. Renders a Link when `href` is passed, a <button> otherwise. */
export function Button({ variant = "primary", size = "default", className = "", ...props }: ButtonProps) {
  const classes = `${BASE} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;

  if (props.href !== undefined) {
    return <Link {...(props as ButtonAsLink)} className={classes} />;
  }

  return <button {...(props as ButtonAsButton)} className={classes} />;
}
