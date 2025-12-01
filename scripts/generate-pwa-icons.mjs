import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// Source logo
const sourceLogo = join(projectRoot, 'public/images/syfte_Logo/Logo_syfte.png')
const publicDir = join(projectRoot, 'public')

async function generateIcons() {
  console.log('🎨 Generiere PWA Icons...')
  
  if (!existsSync(sourceLogo)) {
    console.error('❌ Source-Logo nicht gefunden:', sourceLogo)
    process.exit(1)
  }

  const sizes = [
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 }
  ]

  for (const { name, size } of sizes) {
    const outputPath = join(publicDir, name)
    
    await sharp(sourceLogo)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(outputPath)
    
    console.log(`✅ ${name} erstellt (${size}x${size})`)
  }

  console.log('🎉 Alle PWA Icons wurden erfolgreich erstellt!')
}

generateIcons().catch(console.error)
