'use client'

import { useState } from 'react'

interface CodeCopyButtonProps {
  codeId: string
  className?: string
}

export function CodeCopyButton({ codeId, className = '' }: CodeCopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const codeElement = document.getElementById(codeId)
    if (!codeElement) return

    const text = codeElement.textContent || codeElement.innerText

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted/50 ${className}`}
    >
      {copied ? (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span className="text-green-500">Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  )
}
