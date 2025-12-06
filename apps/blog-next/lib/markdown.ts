import { marked } from 'marked'
import Prism from 'prismjs'

// Import only essential languages to avoid conflicts
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-yaml'

// Configure marked for better security and formatting
marked.setOptions({
  breaks: true,
  gfm: true,
})

// Custom renderer for enhanced code blocks with syntax highlighting and copy functionality
const renderer = new marked.Renderer()

// Counter for deterministic IDs
let codeBlockCounter = 0

// Generate deterministic ID based on content hash
function generateCodeId(code: string): string {
  // Simple hash function for deterministic IDs
  let hash = 0
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return `code-${Math.abs(hash)}-${++codeBlockCounter}`
}

// Enhanced code block renderer with syntax highlighting and copy button
renderer.code = function (code: any, language?: string) {
  // Extract language from the token object if it's a marked token
  let lang = 'text'
  let codeString = ''
  
  if (code && typeof code === 'object' && code.type === 'code') {
    // This is a marked token object
    lang = code.lang || 'text'
    codeString = code.text || ''
  } else if (typeof code === 'string') {
    // This is just a string
    codeString = code
    lang = language || 'text'
  } else {
    // Fallback for other cases
    codeString = String(code || '')
    lang = language || 'text'
  }
  
  // Generate deterministic ID for this code block
  const codeId = generateCodeId(codeString)
  
  // Apply syntax highlighting with Prism.js
  let highlightedCode = codeString
  let prismLang = lang
  
  // Map common language aliases to Prism.js language names
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'sh': 'bash',
    'shell': 'bash',
    'yml': 'yaml',
    'md': 'markdown',
    'c++': 'cpp',
    'c#': 'csharp',
    'cs': 'csharp',
    'dockerfile': 'docker',
    'git': 'git'
  }
  
  prismLang = languageMap[lang.toLowerCase()] || lang.toLowerCase()
  
  // Check if Prism has support for this language
  if (Prism.languages[prismLang]) {
    try {
      highlightedCode = Prism.highlight(codeString, Prism.languages[prismLang], prismLang)
    } catch (error) {
      console.warn(`Prism highlighting failed for language: ${prismLang}`, error)
      // Fallback to escaped code if highlighting fails
      highlightedCode = codeString
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    }
  } else {
    // Escape HTML for unsupported languages
    highlightedCode = codeString
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
  
  return `
    <div class="code-block-wrapper mb-6 rounded-lg border border-border/20 bg-muted/30 overflow-hidden">
      <div class="code-block-header flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/20">
        <div class="flex items-center gap-2">
          <div class="flex gap-1">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div class="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span class="text-xs font-mono text-muted-foreground">${lang}</span>
        </div>
        <button 
          class="copy-code-btn flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted/50"
          data-code-id="${codeId}"
          onclick="copyCodeToClipboard('${codeId}')"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
          Copy
        </button>
      </div>
      <div class="code-block-content relative">
        <pre class="overflow-x-auto p-4 m-0"><code id="${codeId}" class="language-${prismLang} text-sm font-mono leading-relaxed">${highlightedCode}</code></pre>
      </div>
    </div>
  `
}

// Enhanced inline code renderer
renderer.codespan = function ({ text }: { text: string }) {
  return `<code class="bg-muted/50 px-2 py-1 rounded text-sm font-mono text-foreground border border-border/20">${text}</code>`
}

// Use the custom renderer
marked.use({ renderer })

/**
 * Convert markdown content to HTML with enhanced code rendering
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return ''
  
  try {
    const html = marked.parse(markdown) as string
    return html
  } catch (error) {
    console.error('Error converting markdown to HTML:', error)
    return markdown // Return original if conversion fails
  }
}

/**
 * Check if content is markdown (simple heuristic)
 */
export function isMarkdown(content: string): boolean {
  if (!content) return false
  
  // Check for common markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s+/m,           // Headers
    /\*\*.*?\*\*/,           // Bold
    /\*.*?\*/,               // Italic
    /^\s*[-*+]\s+/m,        // Unordered lists
    /^\s*\d+\.\s+/m,        // Ordered lists
    /```[\s\S]*?```/,       // Code blocks
    /\[.*?\]\(.*?\)/,       // Links
    /^\s*>\s+/m,            // Blockquotes
    /\|.*\|/m,              // Tables
  ]
  
  return markdownPatterns.some(pattern => pattern.test(content))
}
