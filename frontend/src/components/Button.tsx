import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  children?: ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-gv-yellow text-gv-bg0h",
  secondary: "bg-gv-bg0 text-gv-fg1",
  danger: "bg-gv-red text-gv-bg0",
  ghost: "bg-transparent text-gv-fg1 shadow-none border-transparent hover:shadow-brutal-sm",
};

export default function Button({ variant = "primary", icon, children, fullWidth, className = "", ...rest }: Props) {
  return (
    <button
      className={`brutal-btn inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm disabled:opacity-50 disabled:pointer-events-none ${VARIANT_CLASSES[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
