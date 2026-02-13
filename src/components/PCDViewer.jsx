import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, Text } from '@react-three/drei'
import * as THREE from 'three'
import './PCDViewer.css'

// PCD Viewer Component
// This component will load and display Point Cloud Data files
// For now, it shows a placeholder. When actual PCD files are available,
// you can integrate libraries like Potree or use Three.js PCDLoader

function PCDViewer({ pcdFile }) {
  if (!pcdFile) {
    return (
      <div className="pcd-viewer-placeholder">
        <Canvas
          shadows
          gl={{ antialias: true }}
          className="pcd-canvas"
        >
          <PerspectiveCamera makeDefault position={[0, 5, 15]} fov={50} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
          <pointLight position={[-10, 5, -10]} intensity={0.4} color="#d4af37" />
          
          <Suspense fallback={null}>
            <Environment preset="night" />
            
            {/* Placeholder point cloud visualization */}
            <PointCloudPlaceholder />
            
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
          </Suspense>

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={30}
          />
        </Canvas>
        <div className="pcd-info">
          <p>PCD Viewer Ready</p>
          <p className="hint">Point Cloud Data files will be displayed here</p>
          <p className="hint">Supports .pcd format from Revit exports</p>
        </div>
      </div>
    )
  }

  // TODO: Implement actual PCD loading when files are available
  // You can use:
  // - Three.js PCDLoader: import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader'
  // - Or Potree for more advanced point cloud visualization
  
  return (
    <div className="pcd-viewer">
      <Canvas
        shadows
        gl={{ antialias: true }}
        className="pcd-canvas"
      >
        <PerspectiveCamera makeDefault position={[0, 5, 15]} fov={50} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
        
        <Suspense fallback={null}>
          <Environment preset="night" />
          {/* PCD content will be loaded here */}
        </Suspense>

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={30}
        />
      </Canvas>
    </div>
  )
}

// Placeholder component showing a point cloud-like effect
function PointCloudPlaceholder() {
  const groupRef = useRef()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  const points = []
  const geometry = new THREE.BufferGeometry()
  
  // Generate random points to simulate a point cloud
  for (let i = 0; i < 1000; i++) {
    const x = (Math.random() - 0.5) * 10
    const y = Math.random() * 8
    const z = (Math.random() - 0.5) * 10
    points.push(x, y, z)
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  
  return (
    <points ref={groupRef} geometry={geometry}>
      <pointsMaterial size={0.05} color="#d4af37" />
    </points>
  )
}

export default PCDViewer
