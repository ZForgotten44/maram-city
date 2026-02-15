/**
 * Build-time: scan public/projects/*, collect media + blueprints + brief*.pdf,
 * parse brief for name/year/duration/type/location/description, write projects.generated.json.
 * Run before build: "prebuild": "node scripts/generateProjects.mjs"
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(process.cwd(), 'public', 'projects')
const OUT = path.join(process.cwd(), 'src', 'data', 'projects.generated.json')

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp'])

function toId(folderName) {
  return folderName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function publicUrl(...parts) {
  return '/' + parts.map((p) => encodeURIComponent(p)).join('/')
}

function safeReaddir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
}

function listFiles(dir, predicate) {
  const out = []
  const ents = safeReaddir(dir)
  for (const e of ents) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) continue
    if (predicate(e.name)) out.push(e.name)
  }
  return out.sort()
}

function findBriefPdfs(dir) {
  const all = listFiles(dir, (n) => n.toLowerCase().startsWith('brief') && n.toLowerCase().endsWith('.pdf'))
  // Prefer brief2* > brief* > brief.pdf (newest / most specific first)
  return all.sort((a, b) => {
    const a2 = a.toLowerCase().startsWith('brief2') ? 2 : a.toLowerCase() === 'brief.pdf' ? 0 : 1
    const b2 = b.toLowerCase().startsWith('brief2') ? 2 : b.toLowerCase() === 'brief.pdf' ? 0 : 1
    if (b2 !== a2) return b2 - a2
    return b.localeCompare(a)
  })
}

function parseBriefText(text) {
  const get = (label, re) => {
    const m = text.match(re)
    return m ? m[1].trim() : ''
  }
  const name = get('Name', /(?:^|\n)\s*Name\s*:\s*(.+?)(?=\n|$)/i)
    || get('Title', /(?:^|\n)\s*Title\s*:\s*(.+?)(?=\n|$)/i)
  const year = get('Year', /(?:^|\n)\s*(?:Year|Academic Year)\s*:\s*(.+?)(?=\n|$)/i)
    || (text.match(/(20\d{2})/) ? text.match(/(20\d{2})/)[1] : '')
  const duration = get('Duration', /(?:^|\n)\s*Duration\s*:\s*(.+?)(?=\n|$)/i)
    || (text.match(/(\d+)\s*(weeks|months|days)/i) ? text.match(/(\d+\s*(?:weeks|months|days))/i)[0] : '')
  const type = get('Type', /(?:^|\n)\s*Type\s*:\s*(.+?)(?=\n|$)/i)
    || get('Category', /(?:^|\n)\s*Category\s*:\s*(.+?)(?=\n|$)/i)
  const location = get('Location', /(?:^|\n)\s*Location\s*:\s*(.+?)(?=\n|$)/i)
  let description = get('Description', /(?:^|\n)\s*Description\s*:\s*([\s\S]+?)(?=\n\s*(?:\w+\s*:)|$)/i)
  if (!description && text.length > 200) description = text.slice(0, 400).trim() + '…'
  return { name, year, duration, type, location, description }
}

async function extractBriefMeta(briefPath) {
  let pdfParse
  try {
    pdfParse = (await import('pdf-parse')).default
  } catch {
    try {
      const { createRequire } = await import('module')
      pdfParse = createRequire(import.meta.url)('pdf-parse')
    } catch {
      return {}
    }
  }
  try {
    const buf = fs.readFileSync(briefPath)
    const { text } = await pdfParse(buf)
    return parseBriefText(text || '')
  } catch {
    return {}
  }
}

async function scanProject(folderName) {
  const dir = path.join(ROOT, folderName)
  const id = toId(folderName)
  const meta = { name: folderName, year: '', duration: '', type: '', location: '', description: '' }

  // Brief: prefer brief2* > brief* > brief.pdf
  const briefs = findBriefPdfs(dir)
  if (briefs.length > 0) {
    const chosen = path.join(dir, briefs[0])
    const parsed = await extractBriefMeta(chosen)
    meta.name = parsed.name || meta.name
    meta.year = parsed.year || ''
    meta.duration = parsed.duration || ''
    meta.type = parsed.type || ''
    meta.location = parsed.location || ''
    meta.description = parsed.description || ''
  }

  // Media: look for folder named media or "photos and 3d" (any casing)
  const topDirsForMedia = safeReaddir(dir).filter((e) => e.isDirectory()).map((e) => e.name)
  const mediaFolderNames = topDirsForMedia.filter(
    (d) => d.toLowerCase() === 'media' || d.toLowerCase().replace(/\s+/g, ' ') === 'photos and 3d'
  )
  const images = []
  for (const sub of mediaFolderNames) {
    const mediaDir = path.join(dir, sub)
    const files = listFiles(mediaDir, (n) => IMAGE_EXTS.has(path.extname(n).toLowerCase()))
    for (const f of files) {
      images.push(publicUrl('projects', folderName, sub, f))
    }
  }
  images.sort()

  // Blueprints (use actual folder name so URL matches filesystem casing)
  const topDirs = safeReaddir(dir).filter((e) => e.isDirectory()).map((e) => e.name)
  const bpFolderName = topDirs.find((d) => d.toLowerCase() === 'blueprints')
  const bpDir = bpFolderName ? path.join(dir, bpFolderName) : null
  const bpList = []
  if (bpDir && fs.statSync(bpDir).isDirectory()) {
    const subName = bpFolderName
    const files = listFiles(bpDir, (n) => n.toLowerCase().endsWith('.pdf'))
    for (const f of files) {
      const name = path.basename(f, '.pdf').replace(/-/g, ' ')
      bpList.push({ name, url: publicUrl('projects', folderName, subName, f) })
    }
  }

  // Optional: .rvt / .glb in media folders
  let rvtUrl = null
  let glbUrl = null
  for (const sub of mediaFolderNames) {
    const mediaDir = path.join(dir, sub)
    const files = fs.readdirSync(mediaDir)
    for (const f of files) {
      const lower = f.toLowerCase()
      if (lower.endsWith('.rvt')) rvtUrl = publicUrl('projects', folderName, sub, f)
      if (lower.endsWith('.glb') || lower.endsWith('.gltf')) glbUrl = publicUrl('projects', folderName, sub, f)
    }
  }

  return {
    id,
    folderName,
    name: meta.name,
    year: meta.year,
    duration: meta.duration,
    type: meta.type,
    location: meta.location,
    description: meta.description,
    images,
    blueprints: bpList,
    rvt: rvtUrl,
    glbOrGltf: glbUrl ? { url: glbUrl, name: path.basename(glbUrl) } : null,
  }
}

async function main() {
  if (!fs.existsSync(ROOT)) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true })
    fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), projects: [] }, null, 2))
    console.log('No public/projects folder, wrote empty manifest.')
    return
  }

  const folders = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)

  const projects = []
  for (const folderName of folders) {
    const proj = await scanProject(folderName)
    projects.push(proj)
  }

  const payload = { generatedAt: new Date().toISOString(), projects }
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2))
  console.log(`Wrote ${projects.length} projects → ${OUT}`)
}

main().catch((e) => {
  console.error('generateProjects failed:', e)
  process.exit(1)
})
