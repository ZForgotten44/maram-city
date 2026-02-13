import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Gothic Voxel palette
const STONE = '#7A7A7A'
const STONE_DARK = '#5A5A5A'
const CHARCOAL = '#1B1B1B'
const MAROON = '#5B1E2D'
const OXIDE = '#8C2F39'
const IRON = '#4A4A4A'

const HOVER_ANGLE = 0.2 // ~10–12° tease
const FULL_ANGLE = Math.PI / 2 * 0.85

function GothicGate({ onEnter }) {
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  const leftDoorRef = useRef()
  const rightDoorRef = useRef()
  const openProgress = useRef(0)

  useFrame((_, delta) => {
    if (!leftDoorRef.current || !rightDoorRef.current) return
    const targetOpen = clicked ? 1 : hovered ? 0.15 : 0
    openProgress.current = THREE.MathUtils.lerp(openProgress.current, targetOpen, delta * (clicked ? 2.2 : 4))
    const angle = openProgress.current * FULL_ANGLE
    leftDoorRef.current.rotation.y = -angle
    rightDoorRef.current.rotation.y = angle
  })

  const handleClick = () => {
    if (clicked) return
    setClicked(true)
    setTimeout(() => onEnter(), 1600)
  }

  return (
    <group position={[0, 0, 0]}>
      {/* Tall pointed arch — voxel stacked */}
      <group position={[0, 3.2, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[6, 0.8, 0.6]} />
          <meshStandardMaterial color={CHARCOAL} roughness={0.95} metalness={0.05} />
        </mesh>
        <mesh position={[-1.6, 0.9, 0]} castShadow>
          <boxGeometry args={[1, 0.8, 0.6]} />
          <meshStandardMaterial color={STONE_DARK} roughness={0.9} />
        </mesh>
        <mesh position={[1.6, 0.9, 0]} castShadow>
          <boxGeometry args={[1, 0.8, 0.6]} />
          <meshStandardMaterial color={STONE_DARK} roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.8, 0]} castShadow>
          <boxGeometry args={[2.8, 0.8, 0.6]} />
          <meshStandardMaterial color={CHARCOAL} roughness={0.9} />
        </mesh>
        <mesh position={[0, 2.6, 0]} castShadow>
          <boxGeometry args={[1.6, 0.8, 0.6]} />
          <meshStandardMaterial color={STONE_DARK} roughness={0.9} />
        </mesh>
        <mesh position={[0, 3.4, 0]} castShadow>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshStandardMaterial color={CHARCOAL} roughness={0.9} />
        </mesh>
        {/* Spikes */}
        <mesh position={[-2.8, 0.4, 0]} castShadow>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color={IRON} metalness={0.6} roughness={0.5} />
        </mesh>
        <mesh position={[2.8, 0.4, 0]} castShadow>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color={IRON} metalness={0.6} roughness={0.5} />
        </mesh>
      </group>

      {/* Left door — 3 blocks thick */}
      <group ref={leftDoorRef} position={[-1.5, 1.5, 0.35]}>
        <mesh
          castShadow
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={handleClick}
        >
          <boxGeometry args={[1.35, 2.7, 0.35]} />
          <meshStandardMaterial
            color={hovered || clicked ? MAROON : STONE_DARK}
            emissive={MAROON}
            emissiveIntensity={(hovered ? 0.12 : 0) + (clicked ? 0.15 : 0)}
            roughness={0.9}
            metalness={0}
          />
        </mesh>
      </group>

      {/* Right door */}
      <group ref={rightDoorRef} position={[1.5, 1.5, 0.35]}>
        <mesh
          castShadow
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={handleClick}
        >
          <boxGeometry args={[1.35, 2.7, 0.35]} />
          <meshStandardMaterial
            color={hovered || clicked ? MAROON : STONE_DARK}
            emissive={MAROON}
            emissiveIntensity={(hovered ? 0.12 : 0) + (clicked ? 0.15 : 0)}
            roughness={0.9}
            metalness={0}
          />
        </mesh>
      </group>

      {/* Interior glow plane (maroon leak when hovered) */}
      {(hovered || clicked) && (
        <mesh position={[0, 1.5, -0.1]}>
          <planeGeometry args={[2, 2.5]} />
          <meshBasicMaterial color={MAROON} transparent opacity={0.2} depthWrite={false} />
        </mesh>
      )}

      {/* Torches */}
      <Torch position={[-2.6, 1.2, 0.5]} />
      <Torch position={[2.6, 1.2, 0.5]} />
    </group>
  )
}

function Torch({ position }) {
  const lightRef = useRef()
  const meshRef = useRef()
  useFrame((state) => {
    if (!lightRef.current || !meshRef.current) return
    const t = state.clock.elapsedTime
    const flicker = 0.7 + Math.sin(t * 3) * 0.08 + Math.sin(t * 7) * 0.04
    lightRef.current.intensity = flicker * 1.2
    meshRef.current.material.emissiveIntensity = 0.4 + Math.sin(t * 2.5) * 0.1
  })
  return (
    <group position={position}>
      <pointLight ref={lightRef} color={OXIDE} distance={4} intensity={0.9} decay={2} />
      <mesh ref={meshRef} position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color={CHARCOAL} emissive={OXIDE} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[0.25, 0.15, 0.25]} />
        <meshStandardMaterial color={OXIDE} emissive={OXIDE} emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

export default GothicGate
