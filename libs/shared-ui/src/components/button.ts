/**
 * Button component
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: string;
  class?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    background: var(--gradient-brand);
    color: white;
    border: none;
    &:hover { background: var(--gradient-brand-hover); transform: translateY(-1px); }
  `.trim(),
  secondary: `
    background: transparent;
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    &:hover { background: var(--color-surface-hover); border-color: var(--color-border-hover); }
  `.trim(),
  ghost: `
    background: transparent;
    color: var(--color-text-secondary);
    border: none;
    &:hover { color: var(--color-text-primary); background: var(--color-surface-hover); }
  `.trim(),
  danger: `
    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
    color: white;
    border: none;
    &:hover { background: linear-gradient(135deg, #F87171 0%, #EF4444 100%); }
  `.trim(),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-lg",
};

export function renderButton(
  content: string,
  props: ButtonProps = {}
): string {
  const {
    variant = "primary",
    size = "md",
    href,
    type = "button",
    disabled = false,
    fullWidth = false,
    icon,
    class: className = "",
  } = props;

  const baseClasses = `
    inline-flex items-center justify-center font-medium
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-orange-500
    disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeStyles[size]}
    ${fullWidth ? "w-full" : ""}
    ${className}
  `.trim().replace(/\s+/g, " ");

  const style = variantStyles[variant]
    .replace(/&:hover/g, "")
    .replace(/{[^}]*}/g, "")
    .trim();

  const hoverClass = variant === "primary" 
    ? "hover:shadow-lg hover:-translate-y-0.5" 
    : "hover:bg-white/5";

  if (href) {
    return `
<a href="${href}" 
   class="${baseClasses} ${hoverClass}"
   style="${style}">
  ${icon ? `<span class="mr-2">${icon}</span>` : ""}${content}
</a>`.trim();
  }

  return `
<button type="${type}" 
        ${disabled ? "disabled" : ""}
        class="${baseClasses} ${hoverClass}"
        style="${style}">
  ${icon ? `<span class="mr-2">${icon}</span>` : ""}${content}
</button>`.trim();
}
