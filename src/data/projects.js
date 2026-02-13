// Maram Ashraf — Portfolio projects (Minecraft-style city)
// Each building has fixed grid position for the world map

export const projects = [
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
      experimental: ['Evaporative cooling', 'Green roofs']
    },
    location: 'Red Sea, Egypt',
    designDuration: '8 months',
    images: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'
    ],
    rvtFile: null,
    blueprints: [
      { name: 'Site Plan', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { name: 'Ground Floor', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
    ]
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
      experimental: ['Outdoor classrooms', 'Rainwater harvesting']
    },
    location: 'Cairo, Egypt',
    designDuration: '6 months',
    images: [
      'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200',
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200',
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200'
    ],
    rvtFile: null,
    blueprints: [
      { name: 'Floor Plans', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { name: 'Sections', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
    ]
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
      experimental: ['Shared rooftop garden', 'Bike storage']
    },
    location: 'Alexandria, Egypt',
    designDuration: '10 months',
    images: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200'
    ],
    rvtFile: null,
    blueprints: [
      { name: 'Typical Floor', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { name: 'Facade', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
    ]
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
      experimental: ['Wind turbines', 'Smart shading']
    },
    location: 'New Capital, Egypt',
    designDuration: '14 months',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200'
    ],
    rvtFile: null,
    blueprints: [
      { name: 'Elevation', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { name: 'Typical Floor', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
    ]
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
      experimental: ['Wind turbines', 'Smart shading']
    },
    location: 'New Capital, Egypt',
    designDuration: '14 months',
    images: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200'
    ],
    rvtFile: null,
    blueprints: [
      { name: 'Elevation', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { name: 'Typical Floor', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
    ]
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
      experimental: ['Light wells', 'Thermal mass']
    },
    location: 'Giza Plateau, Egypt',
    designDuration: '12 months',
    images: [
      'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=1200',
      'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200',
      'https://images.unsplash.com/photo-1597211837712-2e67a2e4a6a3?w=1200'
    ],
    rvtFile: null,
    blueprints: [
      { name: 'Master Plan', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { name: 'Section', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
    ]
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
      experimental: ['Biophilic design', 'Smart building systems']
    },
    location: 'Cairo, Egypt',
    designDuration: '18 months',
    images: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200',
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200',
      'https://images.unsplash.com/photo-1631217868269-e6b356dea597?w=1200'
    ],
    rvtFile: null,
    blueprints: [
      { name: 'Site Plan', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { name: 'Ground Floor', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { name: 'Section', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
    ]
  }
]

// Fixed grid positions. Hospital & courtyard block moved forward from pyramids (plaza buffer).
// three-pyramids: largest center, then medium, then small.
export const projectPositions = {
  resort: [[9, 7]],
  'elementary-school': [[-8, 6]],
  'mixed-use': [[7, -2.5]],
  'tower-east': [[-4, -10]],
  'tower-west': [[4, -10]],
  'three-pyramids': [[0, -8], [-4, -8], [4, -8]],
  hospital: [[-7, -2.5]],
}

export const getProjectById = (id) => projects.find(p => p.id === id)
