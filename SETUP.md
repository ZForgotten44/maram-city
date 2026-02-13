# Quick Setup Guide

## Installation Complete! ✅

Your architect portfolio website is ready to run.

## Getting Started

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   The app will automatically open at `http://localhost:3000`

3. **Explore the site:**
   - **Homepage**: Dark gothic threshold with "Enter" button
   - **World Map**: 3D portfolio view with clickable buildings
   - **Project Pages**: Detailed views with blueprints and 3D models
   - **About Page**: Manifesto-style presentation

## Features Ready to Use

✅ Dark gothic aesthetic with fog effects  
✅ 3D interactive world map  
✅ Project detail pages  
✅ PDF blueprint viewer  
✅ PCD viewer (ready for your files)  
✅ Sustainability X-ray vision toggle  
✅ Sound design framework  
✅ Template projects (6 sample projects included)  

## Next Steps

### 1. Add Real Projects
Edit `src/data/projects.js` and replace the template projects with actual work:
- Update project details
- Add real images (replace Unsplash URLs)
- Add PCD files to `public/models/`
- Add PDF blueprints to `public/blueprints/`

### 2. Add Audio Files (Optional)
Place audio files in `public/audio/`:
- `wind-ambient.mp3` - For homepage
- `metallic-resonance.mp3` - For world map
- `cathedral-reverb.mp3` - For project pages

### 3. Customize Colors
Edit `src/styles/index.css` to change the color scheme:
- `--color-black`: Main background
- `--color-gold`: Accent color
- `--color-muted-sandstone`: Secondary color

### 4. Build for Production
```bash
npm run build
```
Output will be in the `dist` folder.

## Troubleshooting

**Port already in use?**
Change the port in `vite.config.js`:
```javascript
server: {
  port: 3001, // Change this
}
```

**3D models not loading?**
- Check browser console for errors
- Ensure PCD files are in `public/models/`
- Verify file paths in project data

**PDFs not displaying?**
- Ensure PDF files are accessible
- Check browser console for CORS errors
- Try using absolute URLs for PDFs

## Tech Stack

- React 18
- Three.js (3D graphics)
- React Three Fiber (React renderer for Three.js)
- React Router (Navigation)
- Vite (Build tool)
- React-PDF (Blueprint viewing)

Enjoy your new portfolio! 🎉
