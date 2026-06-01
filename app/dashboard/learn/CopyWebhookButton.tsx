'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyWebhookButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors shrink-0 ${
        copied
          ? 'bg-[#7FB069] text-white'
          : 'bg-[#004643] hover:bg-[#003533] text-white'
      }`}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
