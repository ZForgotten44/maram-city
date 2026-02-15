import React, { Suspense, useState, useMemo, useRef, useEffect, createContext, useContext } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, useCursor } from '@react-three/drei'
import * as THREE from 'three'
import { projects, projectPositions } from '../data/projects'
import { getProjectById } from '../data/projects'
import Building from '../components/Building'
import NavigationUI from '../components/NavigationUI'
import ProjectDetail from './ProjectDetail'
import About from './About'
import { useTheme } from '../context/ThemeContext'
import { useLighthouseWorld } from '../context/LighthouseWorldContext'
import './WorldMap.css'

const HQContext = createContext(null)
function useHQ() {
  const ctx = useContext(HQContext)
  return ctx
}

// HQ transition: approach lighthouse (position [14, 0, 5] on island)
const HQ_APPROACH_POS = [22, 7, 12]
const HQ_APPROACH_TARGET = [14, 3.5, 5]
const HQ_APPROACH_DURATION = 1.5
const HQ_DOOR_DURATION = 0.6
const HQ_ENTERING_DURATION = 0.6

// Camera fly-to targets (from lighthouse map key)
const CAMERA_TARGETS = {
  school: { target: [-8, 3, 6], pos: [6, 10, 18] },
  hospital: { target: [-7, 3, -2.5], pos: [8, 10, 8] },
  airport: { target: [4, 4, 17], pos: [12, 12, 28] },
  volcano: { target: [48, 3, 48], pos: [55, 15, 55] },
  lighthouse: { target: [14, 4, 5], pos: [24, 10, 14] },
  towers: { target: [0, 5, -10], pos: [12, 12, 2] },
  pyramids: { target: [0, 2, -8], pos: [10, 10, 2] },
}

// Building pages: fly-to camera (target + pos) per project id — derived from projectPositions
function getBuildingFlyTarget(projectId) {
  const positions = projectPositions[projectId]
  if (!positions) return null
  const pos = Array.isArray(positions[0]) ? positions[0] : positions
  const x = pos[0]
  const z = pos[1]
  return { target: [x, 2.5, z], pos: [x + 7, 9, z + 7] }
}
const BUILDING_FLY_DURATION = 0.95
const BUILDING_FLY_PAUSE = 0.5

// Gothic Voxel palette
const STONE = '#7A7A7A'
const MAROON = '#5B1E2D'
const CHARCOAL = '#1B1B1B'
const SAND = '#C2B280'
const MOONLIGHT = '#AAB7C4'
const STONE_DARK = '#5A5A5A'
const NAVY = '#0d2137'
const ASPHALT = '#2a2a2a'

const NIGHT_SKY = '#0a0e14'
const DAY_SKY_TOP = '#7EC8FF'
const DAY_FOG = '#cfe9ff'
const NIGHT_FOG = '#070a10'

const TRANSITION_DURATION = 1.2
const BLEND_UPDATE_INTERVAL = 6

// Default view (from camera log — press P to print current)
const DEFAULT_CAMERA_POSITION = [-0.4063, 23.0511, 50.4808]
const DEFAULT_CAMERA_TARGET = [-0.306, -1.9175, -17.051]

// Intro: start in “space” looking at Earth, then zoom to city
const INTRO_CURVE_START = [0, 70, -220]
const SPACE_SKY = '#77c8ff'
const EARTH_CENTER = [0, 40, -150]

function CameraControls({ controlsRef, resetCameraRef, defaultPosition, defaultTarget, enabled = true, enableDamping = true }) {
  const internalRef = useRef()
  const ref = controlsRef ?? internalRef
  useEffect(() => {
    if (!resetCameraRef) return
    resetCameraRef.current = () => {
      if (ref.current) {
        ref.current.object.position.set(...defaultPosition)
        ref.current.target.set(...defaultTarget)
      }
    }
    return () => { resetCameraRef.current = null }
  }, [resetCameraRef, defaultPosition, defaultTarget, ref])
  return (
    <OrbitControls
      ref={ref}
      enablePan={enabled}
      enableZoom={enabled}
      enableRotate={enabled}
      minDistance={8}
      maxDistance={72}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 2 - 0.35}
      enableDamping={enableDamping}
      dampingFactor={0.08}
      target={defaultTarget}
    />
  )
}

// Procedural Earth: ocean, land (greens/sand/rock), ice caps, vertex colors
function buildEarthVertexColors(geo) {
  const pos = geo.attributes.position
  const colors = []
  const c = new THREE.Color()
  const noise = (x, y, z) =>
    0.55 * Math.sin(x * 2.2 + z * 1.7) +
    0.35 * Math.sin(y * 3.1 + x * 1.3) +
    0.25 * Math.sin(z * 4.2 + y * 1.9)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const lat = Math.abs(y)
    const n = noise(x, y, z)
    const h = (n + 1) * 0.5
    const isIce = lat > 0.72
    const isLand = h > 0.53
    if (isIce) {
      c.set('#eaf6ff')
    } else if (!isLand) {
      c.set('#136bff')
      c.lerp(new THREE.Color('#6fd3ff'), THREE.MathUtils.clamp((0.55 - h) * 3.2, 0, 1))
    } else {
      const dryness = THREE.MathUtils.clamp((h - 0.53) * 3.0, 0, 1)
      c.set('#2bd65a')
      c.lerp(new THREE.Color('#1e8a3a'), dryness * 0.6)
      if (h < 0.58) c.lerp(new THREE.Color('#f2c14e'), 0.65)
      if (h > 0.78) c.lerp(new THREE.Color('#8c8c8c'), 0.7)
    }
    colors.push(c.r, c.g, c.b)
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
}

function Earth({ visible = true, opacityRef }) {
  const earthRef = useRef()
  const cloudsRef = useRef()
  const glowRef = useRef()
  const earthGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(18, 48, 48)
    buildEarthVertexColors(g)
    return g
  }, [])

  useFrame((_, delta) => {
    const op = opacityRef?.current ?? 1
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.12
      if (earthRef.current.material) earthRef.current.material.opacity = op
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.18
      if (cloudsRef.current.material) cloudsRef.current.material.opacity = 0.18 * op
    }
    if (glowRef.current && glowRef.current.material)
      glowRef.current.material.opacity = 0.15 * op
  })

  if (!visible) return null

  return (
    <group position={EARTH_CENTER}>
      <mesh ref={glowRef} scale={1.06}>
        <sphereGeometry args={[18, 32, 32]} />
        <meshBasicMaterial
          color="#7fd7ff"
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={earthRef} geometry={earthGeo}>
        <meshStandardMaterial
          vertexColors
          roughness={0.65}
          metalness={0.05}
          transparent
          opacity={1}
        />
      </mesh>
      <mesh ref={cloudsRef} scale={1.02}>
        <sphereGeometry args={[18, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.18}
          roughness={1}
          metalness={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

// 3-beat camera path: full Earth → approach → crossfade to city (CatmullRomCurve3)
function IntroSequence({
  controlsRef,
  earthFadeRef,
  cityFadeRef,
  introProgressRef,
  onDone,
  onShowWelcome,
}) {
  const tRef = useRef(0)
  const finishedRef = useRef(false)
  const lookRef = useRef(new THREE.Vector3())
  const curve = useRef(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 70, -220),
      new THREE.Vector3(0, 55, -170),
      new THREE.Vector3(8, 38, -110),
      new THREE.Vector3(18, 24, -40),
    ])
  )
  const targetStart = useMemo(() => new THREE.Vector3(0, 40, -150), [])
  const targetMid = useMemo(() => new THREE.Vector3(0, 20, -80), [])
  const cityTarget = useMemo(() => new THREE.Vector3(...DEFAULT_CAMERA_TARGET), [])

  useFrame((state, delta) => {
    const controls = controlsRef?.current
    if (!controls) return
    if (tRef.current >= 1) return

    tRef.current = Math.min(1, tRef.current + delta * 0.22)
    const t = tRef.current
    const ease =
      t < 0.25
        ? 4 * t * t * t
        : t > 0.85
          ? 1 - Math.pow(1 - t, 3) * 6
          : 1 - Math.pow(1 - t, 2)

    const pos = curve.current.getPoint(ease)
    if (t < 0.75) {
      lookRef.current.copy(targetStart).lerp(targetMid, t / 0.75)
    } else {
      lookRef.current.copy(targetMid).lerp(cityTarget, (t - 0.75) / 0.25)
    }

    controls.object.position.copy(pos)
    controls.target.copy(lookRef.current)

    if (introProgressRef) introProgressRef.current = ease
    const earthOpacity = t < 0.72 ? 1 : THREE.MathUtils.clamp(1 - (t - 0.72) / 0.18, 0, 1)
    const cityOpacity = t < 0.72 ? 0 : THREE.MathUtils.clamp((t - 0.72) / 0.18, 0, 1)
    if (earthFadeRef) earthFadeRef.current = earthOpacity
    if (cityFadeRef) cityFadeRef.current = cityOpacity

    if (t >= 1 && !finishedRef.current) {
      finishedRef.current = true
      onDone?.()
      onShowWelcome?.()
    }
  })

  return null
}

const INTRO_SKY_START = new THREE.Color(SPACE_SKY)
const INTRO_SKY_END = new THREE.Color(DAY_SKY_TOP)
function IntroSky({ introProgressRef }) {
  const { scene } = useThree()
  useFrame(() => {
    if (!scene.background || !introProgressRef) return
    const t = introProgressRef.current ?? 0
    if (t >= 1) return
    scene.background.lerpColors(INTRO_SKY_START, INTRO_SKY_END, t)
  })
  return null
}

const IntroContext = createContext({ introPlaying: true })
function useIntro() {
  return useContext(IntroContext)
}
function IntroAwareCityGroup({ cityGroupRef, children }) {
  return <group ref={cityGroupRef}>{children}</group>
}
function CityFadeDriver({ cityGroupRef, cityFadeRef }) {
  const { introPlaying } = useIntro()
  useFrame(() => {
    if (!cityGroupRef?.current || !cityFadeRef) return
    const opacity = cityFadeRef.current ?? 0
    if (!introPlaying && opacity >= 1) return
    cityGroupRef.current.traverse((o) => {
      if (o.isMesh && o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        mats.forEach((m) => {
          m.transparent = true
          m.opacity = opacity
        })
      }
    })
  })
  return null
}

const THEME_NIGHT_SKY = new THREE.Color(NIGHT_SKY)
const THEME_DAY_SKY = new THREE.Color(DAY_SKY_TOP)
const THEME_NIGHT_FOG = new THREE.Color(NIGHT_FOG)
const THEME_DAY_FOG = new THREE.Color(DAY_FOG)
const THEME_AMBIENT_COLOR = new THREE.Color('#aab7c4')
const THEME_DIR_COLOR = new THREE.Color('#fff8e8')
function ThemeDriver() {
  const { themeRef, themeBlendRef, themeBlend, setThemeBlend, ambientRef, directionalRef } = useTheme()
  const { scene } = useThree()
  const frameCount = useRef(0)
  const bgRef = useRef(new THREE.Color(NIGHT_SKY))
  useFrame((_, delta) => {
    if (!scene.fog) scene.fog = new THREE.Fog(NIGHT_FOG, 24, 52)
    const target = themeRef.current === 'day' ? 1 : 0
    const blend = themeBlendRef.current
    const step = Math.min(1, (delta / TRANSITION_DURATION) * 2.2)
    themeBlendRef.current = blend + (target - blend) * step
    const b = themeBlendRef.current
    frameCount.current++
    if (frameCount.current % BLEND_UPDATE_INTERVAL === 0) setThemeBlend(b)
    bgRef.current.copy(THEME_NIGHT_SKY).lerp(THEME_DAY_SKY, b)
    scene.background = bgRef.current
    scene.fog.color.lerpColors(THEME_NIGHT_FOG, THEME_DAY_FOG, b)
    if (ambientRef.current) ambientRef.current.intensity = 0.35 + 0.55 * b
    if (directionalRef.current) {
      directionalRef.current.intensity = 1.2 + 0.2 * b
      directionalRef.current.color.copy(THEME_AMBIENT_COLOR).lerp(THEME_DIR_COLOR, b)
    }
  })
  return null
}

const FOG_UPDATE_THRESHOLD = 0.5
function FogController() {
  const { camera, scene } = useThree()
  const { themeBlendRef } = useTheme()
  const vec = useRef(new THREE.Vector3())
  const center = useRef(new THREE.Vector3(0, 5, 0))
  const lastDist = useRef(null)
  useFrame(() => {
    if (!scene.fog) return
    vec.current.setFromMatrixPosition(camera.matrixWorld)
    const dist = vec.current.distanceTo(center.current)
    if (lastDist.current != null && Math.abs(dist - lastDist.current) < FOG_UPDATE_THRESHOLD) return
    lastDist.current = dist
    const b = themeBlendRef.current
    // Night: current behavior. Day: lighter, far haze only.
    let nNear = 28, nFar = 72
    if (dist > 28) {
      nNear = 28
      nFar = 72
    } else if (dist < 20) {
      nNear = 18
      nFar = 85
    } else {
      const t = (dist - 20) / 8
      nNear = 18 + t * 10
      nFar = 85 - t * 13
    }
    // Day: fog much farther so water stays bright (no black band); night: closer fog
    const dNear = 74
    const dFar = 145
    scene.fog.near = nNear + (dNear - nNear) * b
    scene.fog.far = nFar + (dFar - nFar) * b
  })
  return null
}

function WireframeOverlay() {
  const { scene } = useThree()
  const lhWorld = useLighthouseWorld()
  const prev = useRef(false)
  useFrame(() => {
    if (!lhWorld || lhWorld.wireframeMode === prev.current) return
    prev.current = lhWorld.wireframeMode
    scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach((m) => { m.wireframe = lhWorld.wireframeMode })
      }
    })
  })
  return null
}

// Easter egg: tiny voxel satellite visible when zoomed fully out; click = "You left the island."
function SatelliteEgg() {
  const { camera } = useThree()
  const lhWorld = useLighthouseWorld()
  const groupRef = useRef()
  const camPos = useRef(new THREE.Vector3())
  useFrame(() => {
    if (!groupRef.current) return
    camPos.current.setFromMatrixPosition(camera.matrixWorld)
    const dist = camPos.current.length()
    groupRef.current.visible = dist > 520
  })
  if (!lhWorld) return null
  return (
    <group ref={groupRef} position={[0, 55, -170]} visible={false}>
      <mesh
        onClick={(e) => { e.stopPropagation(); lhWorld.setSatelliteMessage(true) }}
        onPointerOver={() => { document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'default' }}
      >
        <boxGeometry args={[1.2, 0.8, 0.6]} />
        <meshBasicMaterial color="#4a4a4a" />
      </mesh>
    </group>
  )
}

// Water: single mesh; day = bright blue (emissive so it stays bright), night = navy
// Material is imperative (one ref) so React never overwrites our useFrame color/emissive updates
// Set true for 2s to prove visible mesh; set true for 5s to rule out lighting (unlit bright blue)
const WATER_NEON_DEBUG = false
const WATER_NUCLEAR_DEBUG = false
// Set true to lift water to y=2 (if it turns blue, something at y≈-0.4 was dominating)
const WATER_POSITION_DEBUG = false
// If nuclear is still navy: set true to force water on top (renderOrder 9999, depthTest false)
const WATER_FORCE_ON_TOP_DEBUG = false
const DAY_WATER = '#5AC8FF'
function WaterSurface() {
  const { theme, themeBlendRef } = useTheme()
  const meshRef = useRef()
  const materialRef = useRef()
  const basicMatRef = useRef(null)
  const positionsRef = useRef(null)
  const countRef = useRef(0)
  const lastNormalsRef = useRef(0)
  const colorRef = useRef(new THREE.Color(NAVY))
  const emissiveRef = useRef(new THREE.Color(DAY_WATER))
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(NAVY),
      roughness: 0.3,
      metalness: 0.58,
      transparent: true,
      opacity: 1,
      emissive: new THREE.Color(DAY_WATER),
      emissiveIntensity: 0,
      depthWrite: true,
      depthTest: true,
    })
    materialRef.current = m
    return m
  }, [])
  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh?.geometry) return
    const pos = mesh.geometry.attributes.position
    if (!pos) return
    if (!positionsRef.current) {
      positionsRef.current = pos.array.slice()
      countRef.current = pos.count
    }
    const orig = positionsRef.current
    const b = themeBlendRef.current
    const t = state.clock.elapsedTime * 0.5
    const amp = 0.2 + 0.05 * b
    const k = 0.35
    for (let i = 0; i < countRef.current; i++) {
      const i3 = i * 3
      const x = orig[i3]
      const y = orig[i3 + 1]
      const wave =
        Math.sin(t + x * k) * Math.cos(y * k) +
        0.6 * Math.sin(t * 0.8 + y * k * 0.7) +
        0.25 * Math.sin(t * 1.2 + (x + y) * 0.2)
      pos.array[i3 + 2] = orig[i3 + 2] + amp * wave
    }
    pos.needsUpdate = true
    const now = state.clock.elapsedTime
    if (now - lastNormalsRef.current > 0.25) {
      mesh.geometry.computeVertexNormals()
      lastNormalsRef.current = now
    }
    const forceDay = theme === 'day' ? 1 : 0
    const b2 = Math.max(b, forceDay)
    const mat = materialRef.current || mesh.material
    if (WATER_FORCE_ON_TOP_DEBUG) {
      mesh.renderOrder = 9999
      if (mesh.material) mesh.material.depthTest = false
    }
    if (WATER_NUCLEAR_DEBUG && now < 5) {
      if (!basicMatRef.current) basicMatRef.current = new THREE.MeshBasicMaterial({ color: '#00BFFF', transparent: true, opacity: 1 })
      mesh.material = basicMatRef.current
    } else {
      mesh.material = material
      if (mat) {
        if (WATER_NEON_DEBUG && now < 2) {
          mat.color.set('#00FFFF')
          mat.emissive.set('#00FFFF')
          mat.emissiveIntensity = 2
        } else {
          if (b2 > 0.35) {
            colorRef.current.set(DAY_WATER)
            mat.color.copy(colorRef.current)
          } else {
            colorRef.current.copy(NAVY).lerp(new THREE.Color(DAY_WATER), b2)
            mat.color.copy(colorRef.current)
          }
          mat.roughness = 0.3 - 0.22 * b2
          mat.metalness = 0.58 - 0.43 * b2
          mat.emissive = emissiveRef.current.set(DAY_WATER)
          mat.emissiveIntensity = 0.25 * b2
        }
      }
    }
    if (WATER_FORCE_ON_TOP_DEBUG && mesh.material) mesh.material.depthTest = false
    mesh.receiveShadow = b < 0.4
  })
  const waterY = WATER_POSITION_DEBUG ? 2 : -0.4
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, waterY, 0]} receiveShadow material={material} renderOrder={9999}>
      <planeGeometry args={[160, 160, 32, 32]} />
    </mesh>
  )
}

// Foam at island edge — soft gradient only; low opacity so no visible “ring” seam
function WaterFoam() {
  const { themeBlendRef } = useTheme()
  const ring1 = useRef()
  const ring2 = useRef()
  useFrame((state) => {
    const b = themeBlendRef.current
    const wave = 0.4 + 0.25 * Math.sin(state.clock.elapsedTime * 1.1)
    if (ring1.current?.material) {
      ring1.current.material.opacity = (wave + 0.35 * b) * 0.9
      ring1.current.material.color.lerpColors(FOAM_RING1_NIGHT, FOAM_RING1_DAY, 0.3 + 0.5 * b)
    }
    if (ring2.current?.material) {
      ring2.current.material.opacity = (0.3 + 0.25 * b) * (0.92 + 0.2 * Math.sin(state.clock.elapsedTime * 1.1))
      ring2.current.material.color.lerpColors(FOAM_RING2_NIGHT, FOAM_RING2_DAY, 0.3 + 0.5 * b)
    }
  })
  return (
    <>
      <mesh ref={ring1} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]} renderOrder={10001}>
        <ringGeometry args={[20, 28, 48]} />
        <meshBasicMaterial color="#e8f4ff" transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.33, 0]} renderOrder={10001}>
        <ringGeometry args={[21, 26, 48]} />
        <meshBasicMaterial color="#dceef8" transparent opacity={0.35} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

// Sun reflection streak on water — both modes, stronger in morning
function WaterSunStreak() {
  const { themeBlendRef } = useTheme()
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current?.material) return
    const b = themeBlendRef.current
    const pulse = 0.12 + 0.08 * Math.sin(state.clock.elapsedTime * 0.8)
    ref.current.material.opacity = (1 - b) * 0.06 + b * pulse
    ref.current.material.color.lerpColors(WATER_STREAK_NIGHT, WATER_STREAK_DAY, b)
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[8, -0.38, -18]} scale={[1, 2.5 / 6, 1]} renderOrder={10002}>
      <circleGeometry args={[6, 32]} />
      <meshBasicMaterial color="#fff8e0" transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

// Opaque blue plane between horizon cylinders and water — blocks dark cylinder from showing through
function WaterBlockerPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.39, 0]} renderOrder={5000}>
      <planeGeometry args={[160, 160, 1, 1]} />
      <meshBasicMaterial
        color="#5AC8FF"
        transparent
        opacity={0.98}
        depthWrite={false}
        depthTest={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// Bright blue overlay on sea for morning only — no shadows, strong opacity to hide z-fight/shadow patches
function MorningWaterOverlay() {
  const { themeBlendRef } = useTheme()
  const ref = useRef()
  useFrame(() => {
    if (!ref.current?.material) return
    const b = themeBlendRef.current
    ref.current.material.opacity = Math.max(0, b * 0.88)
    ref.current.visible = b > 0.08
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.37, 0]} renderOrder={10003} visible={false} receiveShadow={false}>
      <planeGeometry args={[160, 160, 1, 1]} />
      <meshBasicMaterial
        color="#5AC8FF"
        transparent
        opacity={0.88}
        depthWrite={false}
        depthTest={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// Top cap layer — draws last in morning so entire sea reads bright blue (no shadow/depth darkening)
function MorningSeaCap() {
  const { themeBlendRef } = useTheme()
  const ref = useRef()
  useFrame(() => {
    if (!ref.current) return
    const b = themeBlendRef.current
    ref.current.visible = b > 0.12
    if (ref.current.material) ref.current.material.opacity = b * 0.92
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.36, 0]} renderOrder={10005} visible={false} receiveShadow={false}>
      <planeGeometry args={[160, 160, 1, 1]} />
      <meshBasicMaterial
        color="#5AC8FF"
        transparent
        opacity={0.92}
        depthWrite={false}
        depthTest={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// Dolphins: stay in water only (island half-size 21 → min radius 24)
const DOLPHIN_PATHS = [
  { radius: 24, speed: 0.038, offset: 0 },
  { radius: 28, speed: -0.032, offset: Math.PI * 0.6 },
  { radius: 26, speed: 0.035, offset: Math.PI * 1.3 },
]
function Dolphins() {
  const refs = useRef([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    DOLPHIN_PATHS.forEach((r, i) => {
      const g = refs.current[i]
      if (!g) return
      const angle = t * r.speed + r.offset
      const x = Math.cos(angle) * r.radius
      const z = Math.sin(angle) * r.radius
      const jump = Math.max(0, Math.sin(t * 2.5 + i * 2) * 0.5)
      g.position.set(x, -0.35 + jump, z)
      g.rotation.y = -angle
      g.rotation.x = jump * 0.4
    })
  })
  return (
    <>
      {DOLPHIN_PATHS.map((_, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)}>
          <mesh castShadow position={[0, 0.15, 0]}>
            <boxGeometry args={[0.5, 0.2, 1.2]} />
            <meshStandardMaterial color="#6b7a8a" roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, 0.12, 0.7]}>
            <boxGeometry args={[0.35, 0.15, 0.4]} />
            <meshStandardMaterial color="#5a6570" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </>
  )
}

// Distant big ships — cargo scale, far from island, slow, silhouettes, small lights at night
const DISTANT_SHIP_RADIUS = 62
const DISTANT_SHIP_SPEED = 0.008
function DistantShips() {
  const refs = useRef([])
  const { themeBlendRef } = useTheme()
  const routes = useMemo(() => [
    { offset: 0 },
    { offset: Math.PI * 0.6 },
    { offset: Math.PI * 1.3 },
  ], [])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    routes.forEach((r, i) => {
      const g = refs.current[i]
      if (!g) return
      const angle = t * DISTANT_SHIP_SPEED + r.offset
      const x = Math.cos(angle) * DISTANT_SHIP_RADIUS
      const z = Math.sin(angle) * DISTANT_SHIP_RADIUS
      g.position.set(x, -0.38, z)
      g.rotation.y = -angle
    })
  })
  const night = 1 - (themeBlendRef?.current ?? 0)
  return (
    <>
      {routes.map((r, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)}>
          {/* Large cargo silhouette — hull */}
          <mesh>
            <boxGeometry args={[5.5, 1.8, 2.2]} />
            <meshStandardMaterial color="#1a1a22" roughness={0.9} metalness={0.1} />
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <boxGeometry args={[0.8, 1.2, 0.6]} />
            <meshStandardMaterial color="#252530" roughness={0.88} />
          </mesh>
          <mesh position={[0.6, 0.95, 0]}>
            <boxGeometry args={[4.2, 0.5, 1.8]} />
            <meshStandardMaterial color="#1e1e28" roughness={0.9} />
          </mesh>
          {night > 0.3 && (
            <pointLight color="#f0e6c8" intensity={0.4 * night} distance={12} position={[0.8, 1.6, 0.4]} />
          )}
          {night > 0.3 && (
            <pointLight color="#e8dca8" intensity={0.25 * night} distance={8} position={[-0.6, 1.2, -0.2]} />
          )}
        </group>
      ))}
    </>
  )
}

// Brown mountains / islands in the sea — farther from island, bigger, more of them
const SEA_MOUNTAIN_SPOTS = [
  { x: 48, z: -38, scale: 2.2, color: '#6B4423' },
  { x: -45, z: 42, scale: 1.9, color: '#5D3A1A' },
  { x: 42, z: 50, scale: 2.0, color: '#7D5A3D' },
  { x: -52, z: -35, scale: 2.4, color: '#5A3822' },
  { x: 55, z: 20, scale: 2.1, color: '#6D4C2E' },
  { x: -38, z: -48, scale: 1.8, color: '#4E3319' },
]
function SeaMountains() {
  return (
    <group>
      {SEA_MOUNTAIN_SPOTS.map((spot, i) => (
        <group key={i} position={[spot.x, 0, spot.z]}>
          <mesh castShadow receiveShadow position={[0, 0.8 * spot.scale, 0]}>
            <coneGeometry args={[1.4 * spot.scale, 2.2 * spot.scale, 8]} />
            <meshStandardMaterial color={spot.color} roughness={0.92} metalness={0} />
          </mesh>
          <mesh castShadow receiveShadow position={[0.15, 1.6 * spot.scale, -0.1]}>
            <coneGeometry args={[0.6 * spot.scale, 1.2 * spot.scale, 6]} />
            <meshStandardMaterial color={spot.color} roughness={0.9} metalness={0} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Ships: different colors and styles — hull, cabin, deck per route. Stay in water only; no overlap.
const ISLAND_HALF = 21
const SHIP_ISLAND_MARGIN = 2.2  // hull must not cross island edge (only foam may)
const SHIP_MIN_SEP = 5
function clampShipToWater(x, z) {
  const limit = ISLAND_HALF + SHIP_ISLAND_MARGIN
  const ax = Math.abs(x)
  const az = Math.abs(z)
  if (ax <= limit && az <= limit) {
    const dx = limit - ax
    const dz = limit - az
    if (dx <= dz) return [x < 0 ? -limit : limit, z]
    return [x, z < 0 ? -limit : limit]
  }
  return [x, z]
}
const SHIP_ROUTES = [
  { radius: 28, speed: 0.024, offset: 0, size: 'big', hull: '#2c3e50', cabin: '#7f8c8d', deck: '#95a5a6' },
  { radius: 32, speed: 0.02, offset: Math.PI, size: 'big', hull: '#8B4513', cabin: '#D2691E', deck: '#DEB887' },
  { radius: 26, speed: 0.035, offset: Math.PI / 2, size: 'small', hull: '#1a5276', cabin: '#3498db', deck: '#aed6f1' },
  { radius: 30, speed: -0.028, offset: Math.PI / 3, size: 'small', hull: '#4a235a', cabin: '#8e44ad', deck: '#d7bde2' },
  { radius: 35, speed: 0.017, offset: Math.PI * 0.7, size: 'big', hull: '#1b4f72', cabin: '#2874a6', deck: '#a9cce3' },
  { radius: 24, speed: -0.038, offset: Math.PI * 1.2, size: 'small', hull: '#784212', cabin: '#a04000', deck: '#f5b041' },
  { radius: 29, speed: 0.026, offset: 0.4, size: 'big', hull: '#145a32', cabin: '#1e8449', deck: '#a9dfbf' },
]
function Ships() {
  const refs = useRef([])
  const positionsRef = useRef(SHIP_ROUTES.map(() => ({ x: 0, z: 0, angle: 0 })))
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const pos = positionsRef.current
    SHIP_ROUTES.forEach((r, i) => {
      const angle = t * r.speed + r.offset
      let x = Math.cos(angle) * r.radius
      let z = Math.sin(angle) * r.radius
      ;[x, z] = clampShipToWater(x, z)
      pos[i] = { x, z, angle }
    })
    for (let iter = 0; iter < 3; iter++) {
      for (let i = 0; i < SHIP_ROUTES.length; i++) {
        let dx = 0, dz = 0
        for (let j = 0; j < SHIP_ROUTES.length; j++) {
          if (i === j) continue
          const a = pos[i], b = pos[j]
          const d = Math.hypot(a.x - b.x, a.z - b.z)
          if (d > 0 && d < SHIP_MIN_SEP) {
            const push = (SHIP_MIN_SEP - d) / d
            dx += (a.x - b.x) * push
            dz += (a.z - b.z) * push
          }
        }
        pos[i].x += dx
        pos[i].z += dz
        ;[pos[i].x, pos[i].z] = clampShipToWater(pos[i].x, pos[i].z)
      }
    }
    SHIP_ROUTES.forEach((r, i) => {
      const g = refs.current[i]
      if (!g) return
      const { x, z, angle } = pos[i]
      g.position.set(x, -0.35, z)
      g.rotation.y = -angle
    })
  })
  return (
    <>
      {SHIP_ROUTES.map((r, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)}>
          {r.size === 'big' ? (
            <>
              <mesh castShadow>
                <boxGeometry args={[2.8, 0.65, 1.2]} />
                <meshStandardMaterial color={r.hull} roughness={0.72} />
              </mesh>
              <mesh position={[0, 0.7, 0]} castShadow>
                <boxGeometry args={[0.35, 0.9, 0.25]} />
                <meshStandardMaterial color={r.cabin} />
              </mesh>
              <mesh position={[0.7, 0.4, 0]} castShadow>
                <boxGeometry args={[1, 0.3, 0.85]} />
                <meshStandardMaterial color={r.deck} roughness={0.68} />
              </mesh>
              <mesh position={[-0.5, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI]}>
                <planeGeometry args={[1.4, 0.8]} />
                <meshBasicMaterial color="#e8eef4" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
              </mesh>
            </>
          ) : (
            <>
              <mesh castShadow>
                <boxGeometry args={[1.2, 0.35, 0.55]} />
                <meshStandardMaterial color={r.hull} roughness={0.7} />
              </mesh>
              <mesh position={[0, 0.45, 0]} castShadow>
                <boxGeometry args={[0.18, 0.55, 0.12]} />
                <meshStandardMaterial color={r.cabin} />
              </mesh>
              <mesh position={[-0.35, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI]}>
                <planeGeometry args={[0.7, 0.4]} />
                <meshBasicMaterial color="#dce4ec" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
              </mesh>
            </>
          )}
        </group>
      ))}
    </>
  )
}

// Street network: segments that wrap around buildings (no roads under buildings).
// Each segment: { type: 'h', z, x0, x1 } or { type: 'v', x, z0, z1 }. Primary = wider.
const ROAD_W_PRIMARY = 2.8
const ROAD_W_SECONDARY = 2.2
const ROAD_SEGMENTS = [
  { type: 'h', z: 8, x0: -11, x1: 11, w: ROAD_W_PRIMARY },
  { type: 'h', z: -12, x0: -11, x1: 11, w: ROAD_W_PRIMARY },
  { type: 'v', x: -11, z0: -12, z1: 8, w: ROAD_W_PRIMARY },
  { type: 'v', x: 11, z0: -12, z1: 8, w: ROAD_W_PRIMARY },
  { type: 'h', z: 4, x0: -11, x1: 11, w: ROAD_W_SECONDARY },
  { type: 'h', z: 0, x0: -11, x1: -6, w: ROAD_W_SECONDARY },
  { type: 'h', z: 0, x0: 6, x1: 11, w: ROAD_W_SECONDARY },
  { type: 'h', z: -5, x0: -11, x1: 11, w: ROAD_W_SECONDARY },
  { type: 'v', x: -6, z0: -5, z1: 4, w: ROAD_W_SECONDARY },
  { type: 'v', x: 6, z0: -5, z1: 4, w: ROAD_W_SECONDARY },
  { type: 'v', x: 0, z0: -12, z1: -10, w: ROAD_W_SECONDARY },
  { type: 'v', x: 0, z0: 0, z1: 8, w: ROAD_W_SECONDARY },
]
const TRAFFIC_LIGHT_POSITIONS = [
  [-11, 8], [-11, 4], [-11, 0], [-11, -5], [11, 8], [11, 4], [11, 0], [11, -5],
  [-6, 4], [-6, 0], [-6, -5], [6, 4], [6, 0], [6, -5], [0, 8], [0, 0], [0, -12],
]

const SIDEWALK_W = 0.7
const CURB_H = 0.05

function RoadSegment({ seg, segIndex }) {
  const w = seg.w
  const half = w / 2
  const rot = [-Math.PI / 2, 0, 0]
  const roadY = 0.03
  const sidewalkY = 0.015
  const curbY = (roadY + sidewalkY) / 2 + CURB_H / 2
  const rough = 0.82 + (segIndex % 5) * 0.02
  const asphaltColor = segIndex % 3 === 0 ? ASPHALT : segIndex % 3 === 1 ? '#252528' : '#2d2d30'
  if (seg.type === 'h') {
    const len = seg.x1 - seg.x0
    const cx = (seg.x0 + seg.x1) / 2
    return (
      <group position={[cx, 0, seg.z]}>
        <mesh rotation={rot} position={[0, roadY, 0]} receiveShadow>
          <planeGeometry args={[len, w]} />
          <meshStandardMaterial color={asphaltColor} roughness={rough} metalness={0.2} />
        </mesh>
        <mesh rotation={rot} position={[0, roadY + 0.005, half]}>
          <planeGeometry args={[len, 0.1]} />
          <meshStandardMaterial color="#e8e8e0" />
        </mesh>
        <mesh rotation={rot} position={[0, roadY + 0.005, -half]}>
          <planeGeometry args={[len, 0.1]} />
          <meshStandardMaterial color="#c4a84a" />
        </mesh>
        <mesh position={[0, curbY, half + 0.06]}>
          <boxGeometry args={[len, CURB_H, 0.12]} />
          <meshStandardMaterial color={STONE_DARK} roughness={0.92} />
        </mesh>
        <mesh position={[0, curbY, -half - 0.06]}>
          <boxGeometry args={[len, CURB_H, 0.12]} />
          <meshStandardMaterial color={STONE_DARK} roughness={0.92} />
        </mesh>
        <mesh rotation={rot} position={[0, sidewalkY, half + SIDEWALK_W / 2 + CURB_H / 2]} receiveShadow>
          <planeGeometry args={[len, SIDEWALK_W]} />
          <meshStandardMaterial color={STONE_DARK} roughness={0.88 + (segIndex % 3) * 0.04} />
        </mesh>
        <mesh rotation={rot} position={[0, sidewalkY, -half - SIDEWALK_W / 2 - CURB_H / 2]} receiveShadow>
          <planeGeometry args={[len, SIDEWALK_W]} />
          <meshStandardMaterial color={STONE_DARK} roughness={0.88 + (segIndex % 3) * 0.04} />
        </mesh>
      </group>
    )
  }
  const len = seg.z1 - seg.z0
  const cz = (seg.z0 + seg.z1) / 2
  return (
    <group position={[seg.x, 0, cz]}>
      <mesh rotation={rot} position={[0, roadY, 0]} receiveShadow>
        <planeGeometry args={[w, len]} />
        <meshStandardMaterial color={asphaltColor} roughness={rough} metalness={0.2} />
      </mesh>
      <mesh rotation={rot} position={[half, roadY + 0.005, 0]}>
        <planeGeometry args={[0.1, len]} />
        <meshStandardMaterial color="#e8e8e0" />
      </mesh>
      <mesh rotation={rot} position={[-half, roadY + 0.005, 0]}>
        <planeGeometry args={[0.1, len]} />
        <meshStandardMaterial color="#c4a84a" />
      </mesh>
      <mesh position={[half + 0.04, curbY, 0]}>
        <boxGeometry args={[0.12, CURB_H, len]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.92} />
      </mesh>
      <mesh position={[-half - 0.04, curbY, 0]}>
        <boxGeometry args={[0.12, CURB_H, len]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.92} />
      </mesh>
      <mesh rotation={rot} position={[half + SIDEWALK_W / 2 + CURB_H / 2, sidewalkY, 0]} receiveShadow>
        <planeGeometry args={[SIDEWALK_W, len]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.88 + (segIndex % 3) * 0.04} />
      </mesh>
      <mesh rotation={rot} position={[-half - SIDEWALK_W / 2 - CURB_H / 2, sidewalkY, 0]} receiveShadow>
        <planeGeometry args={[SIDEWALK_W, len]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.88 + (segIndex % 3) * 0.04} />
      </mesh>
    </group>
  )
}

// Dedicated plaza for pyramids: warm uplighting, clear axis
// Island ground — green shades (vertex variation), darker at night
const ISLAND_SEGMENTS = 48
const GREEN_DARK = new THREE.Color('#1a3d2a')
const GREEN_MID = new THREE.Color('#2a5c3e')
const GREEN_LIGHT = new THREE.Color('#3d7a52')
const GREEN_PATCH = new THREE.Color('#246b38')

function islandGreenNoise(x, z) {
  return (
    Math.sin(x * 0.15) * Math.cos(z * 0.12) * 0.5 +
    0.5 * Math.sin((x + z) * 0.08) +
    0.25 * Math.cos(z * 0.2)
  )
}

function IslandGround() {
  const { themeBlendRef } = useTheme()
  const ref = useRef()
  const colorRef = useRef(new THREE.Color())
  const processed = useRef(false)

  useEffect(() => {
    const mesh = ref.current
    if (!mesh?.geometry || processed.current) return
    processed.current = true
    const g = mesh.geometry
    const pos = g.attributes.position
    const colors = []
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const n = islandGreenNoise(x, z)
      const t = THREE.MathUtils.clamp((n + 1.2) / 2.4, 0, 1)
      const c = GREEN_DARK.clone().lerp(GREEN_MID, t).lerp(GREEN_LIGHT, t * 0.6)
      if (Math.sin(x * 0.5) * Math.cos(z * 0.5) > 0.3) c.lerp(GREEN_PATCH, 0.2)
      colors.push(c.r, c.g, c.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    g.computeVertexNormals()
  }, [])

  useFrame(() => {
    if (!ref.current?.material) return
    const b = themeBlendRef.current
    const mat = ref.current.material
    colorRef.current.setRGB(0.5, 0.58, 0.45).lerp(new THREE.Color(1, 1, 0.98), b)
    mat.color.copy(colorRef.current)
    mat.roughness = 0.9 - 0.12 * b
    mat.metalness = 0.05 + 0.06 * b
    mat.envMapIntensity = 0.25 + 0.25 * b
  })

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[42, 42, ISLAND_SEGMENTS, ISLAND_SEGMENTS]} />
      <meshStandardMaterial vertexColors roughness={0.88} metalness={0.08} envMapIntensity={0.35} />
    </mesh>
  )
}

// Volcano: half dark reddish-brown, big lava down one side, glowing cracks, 24/7 smoke (dark grey→light, drift)
const LAVA_COLOR = '#e85c2b'
const LAVA_EMISSIVE = '#ff6633'
function CornerVolcano() {
  const { themeBlendRef } = useTheme()
  const lhWorld = useLighthouseWorld()
  const craterMeshRef = useRef()
  const lavaFlowRefs = useRef([])
  const crackRefs = useRef([])
  const smokeRef = useRef()
  const [lavaGlow, setLavaGlow] = useState(0)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.2)
    const night = 1 - themeBlendRef.current
    const basePulse = 0.5 + 0.3 * pulse
    const ignite = lhWorld?.volcanoGlow ? 2.2 : 0
    const clickGlow = lavaGlow * 0.9
    const intensity = basePulse * night + ignite + clickGlow
    if (craterMeshRef.current?.material) craterMeshRef.current.material.emissiveIntensity = intensity
    lavaFlowRefs.current.forEach((mesh) => {
      if (mesh?.material) mesh.material.emissiveIntensity = intensity * 0.85
    })
    crackRefs.current.forEach((mesh) => {
      if (mesh?.material) mesh.material.emissiveIntensity = intensity * 0.9
    })
    if (smokeRef.current) {
      smokeRef.current.visible = true
      smokeRef.current.position.x = Math.sin(t * 0.15) * 0.4
      smokeRef.current.position.z = Math.cos(t * 0.12) * 0.3
      smokeRef.current.position.y = 4.2 + Math.sin(t * 0.2) * 0.2
    }
    if (lavaGlow > 0) setLavaGlow((g) => Math.max(0, g - 0.012))
  })

  const handleClick = (e) => {
    e.stopPropagation()
    setLavaGlow(0.7)
    lhWorld?.addVolcanoClick()
    lhWorld?.addSecretClick('volcano')
  }

  return (
    <group position={[48, 0, 48]}>
      {/* Base — dark rock half */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow onClick={handleClick} onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
        <cylinderGeometry args={[3.5, 4.5, 2.4, 8, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#2a2520" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Base — dark reddish-brown half (volcano side) */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow onClick={handleClick}>
        <cylinderGeometry args={[3.5, 4.5, 2.4, 8, 1, false, Math.PI, Math.PI]} />
        <meshStandardMaterial color="#4a2818" roughness={0.92} metalness={0.02} />
      </mesh>
      {/* Upper cone — dark rock half */}
      <mesh position={[0, 2.8, 0]} castShadow receiveShadow onClick={handleClick}>
        <cylinderGeometry args={[1.8, 3.5, 1.4, 8, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#2a2520" roughness={0.92} metalness={0.02} />
      </mesh>
      {/* Upper cone — dark reddish-brown half */}
      <mesh position={[0, 2.8, 0]} castShadow receiveShadow onClick={handleClick}>
        <cylinderGeometry args={[1.8, 3.5, 1.4, 8, 1, false, Math.PI, Math.PI]} />
        <meshStandardMaterial color="#5c2a18" roughness={0.92} metalness={0.02} />
      </mesh>
      {/* Big lava flow — down one side (positive Z), visibly spilling */}
      <mesh
        ref={(el) => (lavaFlowRefs.current[0] = el)}
        position={[0.8, 2.0, 2.4]}
        rotation={[0, 0, 0.55]}
        castShadow={false}
        onClick={handleClick}
      >
        <planeGeometry args={[1.4, 2.8]} />
        <meshStandardMaterial color={LAVA_COLOR} emissive={LAVA_EMISSIVE} emissiveIntensity={0.6} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={(el) => (lavaFlowRefs.current[1] = el)} position={[0.5, 1.4, 2.0]} rotation={[0, 0, 0.5]} castShadow={false} onClick={handleClick}>
        <planeGeometry args={[0.9, 1.6]} />
        <meshStandardMaterial color={LAVA_COLOR} emissive={LAVA_EMISSIVE} emissiveIntensity={0.5} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Glowing red lava cracks */}
      {[[0.5, 0.9], [-0.4, 0.7], [0.35, -0.4]].map(([sx, sz], i) => (
        <mesh key={`crack-${i}`} ref={(el) => (crackRefs.current[i] = el)} position={[sx * 1.6, 3.3 + i * 0.12, sz * 1.6]} rotation={[0, i * 0.5, 0]} onClick={handleClick}>
          <planeGeometry args={[0.12, 0.6]} />
          <meshStandardMaterial color={LAVA_COLOR} emissive={LAVA_EMISSIVE} emissiveIntensity={0.8} roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Crater — big lava pool */}
      <mesh ref={craterMeshRef} position={[0, 3.6, 0]} castShadow={false} onClick={handleClick}>
        <ringGeometry args={[0.9, 2.2, 32]} />
        <meshStandardMaterial color="#b84218" emissive={LAVA_EMISSIVE} emissiveIntensity={0.6} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 3.58, 0]} castShadow={false} onClick={handleClick}>
        <circleGeometry args={[0.85, 24]} />
        <meshStandardMaterial color="#8b2910" emissive={LAVA_EMISSIVE} emissiveIntensity={0.45} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* 24/7 smoke — always visible, dark grey base to lighter, slight drift */}
      <group ref={smokeRef} position={[0, 4.2, 0]}>
        <mesh renderOrder={10}>
          <coneGeometry args={[1.8, 2.8, 8]} />
          <meshBasicMaterial color="#2a2a2a" transparent opacity={0.22} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.6, 0]} scale={[0.7, 0.6, 0.7]} renderOrder={9}>
          <coneGeometry args={[1.4, 1.8, 8]} />
          <meshBasicMaterial color="#4a4a4a" transparent opacity={0.14} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 1.1, 0]} scale={[0.5, 0.5, 0.5]} renderOrder={8}>
          <coneGeometry args={[1, 1.2, 8]} />
          <meshBasicMaterial color="#666" transparent opacity={0.08} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}

function PyramidPlaza() {
  return (
    <group position={[0, 0, -8]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color="#1e1c20" roughness={0.88} metalness={0.1} />
      </mesh>
    </group>
  )
}

// Beach — left side of island: sand strip, umbrellas both sides, life buoys, voxel people
const SAND_COLOR = '#D4A574'
function BeachSwimmer({ basePosition, seed }) {
  const groupRef = useRef()
  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime + seed
    groupRef.current.position.y = basePosition[1] + Math.sin(t * 1.2) * 0.06
    groupRef.current.position.x = basePosition[0] + Math.sin(t * 0.7) * 0.04
  })
  return (
    <group ref={groupRef} position={[basePosition[0], basePosition[1], basePosition[2]]} rotation={[0, 0, -0.25]}>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.35, 0.14, 0.18]} />
        <meshStandardMaterial color="#5a8a9e" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#D4A574" roughness={0.9} />
      </mesh>
    </group>
  )
}
function Beach() {
  const walkRef = useRef()
  useFrame((state) => {
    if (walkRef.current) walkRef.current.position.z = -4.2 + Math.sin(state.clock.elapsedTime * 0.8) * 0.15
  })
  const umbrellaSpots = [
    [-0.4, -5], [0.2, -2.5], [-0.2, 0], [0.3, 2.5], [0, 5],
    [0.6, -3.5], [-0.5, 1.5], [0.4, 4],
  ]
  return (
    <group position={[-20, 0, 0]}>
      {/* Sand strip */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.2, 30]} />
        <meshStandardMaterial color={SAND_COLOR} roughness={0.92} metalness={0} />
      </mesh>
      {/* Umbrellas: 2–4 per side, alternating red/white and blue/white */}
      {umbrellaSpots.map(([ox, oz], i) => (
        <group key={i} position={[ox, 0, oz]}>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.2, 6]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.35, 0]}>
            <coneGeometry args={[0.65, 0.38, 8]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#c62828' : '#1565c0'} roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* Life buoys: 2–3 near shoreline, orange/red with white stripe feel (solid orange) */}
      {[[0.7, 0.35, -3.5], [-0.3, 0.32, 0.5], [0.5, 0.38, 3.5]].map(([px, py, pz], i) => (
        <group key={i} position={[px, py, pz]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.22, 0.06, 8, 16]} />
            <meshStandardMaterial color="#e65100" roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* Lifeguard stand */}
      <group position={[-0.4, 0, 2.5]}>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#E8A317" roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.6, 0.15, 0.5]} />
          <meshStandardMaterial color="#5D4037" roughness={0.8} />
        </mesh>
      </group>
      {/* Towels */}
      <mesh position={[0.2, 0.03, 0.8]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.6, 0.02, 0.35]} />
        <meshStandardMaterial color="#42a5f5" roughness={0.9} />
      </mesh>
      <mesh position={[-0.3, 0.03, 1.2]} rotation={[0, 0, -0.05]}>
        <boxGeometry args={[0.5, 0.02, 0.4]} />
        <meshStandardMaterial color="#ef5350" roughness={0.9} />
      </mesh>
      {/* Voxel people: standing */}
      <group position={[-0.5, 0, -2]}>
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.2, 0.5, 0.12]} />
          <meshStandardMaterial color="#4a7c8e" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[0.22, 0.22, 0.2]} />
          <meshStandardMaterial color="#D4A574" roughness={0.9} />
        </mesh>
      </group>
      {/* Sitting */}
      <group position={[0.4, 0, 1.2]} rotation={[0, 0, 0.15]}>
        <mesh position={[0, 0.2, 0]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.18, 0.35, 0.15]} />
          <meshStandardMaterial color="#6b8e9e" roughness={0.85} />
        </mesh>
        <mesh position={[0.02, 0.48, 0.05]}>
          <boxGeometry args={[0.2, 0.2, 0.18]} />
          <meshStandardMaterial color="#D4A574" roughness={0.9} />
        </mesh>
      </group>
      {/* Walking (animated) */}
      <group ref={walkRef} position={[0.1, 0, -4.2]}>
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[0.18, 0.45, 0.1]} />
          <meshStandardMaterial color="#5a8a9e" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.72, 0]}>
          <boxGeometry args={[0.2, 0.2, 0.18]} />
          <meshStandardMaterial color="#D4A574" roughness={0.9} />
        </mesh>
      </group>
      {/* Three people swimming (farther out in water so visible) */}
      {[
        [-2.2, 0.15, -2.5],
        [-2.4, 0.12, 1.2],
        [-2.0, 0.18, 4.2],
      ].map(([px, py, pz], i) => (
        <BeachSwimmer key={i} basePosition={[px, py, pz]} seed={i * 1.3} />
      ))}
    </group>
  )
}

function AsphaltStreets() {
  const { themeBlendRef } = useTheme()
  const groupRef = useRef()
  const dayAsphalt = useRef(new THREE.Color('#404048'))
  const nightAsphalt = useRef(new THREE.Color(ASPHALT))
  useFrame(() => {
    if (!groupRef.current) return
    const b = themeBlendRef.current
    groupRef.current.traverse((obj) => {
      if (!obj.isMesh?.material) return
      const mat = obj.material
      const hex = mat.color.getHex()
      if (hex <= 0x2e2e32 && mat.roughness >= 0.8) {
        mat.color.copy(nightAsphalt.current).lerp(dayAsphalt.current, b)
        mat.roughness = 0.82 - 0.12 * b
        mat.metalness = 0.2 + 0.1 * b
      }
    })
  })
  return (
    <group ref={groupRef}>
      {ROAD_SEGMENTS.map((seg, i) => (
        <RoadSegment key={i} seg={seg} segIndex={i} />
      ))}
    </group>
  )
}

// Extra city neon at night (reduced count for performance)
const CITY_NEON_LIGHTS = [
  { pos: [0, 2, -8], color: '#ffd36a', intensity: 1.8 },
  { pos: [-3, 1.5, -7], color: '#00e5ff', intensity: 1.5 },
  { pos: [3, 1.5, -7], color: '#ff6b9d', intensity: 1.5 },
  { pos: [-8, 1, 8], color: '#ffd36a', intensity: 1.4 },
  { pos: [8, 1, 8], color: '#c0e8ff', intensity: 1.4 },
  { pos: [-2, 2, 2], color: '#ffd36a', intensity: 1.5 },
  { pos: [2, 2, 2], color: '#00e5ff', intensity: 1.5 },
  { pos: [-5, 1.2, -10], color: '#ff6b9d', intensity: 1.2 },
]
function CityNeonLights() {
  const { themeBlendRef } = useTheme()
  const refs = useRef([])
  const baseRef = useRef(CITY_NEON_LIGHTS.map((l) => l.intensity))
  const lastNight = useRef(-1)
  useFrame(() => {
    const night = 1 - themeBlendRef.current
    if (Math.abs(night - lastNight.current) < 0.02) return
    lastNight.current = night
    refs.current.forEach((light, i) => {
      if (light) light.intensity = (baseRef.current[i] ?? 1) * night
    })
  })
  return (
    <>
      {CITY_NEON_LIGHTS.map(({ pos, color, intensity }, i) => (
        <pointLight
          key={i}
          ref={(el) => { refs.current[i] = el }}
          position={[pos[0], pos[1], pos[2]]}
          color={color}
          intensity={0}
          distance={14}
          decay={2}
        />
      ))}
    </>
  )
}

// Street lamps — brighter, circular ground radius, soft falloff
const LAMP_POSITIONS = [
  [-8, 8], [-4, 8], [0, 8], [4, 8], [8, 8],
  [11, 4], [11, 0], [11, -5],
  [8, -12], [4, -12], [0, -12], [-4, -12], [-8, -12],
  [-11, -5], [-11, 0], [-11, 4],
]
function StreetLamps() {
  const { themeBlendRef } = useTheme()
  const groupRef = useRef()
  const lastMult = useRef(-1)
  useFrame(() => {
    if (!groupRef.current) return
    const mult = Math.max(0.02, 1 - 0.98 * themeBlendRef.current)
    if (Math.abs(mult - lastMult.current) < 0.03) return
    lastMult.current = mult
    groupRef.current.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        if (obj.material.emissive) obj.material.emissiveIntensity = (mult > 0.5 ? 2.2 : 0.85) * mult
        if (obj.material.transparent && obj.material.opacity !== undefined) obj.material.opacity = (mult > 0.5 ? 0.35 : 0.12) * mult
      }
      if (obj.isPointLight) obj.intensity = mult > 0.5 ? 2.2 : 0.15
    })
  })
  return (
    <group ref={groupRef}>
      {LAMP_POSITIONS.map((pos, i) => (
        <group key={i} position={[pos[0], 0, pos[1]]}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 1.2, 6]} />
            <meshStandardMaterial color={CHARCOAL} />
          </mesh>
          <mesh position={[0, 1.1, 0]} castShadow>
            <sphereGeometry args={[0.2, 8, 6]} />
            <meshStandardMaterial color="#e8c547" emissive="#e8c547" emissiveIntensity={2.2} />
          </mesh>
          <pointLight position={[0, 1.1, 0]} color="#e8c547" intensity={2.2} distance={12} decay={2} />
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 1.4, 16]} />
            <meshBasicMaterial color="#e8c547" transparent opacity={0.35} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Ambulance parked in front of hospital
function Ambulance() {
  return (
    <group position={[-5.2, 0, -2.5]} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.5, 0.5]} />
        <meshStandardMaterial color="#f0f0ec" roughness={0.6} metalness={0.15} />
      </mesh>
      <mesh position={[0.15, 0.55, 0]} castShadow>
        <boxGeometry args={[0.5, 0.45, 0.45]} />
        <meshStandardMaterial color="#f0f0ec" roughness={0.6} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.5, 0.26]} castShadow>
        <boxGeometry args={[0.25, 0.2, 0.04]} />
        <meshStandardMaterial color="#8C2F39" emissive="#8C2F39" emissiveIntensity={0.08} />
      </mesh>
      <mesh position={[0, 0.5, 0.26]}>
        <boxGeometry args={[0.04, 0.25, 0.04]} />
        <meshStandardMaterial color="#8C2F39" emissive="#8C2F39" emissiveIntensity={0.08} />
      </mesh>
    </group>
  )
}

// Traffic lights — emissive × day/night multiplier, chunk flicker every ~0.5s
function TrafficLights() {
  const { themeBlendRef } = useTheme()
  const rRef = useRef([])
  const yRef = useRef([])
  const gRef = useRef([])
  const positions = TRAFFIC_LIGHT_POSITIONS
  const lastTick = useRef(0)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (t - lastTick.current < 0.5) return
    lastTick.current = t
    const mult = Math.max(0.03, 1 - 0.97 * themeBlendRef.current)
    const flicker = (0.65 + 0.15 * Math.sin(t * 0.8)) * mult
    positions.forEach((_, i) => {
      ;[rRef, yRef, gRef].forEach((ref, c) => {
        const mesh = ref.current[i]
        if (!mesh?.material) return
        mesh.material.emissiveIntensity = flicker + (c * 0.05)
      })
    })
  })
  return (
    <>
      {positions.map((pos, i) => (
        <group key={i} position={[pos[0], 0, pos[1]]}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[0.15, 1, 0.15]} />
            <meshStandardMaterial color={CHARCOAL} />
          </mesh>
          <mesh position={[0.25, 1.1, 0]} castShadow>
            <boxGeometry args={[0.35, 0.5, 0.2]} />
            <meshStandardMaterial color={CHARCOAL} />
          </mesh>
          <mesh ref={(el) => (rRef.current[i] = el)} position={[0.25, 1.35, 0.08]} castShadow>
            <boxGeometry args={[0.2, 0.2, 0.05]} />
            <meshStandardMaterial color="#8C2F39" emissive="#8C2F39" emissiveIntensity={0.75} />
          </mesh>
          <mesh ref={(el) => (yRef.current[i] = el)} position={[0.25, 1.1, 0.08]} castShadow>
            <boxGeometry args={[0.2, 0.2, 0.05]} />
            <meshStandardMaterial color="#c4a84a" emissive="#c4a84a" emissiveIntensity={0.65} />
          </mesh>
          <mesh ref={(el) => (gRef.current[i] = el)} position={[0.25, 0.85, 0.08]} castShadow>
            <boxGeometry args={[0.2, 0.2, 0.05]} />
            <meshStandardMaterial color="#2d5a27" emissive="#2d5a27" emissiveIntensity={0.65} />
          </mesh>
        </group>
      ))}
    </>
  )
}

// No visible grid — removed for finished look

// Trees: distributed around buildings, 2–4 per side, buffer 1–1.5, no runway/taxi/sidewalks
const DARK_GREEN_LEAF = '#1a2e1a'
const DARK_GREEN_MID = '#243d24'
const DARK_GREEN_DARK = '#0f1f0f'
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
// Building footprints (center x, z, halfW, halfD) for tree exclusion + framing
const BUILDING_FOOTPRINTS = [
  [9, 7, 1.5, 1.25], [-8, 6, 1.5, 1.25], [7, -2.5, 2.1, 1.7], [-4, -10, 0.7, 0.7], [4, -10, 0.7, 0.7],
  [0, -8, 1.1, 1.1], [-4, -8, 1.1, 1.1], [4, -8, 1.1, 1.1], [-7, -2.5, 1.9, 1.45],
]
const TREE_BUFFER = 1.25
const RUNWAY_MARGIN = 1.5
const RUNWAY_WORLD = { xMin: -10.5, xMax: 18.5, zMin: 13.5, zMax: 20.5 }
const TAXI_WORLD = { xMin: -17.5, xMax: -4.5, zMin: 10.1, zMax: 14.9 }
function inRunwayOrTaxi(x, z) {
  if (x >= RUNWAY_WORLD.xMin && x <= RUNWAY_WORLD.xMax && z >= RUNWAY_WORLD.zMin && z <= RUNWAY_WORLD.zMax) return true
  if (x >= TAXI_WORLD.xMin && x <= TAXI_WORLD.xMax && z >= TAXI_WORLD.zMin && z <= TAXI_WORLD.zMax) return true
  return false
}
function inAnyBuildingBuffer(x, z, buffer) {
  for (const [cx, cz, hw, hd] of BUILDING_FOOTPRINTS) {
    if (Math.abs(x - cx) <= hw + buffer && Math.abs(z - cz) <= hd + buffer) return true
  }
  return false
}
const PYRAMID_ZONE_CENTERS = [[0, -8], [-4, -8], [4, -8]]
const PYRAMID_ZONE_RADIUS = 2.8
function insidePyramidZone(x, z) {
  return PYRAMID_ZONE_CENTERS.some(([cx, cz]) => (x - cx) ** 2 + (z - cz) ** 2 <= PYRAMID_ZONE_RADIUS ** 2)
}
function onSidewalk(x, z) {
  if (Math.abs(z - 8) < 2 && Math.abs(x) < 12) return true
  if (Math.abs(z + 12) < 2 && Math.abs(x) < 12) return true
  if (Math.abs(x - 11) < 2 && Math.abs(z) < 10) return true
  if (Math.abs(x + 11) < 2 && Math.abs(z) < 10) return true
  return false
}
// Trees only in green areas. No roads, no on seats, no on beach.
function inSeatingBuffer(x, z) {
  const seats = [[-3, -2.5], [0, -2.7], [2.8, -2.4]]
  for (const [sx, sz] of seats) {
    if ((x - sx) ** 2 + (z - sz) ** 2 < 1.8 ** 2) return true
  }
  return false
}
function onBeach(x, z) {
  return x >= -20.5 && x <= -15.5 && z >= -15 && z <= 15
}
const ALLOWED_TREE_ZONES = [
  // Green strip between mixed-use and hospital, in front of seats (not on seats)
  { xMin: -1.2, xMax: 3.5, zMin: -2.95, zMax: -2.2, n: 4 },
  // Green behind hospital (left side)
  { xMin: -11, xMax: -9, zMin: -3.5, zMax: -1.5, n: 3 },
  // Green behind mixed-use (right side)
  { xMin: 9.5, xMax: 12, zMin: -3.2, zMax: -1.8, n: 3 },
  // Island perimeter edges — not on beach (beach is x -20 to -16, z -15..15)
  { xMin: -21, xMax: -18.5, zMin: 15, zMax: 21, n: 2 },
  { xMin: -21, xMax: -18.5, zMin: -21, zMax: -15, n: 3 },
  { xMin: 18.5, xMax: 21, zMin: -12, zMax: 12, n: 4 },
  { xMin: -12, xMax: 12, zMin: -21, zMax: -18, n: 4 },
  { xMin: -21, xMax: -11, zMin: 18, zMax: 21, n: 3 },
  { xMin: -18, xMax: -10, zMin: 7, zMax: 9, n: 3 },
  { xMin: 10, xMax: 13, zMin: -2, zMax: 2, n: 3 },
  // Around lighthouse (green spots)
  { xMin: 12.5, xMax: 16, zMin: 4, zMax: 7, n: 4 },
  // In front of resort (9, 7), not on road
  { xMin: 7.5, xMax: 10.5, zMin: 7.2, zMax: 9, n: 4 },
  // Beside airport terminal (apron side), back of airport
  { xMin: -20, xMax: -17, zMin: 10.5, zMax: 13, n: 3 },
  { xMin: -14, xMax: -11, zMin: 10.5, zMax: 13, n: 3 },
  // Around construction / pyramid area (back green)
  { xMin: -6, xMax: -2, zMin: -11, zMax: -8.5, n: 3 },
  { xMin: 2, xMax: 6, zMin: -11, zMax: -8.5, n: 3 },
  { xMin: -2, xMax: 2, zMin: -11, zMax: -8.5, n: 2 },
]
const TREE_POSITIONS = (() => {
  const trees = []
  const rng = mulberry32(42)
  for (const zone of ALLOWED_TREE_ZONES) {
    const n = zone.n
    for (let i = 0; i < n; i++) {
      const x = zone.xMin + (zone.xMax - zone.xMin) * (0.2 + 0.6 * (i + rng()) / (n + 1)) + (rng() - 0.5) * 0.3
      const z = zone.zMin + (zone.zMax - zone.zMin) * (0.2 + 0.6 * rng()) + (rng() - 0.5) * 0.3
      if (inRunwayOrTaxi(x, z) || onSidewalk(x, z) || inAnyBuildingBuffer(x, z, 0.15) || insidePyramidZone(x, z) || inSeatingBuffer(x, z) || onBeach(x, z)) continue
      const trunkH = (0.4 + rng() * 0.85) * (0.9 + rng() * 0.3)
      const trunkW = 0.12 + rng() * 0.1
      trees.push({
        x, z,
        trunkH,
        trunkW,
        shape: Math.floor(rng() * 6),
        colorIdx: Math.floor(rng() * 3),
        leanY: (rng() - 0.5) * 0.22,
        leanX: (rng() - 0.5) * 0.12,
        scale: 0.9 + rng() * 0.3,
      })
    }
  }
  return trees
})()

const TREE_COLORS = [DARK_GREEN_LEAF, DARK_GREEN_MID, DARK_GREEN_DARK]
const DAY_TREE_COLORS = ['#3DDC5A', '#4FE36A', '#2BC04C']

function SimpleTrees() {
  const { themeBlendRef } = useTheme()
  const groupRef = useRef()
  const treeColorRef = useRef(new THREE.Color())
  const treeColorDayRef = useRef(new THREE.Color())
  useFrame(() => {
    if (!groupRef.current) return
    const b = themeBlendRef.current
    const nightColor = treeColorRef.current
    const dayColor = treeColorDayRef.current
    groupRef.current.children.forEach((treeGroup, i) => {
      const tree = TREE_POSITIONS[i]
      if (!tree) return
      nightColor.set(TREE_COLORS[tree.colorIdx])
      dayColor.set(DAY_TREE_COLORS[(tree.colorIdx + (i % 2)) % 3])
      treeGroup.children.forEach((mesh, j) => {
        if (j === 0 || !mesh.material) return
        mesh.material.color.copy(nightColor).lerp(dayColor, b)
        mesh.material.roughness = 0.88 - 0.12 * b
      })
    })
  })
  return (
    <group ref={groupRef}>
      {TREE_POSITIONS.map((tree, i) => {
        const c = TREE_COLORS[tree.colorIdx]
        const s = tree.scale ?? 1
        return (
          <group
            key={i}
            position={[tree.x, 0, tree.z]}
            rotation={[tree.leanX, tree.leanY, 0]}
            scale={[s, s, s]}
          >
            <mesh position={[0, tree.trunkH / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[tree.trunkW, tree.trunkH, tree.trunkW]} />
              <meshStandardMaterial color={DARK_GREEN_DARK} roughness={0.95} />
            </mesh>
            {tree.shape === 0 && (
              <mesh position={[0, tree.trunkH + 0.28, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.6, 0.55, 0.6]} />
                <meshStandardMaterial color={c} roughness={0.88 + (i % 5) * 0.02} />
              </mesh>
            )}
            {tree.shape === 1 && (
              <>
                <mesh position={[0, tree.trunkH + 0.22, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.65, 0.35, 0.65]} />
                  <meshStandardMaterial color={c} roughness={0.88 + (i % 5) * 0.02} />
                </mesh>
                <mesh position={[0, tree.trunkH + 0.52, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.5, 0.28, 0.5]} />
                  <meshStandardMaterial color={DARK_GREEN_MID} roughness={0.9} />
                </mesh>
              </>
            )}
            {tree.shape === 2 && (
              <mesh position={[0, tree.trunkH + 0.4, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.5, 0.75, 0.5]} />
                <meshStandardMaterial color={c} roughness={0.88 + (i % 5) * 0.02} />
              </mesh>
            )}
            {tree.shape === 3 && (
              <>
                <mesh position={[0, tree.trunkH + 0.2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.55, 0.4, 0.55]} />
                  <meshStandardMaterial color={c} roughness={0.88 + (i % 5) * 0.02} />
                </mesh>
                <mesh position={[0, tree.trunkH + 0.48, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.4, 0.32, 0.4]} />
                  <meshStandardMaterial color={DARK_GREEN_MID} roughness={0.9} />
                </mesh>
              </>
            )}
            {tree.shape === 4 && (
              <mesh position={[0, tree.trunkH + 0.35, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.7, 0.45, 0.7]} />
                <meshStandardMaterial color={c} roughness={0.88 + (i % 5) * 0.02} />
              </mesh>
            )}
            {tree.shape === 5 && (
              <>
                <mesh position={[0, tree.trunkH + 0.25, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.45, 0.5, 0.45]} />
                  <meshStandardMaterial color={c} roughness={0.88 + (i % 5) * 0.02} />
                </mesh>
                <mesh position={[0, tree.trunkH + 0.55, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.35, 0.3, 0.35]} />
                  <meshStandardMaterial color={DARK_GREEN_MID} roughness={0.9} />
                </mesh>
              </>
            )}
          </group>
        )
      })}
    </group>
  )
}

// Seating area: 2–3 clusters between mixed-use & hospital (green space)
const SEAT_WOOD = '#8b7355'
const SEAT_GREY = '#7a7a7a'
const SEATING_CLUSTERS = [
  { x: -3, z: -2.5, seats: [[0, 0, 0], [0.5, 0, 0.4], [-0.35, 0, -0.3]], light: true, tree: true },
  { x: 0, z: -2.7, seats: [[0, 0, 0], [-0.45, 0, 0.35]], light: true, tree: false },
  { x: 2.8, z: -2.4, seats: [[0, 0, 0], [0.4, 0, -0.35], [0.2, 0, 0.45]], light: false, tree: true },
]
function SeatingArea() {
  return (
    <group>
      {SEATING_CLUSTERS.map((cluster, ci) => (
        <group key={ci} position={[cluster.x, 0, cluster.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
            <circleGeometry args={[1.4, 16]} />
            <meshStandardMaterial color="#2a332a" roughness={0.95} metalness={0} />
          </mesh>
          {cluster.seats.map(([sx, sy, sz], si) => (
            <group key={si} position={[sx, 0, sz]} rotation={[0, (si * 0.4 - 0.3) * Math.PI, 0]}>
              <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.5, 0.15, 0.35]} />
                <meshStandardMaterial color={si % 2 ? SEAT_GREY : SEAT_WOOD} roughness={0.88} />
              </mesh>
              <mesh position={[0, 0.55, -0.12]} castShadow receiveShadow>
                <boxGeometry args={[0.48, 0.5, 0.08]} />
                <meshStandardMaterial color={si % 2 ? SEAT_GREY : SEAT_WOOD} roughness={0.88} />
              </mesh>
            </group>
          ))}
          {cluster.light && (
            <group position={[0.7, 0, 0.5]}>
              <mesh position={[0, 0.4, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.05, 0.8, 8]} />
                <meshStandardMaterial color={CHARCOAL} roughness={0.85} />
              </mesh>
              <mesh position={[0, 0.85, 0]} castShadow>
                <sphereGeometry args={[0.12, 8, 6]} />
                <meshStandardMaterial color="#e8e0c0" emissive="#e8e0c0" emissiveIntensity={0.15} roughness={0.7} />
              </mesh>
            </group>
          )}
          {cluster.tree && (
            <group position={[-0.6, 0, -0.5]}>
              <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.1, 0.5, 0.1]} />
                <meshStandardMaterial color={DARK_GREEN_DARK} roughness={0.95} />
              </mesh>
              <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.4, 0.35, 0.4]} />
                <meshStandardMaterial color={DARK_GREEN_LEAF} roughness={0.88} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  )
}

const SKY_NIGHT = new THREE.Color('#0d1219')
const SKY_DAY = new THREE.Color('#7EC8FF')
const FOAM_RING1_NIGHT = new THREE.Color('#e8f4ff')
const FOAM_RING1_DAY = new THREE.Color('#b8dcff')
const FOAM_RING2_NIGHT = new THREE.Color('#dceef8')
const FOAM_RING2_DAY = new THREE.Color('#a8d8ff')
const WATER_STREAK_NIGHT = new THREE.Color('#a0b0c8')
const WATER_STREAK_DAY = new THREE.Color('#fff8e0')
const CLOUD_NIGHT = new THREE.Color('#e8eaf0')
const CLOUD_DAY = new THREE.Color('#f5f8ff')
function SkyGradient() {
  const { themeBlendRef } = useTheme()
  const domeRef = useRef()
  const horizonRef = useRef()
  useFrame(() => {
    const b = themeBlendRef.current
    if (domeRef.current?.material) {
      domeRef.current.material.color.lerpColors(SKY_NIGHT, SKY_DAY, b)
      domeRef.current.material.opacity = 0.7 - 0.2 * b
    }
    if (horizonRef.current?.material) horizonRef.current.material.opacity = b * 0.5
  })
  return (
    <group renderOrder={-10}>
      <mesh ref={domeRef} position={[0, 0, 0]} scale={[80, 80, 80]} renderOrder={-10}>
        <sphereGeometry args={[1, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#0d1219" transparent opacity={0.7} side={THREE.BackSide} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh ref={horizonRef} position={[0, 2, -40]} scale={[100, 12, 1]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-10}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#FFE3A1" transparent opacity={0} depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// Sun as character: bright core, glow rings, subtle prismatic rays
const SUN_CORE = '#FFD76A'
const RAY_COLORS = ['#ffb380', '#ffd080', '#ffe080', '#e8f0a0', '#c0e8ff', '#b0c8ff', '#d0b0ff', '#f0c0d0']

function SunAndRays({ onArchitectClick }) {
  const { themeBlendRef } = useTheme()
  const groupRef = useRef()
  const innerRef = useRef()
  const [hovered, setHovered] = useState(false)
  useCursor(hovered, 'pointer', 'auto')
  const ringCount = 3
  const rayCount = 8
  const scaleTarget = useRef(1)
  useFrame((state) => {
    if (!groupRef.current) return
    const b = themeBlendRef.current
    const t = state.clock.elapsedTime
    groupRef.current.visible = b > 0.05
    scaleTarget.current = hovered ? 1.06 : 1
    if (innerRef.current) {
      innerRef.current.scale.lerp(new THREE.Vector3(scaleTarget.current, scaleTarget.current, scaleTarget.current), 0.15)
    }
    const breath = 1 + 0.04 * Math.sin(t * 0.4)
    const inner = innerRef.current
    if (inner) {
      let ringIdx = 0
      let rayIdx = 0
      inner.children.forEach((child) => {
        if (!child.isMesh || !child.material) return
        const g = child.geometry
        if (g?.type === 'SphereGeometry') {
          child.material.opacity = b * 0.95
        } else if (g?.type === 'RingGeometry') {
          const params = g.parameters
          if (params?.innerRadius === 3.75 && params?.outerRadius === 4.1) return
          const ringScale = 0.92 + (ringIdx / ringCount) * 0.08 * breath
          child.material.opacity = b * 0.12 * ringScale * (1.1 - ringIdx * 0.25)
          ringIdx++
        } else if (g?.type === 'PlaneGeometry') {
          child.material.opacity = b * (0.04 + 0.02 * Math.sin(t * 0.3 + rayIdx))
          rayIdx++
        }
      })
    }
    groupRef.current.rotation.y = t * 0.015
  })
  return (
    <group ref={groupRef} position={[12, 20, -28]} visible={false}>
      <group ref={innerRef}>
        <mesh
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
          onPointerOut={() => setHovered(false)}
          onClick={(e) => { e.stopPropagation(); onArchitectClick?.() }}
        >
          <sphereGeometry args={[3.5, 24, 24]} />
          <meshBasicMaterial color={hovered ? '#FFE066' : SUN_CORE} transparent opacity={0.95} depthWrite={false} />
        </mesh>
        {hovered && (
          <mesh raycast={() => null}>
            <ringGeometry args={[3.75, 4.1, 32]} />
            <meshBasicMaterial color={SUN_CORE} transparent opacity={0.45} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        )}
        {Array.from({ length: ringCount }).map((_, i) => (
          <mesh key={`ring-${i}`} position={[0, 0, 0]}>
            <ringGeometry args={[4 + i * 2.5, 4.5 + i * 2.5, 32]} />
            <meshBasicMaterial color={SUN_CORE} transparent opacity={0.15} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
        {Array.from({ length: rayCount }).map((_, i) => (
          <mesh key={`ray-${i}`} position={[0, 0, 0]} rotation={[0, (i / rayCount) * Math.PI * 2, 0]}>
            <planeGeometry args={[22, 0.5]} />
            <meshBasicMaterial
              color={RAY_COLORS[i % RAY_COLORS.length]}
              transparent
              opacity={0.05}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// Horizon: 360° cylindrical silhouette so no flat “walls” from any angle
const MOUNTAIN_LAYER_Z = [-95, -120, -150, -185]
const MOUNTAIN_LAYER_SCALE = [[0.92, 0.28], [1.0, 0.32], [1.18, 0.38], [1.4, 0.45]]
const MOUNTAIN_NIGHT_COLORS = ['#3d2e24', '#4a3a2e', '#5c4838', '#6b5544']
const MOUNTAIN_DAY_COLORS = ['#5c4a3a', '#6b5848', '#7d6b58', '#8f7d6a']

function buildJaggedRidgeGeometry(width, height, segW, segH, seed) {
  const g = new THREE.PlaneGeometry(width, height, segW, segH)
  const pos = g.attributes.position
  const rng = mulberry32(seed)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const t = y + 0.5
    const amp = 5 * (0.35 * Math.sin(x * 0.08) + 0.45 * Math.sin(x * 0.14 + 2 + rng() * 4) + 0.2 * Math.sin(x * 0.05 + rng() * 6) + 0.15 * (rng() - 0.5))
    pos.setY(i, y + t * amp)
  }
  g.computeVertexNormals()
  return g
}

const MOUNTAIN_GEOMS = [401, 402, 403, 404].map((s) => buildJaggedRidgeGeometry(200, 40, 72, 28, s))

const MOUNTAIN_LERP_NIGHT = MOUNTAIN_NIGHT_COLORS.map((c) => new THREE.Color(c))
const MOUNTAIN_LERP_DAY = MOUNTAIN_DAY_COLORS.map((c) => new THREE.Color(c))

function LayeredMountainRidges() {
  const { themeBlendRef } = useTheme()
  const matRefs = useRef([])
  useFrame(() => {
    const b = themeBlendRef.current
    matRefs.current.forEach((mat, i) => {
      if (!mat) return
      mat.color.lerpColors(MOUNTAIN_LERP_NIGHT[i], MOUNTAIN_LERP_DAY[i], b)
    })
  })
  return (
    <group position={[0, 2, 0]} renderOrder={-8}>
      {MOUNTAIN_LAYER_Z.map((z, i) => (
        <mesh
          key={i}
          position={[0, i * -0.8, z]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[MOUNTAIN_LAYER_SCALE[i][0], MOUNTAIN_LAYER_SCALE[i][1], 1]}
          geometry={MOUNTAIN_GEOMS[i]}
          receiveShadow
        >
          <meshStandardMaterial
            ref={(el) => { if (el) matRefs.current[i] = el }}
            color={MOUNTAIN_NIGHT_COLORS[i]}
            roughness={0.95}
            metalness={0}
            transparent={false}
            opacity={1}
            depthWrite={true}
            side={THREE.FrontSide}
          />
        </mesh>
      ))}
    </group>
  )
}

function HorizonSilhouettes() {
  return null
}

// Clouds: more coverage, 3 types (small fast high, medium slow, large slow), varied scale/height/opacity/speed, soft parallax
function CloudLayer() {
  const { themeBlendRef } = useTheme()
  const groupRef = useRef()
  const clouds = useMemo(() => {
    const rng = mulberry32(201)
    const list = []
    for (let i = 0; i < 28; i++) {
      const type = i % 3
      let size, y, speed, opacity
      if (type === 0) {
        size = 0.5 + rng() * 0.35
        y = 14 + rng() * 2.2
        speed = 0.0018 + rng() * 0.001
        opacity = 0.28 + rng() * 0.15
      } else if (type === 1) {
        size = 0.9 + rng() * 0.4
        y = 11 + rng() * 1.8
        speed = 0.0006 + rng() * 0.0004
        opacity = 0.35 + rng() * 0.18
      } else {
        size = 1.35 + rng() * 0.45
        y = 9 + rng() * 1.5
        speed = 0.0003 + rng() * 0.0002
        opacity = 0.4 + rng() * 0.2
      }
      const angle = (i / 28) * Math.PI * 2 + rng() * 0.4
      const radius = 22 + rng() * 10
      list.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        y,
        size,
        speed,
        opacity,
        seed: i * 7,
      })
    }
    return list
  }, [])
  useFrame((state) => {
    if (!groupRef.current) return
    const b = themeBlendRef.current
    const t = state.clock.elapsedTime
    groupRef.current.children.forEach((child, i) => {
      const c = clouds[i]
      if (!c) return
      child.rotation.y = t * c.speed
      child.position.y = c.y + Math.sin(t * 0.02 + c.seed) * 0.15
      if (child.children[0]?.material) {
        const baseOpacity = c.opacity * (0.5 + 0.5 * b)
        child.children[0].material.opacity = baseOpacity
        child.children[0].material.color.lerpColors(CLOUD_NIGHT, CLOUD_DAY, b)
      }
    })
  })
  return (
    <group ref={groupRef}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={[c.size, c.size * 0.45, c.size]}>
          <mesh>
            <boxGeometry args={[1.2, 0.5, 1.2]} />
            <meshBasicMaterial color="#e8eaf0" transparent opacity={c.opacity} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Morning bird flocks — 5 groups, spaced-out black birds, different paths, day-only (lighter for performance)
const BIRDS_PER_FLOCK = 10
const BIRD_SPREAD = 4.5
const BIRD_FLOCKS = [
  { cx: 20, cy: 9, cz: 0, r: 5, speed: 0.06 },
  { cx: 0, cy: 11, cz: -10, r: 6, speed: -0.05 },
  { cx: -15, cy: 13, cz: -5, r: 4, speed: 0.055 },
  { cx: 12, cy: 8, cz: 8, r: 5.5, speed: -0.048 },
  { cx: -8, cy: 14, cz: -15, r: 4.5, speed: 0.052 },
]
const BIRD_OFFSETS = (() => {
  const rng = mulberry32(77)
  return BIRD_FLOCKS.map(() =>
    Array.from({ length: BIRDS_PER_FLOCK }, () => ({
      dx: (rng() - 0.5) * BIRD_SPREAD,
      dz: (rng() - 0.5) * BIRD_SPREAD,
    }))
  )
})()

function BirdFlock() {
  const { themeBlendRef } = useTheme()
  const refs = useRef([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const b = themeBlendRef.current
    const isDay = b > 0.25
    BIRD_FLOCKS.forEach((flock, fi) => {
      const g = refs.current[fi]
      if (!g) return
      g.visible = isDay
      if (!isDay) return
      const angle = t * flock.speed + fi * 2
      const swoop = 0.2 * Math.sin(t * 0.5 + fi) * (fi % 2 === 0 ? 1 : -1)
      g.position.set(
        flock.cx + Math.cos(angle) * flock.r,
        flock.cy + Math.sin(angle * 0.7) * 0.3 + swoop,
        flock.cz + Math.sin(angle) * flock.r
      )
      g.rotation.y = -angle + Math.PI / 2
    })
  })
  return (
    <>
      {BIRD_FLOCKS.map((_, fi) => (
        <group key={fi} ref={(el) => (refs.current[fi] = el)}>
          {BIRD_OFFSETS[fi].map((off, bi) => (
            <mesh key={bi} position={[off.dx, 0, off.dz]}>
              <boxGeometry args={[0.12, 0.06, 0.22]} />
              <meshBasicMaterial color="#0a0a0a" depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

// Low-poly flyover plane: fuselage (tapered), wings, tail fin, tail wings. Scale 1.5, length 8*1.25, wingspan 10. Night lights: red left, green right, white tail.
const PLANE_BODY = '#8a8f94'
const PLANE_SCALE = 0.25
const PLANE_L = 8 * 1.25
const PLANE_W = 1.2
const PLANE_H = 1.5
const WING_SPAN = 10
const LIGHT_RED = '#c0392b'
const LIGHT_GREEN = '#27ae60'
const LIGHT_WHITE = '#f5f8ff'
function FlyoverPlane() {
  const planeRef = useRef()
  const redRef = useRef()
  const greenRef = useRef()
  const whiteRef = useRef()
  useFrame((state) => {
    if (!planeRef.current) return
    const t = state.clock.elapsedTime * 0.04
    const r = 30
    planeRef.current.position.set(Math.cos(t) * r, 13 + Math.sin(t * 2) * 0.3, Math.sin(t) * r)
    planeRef.current.lookAt(0, 8, 0)
    const time = state.clock.elapsedTime
    const blink = 1.5 + Math.sin(time * 4) * 1
    if (redRef.current?.material) redRef.current.material.emissiveIntensity = Math.max(0, blink)
    if (greenRef.current?.material) greenRef.current.material.emissiveIntensity = Math.max(0, blink * 0.9)
    if (whiteRef.current?.material) whiteRef.current.material.emissiveIntensity = Math.max(0, 0.8 + Math.sin(time * 5) * 0.7)
  })
  return (
    <group ref={planeRef} scale={[PLANE_SCALE, PLANE_SCALE, PLANE_SCALE]}>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
        <circleGeometry args={[2.2, 16]} />
        <meshBasicMaterial color="#0a0a0a" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      {/* Fuselage: long axis Z */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[PLANE_W, PLANE_H * 0.5, PLANE_L]} />
        <meshStandardMaterial color={PLANE_BODY} metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0, PLANE_L * 0.35]}>
        <boxGeometry args={[PLANE_W * 0.85, PLANE_H * 0.4, PLANE_L * 0.4]} />
        <meshStandardMaterial color={PLANE_BODY} metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0, -PLANE_L * 0.42]}>
        <boxGeometry args={[PLANE_W * 0.7, PLANE_H * 0.35, PLANE_L * 0.2]} />
        <meshStandardMaterial color={PLANE_BODY} metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Wings: long axis X (left/right) */}
      <mesh position={[0, -PLANE_H * 0.1, 0]}>
        <boxGeometry args={[WING_SPAN, 0.12, PLANE_L * 0.4]} />
        <meshStandardMaterial color={PLANE_BODY} metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, PLANE_H * 0.35, -PLANE_L * 0.42]}>
        <boxGeometry args={[0.08, PLANE_H * 1.1, PLANE_W * 0.6]} />
        <meshStandardMaterial color={PLANE_BODY} metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[0, PLANE_H * 0.2, -PLANE_L * 0.42]}>
        <boxGeometry args={[PLANE_W * 1.8, 0.06, PLANE_L * 0.25]} />
        <meshStandardMaterial color={PLANE_BODY} metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh ref={redRef} position={[-WING_SPAN * 0.5 * 0.4, 0.02, 0]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color={LIGHT_RED} emissive={LIGHT_RED} emissiveIntensity={1.5} roughness={0.6} />
      </mesh>
      <mesh ref={greenRef} position={[WING_SPAN * 0.5 * 0.4, 0.02, 0]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color={LIGHT_GREEN} emissive={LIGHT_GREEN} emissiveIntensity={1.5} roughness={0.6} />
      </mesh>
      <mesh ref={whiteRef} position={[0, PLANE_H * 0.5, PLANE_L * 0.48]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshStandardMaterial color={LIGHT_WHITE} emissive={LIGHT_WHITE} emissiveIntensity={1.2} roughness={0.5} />
      </mesh>
    </group>
  )
}

// Two satellites: slow orbit ring around island, high in sky. Low-poly body + 2 panels.
const SATELLITE_ORBIT_RADIUS = 38
const SATELLITE_ORBIT_Y = 26
const SATELLITE_ORBIT_SPEED = 0.012
function Satellites() {
  const g1 = useRef()
  const g2 = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (g1.current) {
      const a1 = t * SATELLITE_ORBIT_SPEED
      g1.current.position.set(Math.cos(a1) * SATELLITE_ORBIT_RADIUS, SATELLITE_ORBIT_Y, Math.sin(a1) * SATELLITE_ORBIT_RADIUS)
      g1.current.lookAt(0, 8, 0)
    }
    if (g2.current) {
      const a2 = t * SATELLITE_ORBIT_SPEED + Math.PI
      g2.current.position.set(Math.cos(a2) * SATELLITE_ORBIT_RADIUS, SATELLITE_ORBIT_Y, Math.sin(a2) * SATELLITE_ORBIT_RADIUS)
      g2.current.lookAt(0, 8, 0)
    }
  })
  return (
    <>
      <group ref={g1}>
        <mesh>
          <boxGeometry args={[0.25, 0.12, 0.4]} />
          <meshStandardMaterial color="#a0a8b0" metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[0.22, 0, 0]}>
          <boxGeometry args={[0.5, 0.02, 0.35]} />
          <meshStandardMaterial color="#8899aa" metalness={0.3} roughness={0.7} />
        </mesh>
        <mesh position={[-0.22, 0, 0]}>
          <boxGeometry args={[0.5, 0.02, 0.35]} />
          <meshStandardMaterial color="#8899aa" metalness={0.3} roughness={0.7} />
        </mesh>
      </group>
      <group ref={g2}>
        <mesh>
          <boxGeometry args={[0.22, 0.1, 0.35]} />
          <meshStandardMaterial color="#9a9ca8" metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[0.2, 0, 0]}>
          <boxGeometry args={[0.45, 0.02, 0.3]} />
          <meshStandardMaterial color="#7a8a9a" metalness={0.3} roughness={0.7} />
        </mesh>
        <mesh position={[-0.2, 0, 0]}>
          <boxGeometry args={[0.45, 0.02, 0.3]} />
          <meshStandardMaterial color="#7a8a9a" metalness={0.3} roughness={0.7} />
        </mesh>
      </group>
    </>
  )
}

// Population zones: A) Airport (small), B) City core, C) Beach, D) Micro-scatter. Varied colors, scale 0.9–1.1, head rotation. Never cluster, never grid-align.
const PEDESTRIAN_COLORS = ['#a85a5a', '#2c3e6a', '#2d5a3d', '#c9a227', '#b0b0b0', '#6b4c3d', '#f0ebe0', '#8b7355', '#5a4a3a']
function Person({ color, scale = 1, headRotY = 0, headRotX = 0 }) {
  return (
    <group scale={[scale, scale, scale]}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[0.22, 0.45, 0.12]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <group position={[0, 0.78, 0]} rotation={[headRotX, headRotY, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 0.26, 0.22]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      </group>
    </group>
  )
}
const MIN_PERSON_DIST = 0.8
function personDist(a, b) { return Math.hypot(a.x - b.x, a.z - b.z) }
function filterPeopleMinDist(list, minD, existing = []) {
  const out = []
  for (const p of list) {
    if (out.some((q) => personDist(p, q) < minD)) continue
    if (existing.some((q) => personDist(p, q) < minD)) continue
    out.push(p)
  }
  return out
}
// People between control tower and terminals (apron), not on track. RUNWAY_WORLD z 13.5–20.5 — keep z < 13.5
const _rawAirport = [
  { x: -8, z: 12.2, color: 0, scale: 1.02, headRotY: 0.1 }, { x: -5.5, z: 11.8, color: 2, scale: 0.95, headRotY: -0.08 },
  { x: -3, z: 12.4, color: 5, scale: 1.08, headRotY: 0.05 }, { x: 0, z: 11.5, color: 1, scale: 0.98 }, { x: -6, z: 12.8, color: 3, scale: 1.0 },
  { x: -4, z: 11.2, color: 4, scale: 0.92, headRotY: 0.2 }, { x: -1.5, z: 12, color: 6, scale: 0.96 },
]
const _rawCity = [
  { x: -6.4, z: -2.1, color: 1, scale: 1.05, headRotY: -0.1 }, { x: -7.5, z: -2.8, color: 6, scale: 0.93 },
  { x: 2.2, z: 1.8, color: 2, scale: 0.97 }, { x: -1.8, z: 2.1, color: 4, scale: 1.02, headRotY: 0.12 },
  { x: 6.3, z: -2.2, color: 0, scale: 0.96, headRotY: -0.05 }, { x: 5.8, z: -3.0, color: 5, scale: 1.04 },
  { x: -0.5, z: -2.4, color: 3, scale: 0.99 }, { x: 1.2, z: -2.9, color: 7, scale: 1.01, headRotY: 0.08 },
  { x: -5.8, z: -1.8, color: 0, scale: 0.97 }, { x: 3.5, z: 0.5, color: 5, scale: 1.02 }, { x: -2.5, z: -3.2, color: 2, scale: 0.94 },
  { x: -4.2, z: -2.5, color: 3, scale: 0.98 }, { x: 4.2, z: -1.5, color: 6, scale: 0.95, headRotY: -0.1 }, { x: 0.8, z: 0.8, color: 1, scale: 1.0 },
  { x: -3.2, z: 1.2, color: 4, scale: 0.93 }, { x: 5.2, z: -0.5, color: 7, scale: 0.97 },
]
// One person under the lighthouse (beach)
const _rawBeach = [
  { x: 15.5, z: 5.8, color: 2, scale: 1.0, headRotY: 0.15 },
]
const _rawScatter = [
  { x: 2.5, z: -5, color: 3, scale: 0.91, headRotY: -0.2 }, { x: -5.5, z: 3.5, color: 7, scale: 1.06 }, { x: 11, z: -1, color: 2, scale: 0.95, headRotY: 0.15 },
  { x: 0, z: -6, color: 1, scale: 0.93 }, { x: -3, z: 4, color: 4, scale: 1.0 },
  { x: 4, z: -4, color: 0, scale: 0.96 }, { x: -7, z: 2, color: 6, scale: 0.94 }, { x: 9, z: 2, color: 3, scale: 1.0, headRotY: -0.12 },
]
const AIRPORT_PEOPLE = filterPeopleMinDist(_rawAirport, MIN_PERSON_DIST)
const CITY_PEOPLE = filterPeopleMinDist(_rawCity, MIN_PERSON_DIST, AIRPORT_PEOPLE)
const BEACH_PEOPLE = filterPeopleMinDist(_rawBeach, MIN_PERSON_DIST, [...AIRPORT_PEOPLE, ...CITY_PEOPLE])
const SCATTER_PEOPLE = filterPeopleMinDist(_rawScatter, MIN_PERSON_DIST, [...AIRPORT_PEOPLE, ...CITY_PEOPLE, ...BEACH_PEOPLE])
const PEDESTRIAN_PATHS = [
  { start: [4, 12], end: [4, 15.5], speed: 0.028 },
  { start: [3, 14], end: [4.5, 15], speed: 0.035 },
  { start: [-6, -2], end: [-5.5, 1.5], speed: 0.022 },
  { start: [6, -3], end: [2, 2], speed: 0.032 },
  { start: [-0.5, -2.5], end: [1, -2.2], speed: 0.038 },
  { start: [-8, 7], end: [-9.5, 7.8], speed: 0.025 },
  { start: [-4, -3], end: [-2, 0], speed: 0.03 },
  { start: [2, 1], end: [5, -1], speed: 0.042 },
  { start: [8, 5], end: [11, 2], speed: 0.02 },
  { start: [-10, 3], end: [-7, 5], speed: 0.034 },
  { start: [0, -5], end: [3, -4], speed: 0.046 },
  { start: [10, -2], end: [7, 1], speed: 0.026 },
]
const PEDESTRIAN_PATH_COLORS = [0, 2, 4, 1, 6, 3, 5, 0, 2, 4, 1, 6]
const PEDESTRIAN_PATH_SCALES = [0.98, 1.05, 0.92, 1.02, 0.96, 1.0, 0.94, 1.03, 0.97, 1.01, 0.99, 0.95]
function PeopleWalking() {
  const refs = useRef([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    PEDESTRIAN_PATHS.forEach((path, i) => {
      const g = refs.current[i]
      if (!g) return
      const phase = (t * path.speed + i * 3) % 1
      const x = path.start[0] + (path.end[0] - path.start[0]) * phase
      const z = path.start[1] + (path.end[1] - path.start[1]) * phase
      g.position.set(x, 0, z)
    })
  })
  return (
    <>
      {AIRPORT_PEOPLE.map((p, i) => (
        <group key={`a-${i}`} position={[p.x, 0, p.z]}>
          <Person color={PEDESTRIAN_COLORS[p.color]} scale={p.scale} headRotY={p.headRotY ?? 0} headRotX={p.headRotX ?? 0} />
        </group>
      ))}
      {CITY_PEOPLE.map((p, i) => (
        <group key={`c-${i}`} position={[p.x, 0, p.z]}>
          <Person color={PEDESTRIAN_COLORS[p.color]} scale={p.scale} headRotY={p.headRotY ?? 0} headRotX={p.headRotX ?? 0} />
        </group>
      ))}
      {BEACH_PEOPLE.map((p, i) => (
        <group key={`b-${i}`} position={[p.x, 0, p.z]}>
          <Person color={PEDESTRIAN_COLORS[p.color]} scale={p.scale} headRotY={p.headRotY ?? 0} headRotX={p.headRotX ?? 0} />
        </group>
      ))}
      {SCATTER_PEOPLE.map((p, i) => (
        <group key={`s-${i}`} position={[p.x, 0, p.z]}>
          <Person color={PEDESTRIAN_COLORS[p.color]} scale={p.scale} headRotY={p.headRotY ?? 0} headRotX={p.headRotX ?? 0} />
        </group>
      ))}
      {PEDESTRIAN_PATHS.map((path, i) => (
        <group key={`w-${i}`} ref={(el) => (refs.current[i] = el)}>
          <Person color={PEDESTRIAN_COLORS[PEDESTRIAN_PATH_COLORS[i]]} scale={PEDESTRIAN_PATH_SCALES[i]} />
        </group>
      ))}
    </>
  )
}

// Car types: varied size and color. Length (d) ~+50% so cars read as longer.
const CAR_TYPES = [
  { w: 0.48, h: 0.18, d: 0.56, cabH: 0.14, cabD: 0.38, color: '#c0392b' },
  { w: 0.52, h: 0.2, d: 0.6, cabH: 0.15, cabD: 0.4, color: '#ecf0f1' },
  { w: 0.58, h: 0.22, d: 0.64, cabH: 0.16, cabD: 0.42, color: '#2980b9' },
  { w: 0.55, h: 0.2, d: 0.72, cabH: 0.15, cabD: 0.36, color: '#bdc3c7' },
  { w: 0.54, h: 0.21, d: 0.68, cabH: 0.16, cabD: 0.32, color: '#27ae60' },
  { w: 0.45, h: 0.16, d: 0.52, cabH: 0.12, cabD: 0.34, color: '#6c3483' },
  { w: 0.5, h: 0.19, d: 0.6, cabH: 0.14, cabD: 0.38, color: '#1a5276' },
  { w: 0.56, h: 0.2, d: 0.64, cabH: 0.15, cabD: 0.4, color: '#d35400' },
]
const CAR_PATHS_FULL = [
  { start: [-11, 8], end: [11, 8], speed: 0.026 },
  { start: [11, 8], end: [11, -12], speed: 0.024 },
  { start: [11, -12], end: [-11, -12], speed: 0.026 },
  { start: [-11, -12], end: [-11, 8], speed: 0.024 },
  { start: [-11, 4], end: [11, 4], speed: 0.028 },
  { start: [-11, -5], end: [11, -5], speed: 0.028 },
  { start: [-6, -5], end: [-6, 4], speed: 0.025 },
  { start: [6, -5], end: [6, 4], speed: 0.025 },
  { start: [11, 4], end: [-11, 4], speed: 0.027 },
  { start: [-11, 0], end: [-6, 0], speed: 0.022 },
]
const CAR_PATHS = CAR_PATHS_FULL.slice(0, 10)
const CAR_UPDATE_INTERVAL = 1 / 25
function CarsMoving() {
  const lhWorld = useLighthouseWorld()
  const refs = useRef([])
  const acc = useRef(0)
  useFrame((state, delta) => {
    acc.current += delta
    if (acc.current < CAR_UPDATE_INTERVAL) return
    acc.current = 0
    const t = state.clock.elapsedTime
    const speedMult = lhWorld?.chaosMode ? 2 : 1
    CAR_PATHS.forEach((path, i) => {
      const g = refs.current[i]
      if (!g) return
      const raw = (t * path.speed * speedMult + i * 0.2) % 2
      let x, z, dx, dz
      if (raw <= 1) {
        x = path.start[0] + (path.end[0] - path.start[0]) * raw
        z = path.start[1] + (path.end[1] - path.start[1]) * raw
        dx = path.end[0] - path.start[0]
        dz = path.end[1] - path.start[1]
      } else {
        const back = raw - 1
        x = path.end[0] + (path.start[0] - path.end[0]) * back
        z = path.end[1] + (path.start[1] - path.end[1]) * back
        dx = path.start[0] - path.end[0]
        dz = path.start[1] - path.end[1]
      }
      g.position.set(x, 0, z)
      g.rotation.y = Math.atan2(-dx, dz)
    })
  })
  return (
    <>
      {CAR_PATHS.map((_, i) => {
        const type = CAR_TYPES[i % CAR_TYPES.length]
        return (
          <group key={i} ref={(el) => (refs.current[i] = el)}>
            <mesh position={[0, type.h / 2, 0]} castShadow>
              <boxGeometry args={[type.w, type.h, type.d]} />
              <meshStandardMaterial color={type.color} roughness={0.78} />
            </mesh>
            <mesh position={[0, type.h + type.cabH / 2, type.d * 0.08]} castShadow>
              <boxGeometry args={[type.w * 0.85, type.cabH, type.cabD]} />
              <meshStandardMaterial color={MOONLIGHT} transparent opacity={0.6} />
            </mesh>
            <mesh position={[0.12, type.h * 0.6, type.d * 0.48]} castShadow>
              <boxGeometry args={[0.06, 0.04, 0.03]} />
              <meshStandardMaterial color="#e8d4a8" emissive="#e8d4a8" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[-0.12, type.h * 0.6, type.d * 0.48]} castShadow>
              <boxGeometry args={[0.06, 0.04, 0.03]} />
              <meshStandardMaterial color="#e8d4a8" emissive="#e8d4a8" emissiveIntensity={0.5} />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

// Train: full loop ~45s. Path length ~80 units → speed = 80/45
// NOTE: Train and station were removed per design update.

// Wraparound background: silhouette city from ALL angles (cylinder + rings)
function WraparoundBackground() {
  const segments = 32
  const blocksPerRing = 24
  const rings = useMemo(
    () => [
      { radius: 42, yOffset: 0, scale: 1, opacity: 0.5 },
      { radius: 48, yOffset: 2, scale: 1.1, opacity: 0.35 },
      { radius: 54, yOffset: -1, scale: 1.2, opacity: 0.2 },
    ],
    [],
  )

  const blockData = useMemo(() => {
    const out = []
    for (let ring = 0; ring < rings.length; ring++) {
      const r = rings[ring]
      for (let i = 0; i < blocksPerRing; i++) {
        const angle = (i / blocksPerRing) * Math.PI * 2
        const w = 1.2 + (i % 3) * 0.5
        const h = 3 + (i % 5) * 1.5
        out.push({
          ring,
          angle,
          radius: r.radius,
          x: Math.cos(angle) * r.radius,
          z: Math.sin(angle) * r.radius,
          w,
          h,
          yOff: r.yOffset,
          scale: r.scale,
          opacity: r.opacity,
        })
      }
    }
    return out
  }, [rings])

  return (
    <group>
      {blockData.map((b, i) => (
        <mesh
          key={i}
          position={[b.x, b.h / 2 + b.yOff, b.z]}
          scale={[b.scale, b.scale, b.scale]}
        >
          <boxGeometry args={[b.w, b.h, 0.15]} />
          <meshBasicMaterial
            color={CHARCOAL}
            transparent
            opacity={b.opacity}
            depthWrite={false}
          />
        </mesh>
      ))}
      {blockData.slice(0, 16).map((b, i) => (
        <mesh
          key={`b2-${i}`}
          position={[
            Math.cos(b.angle + Math.PI / 4) * (b.radius + 3),
            b.h / 2 + b.yOff + 1,
            Math.sin(b.angle + Math.PI / 4) * (b.radius + 3),
          ]}
          scale={[b.scale * 0.8, b.scale * 0.8, 0.15]}
        >
          <boxGeometry args={[b.w * 0.9, b.h * 0.9, 0.1]} />
          <meshBasicMaterial
            color={CHARCOAL}
            transparent
            opacity={b.opacity * 0.7}
            depthWrite={false}
          />
        </mesh>
      ))}
      {/* Horizon fade — lifted so bottom never intersects water (y > 0) */}
      <mesh position={[0, 6, 0]} rotation={[0, 0, 0]} renderOrder={-10}>
        <cylinderGeometry args={[54, 58, 10, 64, 1, true]} />
        <meshBasicMaterial
          color="#1a2230"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    </group>
  )
}

// Distant mountains — 360° ring, earth brown, WIDER bases so they overlap into one solid range (no filler objects)
const MOUNTAIN_RADIUS = 72
const MOUNTAIN_COUNT = 12
const MOUNTAIN_EARTH_BROWNS = ['#8B7355', '#7D6B4F', '#7A6348', '#6B5B45', '#8A704C']
function BackgroundMountains() {
  const mountains = useMemo(() => {
    const out = []
    for (let i = 0; i < MOUNTAIN_COUNT; i++) {
      const angle = (i / MOUNTAIN_COUNT) * Math.PI * 2
      const x = Math.cos(angle) * MOUNTAIN_RADIUS
      const z = Math.sin(angle) * MOUNTAIN_RADIUS
      const height = 10 + (i % 5) * 3 + (i % 3) * 2
      const radius = 6.5 + (i % 3) * 1.2
      out.push({ x, z, height, radius, color: MOUNTAIN_EARTH_BROWNS[i % MOUNTAIN_EARTH_BROWNS.length] })
    }
    return out
  }, [])
  return (
    <group>
      {mountains.map((m, i) => (
        <mesh key={i} position={[m.x, m.height / 2, m.z]} castShadow receiveShadow>
          <coneGeometry args={[m.radius, m.height, 8]} />
          <meshStandardMaterial
            color={m.color}
            roughness={0.92}
            metalness={0.02}
            depthWrite={true}
            transparent={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// Atmospheric depth: soft mist at mountain base + gradient fade toward horizon
function MountainAtmosphere() {
  const { themeBlendRef } = useTheme()
  const meshRef = useRef()
  useFrame(() => {
    if (!meshRef.current?.material) return
    const day = themeBlendRef.current
    meshRef.current.material.opacity = 0.08 + 0.06 * (1 - day)
  })
  return (
    <group position={[0, 2, 0]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-5}>
        <ringGeometry args={[68, 78, 32]} />
        <meshBasicMaterial
          color="#8a7a6a"
          transparent
          opacity={0.1}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

// Subtle haze near a few peaks — soft drift, not solid objects
function MountainPeakHaze() {
  const refs = useRef([])
  const { themeBlendRef } = useTheme()
  const peaks = useMemo(() => {
    const out = []
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + 0.2
      out.push({ x: Math.cos(angle) * 72, z: Math.sin(angle) * 72, y: 14 + i * 0.5 })
    }
    return out
  }, [])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    refs.current.forEach((mesh, i) => {
      if (!mesh?.material) return
      mesh.material.opacity = 0.04 + 0.02 * Math.sin(t * 0.3 + i)
      mesh.position.y = peaks[i].y + Math.sin(t * 0.2 + i) * 0.3
    })
  })
  return (
    <group>
      {peaks.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => (refs.current[i] = el)}
          position={[p.x, p.y, p.z]}
          renderOrder={-4}
        >
          <sphereGeometry args={[4, 8, 6]} />
          <meshBasicMaterial
            color="#9a8a7a"
            transparent
            opacity={0.05}
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// Construction crane — intentional motion: rotate arm 2–3s → stop → hook down → pause → hook up → repeat. Night: 2–3 emissive lights with gentle flicker.
const CRANE_YELLOW = '#E8A317'
const CRANE_ORANGE = '#CC7A00'
const CRANE_ROTATE_DUR = 2.5
const CRANE_HOOK_DOWN_DUR = 1.2
const CRANE_PAUSE_DUR = 0.3
const CRANE_HOOK_UP_DUR = 1.2
const CRANE_CYCLE = CRANE_ROTATE_DUR + CRANE_HOOK_DOWN_DUR + CRANE_PAUSE_DUR + CRANE_HOOK_UP_DUR
function ConstructionCrane() {
  const armRef = useRef()
  const hookRef = useRef()
  const lightRefs = useRef([])
  const { themeBlendRef } = useTheme()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const cycleT = t % CRANE_CYCLE
    let armY = 0
    let hookY = -0.9
    if (cycleT < CRANE_ROTATE_DUR) {
      armY = (cycleT / CRANE_ROTATE_DUR) * 0.16 - 0.08
    } else if (cycleT < CRANE_ROTATE_DUR + CRANE_HOOK_DOWN_DUR) {
      armY = 0.08
      const p = (cycleT - CRANE_ROTATE_DUR) / CRANE_HOOK_DOWN_DUR
      hookY = -0.9 - p * 0.6
    } else if (cycleT < CRANE_ROTATE_DUR + CRANE_HOOK_DOWN_DUR + CRANE_PAUSE_DUR) {
      armY = 0.08
      hookY = -1.5
    } else {
      armY = 0.08
      const p = (cycleT - CRANE_ROTATE_DUR - CRANE_HOOK_DOWN_DUR - CRANE_PAUSE_DUR) / CRANE_HOOK_UP_DUR
      hookY = -1.5 + p * 0.6
    }
    if (armRef.current) armRef.current.rotation.y = armY
    if (hookRef.current) hookRef.current.position.y = hookY
    const night = 1 - themeBlendRef.current
    if (night > 0.1 && lightRefs.current.length) {
      const flicker = 0.7 + 0.3 * Math.sin(t * 1.8) * Math.sin(t * 2.3)
      lightRefs.current.forEach((mesh) => {
        if (mesh?.material) mesh.material.emissiveIntensity = night * flicker * 0.5
      })
    }
  })
  return (
    <group position={[15, 0, -15]}>
      {/* Foundation slab */}
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <boxGeometry args={[6, 0.4, 5]} />
        <meshStandardMaterial color="#3d3d3d" roughness={0.88} />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[2.2, 0.6, 2.2]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.85} />
      </mesh>
      {/* Tall tower — industrial yellow */}
      <mesh position={[0, 3.4, 0]} castShadow>
        <boxGeometry args={[0.7, 4, 0.7]} />
        <meshStandardMaterial color={CRANE_YELLOW} roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Night lights on tower (2) and arm (1) — emissiveIntensity updated in useFrame for flicker */}
      <mesh position={[0.35, 4.2, 0]} ref={(el) => { if (el) lightRefs.current[0] = el }}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#ffcc66" emissive="#ffcc66" emissiveIntensity={0} />
      </mesh>
      <mesh position={[-0.35, 2.8, 0]} ref={(el) => { if (el) lightRefs.current[1] = el }}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshStandardMaterial color="#ffcc66" emissive="#ffcc66" emissiveIntensity={0} />
      </mesh>
      {/* Long horizontal arm + counter arm + hook */}
      <group ref={armRef} position={[0, 5.4, 0]}>
        <mesh position={[2.5, 0, 0]} castShadow>
          <boxGeometry args={[5, 0.35, 0.5]} />
          <meshStandardMaterial color={CRANE_ORANGE} roughness={0.7} metalness={0.15} />
        </mesh>
        <mesh position={[1.5, 0.18, 0]} ref={(el) => { if (el) lightRefs.current[2] = el }}>
          <sphereGeometry args={[0.08, 6, 6]} />
          <meshStandardMaterial color="#ffdd77" emissive="#ffdd77" emissiveIntensity={0} />
        </mesh>
        <mesh position={[-2.5, 0, 0]} castShadow>
          <boxGeometry args={[5, 0.35, 0.5]} />
          <meshStandardMaterial color={CRANE_ORANGE} roughness={0.7} metalness={0.15} />
        </mesh>
        <group ref={hookRef} position={[3.2, -0.9, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.35, 1.2, 0.35]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
          </mesh>
        </group>
      </group>
      {/* Stacked bricks + materials */}
      <mesh position={[3.5, 0.5, 1]} castShadow>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color="#6B5344" roughness={0.9} />
      </mesh>
      <mesh position={[3.5, 1.4, 1]} castShadow>
        <boxGeometry args={[1, 0.9, 1]} />
        <meshStandardMaterial color="#5C4839" roughness={0.9} />
      </mesh>
      <mesh position={[4, 0.4, -0.5]} castShadow>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color="#5A4A3C" roughness={0.9} />
      </mesh>
    </group>
  )
}

// Blue water intersection glow where beam hits — night only, same sweep as beam
const LIGHTHOUSE_BEAM_SWEEP_SPEED = 0.4
const LIGHTHOUSE_BEAM_SWEEP_AMP = 0.25
const WATER_HIT_RADIUS = 30
function LighthouseWaterHit() {
  const { themeBlendRef } = useTheme()
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    const sweep = LIGHTHOUSE_BEAM_SWEEP_AMP * Math.sin(state.clock.elapsedTime * LIGHTHOUSE_BEAM_SWEEP_SPEED)
    const r = WATER_HIT_RADIUS
    ref.current.position.set(20 - Math.cos(sweep) * r, -0.38, -Math.sin(sweep) * r)
    const pulse = 0.5 + 0.2 * Math.sin(state.clock.elapsedTime * 2)
    ref.current.material.opacity = pulse * (1 - themeBlendRef.current)
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[4, 32]} />
      <meshBasicMaterial
        color="#2fd0ff"
        transparent
        opacity={0.6}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// Lighthouse: warm white body, dark cap, amber windows. Beam: vertex at tip, yellow cone, water-only sweep.
const LIGHTHOUSE_BODY = '#F2EFEA'
const LIGHTHOUSE_CAP = '#1B1B1B'
const LIGHTHOUSE_WINDOW_AMBER = '#E6B85C'
const BEAM_LENGTH = 40
const BEAM_RADIUS = 6
const LIGHTHOUSE_BEAM_COLOR = '#ffd84d'
const BEAM_TILT_DOWN = 0.21

const LIGHTHOUSE_FENCE_COLOR = '#5a5a5a'
const LIGHTHOUSE_FENCE_POST_H = 0.5
const LIGHTHOUSE_FENCE_RADIUS = 2.2
const LIGHTHOUSE_FENCE_POSTS = 8
const LIGHTHOUSE_STONE = '#7a756f'

function Lighthouse() {
  const { themeBlendRef } = useTheme()
  const lhWorld = useLighthouseWorld()
  const hq = useHQ()
  const beamRef = useRef()
  const spotRef = useRef()
  const groupRef = useRef()
  const target = useRef(new THREE.Object3D())
  const [hovered, setHovered] = useState(false)
  useCursor(hovered, 'pointer', 'auto')

  const handleClick = (e) => {
    e.stopPropagation()
    lhWorld?.addSecretClick('lighthouse')
    if (typeof hq?.setHQPhase === 'function') hq.setHQPhase('approaching')
  }

  const beamGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(BEAM_RADIUS, BEAM_LENGTH, 32, 1, true)
    g.translate(0, -BEAM_LENGTH / 2, 0)
    return g
  }, [])

  const beamMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: LIGHTHOUSE_BEAM_COLOR,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  )

  useEffect(() => {
    if (beamRef.current) beamRef.current.frustumCulled = false
  }, [])

  useFrame((state) => {
    if (!groupRef.current || !beamRef.current) return
    const mult = 1 - themeBlendRef.current
    const t = state.clock.elapsedTime
    const sweep = LIGHTHOUSE_BEAM_SWEEP_AMP * Math.sin(t * LIGHTHOUSE_BEAM_SWEEP_SPEED)
    groupRef.current.rotation.y = Math.PI + sweep
    target.current.position.set(-50, -10, 0)
    const chaosFlicker = lhWorld?.chaosMode ? 0.6 + 0.4 * Math.sin(t * 15) : 1
    if (beamRef.current.material) beamRef.current.material.opacity = 0.45 * mult * chaosFlicker
    if (spotRef.current) spotRef.current.intensity = 35 * mult * chaosFlicker
  })

  return (
    <group position={[18, 0, 1]}>
      {/* Wrap-around stair base — 3 step levels, stone */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.35, 1.0, 0.12, 24, 1]} />
        <meshStandardMaterial color={LIGHTHOUSE_STONE} roughness={0.9} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.7, 1.35, 0.12, 24, 1]} />
        <meshStandardMaterial color={LIGHTHOUSE_STONE} roughness={0.9} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.05, 1.7, 0.12, 24, 1]} />
        <meshStandardMaterial color={LIGHTHOUSE_STONE} roughness={0.9} metalness={0.02} />
      </mesh>
      {/* Fence around lighthouse base */}
      {Array.from({ length: LIGHTHOUSE_FENCE_POSTS }).map((_, i) => {
        const angle = (i / LIGHTHOUSE_FENCE_POSTS) * Math.PI * 2
        const x = Math.cos(angle) * LIGHTHOUSE_FENCE_RADIUS
        const z = Math.sin(angle) * LIGHTHOUSE_FENCE_RADIUS
        return (
          <mesh key={`post-${i}`} position={[x, LIGHTHOUSE_FENCE_POST_H / 2, z]} castShadow receiveShadow>
            <cylinderGeometry args={[0.06, 0.08, LIGHTHOUSE_FENCE_POST_H, 6]} />
            <meshStandardMaterial color={LIGHTHOUSE_FENCE_COLOR} roughness={0.85} />
          </mesh>
        )
      })}
      {/* Fence rails — two horizontal rings */}
      {[0.15, 0.35].map((y, ri) => (
        <mesh key={`rail-${ri}`} position={[0, y, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[LIGHTHOUSE_FENCE_RADIUS, 0.04, 8, LIGHTHOUSE_FENCE_POSTS]} />
          <meshStandardMaterial color={LIGHTHOUSE_FENCE_COLOR} roughness={0.85} />
        </mesh>
      ))}

      <mesh
        position={[0, 3.5, 0]}
        castShadow
        receiveShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
        onClick={handleClick}
      >
        <cylinderGeometry args={[0.7, 1.0, 6, 12]} />
        <meshStandardMaterial color={hovered ? '#e8e4de' : LIGHTHOUSE_BODY} roughness={0.82} />
      </mesh>
      <mesh position={[0, 5.2, 0]} castShadow={false} receiveShadow={false}>
        <cylinderGeometry args={[0.72, 0.72, 0.25, 12]} />
        <meshStandardMaterial color={LIGHTHOUSE_WINDOW_AMBER} emissive={LIGHTHOUSE_WINDOW_AMBER} emissiveIntensity={0.25} roughness={0.9} />
      </mesh>
      <mesh position={[0, 6.8, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.7, 1.2, 12]} />
        <meshStandardMaterial color={LIGHTHOUSE_CAP} roughness={0.85} />
      </mesh>
      <mesh position={[0, 7.6, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.55, 0.6, 12]} />
        <meshStandardMaterial color={LIGHTHOUSE_CAP} roughness={0.85} />
      </mesh>
      <group ref={groupRef} position={[0, 8.2, 0]}>
        <spotLight
          ref={spotRef}
          position={[0, 0, 0]}
          angle={0.22}
          penumbra={0.4}
          intensity={35}
          distance={60}
          decay={1.8}
          color={LIGHTHOUSE_BEAM_COLOR}
          target={target.current}
          castShadow={false}
        />
        <primitive object={target.current} />
        <mesh ref={beamRef} geometry={beamGeo} material={beamMat} rotation={[-BEAM_TILT_DOWN, 0, -Math.PI / 2]} renderOrder={9999}>
        </mesh>
      </group>
    </group>
  )
}

// ——— Voxel Micro-Airport (one group, pushed toward island edge; no overlap with roads) ———
const RUNWAY_LEN = 26
const RUNWAY_W = 4
const TAXIWAY_LEN = 10
const TAXIWAY_W = 1.8
const RUNWAY_GRAY = '#2a2a2a'
const TAXIWAY_GRAY = '#353535'
const GLASS_CYAN = '#9ddcff'

// Single grouped transform: toward +Z (top/far edge), ~8–10 units from nearest road (z=8)
const AIRPORT_GROUP_POSITION = [4, 0, 17]
// Airport zone bounding box (world coords) — use to avoid spawning roads/buildings inside
export const AIRPORT_ZONE = {
  xMin: AIRPORT_GROUP_POSITION[0] - 21,
  xMax: AIRPORT_GROUP_POSITION[0] + 14,
  zMin: AIRPORT_GROUP_POSITION[2] - 6,
  zMax: AIRPORT_GROUP_POSITION[2] + 2,
}
const AIRPORT_DEBUG_ZONE = false
const AIRPORT_HITBOX_SIZE = [42, 8, 12] // cover runway + terminals in group space
const AIRPORT_HOVER_GREEN = '#3eea6d'

function MicroAirport({ onHover, onClick }) {
  const { themeBlendRef } = useTheme()
  const runwayLightsRef = useRef([])
  const taxiLightsRef = useRef([])
  const radioSphereRef = useRef()
  const controlTowerCabinRef = useRef()
  const controlTowerFlickerRef = useRef()
  const [hoveredPart, setHoveredPart] = useState(null) // 't0'|'t1'|'t2'|'tower'|null
  const hovered = !!hoveredPart
  useCursor(hovered, 'pointer', 'auto')

  const handleOver = (part) => (e) => { e.stopPropagation(); setHoveredPart(part); onHover?.(true) }
  const handleOut = () => { setHoveredPart(null); onHover?.(false) }
  const handleClick = (e) => { e.stopPropagation(); onClick?.() }

  useFrame((state) => {
    const b = themeBlendRef.current
    const t = state.clock.elapsedTime
    const night = 1 - b
    if (radioSphereRef.current?.material) {
      const flicker = 0.8 + 0.2 * Math.sin(t * 6) + 0.1 * Math.sin(t * 17)
      radioSphereRef.current.material.emissiveIntensity = night ? 3.0 * flicker : 0.4
    }
    const flickerVal = night > 0.2 ? 0.5 + 0.5 * Math.sin(t * 5) + 0.25 * Math.sin(t * 13) : 0
    if (controlTowerCabinRef.current?.material) {
      const mat = controlTowerCabinRef.current.material
      if (mat.emissive) mat.emissive.setHex(0xE6B85C)
      mat.emissiveIntensity = 0.3 * flickerVal
    }
    if (controlTowerFlickerRef.current?.material) {
      controlTowerFlickerRef.current.material.emissiveIntensity = 0.8 * flickerVal
    }
    runwayLightsRef.current.forEach((mesh) => {
      if (mesh?.material) mesh.material.opacity = (0.6 + 0.3 * Math.sin(state.clock.elapsedTime * 2)) * night
    })
    taxiLightsRef.current.forEach((mesh) => {
      if (mesh?.material) mesh.material.opacity = 0.85 * night
    })
  })

  const runwayY = 0.02
  const rot = [-Math.PI / 2, 0, 0]

  return (
    <group position={AIRPORT_GROUP_POSITION}>
      {AIRPORT_DEBUG_ZONE && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(AIRPORT_ZONE.xMin + AIRPORT_ZONE.xMax) / 2 - AIRPORT_GROUP_POSITION[0], 0.01, (AIRPORT_ZONE.zMin + AIRPORT_ZONE.zMax) / 2 - AIRPORT_GROUP_POSITION[2]]}>
          <planeGeometry args={[AIRPORT_ZONE.xMax - AIRPORT_ZONE.xMin, AIRPORT_ZONE.zMax - AIRPORT_ZONE.zMin]} />
          <meshBasicMaterial color="#c0392b" transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Runway — flat strip, center dashed + side lines */}
      <mesh rotation={rot} position={[0, runwayY, 0]} receiveShadow raycast={() => null}>
        <planeGeometry args={[RUNWAY_LEN, RUNWAY_W]} />
        <meshStandardMaterial color={RUNWAY_GRAY} roughness={0.9} metalness={0.1} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => {
        const x = -RUNWAY_LEN / 2 + 1.2 + i * 2.2
        return (
          <mesh key={i} rotation={rot} position={[x, runwayY + 0.005, 0]} receiveShadow={false} raycast={() => null}>
            <planeGeometry args={[1, 0.15]} />
            <meshBasicMaterial color="#f0f0ec" />
          </mesh>
        )
      })}
      <mesh rotation={rot} position={[0, runwayY + 0.005, RUNWAY_W / 2 + 0.08]} receiveShadow={false} raycast={() => null}>
        <planeGeometry args={[RUNWAY_LEN, 0.12]} />
        <meshBasicMaterial color="#f0f0ec" />
      </mesh>
      <mesh rotation={rot} position={[0, runwayY + 0.005, -RUNWAY_W / 2 - 0.08]} receiveShadow={false} raycast={() => null}>
        <planeGeometry args={[RUNWAY_LEN, 0.12]} />
        <meshBasicMaterial color="#f0f0ec" />
      </mesh>

      {/* Runway edge lights (night) */}
      {Array.from({ length: 14 }).map((_, i) => {
        const x = -RUNWAY_LEN / 2 + 0.8 + i * 2
        return (
          <mesh key={`l-${i}`} ref={(el) => (runwayLightsRef.current[i] = el)} position={[x, 0.08, RUNWAY_W / 2 + 0.2]} castShadow={false} raycast={() => null}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshBasicMaterial color="#ffd84d" transparent opacity={0.8} />
          </mesh>
        )
      })}
      {Array.from({ length: 14 }).map((_, i) => {
        const x = -RUNWAY_LEN / 2 + 0.8 + i * 2
        return (
          <mesh key={`r-${i}`} ref={(el) => (runwayLightsRef.current[14 + i] = el)} position={[x, 0.08, -RUNWAY_W / 2 - 0.2]} castShadow={false} raycast={() => null}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshBasicMaterial color="#ffd84d" transparent opacity={0.8} />
          </mesh>
        )
      })}

      {/* Taxiway — parallel, warmer gray + yellow center */}
      <mesh rotation={rot} position={[-RUNWAY_LEN / 2 - 2, runwayY, -RUNWAY_W / 2 - 1.5]} receiveShadow raycast={() => null}>
        <planeGeometry args={[TAXIWAY_LEN, TAXIWAY_W]} />
        <meshStandardMaterial color={TAXIWAY_GRAY} roughness={0.88} metalness={0.12} />
      </mesh>
      <mesh rotation={rot} position={[-RUNWAY_LEN / 2 - 2, runwayY + 0.004, -RUNWAY_W / 2 - 1.5]} receiveShadow={false} raycast={() => null}>
        <planeGeometry args={[TAXIWAY_LEN, 0.08]} />
        <meshBasicMaterial color="#e8c547" />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} ref={(el) => (taxiLightsRef.current[i] = el)} position={[-RUNWAY_LEN / 2 - 2 + i * 2.5, 0.06, -RUNWAY_W / 2 - 1.5]} castShadow={false} raycast={() => null}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshBasicMaterial color="#2fd0ff" transparent opacity={0.85} />
        </mesh>
      ))}

      {/* Plane parking spots — between radio tower and control tower */}
      <group position={[-RUNWAY_LEN / 2 - 4.5, 0, -RUNWAY_W / 2 - 0.5]} raycast={() => null}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[i * 2.2, 0.008, 0]}>
            <mesh rotation={rot} receiveShadow={false}>
              <planeGeometry args={[1.8, 0.8]} />
              <meshStandardMaterial color={TAXIWAY_GRAY} roughness={0.9} />
            </mesh>
            <mesh rotation={rot} position={[0, 0.002, 0]} receiveShadow={false}>
              <planeGeometry args={[1.5, 0.06]} />
              <meshBasicMaterial color="#e8c547" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Terminals — aligned along runway (X): left, center, right with 2–3 unit gaps */}
      {[
        { x: -RUNWAY_LEN / 2 - 10, z: -RUNWAY_W / 2 - 2 },
        { x: -RUNWAY_LEN / 2 - 4, z: -RUNWAY_W / 2 - 2 },
        { x: -RUNWAY_LEN / 2 + 2, z: -RUNWAY_W / 2 - 2 },
      ].map((pos, termIdx) => (
        <group key={termIdx} position={[pos.x, 0, pos.z]}>
          {/* Invisible hitbox for terminal hover/click — terminals + control tower only */}
          <mesh
            position={[7, 0.6, 0]}
            onClick={handleClick}
            onPointerOver={handleOver(`t${termIdx}`)}
            onPointerOut={handleOut}
          >
            <boxGeometry args={[6.5, 2.8, 3.2]} />
            <meshBasicMaterial color="black" transparent opacity={0} depthWrite={false} />
          </mesh>
          {hoveredPart === `t${termIdx}` && (
            <mesh position={[7, 0.6, 0]} raycast={() => null}>
              <boxGeometry args={[6.5, 2.8, 3.2]} />
              <meshBasicMaterial color={AIRPORT_HOVER_GREEN} transparent opacity={0.25} depthWrite={false} />
            </mesh>
          )}
          <mesh position={[7, 0.6, 0]} castShadow receiveShadow raycast={() => null}>
            <boxGeometry args={[6, 1.2, 3]} />
            <meshStandardMaterial color={STONE} roughness={0.85} />
          </mesh>
          <mesh position={[7, 1.5, 0]} castShadow receiveShadow raycast={() => null}>
            <boxGeometry args={[5.5, 0.35, 2.8]} />
            <meshStandardMaterial color={GLASS_CYAN} metalness={0.1} roughness={0.05} transparent opacity={0.85} />
          </mesh>
          <mesh position={[7, 2.0, 0]} castShadow receiveShadow raycast={() => null}>
            <boxGeometry args={[5.5, 0.35, 2.8]} />
            <meshStandardMaterial color={GLASS_CYAN} metalness={0.1} roughness={0.05} transparent opacity={0.85} />
          </mesh>
          <mesh position={[7, 2.5, 0]} castShadow receiveShadow raycast={() => null}>
            <boxGeometry args={[5.2, 0.12, 2.6]} />
            <meshStandardMaterial color={STONE_DARK} roughness={0.9} />
          </mesh>
          <mesh position={[5.2, 0.7, 1.6]} castShadow receiveShadow raycast={() => null}>
            <boxGeometry args={[2.5, 0.18, 1.2]} />
            <meshStandardMaterial color={STONE_DARK} roughness={0.88} />
          </mesh>
          <mesh position={[6.6, 0.2, 1.5]} castShadow raycast={() => null}>
            <boxGeometry args={[0.5, 0.2, 0.4]} />
            <meshStandardMaterial color={CHARCOAL} roughness={0.8} />
          </mesh>
          <mesh position={[7.4, 0.2, 1.5]} castShadow raycast={() => null}>
            <boxGeometry args={[0.4, 0.18, 0.35]} />
            <meshStandardMaterial color={CHARCOAL} roughness={0.8} />
          </mesh>
          <mesh position={[5.8, 0.65, 1.52]} castShadow raycast={() => null}>
            <boxGeometry args={[0.4, 0.28, 0.5]} />
            <meshStandardMaterial color={STONE} roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Control tower — taller cylinder base, glass cabin, antenna */}
      <group position={[-RUNWAY_LEN / 2 - 2, 0, RUNWAY_W / 2 + 1.2]}>
        <mesh
          position={[0, 2.75, 0]}
          onClick={handleClick}
          onPointerOver={handleOver('tower')}
          onPointerOut={handleOut}
        >
          <cylinderGeometry args={[0.55, 0.55, 5.5, 12]} />
          <meshBasicMaterial color="black" transparent opacity={0} depthWrite={false} />
        </mesh>
        {hoveredPart === 'tower' && (
          <mesh position={[0, 2.75, 0]} raycast={() => null}>
            <cylinderGeometry args={[0.55, 0.55, 5.5, 12]} />
            <meshBasicMaterial color={AIRPORT_HOVER_GREEN} transparent opacity={0.25} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        )}
        <mesh position={[0, 2.2, 0]} castShadow receiveShadow raycast={() => null}>
          <cylinderGeometry args={[0.4, 0.5, 4.4, 12]} />
          <meshStandardMaterial color="#8a8f94" roughness={0.82} />
        </mesh>
        <mesh ref={controlTowerCabinRef} position={[0, 4.5, 0]} castShadow={false} raycast={() => null}>
          <cylinderGeometry args={[0.48, 0.48, 0.5, 12]} />
          <meshStandardMaterial color={GLASS_CYAN} metalness={0.1} roughness={0.05} transparent opacity={0.9} emissive="#E6B85C" emissiveIntensity={0} />
        </mesh>
        <mesh ref={controlTowerFlickerRef} position={[0, 4.5, 0]} castShadow={false} raycast={() => null}>
          <cylinderGeometry args={[0.2, 0.2, 0.15, 8]} />
          <meshStandardMaterial color="#E6B85C" emissive="#E6B85C" emissiveIntensity={0} depthWrite={false} />
        </mesh>
        <mesh position={[0, 4.95, 0]} castShadow raycast={() => null}>
          <cylinderGeometry args={[0.44, 0.44, 0.14, 12]} />
          <meshStandardMaterial color={STONE_DARK} roughness={0.88} />
        </mesh>
        <mesh position={[0, 5.5, 0]} castShadow={false} raycast={() => null}>
          <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
          <meshStandardMaterial color="#e8c547" metalness={0.3} roughness={0.6} />
        </mesh>
      </group>

      {/* Radio tower — thin beam, cross arms, red blinking top */}
      <group position={[-RUNWAY_LEN / 2 - 6.5, 0, -RUNWAY_W / 2 - 2.5]} raycast={() => null}>
        <mesh position={[0, 2.5, 0]} castShadow>
          <boxGeometry args={[0.08, 5, 0.08]} />
          <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
        </mesh>
        {[1.2, 2.2, 3.2].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} castShadow>
            <boxGeometry args={[1.2, 0.06, 0.06]} />
            <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
          </mesh>
        ))}
        <mesh ref={radioSphereRef} position={[0, 5.1, 0]} castShadow={false}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshStandardMaterial color="#c0392b" emissive="#c0392b" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Animated planes */}
      <AirportPlanes />
    </group>
  )
}

const LANDING_CURVE = [
  new THREE.Vector3(10, 5, 14),
  new THREE.Vector3(4, 2, 10),
  new THREE.Vector3(-4, 0.3, 4),
  new THREE.Vector3(-10, 0.02, 1.2),
]
const TAXI_CURVE = [
  new THREE.Vector3(-10, 0.02, 1.2),
  new THREE.Vector3(-10, 0.02, 0),
  new THREE.Vector3(-10, 0.02, -1.5),
]
const TAKEOFF_CURVE = [
  new THREE.Vector3(-10, 0.02, -1.5),
  new THREE.Vector3(-4, 0.3, -0.5),
  new THREE.Vector3(2, 0.8, 2),
  new THREE.Vector3(10, 4, 10),
]
const LANDING_SPLINE = new THREE.CatmullRomCurve3(LANDING_CURVE, false)
const TAXI_SPLINE = new THREE.CatmullRomCurve3(TAXI_CURVE, false)
const TAKEOFF_SPLINE = new THREE.CatmullRomCurve3(TAKEOFF_CURVE, false)
const GATE_RIGHT = new THREE.Vector3(-10, 0.02, 1.2)
const GATE_LEFT = new THREE.Vector3(-10, 0.02, -1.5)

const AIRPORT_PLANE_SCALE = 1.05
const CURVE_REF = { pos: new THREE.Vector3(), tangent: new THREE.Vector3() }
// Orient plane so nose (not tail) points along tangent. +PI so we land/take off head-first.
function setPlaneNoseDirection(group, tangent, flattenY = true) {
  const t = tangent.clone()
  if (flattenY) {
    t.y = 0
    if (t.lengthSq() < 1e-6) return
    t.normalize()
  }
  group.rotation.x = 0
  group.rotation.z = 0
  group.rotation.y = Math.atan2(-t.z, t.x) + Math.PI
}
function AirportPlaneMesh({ leftLightRef, rightLightRef, tailLightRef, bodyColor }) {
  return (
    <group scale={AIRPORT_PLANE_SCALE} rotation={[0, -Math.PI / 2, 0]}>
      {/* Fuselage: long on Z, narrow X/Y */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.28, 0.18, 1.1]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Wings: horizontal, wide on X */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[0.9, 0.05, 0.22]} />
        <meshStandardMaterial color="#bdc3c7" roughness={0.7} />
      </mesh>
      {/* Tail fin: vertical */}
      <mesh position={[0, 0.18, -0.52]} castShadow>
        <boxGeometry args={[0.06, 0.22, 0.2]} />
        <meshStandardMaterial color={bodyColor} roughness={0.65} />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 0, 0.52]} castShadow>
        <boxGeometry args={[0.2, 0.14, 0.18]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} />
      </mesh>
      {/* Nav lights — blink at night */}
      <mesh position={[0.22, 0.06, 0.5]} ref={rightLightRef}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0} />
      </mesh>
      <mesh position={[-0.22, 0.06, 0.5]} ref={leftLightRef}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0} />
      </mesh>
      <mesh position={[0, 0.2, -0.52]} ref={tailLightRef}>
        <sphereGeometry args={[0.035, 6, 6]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0} />
      </mesh>
    </group>
  )
}

const PLANE_COUNT = 4
const PARK_RIGHT_WAIT = 1.5
const PARK_LEFT_WAIT = 4
const TAXI_SPEED = 0.08
const AIRPORT_PLANE_SPEED = 0.11
const PLANE_PHASE_OFFSET = 0.48
const PLANE_STAGGER_SEC = 18
const PLANE_SPEED_MULT = [0.85, 1.15, 0.9, 1.1]

function AirportPlanes() {
  const refs = useRef([])
  const ts = useRef(Array(PLANE_COUNT).fill(0))
  const states = useRef(['landing', 'parked_right', 'taxi', 'parked_left', 'takeoff'])
  const l0 = useRef(), l1 = useRef(), l2 = useRef(), l3 = useRef(), l4 = useRef(), l5 = useRef()
  const l6 = useRef(), l7 = useRef(), l8 = useRef(), l9 = useRef(), l10 = useRef(), l11 = useRef()
  const lightRefs = [l0, l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11]
  const { themeBlendRef } = useTheme()
  const initStagger = useRef(false)
  if (!initStagger.current) {
    initStagger.current = true
    const phases = ['landing', 'parked_right', 'taxi', 'parked_left']
    for (let i = 0; i < PLANE_COUNT; i++) {
      ts.current[i] = (i * PLANE_PHASE_OFFSET) % 1
      states.current[i] = phases[i % 4]
    }
  }

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime
    const active = (i) => elapsed >= i * PLANE_STAGGER_SEC
    const night = 1 - themeBlendRef.current
    const blink = night > 0.2 ? Math.max(0.1, 0.25 + 0.2 * Math.sin(elapsed * 4)) : 0
    lightRefs.forEach((r) => { const m = r.current; if (m?.material) m.material.emissiveIntensity = blink })
    for (let i = 0; i < PLANE_COUNT; i++) {
      const g = refs.current[i]
      if (!g) continue
      const s = states.current[i]
      let t = ts.current[i]
      const phase = i * PLANE_PHASE_OFFSET
      const speedMult = active(i) ? PLANE_SPEED_MULT[i % PLANE_SPEED_MULT.length] : 0
      const speed = AIRPORT_PLANE_SPEED * delta * speedMult
      const taxiSpeed = TAXI_SPEED * delta * speedMult
      if (s === 'landing') {
        t = Math.min(1, t + speed)
        if (active(i)) ts.current[i] = t
        const pt = (t + phase) % 1
        LANDING_SPLINE.getPointAt(pt, CURVE_REF.pos)
        LANDING_SPLINE.getTangentAt(pt, CURVE_REF.tangent)
        g.position.copy(CURVE_REF.pos)
        setPlaneNoseDirection(g, CURVE_REF.tangent, true)
        g.visible = active(i)
        if (active(i) && t >= 1) {
          ts.current[i] = 0
          states.current[i] = 'parked_right'
        }
      } else if (s === 'parked_right') {
        g.position.copy(GATE_RIGHT)
        g.rotation.set(0, Math.PI, 0)
        g.visible = active(i)
        t = t + (active(i) ? delta : 0)
        if (active(i)) ts.current[i] = t
        if (active(i) && t > PARK_RIGHT_WAIT) {
          ts.current[i] = 0
          states.current[i] = 'taxi'
        }
      } else if (s === 'taxi') {
        t = Math.min(1, t + taxiSpeed)
        if (active(i)) ts.current[i] = t
        const pt = (t + phase) % 1
        TAXI_SPLINE.getPointAt(pt, CURVE_REF.pos)
        TAXI_SPLINE.getTangentAt(pt, CURVE_REF.tangent)
        g.position.copy(CURVE_REF.pos)
        setPlaneNoseDirection(g, CURVE_REF.tangent, true)
        g.visible = active(i)
        if (active(i) && t >= 1) {
          ts.current[i] = 0
          states.current[i] = 'parked_left'
        }
      } else if (s === 'parked_left') {
        g.position.copy(GATE_LEFT)
        g.rotation.set(0, 0, 0)
        g.visible = active(i)
        t = t + (active(i) ? delta : 0)
        if (active(i)) ts.current[i] = t
        if (active(i) && t > PARK_LEFT_WAIT) {
          ts.current[i] = 0
          states.current[i] = 'takeoff'
        }
      } else {
        t = Math.min(1, t + speed)
        if (active(i)) ts.current[i] = t
        const pt = (t + phase) % 1
        TAKEOFF_SPLINE.getPointAt(pt, CURVE_REF.pos)
        TAKEOFF_SPLINE.getTangentAt(pt, CURVE_REF.tangent)
        g.position.copy(CURVE_REF.pos)
        setPlaneNoseDirection(g, CURVE_REF.tangent, true)
        g.visible = active(i)
        if (active(i) && t >= 1) {
          ts.current[i] = 0
          states.current[i] = 'landing'
        }
      }
    }
  })

  return (
    <>
      {Array.from({ length: PLANE_COUNT }, (_, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)}>
          <AirportPlaneMesh
            leftLightRef={lightRefs[i * 3]}
            rightLightRef={lightRefs[i * 3 + 1]}
            tailLightRef={lightRefs[i * 3 + 2]}
            bodyColor="#ecf0f1"
          />
        </group>
      ))}
    </>
  )
}

// Star field — Points cloud (reduced count for performance), flickering white, night-only
const STAR_COUNT = 700
const STAR_GEOM = (() => {
  const rng = mulberry32(123)
  const pos = new Float32Array(STAR_COUNT * 3)
  for (let i = 0; i < STAR_COUNT; i++) {
    const theta = rng() * Math.PI * 2
    const phi = Math.acos(2 * rng() - 1) * 0.45 + Math.PI * 0.28
    const r = 46 + rng() * 12
    pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta)
    pos[i * 3 + 1] = r * Math.cos(phi) + 20
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  return g
})()

function Stars() {
  const { themeBlendRef } = useTheme()
  const pointsRef = useRef()
  const starMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: '#ffffff',
        size: 0.5,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    []
  )
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const night = 1 - themeBlendRef.current
    const flicker = 0.6 + 0.25 * Math.sin(t * 0.8) + 0.15 * Math.sin(t * 3.7)
    starMat.opacity = Math.max(0, flicker * night)
    if (pointsRef.current) pointsRef.current.visible = night > 0.02
  })
  return <points ref={pointsRef} geometry={STAR_GEOM} material={starMat} />
}

// Moon crater spots (grey circles on surface)
const MOON_CRATERS = (() => {
  const rng = mulberry32(99)
  return Array.from({ length: 10 }, () => ({
    u: rng() * 0.8 - 0.4,
    v: rng() * 0.6 - 0.3,
    r: 0.08 + rng() * 0.12,
  }))
})()

function Moon({ onArchitectClick }) {
  const { themeBlendRef } = useTheme()
  const groupRef = useRef()
  const innerRef = useRef()
  const [hovered, setHovered] = useState(false)
  useCursor(hovered, 'pointer', 'auto')
  const scaleTarget = useRef(1)
  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime * 0.018
    groupRef.current.position.x = Math.cos(t) * 24
    groupRef.current.position.y = 18 + Math.sin(t) * 3
    groupRef.current.position.z = Math.sin(t) * 24
    groupRef.current.rotation.y = t * 0.4
    scaleTarget.current = hovered ? 1.06 : 1
    if (innerRef.current) {
      innerRef.current.scale.lerp(new THREE.Vector3(scaleTarget.current, scaleTarget.current, scaleTarget.current), 0.15)
    }
    const mesh = groupRef.current.children[0]?.children?.[0]
    if (mesh?.material) mesh.material.opacity = 0.95 * (1 - themeBlendRef.current)
  })
  return (
    <group ref={groupRef} position={[20, 18, 0]}>
      <group ref={innerRef}>
        <mesh
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
          onPointerOut={() => setHovered(false)}
          onClick={(e) => { e.stopPropagation(); onArchitectClick?.() }}
        >
          <sphereGeometry args={[1.5, 20, 20]} />
          <meshBasicMaterial color={hovered ? '#c9c0a8' : '#e8e0c8'} transparent opacity={0.95} depthWrite={false} />
        </mesh>
        {MOON_CRATERS.map((c, i) => {
          const theta = Math.PI * 0.5 - c.v * Math.PI
          const phi = c.u * Math.PI
          const x = 1.52 * Math.sin(theta) * Math.cos(phi)
          const y = 1.52 * Math.cos(theta)
          const z = 1.52 * Math.sin(theta) * Math.sin(phi)
          return (
            <mesh key={i} position={[x, y, z]} raycast={() => null}>
              <circleGeometry args={[c.r, 12]} />
              <meshBasicMaterial color="#9a9a9a" depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
          )
        })}
        {hovered && (
          <mesh raycast={() => null}>
            <ringGeometry args={[1.58, 1.72, 32]} />
            <meshBasicMaterial color="#e8e0c8" transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    </group>
  )
}

function WelcomeOverlay({ show }) {
  return (
    <div
      className="welcome-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        opacity: show ? 1 : 0,
        transition: 'opacity 600ms ease',
        fontFamily: 'Georgia, serif',
        fontWeight: 300,
        letterSpacing: '0.2em',
        color: 'rgba(255,255,255,0.94)',
        textShadow: '0 8px 20px rgba(0,0,0,0.35)',
        borderTop: '1px solid rgba(255,255,255,0.2)',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
        padding: '1.5em 2em',
      }}
    >
      <span style={{ fontSize: 'clamp(18px, 4vw, 26px)', textTransform: 'uppercase' }}>
        Welcome to Maram City
      </span>
      <span
        style={{
          marginTop: '0.5em',
          fontSize: 'clamp(12px, 2.2vw, 14px)',
          letterSpacing: '0.14em',
          opacity: 0.85,
        }}
      >
        Catch the sun. Meet the architect.
      </span>
    </div>
  )
}

function CameraControlsWithIntro({ controlsRef, resetCameraRef, defaultPosition, defaultTarget, enabled = true, flying = false }) {
  const { introPlaying } = useIntro()
  return (
    <CameraControls
      controlsRef={controlsRef}
      resetCameraRef={resetCameraRef}
      defaultPosition={defaultPosition}
      defaultTarget={defaultTarget}
      enabled={enabled && !introPlaying}
      enableDamping={!flying}
    />
  )
}

function HQTransitionRunner() {
  const { hqPhase, setHQPhase, controlsRef } = useHQ()
  const startPos = useRef(new THREE.Vector3())
  const startTarget = useRef(new THREE.Vector3())
  const approachPos = useRef(new THREE.Vector3(...HQ_APPROACH_POS))
  const approachTarget = useRef(new THREE.Vector3(...HQ_APPROACH_TARGET))
  const phaseStartTime = useRef(0)
  const didSaveStart = useRef(false)

  useFrame((state) => {
    const ctrl = controlsRef?.current
    if (!ctrl || !ctrl.target) return

    if (hqPhase === 'approaching') {
      if (!didSaveStart.current) {
        startPos.current.copy(ctrl.object.position)
        startTarget.current.copy(ctrl.target)
        phaseStartTime.current = state.clock.elapsedTime
        didSaveStart.current = true
      }
      const t = (state.clock.elapsedTime - phaseStartTime.current) / HQ_APPROACH_DURATION
      if (t >= 1) {
        ctrl.object.position.copy(approachPos.current)
        ctrl.target.copy(approachTarget.current)
        setHQPhase('door')
        phaseStartTime.current = state.clock.elapsedTime
      } else {
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        ctrl.object.position.lerpVectors(startPos.current, approachPos.current, eased)
        ctrl.target.lerpVectors(startTarget.current, approachTarget.current, eased)
      }
    } else if (hqPhase === 'door') {
      if (state.clock.elapsedTime - phaseStartTime.current >= HQ_DOOR_DURATION) {
        setHQPhase('entering')
        phaseStartTime.current = state.clock.elapsedTime
      }
    } else if (hqPhase === 'entering') {
      if (state.clock.elapsedTime - phaseStartTime.current >= HQ_ENTERING_DURATION) {
        setHQPhase('inside')
      }
    }
  })

  if (hqPhase === 'idle' || hqPhase === 'inside') didSaveStart.current = false
  return null
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const FLY_OFFSET = [7, 9, 7]
function BuildingFlyRunner() {
  const { flyToBuildingId, setFlyToBuildingId, controlsRef, flyToWorldPosRef, onOpenProject } = useHQ()
  const startPos = useRef(new THREE.Vector3())
  const startTarget = useRef(new THREE.Vector3())
  const endPos = useRef(new THREE.Vector3())
  const endTarget = useRef(new THREE.Vector3())
  const startTime = useRef(-1)
  const phase = useRef('idle')
  const frozenWorldPos = useRef(null)

  useFrame((state) => {
    if (!flyToBuildingId || !controlsRef?.current) return
    const ctrl = controlsRef.current
    const t = state.clock.elapsedTime

    if (phase.current === 'idle') {
      const worldPos = flyToWorldPosRef?.current
      let cfg = null
      if (worldPos) {
        frozenWorldPos.current = worldPos.clone()
        endTarget.current.set(frozenWorldPos.current.x, 2.5, frozenWorldPos.current.z)
        endPos.current.set(
          frozenWorldPos.current.x + FLY_OFFSET[0],
          FLY_OFFSET[1],
          frozenWorldPos.current.z + FLY_OFFSET[2]
        )
        cfg = true
      } else {
        cfg = getBuildingFlyTarget(flyToBuildingId)
        if (cfg) {
          endPos.current.set(...cfg.pos)
          endTarget.current.set(...cfg.target)
        }
      }
      if (!cfg) {
        setFlyToBuildingId(null)
        if (flyToWorldPosRef) flyToWorldPosRef.current = null
        onOpenProject?.(flyToBuildingId)
        return
      }
      startPos.current.copy(ctrl.object.position)
      startTarget.current.copy(ctrl.target)
      startTime.current = t
      phase.current = 'fly'
      if (flyToWorldPosRef) flyToWorldPosRef.current = null
    }

    if (phase.current === 'fly') {
      const elapsed = t - startTime.current
      const progress = Math.min(1, elapsed / BUILDING_FLY_DURATION)
      const eased = easeInOutCubic(progress)
      ctrl.object.position.lerpVectors(startPos.current, endPos.current, eased)
      ctrl.target.lerpVectors(startTarget.current, endTarget.current, eased)
      if (progress >= 1) {
        ctrl.object.position.copy(endPos.current)
        ctrl.target.copy(endTarget.current)
        phase.current = 'pause'
        startTime.current = t
      }
      return
    }

    if (phase.current === 'pause') {
      if (t - startTime.current >= BUILDING_FLY_PAUSE) {
        const projectId = flyToBuildingId
        setFlyToBuildingId(null)
        phase.current = 'idle'
        startTime.current = -1
        onOpenProject?.(projectId)
      }
    }
  })

  return null
}

function ScenePrecompile() {
  return null
}

const TERMINAL_LINES = [
  '> signal found...',
  '> decrypting beacon: OK',
  '> you found zforgotten.',
  '',
  '> i love building cool stuff.',
  '> so i decided to build this city.',
  '',
  '> this city was built with love.',
  '',
  '  125,037 lines of code',
  '  3,456 grid tiles',
  '  593,908,320,542,897,916 pixels',
  '  74 hours built',
  '  every 5s on night mode powers a 20W 60V lamp for 1s',
  '  64 sweeps',
  '  18 sky layers',
  '',
  '> drop by the lighthouse whenever you want.',
  "> don't forget the forgotten.",
  '',
]

function LighthouseModalContent({ onClose }) {
  const [flicker, setFlicker] = useState(true)
  const [lineIndex, setLineIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [cursorOn, setCursorOn] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  const timeoutRef = useRef(null)
  const logRef = useRef(null)
  const endRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setFlicker(false), 220)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (lineIndex >= TERMINAL_LINES.length) return
    const line = TERMINAL_LINES[lineIndex]
    const isNewLine = charIndex === 0
    const isStatsLine = /^\s+\d|^\s+every|^\s+\d+\s+sweeps|^\s+\d+\s+sky/.test(line)
    const isPauseLine = line === '' || line === '> this city was built with love.' || (isNewLine && lineIndex >= 8 && lineIndex <= 15)
    const charDelay = isStatsLine ? 28 + Math.random() * 22 : 24 + Math.random() * 28
    const newLineDelay = isPauseLine ? 320 + Math.random() * 180 : (isStatsLine ? 220 + Math.random() * 120 : 180 + Math.random() * 100)
    const delay = isNewLine ? newLineDelay : charDelay
    timeoutRef.current = setTimeout(() => {
      if (charIndex < line.length) {
        setCharIndex((c) => c + 1)
      } else {
        setLineIndex((n) => n + 1)
        setCharIndex(0)
      }
    }, delay)
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [lineIndex, charIndex])

  useEffect(() => {
    if (!autoScroll) return
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [lineIndex, charIndex, autoScroll])

  useEffect(() => {
    const el = logRef.current
    if (!el) return
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24
      setAutoScroll(atBottom)
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setCursorOn((c) => !c), 530)
    return () => clearInterval(id)
  }, [])

  const visibleLines = TERMINAL_LINES.slice(0, lineIndex).map((l) => l + '\n')
  const currentLine = TERMINAL_LINES[lineIndex]
  const currentVisible = currentLine ? currentLine.slice(0, charIndex) : ''

  return (
    <div className={`lighthouse-terminal-wrap ${flicker ? 'lighthouse-terminal-flicker' : ''}`}>
      <div className="lighthouse-terminal-flash" aria-hidden="true" />
      <div className="lighthouse-terminal-popup">
        <div className="lighthouse-terminal-screen">
          <div className="lighthouse-terminal-scanline" aria-hidden="true" />
          <div ref={logRef} className="lighthouse-terminal-log" aria-label="Terminal output">
            <pre className="lighthouse-terminal-pre">
              {visibleLines.map((line, i) => <React.Fragment key={i}>{line}</React.Fragment>)}
              {currentVisible}
              {(lineIndex > 0 || charIndex > 0) && <span className="lighthouse-terminal-cursor">{cursorOn ? '█' : ' '}</span>}
            </pre>
            <span ref={endRef} className="lighthouse-terminal-end" aria-hidden="true" />
          </div>
          <p className="lighthouse-terminal-footer">// hidden in code. as it should be.</p>
        </div>
        <button type="button" className="world-content-modal-close-btn lighthouse-terminal-close" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

function InboxModalContent({ onClose }) {
  const [opened, setOpened] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setOpened(true)))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div className={`inbox-modal-content ${opened ? 'inbox-modal-opened' : ''}`}>
      <h2 className="inbox-modal-title">Inbox</h2>
      <p className="inbox-modal-intro">You have an unread message from your beloved.</p>
      <button type="button" className="world-content-modal-close-btn" onClick={onClose}>Close</button>
    </div>
  )
}

function WorldMap() {
  const { theme, ambientRef, directionalRef } = useTheme()
  const lhWorld = useLighthouseWorld()
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [sustainabilityMode, setSustainabilityMode] = useState(false)
  const [timeStory, setTimeStory] = useState(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [hqPhase, setHQPhase] = useState('idle')
  const [flyToBuildingId, setFlyToBuildingId] = useState(null)
  const [showMapModal, setShowMapModal] = useState(false)
  const [activeModal, setActiveModal] = useState(null)
  const prevThemeRef = useRef(null)
  const resetCameraRef = useRef(null)
  const controlsRef = useRef(null)
  const cityGroupRef = useRef(null)
  const cityFadeRef = useRef(1)
  const flyToWorldPosRef = useRef(null)
  const introPlaying = false

  const onOpenProject = useMemo(() => (id) => setActiveModal({ type: 'project', id }), [])
  const hqContextValue = useMemo(
    () => ({ hqPhase, setHQPhase, controlsRef, flyToBuildingId, setFlyToBuildingId, flyToWorldPosRef, onOpenProject }),
    [hqPhase, flyToBuildingId, onOpenProject]
  )

  useEffect(() => {
    if (!lhWorld?.satelliteMessage) return
    const id = setTimeout(() => lhWorld.setSatelliteMessage(false), 4000)
    return () => clearTimeout(id)
  }, [lhWorld?.satelliteMessage])

  useEffect(() => {
    const target = lhWorld?.cameraTarget
    if (!target) return
    const cfg = CAMERA_TARGETS[target]
    if (!cfg) return
    const id = setTimeout(() => {
      if (!controlsRef.current) return
      const ctrl = controlsRef.current
      ctrl.target.set(...cfg.target)
      ctrl.object.position.set(...cfg.pos)
      lhWorld?.clearCameraTarget()
    }, 100)
    return () => clearTimeout(id)
  }, [lhWorld?.cameraTarget])

  useEffect(() => {
    if (prevThemeRef.current === null) {
      prevThemeRef.current = theme
      return
    }
    if (prevThemeRef.current !== theme) {
      prevThemeRef.current = theme
      setTimeStory(theme === 'day' ? 'Morning: Clarity' : 'Night: Memory')
      const id = setTimeout(() => setTimeStory(null), 2500)
      return () => clearTimeout(id)
    }
  }, [theme])

  const handleBuildingClick = (projectId, worldPos) => {
    if (introPlaying) return
    if (sustainabilityMode) {
      setSelectedBuilding((prev) => (prev === projectId ? null : projectId))
    } else {
      flyToWorldPosRef.current = worldPos && worldPos.clone ? worldPos.clone() : null
      setFlyToBuildingId(projectId)
    }
  }

  useEffect(() => {
    const id = setTimeout(() => setShowWelcome(false), 5000)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'p' || e.key === 'P') {
        const ctrl = controlsRef?.current
        if (!ctrl?.object?.position || !ctrl?.target) {
          console.log('Camera: OrbitControls not ready yet.')
          return
        }
        const pos = ctrl.object.position
        const tar = ctrl.target
        console.log('%c——— Default camera (copy into WorldMap.jsx) ———', 'font-weight:bold')
        console.log('const DEFAULT_CAMERA_POSITION = [' + [pos.x, pos.y, pos.z].map((n) => Number(n.toFixed(4))).join(', ') + ']')
        console.log('const DEFAULT_CAMERA_TARGET = [' + [tar.x, tar.y, tar.z].map((n) => Number(n.toFixed(4))).join(', ') + ']')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (hqPhase === 'inside') {
      setActiveModal({ type: 'lighthouse' })
      setHQPhase('idle')
    }
  }, [hqPhase])

  const buildingEntries = useMemo(() => {
    const out = []
    projects.forEach((project) => {
      const positions = projectPositions[project.id]
      if (!positions) return
      const list = Array.isArray(positions[0]) ? positions : [positions]
      list.forEach((pos, idx) => {
        let importance = out.length + 1
        if (project.id === 'three-pyramids') {
          // largest center, then medium, then small
          importance = idx === 0 ? 3 : idx === 1 ? 2 : 1
        }
        out.push({
          project,
          position: [pos[0], 0, pos[1]],
          key: `${project.id}-${idx}`,
          importance,
        })
      })
    })
    return out
  }, [])

  return (
    <IntroContext.Provider value={{ introPlaying }}>
      <HQContext.Provider value={hqContextValue}>
      <div className="world-map-container" data-theme={theme}>
        {/* HQ transition overlay: black during entering, then fade out when inside */}
        <div
          className="world-map-hq-overlay"
          style={{
            opacity: hqPhase === 'entering' ? 1 : hqPhase === 'inside' ? 0 : 0,
            pointerEvents: hqPhase === 'entering' ? 'auto' : 'none',
          }}
          aria-hidden="true"
        />
        <Canvas
          shadows
          dpr={[1, 1.25]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.15
          }}
          className="world-canvas world-canvas-crosshair"
        >
          <color attach="background" args={[NIGHT_SKY]} />
          <PerspectiveCamera makeDefault position={DEFAULT_CAMERA_POSITION} fov={38} />
          <ThemeDriver />
          <ambientLight ref={ambientRef} intensity={0.14} />
          <directionalLight
            ref={directionalRef}
            position={[8, 22, 6]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={512}
            shadow-mapSize-height={512}
            shadow-bias={-0.0003}
            shadow-normalBias={0.02}
          />

          <fog attach="fog" args={[NIGHT_FOG, 24, 52]} />
          <FogController />
          <WireframeOverlay />
          <SatelliteEgg />

          {hqPhase !== 'inside' && (
            <>
          <IntroAwareCityGroup cityGroupRef={cityGroupRef}>
            <Suspense fallback={null}>
              <WaterBlockerPlane />
              <WaterSurface />
              <WaterFoam />
              <WaterSunStreak />
              <MorningWaterOverlay />
              <MorningSeaCap />
              <Ships />
              <DistantShips />
              <Dolphins />
              <SeaMountains />
              <LighthouseWaterHit />
              <IslandGround />
              <Beach />
              <CornerVolcano />
              <ConstructionCrane />

              <PyramidPlaza />
              <AsphaltStreets />
              <StreetLamps />
              <CityNeonLights />
              <TrafficLights />
              <Ambulance />
              <Lighthouse />
              <SkyGradient />
              <SunAndRays onArchitectClick={() => setActiveModal({ type: 'about' })} />
              <Stars />
              <Moon onArchitectClick={() => setActiveModal({ type: 'about' })} />
              <LayeredMountainRidges />
              <HorizonSilhouettes />
              <WraparoundBackground />
              <CloudLayer />
              <BirdFlock />
              <FlyoverPlane />
              <Satellites />
              <PeopleWalking />
              <CarsMoving />
              <SimpleTrees />
              <SeatingArea />
              <MicroAirport
                  onHover={(h) => setSelectedBuilding(h ? 'airport' : (prev) => (prev === 'airport' ? null : prev))}
                  onClick={() => { setSelectedBuilding('airport'); lhWorld?.addSecretClick('airport') }}
                />

              {buildingEntries.map(({ project, position, key, importance }) => (
                <Building
                  key={key}
                  position={position}
                  project={project}
                  onClick={(id, worldPos) => handleBuildingClick(id, worldPos)}
                  onHover={(hovered) => setSelectedBuilding(hovered ? project.id : null)}
                  sustainabilityMode={sustainabilityMode}
                  selectedId={selectedBuilding}
                  isSelected={selectedBuilding === project.id}
                  index={projects.indexOf(project)}
                  importance={importance}
                />
              ))}
            </Suspense>
          </IntroAwareCityGroup>

          <HQTransitionRunner />
          <BuildingFlyRunner />
          <CameraControlsWithIntro
            controlsRef={controlsRef}
            resetCameraRef={resetCameraRef}
            defaultPosition={DEFAULT_CAMERA_POSITION}
            defaultTarget={DEFAULT_CAMERA_TARGET}
            enabled={hqPhase === 'idle' && !flyToBuildingId}
            flying={!!flyToBuildingId}
          />
          <ScenePrecompile />
            </>
          )}
        </Canvas>

        <WelcomeOverlay show={showWelcome} />

      <NavigationUI
        selectedBuilding={selectedBuilding}
        sustainabilityMode={sustainabilityMode}
        onSustainabilityToggle={() => setSustainabilityMode(!sustainabilityMode)}
        theme={theme}
        onResetCamera={() => resetCameraRef.current?.()}
      />

      <button
        type="button"
        className="world-map-inbox-btn"
        onClick={() => setActiveModal({ type: 'inbox' })}
        aria-label="Open inbox (1 unread)"
      >
        <span className="world-map-inbox-icon" aria-hidden="true">✉</span>
        <span className="world-map-inbox-badge" aria-hidden="true">1</span>
      </button>
      <button
        type="button"
        className="world-map-btn"
        onClick={() => setShowMapModal(true)}
        aria-label="Open island map"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /></svg>
        Map
      </button>

      {showMapModal && (
        <div className="world-map-modal-overlay" onClick={() => setShowMapModal(false)}>
          <div className="world-map-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="world-map-modal-title">Island Map</h2>
            <div className="world-map-2d">
              <svg viewBox="-12 -13 24 22" className="world-map-2d-svg">
                {/* Water */}
                <rect x="-13" y="-14" width="26" height="24" fill="#1e3a5f" />
                {/* Island: grass/land */}
                <rect x="-10.5" y="-11" width="21" height="19" rx="1.5" fill="#2d5a3d" stroke="rgba(91,30,45,0.5)" strokeWidth="0.2" />
                {/* Roads: darker gray */}
                {ROAD_SEGMENTS.map((seg, i) => {
                  const s = 0.95
                  if (seg.type === 'h') {
                    return <line key={`road-${i}`} x1={seg.x0 * s} y1={-seg.z * s} x2={seg.x1 * s} y2={-seg.z * s} stroke="#3d3d42" strokeWidth={seg.w * 0.35} strokeLinecap="round" />
                  }
                  return <line key={`road-${i}`} x1={seg.x * s} y1={-seg.z1 * s} x2={seg.x * s} y2={-seg.z0 * s} stroke="#3d3d42" strokeWidth={seg.w * 0.35} strokeLinecap="round" />
                })}
                {/* Landmarks: colored by type */}
                {buildingEntries.map(({ project, position }) => {
                  const [x, , z] = position
                  const sx = x * 0.95
                  const sy = -z * 0.95
                  const colors = { resort: '#c9a227', 'elementary-school': '#4a90d9', 'mixed-use': '#7b68a6', hospital: '#c75b5b', 'tower-east': '#5b8a72', 'tower-west': '#5b8a72', 'twin-towers': '#5b8a72', 'three-pyramids': '#b8860b', 'life-line-hospital': '#c75b5b' }
                  const fill = colors[project.id] || '#e6e1da'
                  return (
                    <g key={project.id} onClick={() => { setFlyToBuildingId(project.id); setShowMapModal(false) }} style={{ cursor: 'pointer' }}>
                      <circle cx={sx} cy={sy} r="0.6" fill={fill} stroke="rgba(255,255,255,0.4)" strokeWidth="0.12" className="world-map-2d-dot" />
                      <text x={sx} y={sy - 1.15} textAnchor="middle" fontSize="0.85" fill="rgba(245,245,245,0.95)" className="world-map-2d-label">{project.title.length > 12 ? project.title.slice(0, 10) + '…' : project.title}</text>
                    </g>
                  )
                })}
              </svg>
            </div>
            <div className="world-map-2d-legend">
              <span><i style={{ background: '#1e3a5f' }} /></span> Water
              <span><i style={{ background: '#2d5a3d' }} /></span> Land
              <span><i style={{ background: '#3d3d42' }} /></span> Roads
            </div>
            <p className="world-map-modal-hint">Click a building to fly there</p>
            <button type="button" className="world-map-modal-close" onClick={() => setShowMapModal(false)}>Close</button>
          </div>
        </div>
      )}

      {selectedBuilding && (
        <div className={`building-info ${sustainabilityMode ? 'building-info-xray' : ''}`}>
          {selectedBuilding === 'airport' ? (
            <>
              <h3>Airport</h3>
              <p>Coming soon (Graduation project 2026/27)!</p>
              <span className="year">2026/27</span>
            </>
          ) : (
            <>
              <h3>{projects.find((p) => p.id === selectedBuilding)?.title}</h3>
              <p>{projects.find((p) => p.id === selectedBuilding)?.concept}</p>
              <span className="year">{projects.find((p) => p.id === selectedBuilding)?.year}</span>
            </>
          )}
        </div>
      )}

      {timeStory && (
        <div className="time-story" role="status">
          {timeStory}
        </div>
      )}

      {lhWorld?.showVolcanoMessage && (
        <div
          className="volcano-console-message"
          role="status"
          onClick={() => lhWorld?.setShowVolcanoMessage(false)}
        >
          Chaos fuels design.
        </div>
      )}

      {lhWorld?.satelliteMessage && (
        <div
          className="volcano-console-message satellite-message"
          role="status"
          onClick={() => lhWorld?.setSatelliteMessage(false)}
        >
          You left the island.
        </div>
      )}

      {/* Content modals: project, lighthouse, about, inbox — no navigation */}
      {activeModal && (
        <div className="world-content-modal-overlay" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true">
          <div
            className={`world-content-modal-panel ${activeModal.type === 'about' ? 'world-content-modal-panel-architect' : ''} ${activeModal.type === 'lighthouse' ? 'world-content-modal-panel-lighthouse' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="world-content-modal-close" onClick={() => setActiveModal(null)} aria-label="Close">×</button>
            {activeModal.type === 'project' && (
              <div className="world-content-modal-inner">
                <ProjectDetail projectId={activeModal.id} embedded onClose={() => setActiveModal(null)} />
              </div>
            )}
            {activeModal.type === 'lighthouse' && (
              <div className="world-content-modal-inner world-content-modal-lighthouse">
                <LighthouseModalContent onClose={() => setActiveModal(null)} />
              </div>
            )}
            {activeModal.type === 'about' && (
              <div className="world-content-modal-inner">
                <About embedded onClose={() => setActiveModal(null)} />
              </div>
            )}
            {activeModal.type === 'inbox' && (
              <div className="world-content-modal-inner">
                <InboxModalContent onClose={() => setActiveModal(null)} />
              </div>
            )}
          </div>
        </div>
      )}
      </div>
      </HQContext.Provider>
    </IntroContext.Provider>
  )
}

export default WorldMap
