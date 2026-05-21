import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei'
import { LoadingManager } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import './GlbViewer.css'

// Resolve texture URLs so paths with spaces and "&" (e.g. "Textures/woods & plastics...png") are encoded and load correctly
function createEncodingLoadingManager() {
  const manager = new LoadingManager()
  manager.resolveURL = function (url) {
    try {
      const base = window.location.origin + '/'
      return new URL(url, base).href
    } catch {
      return url
    }
  }
  return manager
}

// Base path (directory of the .gltf) for resolving .bin and Textures/
function getBasePath(url) {
  if (!url) return ''
  const path = url.startsWith('http') ? new URL(url).pathname : (url.startsWith('/') ? url : `/${url}`)
  const lastSlash = path.lastIndexOf('/')
  return lastSlash >= 0 ? path.substring(0, lastSlash + 1) : ''
}

// Absolute base URL so texture paths (with spaces, &) resolve correctly from the same origin
function getAbsoluteBaseUrl(url) {
  const path = getBasePath(url)
  if (!path) return ''
  try {
    return new URL(path, window.location.origin + '/').href
  } catch {
    return path
  }
}

function SceneContent({ scene }) {
  return <primitive object={scene} />
}

function ModelFallback({ error }) {
  return (
    <div className="glb-viewer-fallback">
      <p className="glb-viewer-fallback-title">3D model could not be loaded</p>
      <p className="glb-viewer-fallback-hint">
        If Revit gave you a <strong>.zip</strong>, unzip it first. Put the <strong>.gltf</strong>, <strong>.bin</strong> and any <strong>Textures</strong> folder inside <code>public/projects/LIFE LINE HOSPITAL/PHOTOS AND 3D/</code> (same folder as each other).
        Or re-export from Revit as <strong>.glb</strong> with &quot;Embed media&quot; for a single file.
      </p>
      {error && <p className="glb-viewer-fallback-error">{error}</p>}
    </div>
  )
}

function GlbViewer({ url }) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [scene, setScene] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(true)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!url) {
      setScene(null)
      setLoadError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    setScene(null)

    const basePath = getBasePath(url)
    const absoluteBase = getAbsoluteBaseUrl(url)
    const modelPath = url.startsWith('/') ? url : `/${url}`

    const loadingManager = createEncodingLoadingManager()
    const loader = new GLTFLoader(loadingManager)
    if (absoluteBase) loader.setPath(absoluteBase)

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
    loader.setDRACOLoader(dracoLoader)

    let cancelled = false

    function onLoad(gltf) {
      dracoLoader.dispose()
      if (!cancelled) {
        setScene(gltf.scene)
        setLoadError(null)
      }
      setLoading(false)
    }
    function onError(err) {
      dracoLoader.dispose()
      if (!cancelled) {
        setLoadError(err?.message || 'Failed to load model')
        setScene(null)
      }
      setLoading(false)
    }

    // Fetch model file: may be .gltf (JSON) or .glb (binary). Don't rely on Content-Type.
    fetch(modelPath)
      .then((res) => {
        if (cancelled) return
        if (!res.ok) throw new Error(`Model file not found (${res.status}): ${modelPath}`)
        return res.arrayBuffer()
      })
      .then((buffer) => {
        if (cancelled) return
        const arr = new Uint8Array(buffer)
        // GLB magic: 0x676C5466 = "glTF"
        const isGlb = arr.length >= 4 && arr[0] === 0x67 && arr[1] === 0x6C && arr[2] === 0x54 && arr[3] === 0x46
        if (isGlb) {
          loader.parse(buffer, absoluteBase || basePath || './', onLoad, onError)
          return
        }
        // Try as JSON (.gltf)
        const text = new TextDecoder().decode(buffer)
        const trimmed = text.trim()
        if (trimmed.startsWith('<')) {
          throw new Error('Server returned HTML instead of the model file. If you have a .zip from Revit, unzip it and put the .gltf, .bin and Textures folder in: PHOTOS AND 3D')
        }
        let json
        try {
          json = JSON.parse(text)
        } catch (e) {
          throw new Error('File is not valid .gltf (JSON) or .glb (binary). If you have a .zip from Revit, unzip it first and place the .gltf, .bin and Textures folder in the same folder.')
        }
        if (!json.asset || !json.asset.version) {
          throw new Error('File does not look like a glTF (missing asset.version). Unzip the Revit export and use the .gltf + .bin from inside.')
        }
        loader.parse(json, absoluteBase || basePath || './', onLoad, onError)
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err?.message || 'Failed to load model')
          setScene(null)
        }
        setLoading(false)
        dracoLoader.dispose()
      })

    return () => { cancelled = true }
  }, [url])

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  if (!url) return null
  if (loadError) {
    return (
      <div ref={containerRef} className="glb-viewer">
        <ModelFallback error={loadError} />
      </div>
    )
  }
  if (loading || !scene) {
    return (
      <div ref={containerRef} className="glb-viewer">
        <div className="glb-viewer-loading">Loading model…</div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="glb-viewer">
      <button
        type="button"
        className="glb-viewer-fullscreen-btn"
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? '⤓' : '⤢'}
      </button>
      <Canvas shadows gl={{ antialias: true }} className="glb-viewer-canvas">
        <PerspectiveCamera makeDefault position={[4, 4, 8]} fov={50} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={0.9} castShadow />
        <pointLight position={[-10, 5, -10]} intensity={0.3} />
        <Environment preset="city" />
        <SceneContent scene={scene} />
        <OrbitControls enablePan enableZoom enableRotate minDistance={2} maxDistance={30} />
      </Canvas>
    </div>
  )
}

export default GlbViewer
