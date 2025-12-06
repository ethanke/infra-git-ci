/**
 * Input components
 */

export interface InputProps {
  type?: string;
  name: string;
  label?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  class?: string;
}

export function renderInput(props: InputProps): string {
  const {
    type = "text",
    name,
    label,
    placeholder,
    value = "",
    required = false,
    disabled = false,
    error,
    hint,
    class: className = "",
  } = props;

  const inputId = `input-${name}`;
  const hasError = !!error;

  return `
<div class="space-y-1.5 ${className}">
  ${label ? `
    <label for="${inputId}" class="block text-sm font-medium text-gray-300">
      ${label}${required ? '<span class="text-red-500 ml-1">*</span>' : ""}
    </label>
  ` : ""}
  <input
    type="${type}"
    id="${inputId}"
    name="${name}"
    value="${value}"
    placeholder="${placeholder || ""}"
    ${required ? "required" : ""}
    ${disabled ? "disabled" : ""}
    class="w-full px-3 py-2 rounded-lg text-white placeholder-gray-500 
           transition-colors duration-200
           focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black
           disabled:opacity-50 disabled:cursor-not-allowed
           ${hasError ? "ring-2 ring-red-500" : ""}"
    style="background: var(--color-surface-elevated); border: 1px solid ${hasError ? "#EF4444" : "var(--color-border)"};"
  />
  ${error ? `<p class="text-sm text-red-500">${error}</p>` : ""}
  ${hint && !error ? `<p class="text-sm text-gray-500">${hint}</p>` : ""}
</div>`.trim();
}

export function renderTextarea(
  props: InputProps & { rows?: number }
): string {
  const {
    name,
    label,
    placeholder,
    value = "",
    required = false,
    disabled = false,
    error,
    rows = 4,
    class: className = "",
  } = props;

  const inputId = `textarea-${name}`;

  return `
<div class="space-y-1.5 ${className}">
  ${label ? `
    <label for="${inputId}" class="block text-sm font-medium text-gray-300">
      ${label}${required ? '<span class="text-red-500 ml-1">*</span>' : ""}
    </label>
  ` : ""}
  <textarea
    id="${inputId}"
    name="${name}"
    rows="${rows}"
    placeholder="${placeholder || ""}"
    ${required ? "required" : ""}
    ${disabled ? "disabled" : ""}
    class="w-full px-3 py-2 rounded-lg text-white placeholder-gray-500 resize-none
           transition-colors duration-200
           focus:outline-none focus:ring-2 focus:ring-orange-500"
    style="background: var(--color-surface-elevated); border: 1px solid var(--color-border);"
  >${value}</textarea>
  ${error ? `<p class="text-sm text-red-500">${error}</p>` : ""}
</div>`.trim();
}
