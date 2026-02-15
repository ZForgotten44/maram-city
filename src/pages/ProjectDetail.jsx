import { useState, Suspense, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei'
import { getProjectById } from '../data/projects'
import BlueprintViewer from '../components/BlueprintViewer'
import RVTViewer from '../components/RVTViewer'
import GlbViewer from '../components/GlbViewer'
import { useTheme } from '../context/ThemeContext'
import './ProjectDetail.css'

function ProjectDetail({ embedded, projectId: projectIdProp, onClose }) {
  const { id: routeId } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const id = embedded && projectIdProp != null ? projectIdProp : routeId
  const project = getProjectById(id)
  const [activeView, setActiveView] = useState('overview')
  const [selectedBlueprint, setSelectedBlueprint] = useState(null)
  const [sustainabilityMode, setSustainabilityMode] = useState(false)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setEntered(true), 20)
    return () => clearTimeout(id)
  }, [])

  if (!project) {
    const isAirport = id === 'airport'
    return (
      <div className="project-not-found" data-theme={theme}>
        <h2>{isAirport ? 'Airport' : 'Project not found'}</h2>
        {isAirport && <p>Coming soon (Graduation project 2026/27)!</p>}
        {embedded && onClose ? (
          <button type="button" onClick={onClose}>Close</button>
        ) : (
          <Link to="/world">Return to World</Link>
        )}
      </div>
    )
  }

  const isDay = theme === 'day'
  const images = project.images || []

  return (
    <div
      className={`project-detail project-detail-enter ${entered ? 'entered' : ''}`}
      data-theme={theme}
    >
      {/* Voxel grid background + optional building silhouette */}
      <div className="project-detail-bg" aria-hidden="true">
        <div className="voxel-grid-bg" />
        <div className="building-silhouette" data-building={project.buildingType} />
      </div>

      {/* Sticky close (X) — always visible when scrolling */}
      {(embedded && onClose) && (
        <button type="button" className="project-close-sticky" onClick={onClose} aria-label="Close">×</button>
      )}

      {/* Title + description always under title; metadata right */}
      <header className="project-header">
        <div className="project-header-left">
          <h1 className="project-title">{project.title}</h1>
          <p className="project-description-under-title">{project.description}</p>
        </div>
        <div className="project-meta-stack">
          <div className="meta-box">
            <span className="meta-label">Year</span>
            <span className="meta-value">{project.year}</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">Type</span>
            <span className="meta-value">{project.concept}</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">Location</span>
            <span className="meta-value">{project.location}</span>
          </div>
          {project.designDuration && (
            <div className="meta-box meta-box-accent">
              <span className="meta-label">Duration</span>
              <span className="meta-value">{project.designDuration}</span>
            </div>
          )}
        </div>
      </header>

      {/* Nav: voxel-style buttons */}
      <nav className="project-nav">
        <button
          className={`nav-tab ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          Overview
        </button>
        <button
          className={`nav-tab ${activeView === 'blueprints' ? 'active' : ''}`}
          onClick={() => setActiveView('blueprints')}
        >
          Blueprints
        </button>
        <button
          className={`nav-tab ${activeView === '3d' ? 'active' : ''}`}
          onClick={() => setActiveView('3d')}
        >
          3D Model
        </button>
        {images.length > 3 && (
          <button
            className={`nav-tab ${activeView === 'gallery' ? 'active' : ''}`}
            onClick={() => setActiveView('gallery')}
          >
            Gallery
          </button>
        )}
        <button
          className={`sustainability-btn ${sustainabilityMode ? 'active' : ''}`}
          onClick={() => setSustainabilityMode(!sustainabilityMode)}
          title="X-ray Vision"
        >
          🌱
        </button>
      </nav>

      <main className="project-content">
        {activeView === 'overview' && (
          <div className="overview-section">
            {/* Overview: first 3 pictures + "See more pictures" (clear of close button) */}
            <div className={`project-images voxel-image-grid ${images.length <= 1 ? 'single-image' : ''}`}>
              {images.slice(0, 3).map((src) => (
                <div key={src} className="image-block">
                  <div className="image-frame">
                    <img src={src} alt="" loading="lazy" />
                  </div>
                </div>
              ))}
            </div>
            {images.length > 3 && (
              <button
                type="button"
                className="see-more-pictures"
                onClick={() => setActiveView('gallery')}
              >
                See more pictures
              </button>
            )}

            {sustainabilityMode && (
              <div className="materials-section">
                <h3>Materials</h3>
                <div className="materials-grid">
                  {project.materials.sustainable?.length > 0 && (
                    <div className="material-category green">
                      <h4>Sustainable</h4>
                      <ul>
                        {project.materials.sustainable.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {project.materials.reused?.length > 0 && (
                    <div className="material-category amber">
                      <h4>Reused</h4>
                      <ul>
                        {project.materials.reused.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {project.materials.experimental?.length > 0 && (
                    <div className="material-category red">
                      <h4>Experimental</h4>
                      <ul>
                        {project.materials.experimental.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'gallery' && (
          <div className="gallery-section">
            <h3 className="gallery-section-title">All pictures</h3>
            <div className="project-images voxel-image-grid project-gallery-all">
              {images.map((src) => (
                <div key={src} className="image-block gallery-item">
                  <div className="image-frame">
                    <img src={src} alt="" loading="lazy" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'blueprints' && (
          <div className="blueprints-section">
            <div className="blueprints-grid">
              {(project.blueprints || []).map((blueprint, index) => (
                <button
                  key={index}
                  type="button"
                  className="blueprint-card"
                  onClick={() => setSelectedBlueprint(blueprint)}
                >
                  <span className="blueprint-icon">📐</span>
                  <h4>{blueprint.name}</h4>
                  <p>Click to view</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeView === '3d' && (
          <div className="model-viewer-section">
            {project.model3d?.glbOrGltf ? (
              <>
                <GlbViewer url={project.model3d.glbOrGltf.downloadUrl} />
              </>
            ) : project.rvtFile || project.model3d?.rvt ? (
              <>
                <RVTViewer rvtFile={project.rvtFile || (project.model3d?.rvt && { url: project.model3d.rvt.downloadUrl, name: project.model3d.rvt.name })} />
                <div className="model-badge needs-conversion" role="status">
                  .rvt cannot be viewed in browser. Export to .glb for 3D view.
                </div>
              </>
            ) : (
              <div className="placeholder-3d">
                <Canvas shadows gl={{ antialias: true }} className="model-canvas">
                  <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={50} />
                  <ambientLight intensity={0.4} />
                  <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
                  <pointLight position={[-10, 5, -10]} intensity={0.4} color="#d4af37" />
                  <Suspense fallback={null}>
                    <Environment preset="night" />
                    <mesh castShadow receiveShadow>
                      <boxGeometry args={[4, 6, 4]} />
                      <meshStandardMaterial color="#8b7355" metalness={0.3} roughness={0.6} />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                      <planeGeometry args={[20, 20]} />
                      <meshStandardMaterial color="#1a1a1a" />
                    </mesh>
                  </Suspense>
                  <OrbitControls enablePan enableZoom enableRotate minDistance={5} maxDistance={20} />
                </Canvas>
                <div className="placeholder-text">
                  <p>3D Model will be displayed here</p>
                  <p className="hint">Add a .glb or .gltf in Photos and 3D, or export from Revit</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {embedded && onClose ? (
        <button type="button" className="back-button" onClick={onClose}>← Close</button>
      ) : (
        <button type="button" className="back-button" onClick={() => navigate('/world')}>
          ← Return to World
        </button>
      )}

      {selectedBlueprint && (
        <BlueprintViewer
          blueprint={selectedBlueprint}
          onClose={() => setSelectedBlueprint(null)}
        />
      )}
    </div>
  )
}

export default ProjectDetail
