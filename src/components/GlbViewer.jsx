import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, useGLTF, Environment } from '@react-three/drei'
import './GlbViewer.css'

function Model({ url }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

function GlbViewer({ url }) {
  if (!url) return null
  return (
    <div className="glb-viewer">
      <Canvas shadows gl={{ antialias: true }} className="glb-viewer-canvas">
        <PerspectiveCamera makeDefault position={[4, 4, 8]} fov={50} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={0.9} castShadow />
        <pointLight position={[-10, 5, -10]} intensity={0.3} />
        <Suspense fallback={null}>
          <Environment preset="city" />
          <Model url={url} />
        </Suspense>
        <OrbitControls enablePan enableZoom enableRotate minDistance={2} maxDistance={30} />
      </Canvas>
    </div>
  )
}

export default GlbViewer
