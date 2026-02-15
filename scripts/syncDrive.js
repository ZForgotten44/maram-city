/**
 * Drive sync: list Google Drive project folders → generate src/data/projects.generated.json
 *
 * Requires:
 *   DRIVE_ROOT_FOLDER_ID - ID of the Drive folder containing project folders (Lifeline Hospital, Mixed Use, Twin Towers, etc.)
 *   GOOGLE_APPLICATION_CREDENTIALS - path to service account JSON key
 *
 * Run: npm run sync:drive
 * Optional: run before build so "npm run build" uses fresh data.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { google } from 'googleapis'
import pdf from 'pdf-parse'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DRIVE_ROOT_FOLDER_ID = process.env.DRIVE_ROOT_FOLDER_ID
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS
const OUTPUT_PATH = path.join(process.cwd(), 'src', 'data', 'projects.generated.json')
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp'])

function driveViewLink(fileId) {
  return `https://drive.google.com/file/d/${fileId}/view`
}
function driveDownloadLink(fileId) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`
}

function getDriveClient() {
  if (!GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('Missing GOOGLE_APPLICATION_CREDENTIALS env var (path to service account JSON).')
  }
  if (!DRIVE_ROOT_FOLDER_ID) {
    throw new Error('Missing DRIVE_ROOT_FOLDER_ID env var.')
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
  return google.drive({ version: 'v3', auth })
}

async function listChildren(drive, folderId) {
  const out = []
  let pageToken
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size)',
      pageSize: 1000,
      pageToken,
    })
    out.push(...(res.data.files ?? []))
    pageToken = res.data.nextPageToken || undefined
  } while (pageToken)
  return out
}

function findFolder(files, folderName) {
  return files.find(
    (f) =>
      f.mimeType === 'application/vnd.google-apps.folder' &&
      f.name.toLowerCase() === folderName.toLowerCase()
  )
}

function isPdf(file) {
  return file.mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}
function isRvt(file) {
  return file.name.toLowerCase().endsWith('.rvt')
}
function isGlbOrGltf(file) {
  const n = file.name.toLowerCase()
  return n.endsWith('.glb') || n.endsWith('.gltf')
}
function isImage(file) {
  return IMAGE_EXTS.has(path.extname(file.name.toLowerCase()))
}

async function extractBriefText(drive, fileId) {
  try {
    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    )
    const buffer = Buffer.from(res.data)
    const parsed = await pdf(buffer)
    return parsed.text || ''
  } catch {
    return ''
  }
}

function parseBrief(text) {
  const get = (label) => {
    const re = new RegExp(`${label}\\s*:\\s*(.+)`, 'i')
    const m = text.match(re)
    return m ? m[1].trim() : ''
  }
  const name = get('Name') || ''
  const type = get('Type') || ''
  const location = get('Location') || ''
  const academicYear = get('Academic Year') || get('Year') || ''
  const duration = get('Duration') || ''
  let description = ''
  const descMatch = text.match(/Description\s*:\s*([\s\S]+)/i)
  if (descMatch) description = descMatch[1].trim()
  return { name, type, location, academicYear, duration, description }
}

async function main() {
  const drive = getDriveClient()
  const rootChildren = await listChildren(drive, DRIVE_ROOT_FOLDER_ID)
  const projectFolders = rootChildren.filter(
    (f) => f.mimeType === 'application/vnd.google-apps.folder'
  )
  const projects = []

  for (const projFolder of projectFolders) {
    const projectName = projFolder.name
    const projectId = projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const children = await listChildren(drive, projFolder.id)
    const blueprintsFolder = findFolder(children, 'Blueprints')
    const photos3dFolder = findFolder(children, 'Photos and 3D')
    const briefFile = children.find((f) => isPdf(f) && f.name.toLowerCase() === 'brief.pdf')

    let blueprintPdfs = []
    if (blueprintsFolder) {
      const bpChildren = await listChildren(drive, blueprintsFolder.id)
      blueprintPdfs = bpChildren
        .filter(isPdf)
        .map((f) => ({
          id: f.id,
          name: f.name,
          viewUrl: driveViewLink(f.id),
          downloadUrl: driveDownloadLink(f.id),
        }))
    }

    let photos = []
    let rvt = null
    let model = null
    if (photos3dFolder) {
      const pChildren = await listChildren(drive, photos3dFolder.id)
      photos = pChildren
        .filter(isImage)
        .map((f) => ({
          id: f.id,
          name: f.name,
          viewUrl: driveViewLink(f.id),
          downloadUrl: driveDownloadLink(f.id),
        }))
      const rvtFile = pChildren.find(isRvt)
      if (rvtFile) {
        rvt = {
          id: rvtFile.id,
          name: rvtFile.name,
          viewUrl: driveViewLink(rvtFile.id),
          downloadUrl: driveDownloadLink(rvtFile.id),
        }
      }
      const glFile = pChildren.find(isGlbOrGltf)
      if (glFile) {
        model = {
          id: glFile.id,
          name: glFile.name,
          viewUrl: driveViewLink(glFile.id),
          downloadUrl: driveDownloadLink(glFile.id),
        }
      }
    }

    let meta = {
      name: projectName,
      type: '',
      location: '',
      academicYear: '',
      duration: '',
      description: '',
    }
    if (briefFile) {
      const text = await extractBriefText(drive, briefFile.id)
      const parsed = parseBrief(text)
      meta = {
        name: parsed.name || projectName,
        type: parsed.type || '',
        location: parsed.location || '',
        academicYear: parsed.academicYear || '',
        duration: parsed.duration || '',
        description: parsed.description || '',
      }
    }

    projects.push({
      id: projectId,
      folderName: projectName,
      driveFolderId: projFolder.id,
      brief: briefFile
        ? {
            id: briefFile.id,
            name: briefFile.name,
            viewUrl: driveViewLink(briefFile.id),
            downloadUrl: driveDownloadLink(briefFile.id),
          }
        : null,
      meta,
      assets: {
        blueprints: { count: blueprintPdfs.length, pdfs: blueprintPdfs },
        photos: { count: photos.length, images: photos },
        model3d: {
          glbOrGltf: model,
          rvt,
        },
      },
    })
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify({ generatedAt: new Date().toISOString(), projects }, null, 2)
  )
  console.log(`✅ Wrote ${projects.length} projects → ${OUTPUT_PATH}`)
}

main().catch((e) => {
  console.error('❌ syncDrive failed:', e)
  process.exit(1)
})
