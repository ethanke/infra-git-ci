/**
 * Feature card pattern for landing pages
 */

export interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  href?: string;
  badge?: string;
}

export function renderFeatureCard(props: FeatureCardProps): string {
  const { title, description, icon, href, badge } = props;

  const content = `
<div class="relative p-6 rounded-xl border transition-all duration-300 group
            hover:-translate-y-1 hover:shadow-lg"
     style="background: var(--color-surface); border-color: var(--color-border);">
  <!-- Gradient top border on hover -->
  <div class="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity"
       style="background: var(--gradient-brand);"></div>
  
  ${badge ? `
    <span class="absolute top-4 right-4 px-2 py-0.5 text-xs font-medium rounded-full"
          style="background: rgba(255,128,0,0.15); color: #FF8000;">
      ${badge}
    </span>
  ` : ""}
  
  <div class="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
       style="background: linear-gradient(135deg, rgba(255,128,0,0.2) 0%, rgba(233,64,85,0.2) 100%);">
    <span class="text-2xl">${icon}</span>
  </div>
  
  <h3 class="text-lg font-semibold text-white mb-2">${title}</h3>
  <p class="text-gray-400 text-sm leading-relaxed">${description}</p>
  
  ${href ? `
    <div class="mt-4 flex items-center text-sm font-medium group-hover:translate-x-1 transition-transform"
         style="color: var(--lum-orange);">
      Learn more
      <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </div>
  ` : ""}
</div>`.trim();

  if (href) {
    return `<a href="${href}" class="block">${content}</a>`;
  }
  return content;
}

export function renderFeatureGrid(features: FeatureCardProps[]): string {
  return `
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  ${features.map(renderFeatureCard).join("")}
</div>`.trim();
}
