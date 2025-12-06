/**
 * Stats card pattern
 */

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: "blue" | "green" | "purple" | "orange" | "red";
  trend?: {
    value: number;
    label: string;
  };
}

const colorStyles = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
};

export function renderStatsCard(props: StatsCardProps): string {
  const { title, value, subtitle, icon = "📊", color = "blue", trend } = props;

  return `
<div class="rounded-xl p-6 border" style="background: var(--color-surface); border-color: var(--color-border);">
  <div class="flex items-center">
    <div class="w-12 h-12 ${colorStyles[color]} rounded-lg flex items-center justify-center">
      <span class="text-white text-xl">${icon}</span>
    </div>
    <div class="ml-4 flex-1">
      <p class="text-sm font-medium text-gray-400">${title}</p>
      <p class="text-2xl font-bold text-white">${value}</p>
      ${subtitle ? `<p class="text-xs text-gray-500">${subtitle}</p>` : ""}
    </div>
    ${trend ? `
      <div class="text-right">
        <span class="${trend.value >= 0 ? "text-green-500" : "text-red-500"} text-sm font-medium">
          ${trend.value >= 0 ? "↑" : "↓"} ${Math.abs(trend.value)}%
        </span>
        <p class="text-xs text-gray-500">${trend.label}</p>
      </div>
    ` : ""}
  </div>
</div>`.trim();
}

export function renderStatsGrid(cards: StatsCardProps[]): string {
  return `
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  ${cards.map(renderStatsCard).join("")}
</div>`.trim();
}
