import { HTMLAttributes, ReactNode } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  accent?: string; // CSS color var for a top accent bar
}

export default function Card({ children, accent, className = "", ...rest }: Props) {
  return (
    <div className={`brutal-card relative overflow-hidden ${className}`} {...rest}>
      {accent && <div className="absolute top-0 left-0 right-0 h-2" style={{ background: accent }} />}
      <div className={accent ? "pt-2" : ""}>{children}</div>
    </div>
  );
}
