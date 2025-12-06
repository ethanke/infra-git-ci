/**
 * Badge component
 */

export type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "orange";

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  class?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot?: string }> = {
  default: { bg: "rgba(255,255,255,0.1)", text: "#A3A3A3" },
  success: { bg: "rgba(16,185,129,0.15)", text: "#10B981", dot: "#10B981" },
  warning: { bg: "rgba(245,158,11,0.15)", text: "#F59E0B", dot: "#F59E0B" },
  error: { bg: "rgba(239,68,68,0.15)", text: "#EF4444", dot: "#EF4444" },
  info: { bg: "rgba(59,130,246,0.15)", text: "#3B82F6", dot: "#3B82F6" },
  orange: { bg: "rgba(255,128,0,0.15)", text: "#FF8000", dot: "#FF8000" },
};

export function renderBadge(
  content: string,
  props: BadgeProps = {}
): string {
  const {
    variant = "default",
    size = "sm",
    dot = false,
    class: className = "",
  } = props;

  const styles = variantStyles[variant];
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return `
<span class="inline-flex items-center font-medium rounded-full ${sizeClasses} ${className}"
      style="background: ${styles.bg}; color: ${styles.text};">
  ${dot ? `<span class="w-1.5 h-1.5 rounded-full mr-1.5" style="background: ${styles.dot || styles.text};"></span>` : ""}
  ${content}
</span>`.trim();
}
