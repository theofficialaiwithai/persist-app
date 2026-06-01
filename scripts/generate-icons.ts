/**
 * Generates PWA icons using sharp (bundled with Next.js).
 * Run: npx tsx scripts/generate-icons.ts
 */
import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

const outDir = path.join(process.cwd(), 'public', 'icons')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

async function generateIcon(size: number, filename: string) {
  const radius = Math.round(size * 0.2)
  const fontSize = Math.round(size * 0.52)
  const dotR = Math.round(size * 0.08)
  const dotCx = Math.round(size * 0.72)
  const dotCy = Math.round(size * 0.28)

  const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#004643"/>
  <text
    x="50%" y="53%"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="${fontSize}"
    fill="#FBFEF9"
    text-anchor="middle"
    dominant-baseline="middle"
  >P</text>
  <circle cx="${dotCx}" cy="${dotCy}" r="${dotR}" fill="#E4572E"/>
</svg>`

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(outDir, filename))

  console.log(`✓ Generated ${filename} (${size}×${size})`)
}

;(async () => {
  await generateIcon(192, 'icon-192.png')
  await generateIcon(512, 'icon-512.png')
  console.log('Icons written to public/icons/')
})()
