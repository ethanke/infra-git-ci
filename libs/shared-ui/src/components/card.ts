/**
 * Card component
 */

export interface CardProps {
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  border?: boolean;
  class?: string;
}

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function renderCard(
  content: string,
  props: CardProps = {}
): string {
  const {
    padding = "md",
    hover = false,
    border = true,
    class: className = "",
  } = props;

  const classes = `
    rounded-xl
    ${paddingStyles[padding]}
    ${border ? "border" : ""}
    ${hover ? "transition-all duration-200 hover:-translate-y-1 hover:shadow-lg" : ""}
    ${className}
  `.trim().replace(/\s+/g, " ");

  return `
<div class="${classes}" 
     style="background: var(--color-surface); border-color: var(--color-border);">
  ${content}
</div>`.trim();
}

export function renderCardHeader(
  title: string,
  subtitle?: string,
  actions?: string
): string {
  return `
<div class="flex items-center justify-between mb-4">
  <div>
    <h3 class="text-lg font-semibold text-white">${title}</h3>
    ${subtitle ? `<p class="text-sm text-gray-400 mt-1">${subtitle}</p>` : ""}
  </div>
  ${actions ? `<div class="flex items-center gap-2">${actions}</div>` : ""}
</div>`.trim();
}
