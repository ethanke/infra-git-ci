/**
 * Pricing card pattern
 */

export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingCardProps {
  name: string;
  description: string;
  price: string;
  period?: string;
  features: PricingFeature[];
  cta: {
    text: string;
    href: string;
  };
  popular?: boolean;
  highlight?: boolean;
}

export function renderPricingCard(props: PricingCardProps): string {
  const {
    name,
    description,
    price,
    period = "/month",
    features,
    cta,
    popular = false,
    highlight = false,
  } = props;

  return `
<div class="relative flex flex-col p-6 rounded-xl border transition-all duration-300 
            ${highlight ? "md:-translate-y-4 shadow-xl" : ""}
            ${popular ? "border-orange-500" : ""}"
     style="background: var(--color-surface); ${!popular ? "border-color: var(--color-border);" : ""}">
  
  ${popular ? `
    <div class="absolute -top-3 left-1/2 -translate-x-1/2">
      <span class="px-3 py-1 text-xs font-bold text-white rounded-full"
            style="background: var(--gradient-brand);">
        POPULAR
      </span>
    </div>
  ` : ""}
  
  <div class="mb-6">
    <h3 class="text-xl font-bold text-white">${name}</h3>
    <p class="text-sm text-gray-400 mt-1">${description}</p>
  </div>
  
  <div class="mb-6">
    <span class="text-4xl font-bold text-white">${price}</span>
    ${price !== "Custom" ? `<span class="text-gray-400">${period}</span>` : ""}
  </div>
  
  <ul class="space-y-3 mb-8 flex-grow">
    ${features.map(f => `
      <li class="flex items-center text-sm ${f.included ? "text-gray-300" : "text-gray-500 line-through"}">
        <svg class="w-5 h-5 mr-3 flex-shrink-0 ${f.included ? "text-green-500" : "text-gray-600"}" 
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${f.included 
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>'}
        </svg>
        ${f.text}
      </li>
    `).join("")}
  </ul>
  
  <a href="${cta.href}" 
     class="w-full py-3 px-4 text-center font-medium rounded-lg transition-all duration-200
            ${popular 
              ? "text-white hover:shadow-lg hover:-translate-y-0.5" 
              : "text-white border hover:bg-white/5"}"
     style="${popular 
       ? "background: var(--gradient-brand);" 
       : "border-color: var(--color-border);"}">
    ${cta.text}
  </a>
</div>`.trim();
}

export function renderPricingGrid(plans: PricingCardProps[]): string {
  return `
<div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
  ${plans.map(renderPricingCard).join("")}
</div>`.trim();
}
