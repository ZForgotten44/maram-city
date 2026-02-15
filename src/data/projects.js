/**
 * Project data: from Drive sync (projects.generated.json) when available,
 * otherwise fallback static list. World map positions come from overlay or fallback.
 * Local assets in public/projects/ are used for hospital, towers, and mixed-use.
 */

import generated from './projects.generated.json'

// URL for files in public/ (e.g. public/projects/LIFE LINE HOSPITAL/... -> /projects/LIFE%20LINE%20HOSPITAL/...)
const pub = (...parts) => '/' + parts.map((p) => encodeURIComponent(p)).join('/')

// Map project id -> { buildingType, positions } for world map (local manifest + Drive)
const PROJECT_OVERLAY = {
  'life-line-hospital': { buildingType: 'hospital', positions: [[-7, -2.5]] },
  'lifeline-hospital': { buildingType: 'hospital', positions: [[-7, -2.5]] },
  'mixed-use': { buildingType: 'mixed-use', positions: [[7, -2.5]] },
  'twin-towers': { buildingType: 'tower', positions: [[-4, -10], [4, -10]] },
}

function parseYear(str) {
  if (!str) return null
  const n = parseInt(String(str).replace(/\D/g, '').slice(0, 4), 10)
  return Number.isNaN(n) ? null : n
}

function mapLocalManifestToApp(d) {
  const overlay = PROJECT_OVERLAY[d.id]
  return {
    id: d.id,
    title: d.name || d.folderName || d.id,
    year: parseYear(d.year) || new Date().getFullYear(),
    concept: d.type || '',
    category: d.type || '',
    buildingType: overlay?.buildingType || 'default',
    description: d.description || '',
    materials: { sustainable: [], reused: [], experimental: [] },
    location: d.location || '',
    designDuration: d.duration || '',
    images: Array.isArray(d.images) ? d.images : [],
    blueprints: Array.isArray(d.blueprints) ? d.blueprints : [],
    rvtFile: d.rvt ? { url: d.rvt, name: 'model.rvt' } : null,
    model3d: {
      glbOrGltf: d.glbOrGltf?.url ? { downloadUrl: d.glbOrGltf.url, name: d.glbOrGltf.name } : null,
      rvt: d.rvt ? { downloadUrl: d.rvt, name: 'model.rvt' } : null,
    },
  }
}

function mapDriveGeneratedToApp(d) {
  const overlay = PROJECT_OVERLAY[d.id]
  return {
    id: d.id,
    title: d.meta?.name || d.folderName,
    year: parseYear(d.meta?.academicYear) || new Date().getFullYear(),
    concept: d.meta?.type || '',
    category: d.meta?.type || '',
    buildingType: overlay?.buildingType || 'default',
    description: d.meta?.description || '',
    materials: { sustainable: [], reused: [], experimental: [] },
    location: d.meta?.location || '',
    designDuration: d.meta?.duration || '',
    images: (d.assets?.photos?.images || []).map((i) => i.downloadUrl || i.viewUrl),
    blueprints: (d.assets?.blueprints?.pdfs || []).map((p) => ({ name: p.name, url: p.downloadUrl || p.viewUrl })),
    rvtFile: d.assets?.model3d?.rvt ? { url: d.assets.model3d.rvt.downloadUrl, name: d.assets.model3d.rvt.name } : null,
    model3d: d.assets?.model3d ?? { glbOrGltf: null, rvt: null },
  }
}

function mapGeneratedToApp(d) {
  if (Array.isArray(d.images) || (d.blueprints && !d.assets)) return mapLocalManifestToApp(d)
  return mapDriveGeneratedToApp(d)
}

// Placeholders so detail page is never empty when folder has no images/blueprints yet
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
]
const PLACEHOLDER_BLUEPRINTS = [
  { name: 'Plans', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
]
const PLACEHOLDER_DESCRIPTION = 'Description and media for this project will appear here once added to the project folder.'

// Fallback when no Drive data (generated.projects empty or missing) — full content so detail pages show everything
const FALLBACK_PROJECTS = [
  {
    id: 'resort',
    title: 'Desert Resort',
    year: 2024,
    concept: 'Hospitality',
    category: 'Resort',
    buildingType: 'resort',
    description: 'A luxury resort blending local materials with contemporary comfort. Low-rise pavilions, pools, and shaded courtyards create a seamless indoor-outdoor experience in the desert landscape.',
    materials: {
      sustainable: ['Local stone', 'Recycled timber', 'Solar shading'],
      reused: ['Salvaged tiles', 'Heritage wood'],
      experimental: ['Evaporative cooling', 'Green roofs'],
    },
    location: 'Red Sea, Egypt',
    designDuration: '8 months',
    images: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200',
    ],
    rvtFile: null,
    model3d: { glbOrGltf: null, rvt: null },
    blueprints: [
      { name: 'Site Plan', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { name: 'Ground Floor', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    ],
  },
  {
    id: 'elementary-school',
    title: 'Sunrise Elementary',
    year: 2023,
    concept: 'Education',
    category: 'Elementary School',
    buildingType: 'school',
    description: 'An elementary school designed around light and play. Classrooms open onto shared courtyards; colored blocks and safe outdoor spaces encourage movement and curiosity.',
    materials: {
      sustainable: ['Rammed earth', 'Bamboo', 'Natural light'],
      reused: ['Demolition brick', 'Recycled glass'],
      experimental: ['Outdoor classrooms', 'Rainwater harvesting'],
    },
    location: 'Cairo, Egypt',
    designDuration: '6 months',
    images: [
      'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200',
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200',
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200',
    ],
    rvtFile: null,
    model3d: { glbOrGltf: null, rvt: null },
    blueprints: [
      { name: 'Floor Plans', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { name: 'Sections', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    ],
  },
  {
    id: 'mixed-use',
    title: 'Courtyard Block',
    year: 2024,
    concept: 'Mixed Use',
    category: 'Residential & Commercial',
    buildingType: 'mixed-use',
    description: 'Mixed-use block with ground-floor retail and upper-floor housing. A central courtyard brings light and air into every unit while creating a shared community space.',
    materials: {
      sustainable: ['Local brick', 'Cross-ventilation', 'Green facades'],
      reused: ['Industrial steel', 'Salvaged windows'],
      experimental: ['Shared rooftop garden', 'Bike storage'],
    },
    location: 'Alexandria, Egypt',
    designDuration: '10 months',
    images: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
    ],
    rvtFile: null,
    model3d: { glbOrGltf: null, rvt: null },
    blueprints: [
      { name: 'Mixed Use Poster', url: pub('projects', 'Mixed use', 'BLUEPRINTS', 'mixed use poster.pdf') },
    ],
  },
  {
    id: 'tower-east',
    title: 'Tower East',
    year: 2023,
    concept: 'Vertical Living',
    category: 'Residential Tower',
    buildingType: 'tower',
    description: 'Slender residential tower with panoramic views. Terraces and double-height lobbies break the vertical mass and connect residents to the skyline.',
    materials: {
      sustainable: ['High-performance glass', 'Recycled steel', 'Green roof'],
      reused: ['Recycled aluminum', 'Salvaged stone'],
      experimental: ['Wind turbines', 'Smart shading'],
    },
    location: 'New Capital, Egypt',
    designDuration: '14 months',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
    ],
    rvtFile: null,
    model3d: { glbOrGltf: null, rvt: null },
    blueprints: [
      { name: 'Towers Poster', url: pub('projects', 'twin Towers', 'BLUEPRINTS', 'towers poster.pdf') },
    ],
  },
  {
    id: 'tower-west',
    title: 'Tower West',
    year: 2023,
    concept: 'Vertical Living',
    category: 'Residential Tower',
    buildingType: 'tower',
    description: 'Twin to Tower East, forming a gateway to the district. Shared podium with retail and public plazas at ground level.',
    materials: {
      sustainable: ['High-performance glass', 'Recycled steel', 'Green roof'],
      reused: ['Recycled aluminum', 'Salvaged stone'],
      experimental: ['Wind turbines', 'Smart shading'],
    },
    location: 'New Capital, Egypt',
    designDuration: '14 months',
    images: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
    ],
    rvtFile: null,
    model3d: { glbOrGltf: null, rvt: null },
    blueprints: [
      { name: 'Towers Poster', url: pub('projects', 'twin Towers', 'BLUEPRINTS', 'towers poster.pdf') },
    ],
  },
  {
    id: 'three-pyramids',
    title: 'Three Pyramids Complex',
    year: 2024,
    concept: 'Heritage & Light',
    category: 'Cultural',
    buildingType: 'pyramid',
    description: 'A cultural and visitor center inspired by the ancient pyramids. Three low, stepped volumes frame views to the monuments while housing exhibitions, cafes, and gathering spaces.',
    materials: {
      sustainable: ['Local limestone', 'Passive cooling', 'Solar orientation'],
      reused: ['Salvaged stone', 'Heritage materials'],
      experimental: ['Light wells', 'Thermal mass'],
    },
    location: 'Giza Plateau, Egypt',
    designDuration: '12 months',
    images: [
      'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=1200',
      'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200',
      'https://images.unsplash.com/photo-1597211837712-2e67a2e4a6a3?w=1200',
    ],
    rvtFile: null,
    model3d: { glbOrGltf: null, rvt: null },
    blueprints: [
      { name: 'Master Plan', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { name: 'Section', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    ],
  },
  {
    id: 'hospital',
    title: 'Sanctuary General Hospital',
    year: 2024,
    concept: 'Healing',
    category: 'Healthcare',
    buildingType: 'hospital',
    description: 'A large-scale hospital designed for clarity and calm. Clear wayfinding, daylight in every corridor, and healing gardens create an environment that supports recovery and staff wellbeing.',
    materials: {
      sustainable: ['Antimicrobial surfaces', 'Natural ventilation', 'Green courtyards'],
      reused: ['Recycled steel', 'Salvaged stone'],
      experimental: ['Biophilic design', 'Smart building systems'],
    },
    location: 'Cairo, Egypt',
    designDuration: '18 months',
    images: [
      pub('projects', 'LIFE LINE HOSPITAL', 'PHOTOS AND 3D', 'MAIN ENTRANCE.png'),
      pub('projects', 'LIFE LINE HOSPITAL', 'PHOTOS AND 3D', 'RENDER10.jpg'),
      pub('projects', 'LIFE LINE HOSPITAL', 'PHOTOS AND 3D', 'RENDERRR2.png'),
      pub('projects', 'LIFE LINE HOSPITAL', 'PHOTOS AND 3D', 'EMERGENCY ENTANCE.png'),
      pub('projects', 'LIFE LINE HOSPITAL', 'PHOTOS AND 3D', 'SETTINGS.jpg'),
      pub('projects', 'LIFE LINE HOSPITAL', 'PHOTOS AND 3D', 'VASCULLR DEAPARTMENT.jpg'),
      pub('projects', 'LIFE LINE HOSPITAL', 'PHOTOS AND 3D', '3D.png'),
    ],
    rvtFile: { url: pub('projects', 'LIFE LINE HOSPITAL', 'PHOTOS AND 3D', 'hosp.rvt'), name: 'hosp.rvt' },
    model3d: { glbOrGltf: null, rvt: { downloadUrl: pub('projects', 'LIFE LINE HOSPITAL', 'PHOTOS AND 3D', 'hosp.rvt'), name: 'hosp.rvt' } },
    blueprints: [
      { name: 'The Poster', url: pub('projects', 'LIFE LINE HOSPITAL', 'BLUEPRINTS', 'THE POSTER.pdf') },
      { name: 'Master Plan Rendered', url: pub('projects', 'LIFE LINE HOSPITAL', 'BLUEPRINTS', 'master plan rendered.pdf') },
      { name: 'First Floor Plan', url: pub('projects', 'LIFE LINE HOSPITAL', 'BLUEPRINTS', 'FIRST FLOOR PLAN.pdf') },
      { name: 'Second Floor Plan', url: pub('projects', 'LIFE LINE HOSPITAL', 'BLUEPRINTS', 'SECOND FLOOR PLAN.pdf') },
      { name: 'North Elevation', url: pub('projects', 'LIFE LINE HOSPITAL', 'BLUEPRINTS', 'NORTH ELEVATION.pdf') },
      { name: 'West Elevation', url: pub('projects', 'LIFE LINE HOSPITAL', 'BLUEPRINTS', 'WEST ELEVATION.pdf') },
      { name: 'Section 1', url: pub('projects', 'LIFE LINE HOSPITAL', 'BLUEPRINTS', 'section 1.pdf') },
      { name: 'Section 2', url: pub('projects', 'LIFE LINE HOSPITAL', 'BLUEPRINTS', 'section2.pdf') },
    ],
  },
]

const FALLBACK_POSITIONS = {
  resort: [[9, 7]],
  'elementary-school': [[-8, 6]],
  'mixed-use': [[7, -2.5]],
  'tower-east': [[-4, -10]],
  'tower-west': [[4, -10]],
  'three-pyramids': [[0, -8], [-4, -8], [4, -8]],
  hospital: [[-7, -2.5]],
}

// Always show ALL buildings. Merge generated data (from manifest) into fallback so we never lose resort, pyramids, etc.
function mergeGeneratedIntoFallback() {
  const list = FALLBACK_PROJECTS.map((p) => ({ ...p }))
  if (!generated?.projects?.length) return list

  for (const g of generated.projects) {
    const mapped = mapGeneratedToApp(g)
    if (g.id === 'life-line-hospital' || g.id === 'lifeline-hospital') {
      const i = list.findIndex((p) => p.id === 'hospital')
      if (i !== -1) {
        list[i] = {
          ...list[i],
          title: mapped.title || list[i].title,
          year: mapped.year ?? list[i].year,
          concept: mapped.concept || list[i].concept,
          description: mapped.description || list[i].description,
          location: mapped.location || list[i].location,
          designDuration: mapped.designDuration || list[i].designDuration,
          images: (mapped.images?.length > 0 ? mapped.images : list[i].images) || [],
          blueprints: (mapped.blueprints?.length > 0 ? mapped.blueprints : list[i].blueprints) || [],
          rvtFile: mapped.rvtFile ?? list[i].rvtFile,
          model3d: mapped.model3d ?? list[i].model3d,
        }
      }
    } else if (g.id === 'mixed-use') {
      const i = list.findIndex((p) => p.id === 'mixed-use')
      if (i !== -1) {
        list[i] = {
          ...list[i],
          title: mapped.title || list[i].title,
          year: mapped.year ?? list[i].year,
          concept: mapped.concept || list[i].concept,
          description: mapped.description || list[i].description,
          location: mapped.location || list[i].location,
          designDuration: mapped.designDuration || list[i].designDuration,
          images: (mapped.images?.length > 0 ? mapped.images : list[i].images) || [],
          blueprints: (mapped.blueprints?.length > 0 ? mapped.blueprints : list[i].blueprints) || [],
          rvtFile: mapped.rvtFile ?? list[i].rvtFile,
          model3d: mapped.model3d ?? list[i].model3d,
        }
      }
    } else if (g.id === 'twin-towers') {
      const content = {
        title: mapped.title || 'Twin Towers',
        year: mapped.year ?? 2023,
        concept: mapped.concept || list.find((p) => p.id === 'tower-east')?.concept || 'Vertical Living',
        description: mapped.description || list.find((p) => p.id === 'tower-east')?.description || '',
        location: mapped.location || list.find((p) => p.id === 'tower-east')?.location || '',
        designDuration: mapped.designDuration || list.find((p) => p.id === 'tower-east')?.designDuration || '',
        images: (mapped.images?.length > 0 ? mapped.images : list.find((p) => p.id === 'tower-east')?.images) || [],
        blueprints: (mapped.blueprints?.length > 0 ? mapped.blueprints : list.find((p) => p.id === 'tower-east')?.blueprints) || [],
        rvtFile: mapped.rvtFile ?? null,
        model3d: mapped.model3d ?? { glbOrGltf: null, rvt: null },
      }
      const east = list.findIndex((p) => p.id === 'tower-east')
      const west = list.findIndex((p) => p.id === 'tower-west')
      if (east !== -1) list[east] = { ...list[east], ...content }
      if (west !== -1) list[west] = { ...list[west], ...content }
    }
  }

  return list
}

function ensureNoEmptyContent(list) {
  return list.map((p) => ({
    ...p,
    images: p.images?.length ? p.images : PLACEHOLDER_IMAGES,
    blueprints: p.blueprints?.length ? p.blueprints : PLACEHOLDER_BLUEPRINTS,
    description: (p.description && String(p.description).trim()) ? p.description : PLACEHOLDER_DESCRIPTION,
  }))
}

const projects = ensureNoEmptyContent(mergeGeneratedIntoFallback())
export { projects }
export const projectPositions = FALLBACK_POSITIONS

export function getProjectById(id) {
  return projects.find((p) => p.id === id)
}
