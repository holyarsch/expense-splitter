import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = "", ...rest }, ref) => (
  <label className="block">
    {label && <span className="block mb-1.5 font-accent font-bold text-xs uppercase tracking-wider text-gv-fg2">{label}</span>}
    <input ref={ref} className={`brutal-input w-full ${error ? "border-gv-red" : ""} ${className}`} {...rest} />
    {error && <span className="block mt-1 text-xs text-gv-red font-mono">{error}</span>}
  </label>
));
Input.displayName = "Input";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({ label, className = "", ...rest }, ref) => (
  <label className="block">
    {label && <span className="block mb-1.5 font-accent font-bold text-xs uppercase tracking-wider text-gv-fg2">{label}</span>}
    <textarea ref={ref} className={`brutal-input w-full resize-none ${className}`} {...rest} />
  </label>
));
TextArea.displayName = "TextArea";
