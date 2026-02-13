import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box } from '@react-three/drei'
import * as THREE from 'three'

// Simple error boundary for atmosphere components
const SafeComponent = ({ children }) => {
  try {
    return <>{children}</>
  } catch (error) {
    console.error('Atmosphere component error:', error)
    return null
  }
}

// Moving clouds - custom implementation
export function MovingClouds() {
  const cloud1Ref = useRef()
  const cloud2Ref = useRef()
  const cloud3Ref = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (cloud1Ref.current) cloud1Ref.current.position.x = Math.sin(t * 0.1) * 20 + 10
    if (cloud2Ref.current) cloud2Ref.current.position.x = Math.sin(t * 0.15 + 1) * 15 - 15
    if (cloud3Ref.current) cloud3Ref.current.position.x = Math.sin(t * 0.12 + 2) * 18 + 5
  })

  const CloudPuff = ({ position }) => (
    <group position={position}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#ffffff" opacity={0.6} transparent />
      </mesh>
      <mesh position={[0.5, 0.2, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#ffffff" opacity={0.5} transparent />
      </mesh>
      <mesh position={[-0.4, 0.1, 0]}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial color="#ffffff" opacity={0.5} transparent />
      </mesh>
    </group>
  )

  return (
    <>
      <group ref={cloud1Ref} position={[10, 12, -10]}>
        <CloudPuff position={[0, 0, 0]} />
      </group>
      <group ref={cloud2Ref} position={[-15, 14, -8]}>
        <CloudPuff position={[0, 0, 0]} />
      </group>
      <group ref={cloud3Ref} position={[5, 11, -12]}>
        <CloudPuff position={[0, 0, 0]} />
      </group>
    </>
  )
}

// Flying birds
export function FlyingBirds() {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime
      groupRef.current.position.x = (t * 2) % 40 - 20
      groupRef.current.position.y = 8 + Math.sin(t * 2) * 2
    }
  })

  const Bird = ({ offset }) => (
    <mesh position={[offset, Math.sin(offset) * 0.5, 0]} rotation={[0, 0, Math.PI / 6]}>
      <coneGeometry args={[0.1, 0.3, 3]} />
      <meshStandardMaterial color="#000000" />
    </mesh>
  )

  return (
    <group ref={groupRef}>
      {[...Array(5)].map((_, i) => (
        <Bird key={i} offset={i * 2} />
      ))}
    </group>
  )
}

// Flying planes
export function FlyingPlanes() {
  const plane1Ref = useRef()
  const plane2Ref = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (plane1Ref.current) {
      plane1Ref.current.position.x = (t * 5) % 60 - 30
      plane1Ref.current.position.y = 10 + Math.sin(t * 0.5) * 1
    }
    if (plane2Ref.current) {
      plane2Ref.current.position.x = ((t * 4 + 20) % 60) - 30
      plane2Ref.current.position.y = 12 + Math.cos(t * 0.4) * 1
    }
  })

  return (
    <>
      <group ref={plane1Ref} position={[-30, 10, -5]}>
        <Box args={[1, 0.2, 0.3]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#000000" />
        </Box>
        <Box args={[0.3, 0.1, 0.1]} position={[-0.5, 0, 0]}>
          <meshStandardMaterial color="#800020" />
        </Box>
      </group>
      <group ref={plane2Ref} position={[-10, 12, -8]}>
        <Box args={[1, 0.2, 0.3]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#000000" />
        </Box>
        <Box args={[0.3, 0.1, 0.1]} position={[-0.5, 0, 0]}>
          <meshStandardMaterial color="#800020" />
        </Box>
      </group>
    </>
  )
}

// Parachutes
export function Parachutes() {
  const para1Ref = useRef()
  const para2Ref = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (para1Ref.current) {
      para1Ref.current.position.y = 15 - (t * 0.5) % 20
      para1Ref.current.position.x = Math.sin(t * 0.3) * 3
    }
    if (para2Ref.current) {
      para2Ref.current.position.y = 18 - ((t * 0.4 + 5) % 25)
      para2Ref.current.position.x = Math.cos(t * 0.25) * 4
    }
  })

  return (
    <>
      <group ref={para1Ref} position={[5, 15, -3]}>
        <mesh>
          <coneGeometry args={[0.8, 0.3, 8]} />
          <meshStandardMaterial color="#800020" />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <Box args={[0.1, 1, 0.1]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </group>
      <group ref={para2Ref} position={[-8, 18, -5]}>
        <mesh>
          <coneGeometry args={[0.8, 0.3, 8]} />
          <meshStandardMaterial color="#800020" />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <Box args={[0.1, 1, 0.1]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </group>
    </>
  )
}

// Trees
export function Trees() {
  const trees = []
  // Create trees in a grid pattern
  for (let x = -20; x <= 20; x += 4) {
    for (let z = -20; z <= 20; z += 4) {
      if (Math.random() > 0.7 && Math.abs(x) > 6 && Math.abs(z) > 6) { // 30% chance, avoid center
        trees.push({ x, z, height: 1 + Math.random() * 2 })
      }
    }
  }

  const Tree = ({ x, z, height }) => (
    <group position={[x, 0, z]}>
      {/* Trunk */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, height]} />
        <meshStandardMaterial color="#3a5a3a" />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, height + 0.5, 0]}>
        <coneGeometry args={[0.8, 1.5, 8]} />
        <meshStandardMaterial color="#4a7c59" />
      </mesh>
    </group>
  )

  return (
    <>
      {trees.map((tree, i) => (
        <Tree key={i} x={tree.x} z={tree.z} height={tree.height} />
      ))}
    </>
  )
}

// Mountains in background
export function Mountains() {
  return (
    <>
      {[-25, -15, 15, 25].map((x, i) => (
        <mesh key={i} position={[x, 3, -30]} rotation={[0, 0, 0]}>
          <coneGeometry args={[5, 8 + Math.random() * 4, 6]} />
          <meshStandardMaterial color="#4a7c59" />
        </mesh>
      ))}
    </>
  )
}

// Green spaces/parks
export function GreenSpaces() {
  return (
    <>
      {[
        { x: -8, z: -8, size: 3 },
        { x: 10, z: -5, size: 2.5 },
        { x: -12, z: 10, size: 2 },
        { x: 8, z: 12, size: 3 },
      ].map((space, i) => (
        <mesh key={i} position={[space.x, 0.01, space.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[space.size, 32]} />
          <meshStandardMaterial color="#4a7c59" />
        </mesh>
      ))}
    </>
  )
}
