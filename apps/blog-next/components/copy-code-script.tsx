'use client'

import { useEffect } from 'react'

export function CopyCodeScript() {
  useEffect(() => {
    // Define the global copy function
    const copyCodeToClipboard = async (codeId: string) => {
      const codeElement = document.getElementById(codeId)
      if (!codeElement) {
        console.error(`Code element with id "${codeId}" not found`)
        return
      }

      const text = codeElement.textContent || codeElement.innerText

      try {
        await navigator.clipboard.writeText(text)
        
        // Find the copy button and update its state
        const copyButton = document.querySelector(`[data-code-id="${codeId}"]`) as HTMLButtonElement
        if (copyButton) {
          const originalContent = copyButton.innerHTML
          copyButton.innerHTML = `
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="text-green-500">Copied!</span>
          `
          copyButton.classList.add('text-green-500')
          
          // Reset after 2 seconds
          setTimeout(() => {
            copyButton.innerHTML = originalContent
            copyButton.classList.remove('text-green-500')
          }, 2000)
        }
      } catch (err) {
        console.error('Failed to copy code:', err)
        
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand('copy')
          
          // Update button state
          const copyButton = document.querySelector(`[data-code-id="${codeId}"]`) as HTMLButtonElement
          if (copyButton) {
            const originalContent = copyButton.innerHTML
            copyButton.innerHTML = `
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span class="text-green-500">Copied!</span>
            `
            copyButton.classList.add('text-green-500')
            
            setTimeout(() => {
              copyButton.innerHTML = originalContent
              copyButton.classList.remove('text-green-500')
            }, 2000)
          }
        } catch (fallbackErr) {
          console.error('Fallback copy failed:', fallbackErr)
        }
        document.body.removeChild(textArea)
      }
    }

    // Make the function globally available
    ;(window as any).copyCodeToClipboard = copyCodeToClipboard
  }, [])

  return null
}
