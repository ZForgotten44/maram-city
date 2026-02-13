# Architect Portfolio - A Living Gothic World

A modern, immersive digital portfolio website for an architect, designed as a spatial experience rather than a traditional scroll-through site. Built with React, Three.js, and modern web technologies.

## 🌟 Features

### Core Experience
- **Homepage Threshold**: Dark gothic entry with fog effects and a single "Enter" interaction
- **3D World Map**: Interactive portfolio where each building represents a project
- **Project Details**: Immersive project pages with 3D viewers, blueprints, and sustainability layers
- **About Page**: Manifesto-style presentation of the architect

### Technical Features
- **PCD Viewer Support**: Ready for Point Cloud Data files from Revit
- **PDF Blueprint Viewer**: Interactive blueprint viewing with zoom and navigation
- **Sustainability X-ray Vision**: Toggle to reveal sustainable materials in projects
- **Modern 3D Graphics**: Three.js powered 3D environments
- **Gothic Typography**: Custom fonts and animations
- **Sound Design**: Ambient audio for immersive experience

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 📁 Project Structure

```
architect-portfolio/
├── src/
│   ├── components/       # Reusable components
│   │   ├── Building.jsx  # 3D building representation
│   │   ├── NavigationUI.jsx
│   │   ├── BlueprintViewer.jsx
│   │   ├── PCDViewer.jsx
│   │   └── SoundDesign.jsx
│   ├── pages/            # Main page components
│   │   ├── Homepage.jsx  # Entry threshold
│   │   ├── WorldMap.jsx   # 3D portfolio view
│   │   ├── ProjectDetail.jsx
│   │   └── About.jsx
│   ├── data/             # Project data
│   │   └── projects.js   # Template projects (replace with real data)
│   ├── styles/           # Global styles
│   └── utils/            # Utility functions
├── public/               # Static assets
└── package.json
```

## 🎨 Customization

### Adding Real Projects

Edit `src/data/projects.js` to replace template projects with actual work:

```javascript
{
  id: 'unique-project-id',
  title: 'Project Name',
  year: 2024,
  concept: 'Concept Keyword',
  category: 'Category',
  description: 'Project description...',
  materials: {
    sustainable: ['Material 1', 'Material 2'],
    reused: ['Material 3'],
    experimental: ['Material 4']
  },
  location: 'Location',
  images: ['url1', 'url2'], // Image URLs
  pcdFile: 'path/to/file.pcd', // Optional PCD file
  blueprints: [
    { name: 'Plan Name', url: 'path/to/blueprint.pdf' }
  ]
}
```

### Adding PCD Files

1. Place PCD files in `public/models/` directory
2. Update project data with the file path
3. The PCDViewer component will automatically load them

### Adding Audio Files

1. Place audio files in `public/audio/` directory:
   - `wind-ambient.mp3` - For homepage
   - `metallic-resonance.mp3` - For world map
   - `cathedral-reverb.mp3` - For project pages

2. The SoundDesign component will automatically use them

### Styling

Main color variables are defined in `src/styles/index.css`:

```css
--color-black: #0a0a0a;
--color-charcoal: #1a1a1a;
--color-deep-oxblood: #2d1b1b;
--color-muted-sandstone: #8b7355;
--color-gold: #d4af37;
```

## 🛠️ Tech Stack

- **React 18** - UI framework
- **React Router** - Navigation
- **Three.js** - 3D graphics
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for R3F
- **React-PDF** - PDF/blueprint viewing
- **Vite** - Build tool and dev server
- **GSAP** - Advanced animations (available but not heavily used yet)
- **Framer Motion** - Animation library (available)

## 📝 Notes

- The site uses template content and placeholder images from Unsplash
- Replace all template data with actual project information
- PCD viewer is set up but needs actual PCD files to function fully
- Sound design uses Web Audio API for subtle tones - replace with actual audio files for better experience
- All animations use CSS transitions for smooth, performant effects

## 🎯 Future Enhancements

- Full PCD file loading and visualization
- Unreal Engine integration for walkthroughs
- Advanced shader effects for fog and lighting
- Time-based visual changes (day/night modes)
- Easter eggs and hidden interactions
- Mobile optimization improvements

## 📄 License

Private project - All rights reserved

---

Built with care for an architect's digital presence.
