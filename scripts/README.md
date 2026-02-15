# Drive sync (content CMS)

Generates `src/data/projects.generated.json` from a Google Drive folder so the site can render projects, PDFs, images, and 3D models from Drive.

## Setup

1. **Google Cloud**
   - Create a project and enable **Google Drive API**.
   - Create a **Service Account**, download its JSON key.
   - Share your Drive **root folder** (the one containing e.g. Lifeline Hospital, Mixed Use, Twin Towers) with the service account email (`...@....iam.gserviceaccount.com`) as **Viewer**.

2. **Env**
   - `DRIVE_ROOT_FOLDER_ID` – ID of that root folder (from the folder URL: `.../folders/FOLDER_ID`).
   - `GOOGLE_APPLICATION_CREDENTIALS` – path to the service account JSON file.

## Run

```bash
npm run sync:drive
```

Writes `src/data/projects.generated.json`. The app uses it automatically (with a fallback list when the file is empty).

## Build with fresh Drive data

```bash
npm run build:with-drive
```

Runs `sync:drive` then `vite build`.

## Drive folder layout (per project)

- **brief.pdf** at project root (optional; parsed for Name, Type, Location, Academic Year, Duration, Description).
- **Blueprints/** – PDFs listed as blueprints.
- **Photos and 3D/** – images (png, jpg, webp) and:
  - **.rvt** – detected but not viewable in browser; show “needs conversion”.
  - **.glb / .gltf** – used as the 3D model in the project page (e.g. `model.glb` or `scene.glb`).

## Sharing

For PDF/image/GLB links to open in the browser, share files (or the project folder) as **“Anyone with the link”** so the generated `downloadUrl` works.
