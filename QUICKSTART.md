# Quick Start Guide

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   Navigate to `http://localhost:3000`

## 📝 Next Steps

### Replace Template Content

1. **Update Projects** (`src/data/projects.js`)
   - Replace template projects with real work
   - Add actual images (replace Unsplash URLs)
   - Add PCD files to `public/models/` and reference them
   - Add PDF blueprints to `public/blueprints/` and update URLs

2. **Customize About Page** (`src/pages/About.jsx`)
   - Update education information
   - Modify manifesto lines
   - Update tools and skills lists
   - Add contact email

3. **Add Audio Files** (Optional)
   - Place audio files in `public/audio/`:
     - `wind-ambient.mp3` - For homepage
     - `metallic-resonance.mp3` - For world map
     - `cathedral-reverb.mp3` - For project pages

4. **Customize Colors** (`src/styles/index.css`)
   - Modify CSS variables in `:root` section
   - Adjust color scheme to match preferences

## 🎨 Design Customization

### Colors
Edit `src/styles/index.css`:
```css
:root {
  --color-black: #0a0a0a;
  --color-charcoal: #1a1a1a;
  --color-gold: #d4af37;
  /* ... */
}
```

### Fonts
The site uses Google Fonts (Cinzel & Inter). To change:
1. Update font imports in `index.html`
2. Modify `--font-gothic` and `--font-body` in CSS

## 📦 Building for Production

```bash
npm run build
```

Output will be in the `dist` directory.

## 🐛 Troubleshooting

### Port Already in Use
Change port in `vite.config.js`:
```js
server: {
  port: 3001, // Change to available port
}
```

### Three.js Not Loading
Ensure all dependencies are installed:
```bash
npm install three @react-three/fiber @react-three/drei
```

### PDF Viewer Issues
PDF.js worker may need updating. Check `src/components/BlueprintViewer.jsx` for worker URL.

## 💡 Tips

- Use high-quality images (1200px+ width recommended)
- Keep PCD files optimized for web
- Test on different browsers
- Consider mobile responsiveness for future updates
