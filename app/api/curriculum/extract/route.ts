import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

// Strip HTML tags + collapse whitespace → plain text for Claude
function htmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { url } = await req.json() as { url?: string }
    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // ── 1. Fetch the course page ──────────────────────────────────────────────
    let pageText = ''
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const html = await res.text()
      pageText = htmlToText(html).slice(0, 14_000) // cap tokens
    } catch (fetchErr) {
      console.warn('[curriculum/extract] fetch failed:', fetchErr)
      // Return empty so UI falls back to manual mode
      return NextResponse.json({ lessons: [], warning: 'Could not fetch the page. Add lessons manually below.' })
    }

    if (!pageText || pageText.length < 100) {
      return NextResponse.json({ lessons: [], warning: 'Page content too short to extract curriculum.' })
    }

    // ── 2. Ask Claude to extract the curriculum ───────────────────────────────
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `You are analyzing text scraped from a course landing page or syllabus page.

Extract every lesson, lecture, module, chapter, or section title listed in the curriculum/course outline.

Return ONLY a valid JSON array of strings in order, like:
["Introduction", "Module 1: Getting Started", "Lesson 1.1: Setup", "Lesson 1.2: Your First Project", ...]

Rules:
- Include ALL lessons and modules you find, in order
- Use the exact titles as shown on the page
- Do NOT include marketing copy, instructor bios, or feature lists — only the actual curriculum items
- If the page has no curriculum section, return []
- Return ONLY the JSON array, no explanation

Page content:
${pageText}`,
      }],
    })

    const raw = (message.content[0] as { text: string }).text.trim()
    // Strip markdown code fences if Claude wrapped it
    const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let lessons: string[] = []
    try {
      const parsed = JSON.parse(json)
      if (Array.isArray(parsed)) {
        lessons = parsed.filter(l => typeof l === 'string' && l.trim().length > 0).map(l => l.trim())
      }
    } catch {
      lessons = []
    }

    return NextResponse.json({
      lessons,
      warning: lessons.length === 0
        ? 'No curriculum found on this page. Add lessons manually below.'
        : undefined,
    })
  } catch (err) {
    console.error('[curriculum/extract]', err)
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
  }
}
