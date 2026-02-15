// Building.jsx — Gothic Voxel City
import { useMemo, useRef, useState, memo } from "react"
import { Box, useCursor } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useTheme } from "../context/ThemeContext"

const STONE = '#7A7A7A'
const MAROON = '#5B1E2D'
const CHARCOAL = '#1B1B1B'
const HOVER_GREEN = '#3eea6d' // green hover layer + x-ray sustainable
const SAND = '#C2B280'
const MOONLIGHT = '#AAB7C4'
const OXIDE = '#8C2F39'
const STONE_DARK = '#5A5A5A'
const TRIM_DARK = '#4a4a4a'

const STONE_DAY = '#8e8e86'
const SAND_DAY = '#d4c490'
const CHARCOAL_DAY = '#2e2e32'
const STONE_DARK_DAY = '#6a6a62'
const MOONLIGHT_DAY = '#b8c8d8'

const TOWER_EAST_DAY = '#181C22'
const TOWER_WEST_DAY = '#1C1F26'
const HOSPITAL_DAY = '#E8ECEF'
const PYRAMID_BASE_DAY = '#D6B98C'
const MIXEDUSE_DAY = '#2A3655'

const XRAY_GREEN = '#3eea6d'

function getDayBase(themeColor, buildingType, projectId) {
  if (buildingType === 'tower') return projectId === 'tower-west' ? TOWER_WEST_DAY : TOWER_EAST_DAY
  if (buildingType === 'hospital') return HOSPITAL_DAY
  if (buildingType === 'pyramid') return PYRAMID_BASE_DAY
  if (buildingType === 'mixed-use') return MIXEDUSE_DAY
  if (themeColor === SAND) return SAND_DAY
  if (themeColor === STONE) return STONE_DAY
  if (themeColor === CHARCOAL) return CHARCOAL_DAY
  if (themeColor === STONE_DARK) return STONE_DARK_DAY
  if (themeColor === MOONLIGHT) return MOONLIGHT_DAY
  return STONE_DAY
}

function Building({
  position = [0, 0, 0],
  project,
  onClick,
  onHover,
  sustainabilityMode = false,
  selectedId = null,
  isSelected = false,
  importance = 1,
}) {
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)
  useCursor(hovered, "crosshair", "crosshair")

  const buildingType = project?.buildingType ?? "default"
  const { themeBlend } = useTheme()

  const themeColor = useMemo(() => {
    const c = (project?.concept || '').toLowerCase()
    if (c.includes('hospitality') || c.includes('resort')) return SAND
    if (c.includes('education')) return STONE
    if (c.includes('mixed')) return STONE_DARK
    if (c.includes('vertical')) return CHARCOAL
    if (c.includes('heritage') || c.includes('pyramid')) return SAND
    if (c.includes('healing')) return MOONLIGHT
    return STONE
  }, [project])

  const palette = useMemo(() => {
    const rawBase = getMaterialColor({ project, sustainabilityMode, hovered, themeColor, isSelected })
    const c = new THREE.Color(rawBase)
    if (!sustainabilityMode && themeBlend > 0 && (rawBase === themeColor || rawBase === STONE_DARK || buildingType === 'tower' || buildingType === 'hospital' || buildingType === 'pyramid' || buildingType === 'mixed-use'))
      c.lerp(new THREE.Color(getDayBase(themeColor, buildingType, project?.id)), themeBlend)
    const base = '#' + c.getHexString()
    const emissive = (sustainabilityMode || hovered) ? HOVER_GREEN : '#000000'
    const emissiveIntensity = sustainabilityMode ? 0.35 : hovered ? 0.18 : 0
    const roughness = 0.85 - 0.12 * themeBlend
    const metalness = 0.1 + 0.06 * themeBlend
    return { base, emissive, emissiveIntensity, themeColor, roughness, metalness }
  }, [project, sustainabilityMode, hovered, themeColor, isSelected, themeBlend, buildingType])

  const handleOver = () => { setHovered(true); onHover?.(true) }
  const handleOut = () => { setHovered(false); onHover?.(false) }

  const renderBuilding = () => {
    if (buildingType === "resort") return <Resort material={palette} importance={importance} />
    if (buildingType === "school") return <School material={palette} importance={importance} />
    if (buildingType === "mixed-use") return <MixedUse material={palette} importance={importance} />
    if (buildingType === "tower") return <Tower material={palette} importance={importance} projectId={project?.id} />
    if (buildingType === "pyramid") return <Pyramid material={palette} importance={importance} />
    if (buildingType === "hospital") return <Hospital material={palette} importance={importance} />
    if (buildingType === "gothic-church") return <GothicChurch material={palette} importance={importance} />
    if (buildingType === "hq") return <Headquarters material={palette} importance={importance} />
    return <DefaultBuilding material={palette} importance={importance} />
  }

  const height = getBuildingHeight(buildingType, importance)

  const worldPosRef = useRef(new THREE.Vector3())
  const handleClick = (e) => {
    e.stopPropagation()
    if (groupRef.current) {
      groupRef.current.getWorldPosition(worldPosRef.current)
      onClick?.(project?.id, worldPosRef.current.clone())
    } else {
      onClick?.(project?.id)
    }
  }
  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleClick}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
    >
      {(hovered || (sustainabilityMode && isSelected)) && (
        <OutlineBox height={height} buildingType={buildingType} isSelected={sustainabilityMode && isSelected} />
      )}
      {renderBuilding()}
    </group>
  )
}

export default memo(Building)

function getBuildingHeight(type, importance) {
  const pyramidH = importance === 3 ? 4.2 : importance === 2 ? 3.2 : 2.2
  const h = { resort: 2.5, school: 3, 'mixed-use': 4, tower: 9 + importance * 1.2, pyramid: pyramidH, hospital: 3.12, default: 4 }
  return h[type] ?? 4 + importance
}

function OutlineBox({ height, buildingType, isSelected }) {
  const w = buildingType === 'tower' ? 1.4 : buildingType === 'hospital' ? 3.8 : buildingType === 'mixed-use' ? 4.2 : buildingType === 'pyramid' ? 1.8 : 3
  const d = buildingType === 'tower' ? 1.4 : buildingType === 'hospital' ? 2.9 : buildingType === 'mixed-use' ? 3.4 : buildingType === 'pyramid' ? 1.8 : 2.5
  const color = HOVER_GREEN
  const opacity = isSelected ? 0.35 : 0.25
  return (
    <mesh position={[0, height / 2 + 0.2, 0]} raycast={() => null} castShadow={false} receiveShadow={false}>
      <boxGeometry args={[w + 0.15, height + 0.3, d + 0.15]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

// Shared window materials (one per variant) — avoids hundreds of MeshStandardMaterials
const WIN_MATS = [
  new THREE.MeshBasicMaterial({ color: "#2b2b2b" }),
  new THREE.MeshBasicMaterial({ color: "#a98b2a" }),
  new THREE.MeshBasicMaterial({ color: "#e8c547" }),
  new THREE.MeshBasicMaterial({ color: "#c9a227" }),
  new THREE.MeshBasicMaterial({ color: "#e8dcc8" }),
  new THREE.MeshBasicMaterial({ color: "#b89b2a" }),
]
const WINDOW_DARK = '#1a1a1a'
const WINDOW_LIT = '#e8c547'
const FLICKER_INTERVAL_MIN = 1.2
const FLICKER_INTERVAL_MAX = 2.0
const FLICKER_LERP_SPEED = 0.06
function pseudoRand(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}
function getWindowModes(count, seed) {
  return Array.from({ length: count }, (_, i) => {
    const r = pseudoRand(seed + i * 7)
    if (r < 0.2) return 'off'
    if (r < 0.65) return 'steady'
    return 'flicker'
  })
}
function brightnessForMode(mode, t) {
  if (mode === 'off') return 0
  if (mode === 'steady') return 1
  return Math.max(0, 0.4 + 0.5 * Math.sin(t * 3))
}

function getMaterialColor({ project, sustainabilityMode, hovered, themeColor, isSelected }) {
  if (sustainabilityMode) return XRAY_GREEN
  return themeColor
}

function StdMat({ material, metalness, roughness }) {
  return (
    <meshStandardMaterial
      color={material.base}
      emissive={material.emissive}
      emissiveIntensity={material.emissiveIntensity}
      metalness={material.metalness ?? metalness ?? 0.1}
      roughness={material.roughness ?? roughness ?? 0.85}
    />
  )
}

const STAINED_GLASS = ['#2d5a87', '#8b4513', '#4a7c59', '#8b4513', '#2d5a87']
function GothicChurch({ material, importance = 1 }) {
  const h = 5 + importance * 2
  const winCount = 5
  const winMats = useMemo(() => Array.from({ length: winCount }, () => new THREE.MeshBasicMaterial({ color: '#1a1a2e' })), [])
  const baseY = 0.2
  const yStart = h * 0.55
  const yEnd = h * 0.92
  const lastThrottleRef = useRef(0)
  const modesRef = useRef(getWindowModes(winCount, 19))
  const currentBrightnessRef = useRef([])
  const { themeBlend } = useTheme()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (themeBlend < 0.5) {
      if (t - lastThrottleRef.current > FLICKER_INTERVAL_MIN + pseudoRand(Math.floor(t * 2)) * (FLICKER_INTERVAL_MAX - FLICKER_INTERVAL_MIN)) {
        modesRef.current = getWindowModes(winCount, 19 + Math.floor(t))
        lastThrottleRef.current = t
      }
      if (currentBrightnessRef.current.length !== winCount) currentBrightnessRef.current = Array(winCount).fill(0)
      winMats.forEach((mat, i) => {
        const targetB = brightnessForMode(modesRef.current[i], t)
        let cur = currentBrightnessRef.current[i]
        cur += (targetB - cur) * FLICKER_LERP_SPEED
        currentBrightnessRef.current[i] = cur
        mat.color.lerpColors(new THREE.Color('#1a1a2e'), new THREE.Color(STAINED_GLASS[i]), cur)
      })
    } else {
      winMats.forEach((mat, i) => mat.color.set(STAINED_GLASS[i]))
    }
  })
  const row1Y = baseY + yStart + (yEnd - yStart) * 0.33
  const row2Y = baseY + yStart + (yEnd - yStart) * 0.66
  return (
    <group>
      {/* Base plinth */}
      <Box args={[2.7, 0.2, 2.7]} position={[0, 0.1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={TRIM_DARK} roughness={0.9} metalness={0.05} />
      </Box>
      <Box args={[2.5, h, 2.5]} position={[0, 0.2 + h / 2, 0]} castShadow receiveShadow>
        <StdMat material={material} />
      </Box>
      {/* Vertical buttress ribs */}
      {[[-1.3, 0], [1.3, 0], [0, -1.3], [0, 1.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.2 + h / 2, z]} castShadow receiveShadow>
          <boxGeometry args={[0.18, h + 0.1, 0.18]} />
          <meshStandardMaterial color={TRIM_DARK} roughness={0.85} metalness={0.06} />
        </mesh>
      ))}
      <Box args={[1, h * 0.6, 2]} position={[-1.8, 0.2 + (h * 0.6) / 2, 0]} castShadow receiveShadow>
        <StdMat material={material} />
      </Box>
      <Box args={[1, h * 0.6, 2]} position={[1.8, 0.2 + (h * 0.6) / 2, 0]} castShadow receiveShadow>
        <StdMat material={material} />
      </Box>
      {/* Door — base zone */}
      <Box args={[0.55, 0.95, 0.08]} position={[0, 0.2 + 0.6, 1.28]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={CHARCOAL} roughness={0.9} />
      </Box>
      {/* Stained-glass panels — upper 60–90% */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.5 + i * 0.5, row1Y, 1.28]} castShadow={false} receiveShadow={false}>
          <boxGeometry args={[0.35, 0.5, 0.04]} />
          <primitive object={winMats[i]} attach="material" />
        </mesh>
      ))}
      {[0, 1].map((i) => (
        <mesh key={i + 3} position={[-0.25 + i * 0.5, row2Y, 1.28]} castShadow={false} receiveShadow={false}>
          <boxGeometry args={[0.35, 0.45, 0.04]} />
          <primitive object={winMats[i + 3]} attach="material" />
        </mesh>
      ))}
      {/* Pointed roof cap / spire */}
      <Box args={[0.5, 1 + importance, 0.5]} position={[0, 0.2 + h + 0.5 + (1 + importance) / 2, 0]} castShadow>
        <meshStandardMaterial color={TRIM_DARK} roughness={0.85} metalness={0.06} />
      </Box>
      <Box args={[0.25, 0.5, 0.25]} position={[0, 0.2 + h + 1.5 + importance + 0.25, 0]} castShadow={false}>
        <meshStandardMaterial color={TRIM_DARK} roughness={0.8} />
      </Box>
    </group>
  )
}

const HOSPITAL_SECONDARY = '#C9D6DF'
const HOSPITAL_ACCENT = '#4DA3FF'
const HOSPITAL_WINDOW_DAY = '#FFDFA3'
function Hospital({ material, importance = 1 }) {
  const { themeBlend } = useTheme()
  const h = (2.8 + importance * 0.7) * 0.82
  const wingMat = useMemo(() => ({ ...material, base: themeBlend > 0 ? HOSPITAL_SECONDARY : material.base }), [material, themeBlend])
  const winCount = 12
  const winMats = useMemo(() => Array.from({ length: winCount }, () => new THREE.MeshBasicMaterial({ color: WINDOW_DARK })), [])
  const lastThrottleRef = useRef(0)
  const modesRef = useRef(getWindowModes(winCount, 7))
  const currentBrightnessRef = useRef([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (themeBlend < 0.5) {
      if (t - lastThrottleRef.current > FLICKER_INTERVAL_MIN + pseudoRand(Math.floor(t * 2)) * (FLICKER_INTERVAL_MAX - FLICKER_INTERVAL_MIN)) {
        modesRef.current = getWindowModes(winCount, 7 + Math.floor(t))
        lastThrottleRef.current = t
      }
      if (currentBrightnessRef.current.length !== winCount) currentBrightnessRef.current = Array(winCount).fill(0)
      winMats.forEach((mat, i) => {
        const targetB = brightnessForMode(modesRef.current[i], t)
        let cur = currentBrightnessRef.current[i]
        cur += (targetB - cur) * FLICKER_LERP_SPEED
        currentBrightnessRef.current[i] = cur
        mat.color.lerpColors(new THREE.Color(WINDOW_DARK), new THREE.Color(WINDOW_LIT), cur)
      })
    } else {
      winMats.forEach((mat) => mat.color.set(HOSPITAL_WINDOW_DAY))
    }
  })
  return (
    <group>
      {/* Base plinth */}
      <Box args={[3.8, 0.15, 3]} position={[0, 0.075, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={TRIM_DARK} roughness={0.9} metalness={0.05} />
      </Box>
      <Box args={[3.6, h, 2.8]} position={[0, 0.15 + h / 2, 0]} castShadow receiveShadow>
        <StdMat material={material} />
      </Box>
      <Box args={[1.3, h * 0.7, 1.8]} position={[-2.5, 0.15 + (h * 0.7) / 2, 0]} castShadow receiveShadow>
        <StdMat material={wingMat} />
      </Box>
      <Box args={[1.3, h * 0.7, 1.8]} position={[2.5, 0.15 + (h * 0.7) / 2, 0]} castShadow receiveShadow>
        <StdMat material={wingMat} />
      </Box>
      {/* Clear entrance + recessed door */}
      <Box args={[1.1, 1.0, 0.12]} position={[0, 0.15 + 0.7, 1.42]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={TRIM_DARK} roughness={0.85} />
      </Box>
      <Box args={[0.75, 0.9, 0.04]} position={[0, 0.15 + 0.65, 1.44]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={CHARCOAL} roughness={0.9} />
      </Box>
      {/* Ambulance bay canopy */}
      <Box args={[1.6, 0.08, 1.2]} position={[-1.6, 0.15 + 0.95, 1.52]} castShadow receiveShadow>
        <meshStandardMaterial color={TRIM_DARK} roughness={0.85} />
      </Box>
      {/* Horizontal façade lines */}
      {[0.4, 0.65, 0.88].map((frac, i) => (
        <mesh key={i} position={[0, 0.15 + h * frac, 1.42]} castShadow={false} receiveShadow={false}>
          <boxGeometry args={[3.5, 0.04, 0.06]} />
          <meshStandardMaterial color={TRIM_DARK} roughness={0.88} />
        </mesh>
      ))}
      {/* Vertical blue accent strips / window strips */}
      {themeBlend > 0.2 && (
        <>
          <mesh position={[-0.7, 0.15 + h * 0.5, 1.43]} castShadow={false} receiveShadow={false}>
            <boxGeometry args={[0.06, h * 0.85, 0.02]} />
            <meshBasicMaterial color={HOSPITAL_ACCENT} />
          </mesh>
          <mesh position={[0, 0.15 + h * 0.5, 1.43]} castShadow={false} receiveShadow={false}>
            <boxGeometry args={[0.06, h * 0.85, 0.02]} />
            <meshBasicMaterial color={HOSPITAL_ACCENT} />
          </mesh>
          <mesh position={[0.7, 0.15 + h * 0.5, 1.43]} castShadow={false} receiveShadow={false}>
            <boxGeometry args={[0.06, h * 0.85, 0.02]} />
            <meshBasicMaterial color={HOSPITAL_ACCENT} />
          </mesh>
        </>
      )}
      {/* Full-height window rows — upper 60–90% of building */}
      {[0, 1, 2, 3].map((col) => (
        [0, 1, 2].map((row) => {
          const i = col * 3 + row
          const yStart = 0.15 + h * 0.55
          const yEnd = 0.15 + h * 0.92
          const rowY = yStart + (yEnd - yStart) * (row / 2)
          return (
            <mesh key={i} position={[-1.2 + col * 0.85, rowY, 1.44]} castShadow={false} receiveShadow={false}>
              <boxGeometry args={[0.35, 0.5, 0.04]} />
              {themeBlend > 0.4 ? <meshBasicMaterial color={HOSPITAL_WINDOW_DAY} /> : <primitive object={winMats[i]} attach="material" />}
            </mesh>
          )
        })
      ))}
      {/* Red cross — slight emissive in day */}
      <Box args={[0.5, 0.08, 0.04]} position={[0, 0.15 + h * 0.5, 1.44]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={OXIDE} emissive={OXIDE} emissiveIntensity={themeBlend > 0.3 ? 0.12 : 0} roughness={0.9} metalness={0} />
      </Box>
      <Box args={[0.08, 0.7, 0.04]} position={[0, 0.15 + h * 0.5, 1.44]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={OXIDE} emissive={OXIDE} emissiveIntensity={themeBlend > 0.3 ? 0.12 : 0} roughness={0.9} metalness={0} />
      </Box>
      {/* Roofline + roof edge trim */}
      <Box args={[3.65, 0.1, 2.85]} position={[0, 0.15 + h + 0.05, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={TRIM_DARK} roughness={0.85} metalness={0.06} />
      </Box>
      <mesh position={[0, 0.15 + h + 0.08, 1.44]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[3.7, 0.04, 0.04]} />
        <meshStandardMaterial color={TRIM_DARK} roughness={0.86} />
      </mesh>
    </group>
  )
}

function School({ material, importance = 1 }) {
  const h = 2.2 + importance * 1
  const winCount = 10
  const winMats = useMemo(() => Array.from({ length: winCount }, () => new THREE.MeshBasicMaterial({ color: WINDOW_DARK })), [])
  const lastThrottleRef = useRef(0)
  const modesRef = useRef(getWindowModes(winCount, 11))
  const currentBrightnessRef = useRef([])
  const { themeBlend } = useTheme()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (themeBlend < 0.5) {
      if (t - lastThrottleRef.current > FLICKER_INTERVAL_MIN + pseudoRand(Math.floor(t * 2)) * (FLICKER_INTERVAL_MAX - FLICKER_INTERVAL_MIN)) {
        modesRef.current = getWindowModes(winCount, 11 + Math.floor(t))
        lastThrottleRef.current = t
      }
      if (currentBrightnessRef.current.length !== winCount) currentBrightnessRef.current = Array(winCount).fill(0)
      winMats.forEach((mat, i) => {
        const targetB = brightnessForMode(modesRef.current[i], t)
        let cur = currentBrightnessRef.current[i]
        cur += (targetB - cur) * FLICKER_LERP_SPEED
        currentBrightnessRef.current[i] = cur
        mat.color.lerpColors(new THREE.Color(WINDOW_DARK), new THREE.Color(WINDOW_LIT), cur)
      })
    } else {
      winMats.forEach((mat) => mat.color.set(WINDOW_LIT))
    }
  })
  const baseY = 0.15
  const yStart = h * 0.55
  const yEnd = h * 0.92
  const winH = 0.45
  const row1Y = baseY + yStart + (yEnd - yStart) * 0.33
  const row2Y = baseY + yStart + (yEnd - yStart) * 0.66
  return (
    <group>
      {/* Base plinth */}
      <Box args={[5.2, 0.15, 3]} position={[0, 0.075, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={TRIM_DARK} roughness={0.9} metalness={0.05} />
      </Box>
      <Box args={[5, h, 2.8]} position={[0, 0.15 + h / 2, 0]} castShadow receiveShadow>
        <StdMat material={material} />
      </Box>
      <Box args={[2.8, h * 0.5, 2.2]} position={[0, 0.15 + h * 0.5, -0.5]} castShadow receiveShadow>
        <StdMat material={material} />
      </Box>
      {/* Front entrance arch + door — base zone, no windows */}
      <Box args={[1.4, 1.0, 0.15]} position={[0, 0.15 + 0.65, 1.42]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={TRIM_DARK} roughness={0.85} />
      </Box>
      <Box args={[0.9, 0.85, 0.06]} position={[0, 0.15 + 0.62, 1.44]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={CHARCOAL} roughness={0.9} />
      </Box>
      {/* Sign panel above door */}
      <Box args={[1.2, 0.25, 0.08]} position={[0, 0.15 + 1.35, 1.44]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={MAROON} roughness={0.9} />
      </Box>
      {/* Windows in upper 60–90% */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[-2 + i * 1, row1Y, 1.42]} castShadow={false} receiveShadow={false}>
          <boxGeometry args={[0.5, winH, 0.04]} />
          <primitive object={winMats[i]} attach="material" />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i + 5} position={[-2 + i * 1, row2Y, 1.42]} castShadow={false} receiveShadow={false}>
          <boxGeometry args={[0.5, winH, 0.04]} />
          <primitive object={winMats[i + 5]} attach="material" />
        </mesh>
      ))}
      {/* Roof edge trim / cornice */}
      <Box args={[5.15, 0.1, 2.95]} position={[0, 0.15 + h + 0.05, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={TRIM_DARK} roughness={0.85} metalness={0.06} />
      </Box>
    </group>
  )
}

function Headquarters({ material, importance = 1 }) {
  const h = 5 + importance * 2
  return (
    <group>
      <Box args={[2.5, h, 2.5]} position={[0, h / 2, 0]} castShadow receiveShadow>
        <StdMat material={material} />
      </Box>
      <Box args={[1.6, h * 0.6, 2]} position={[-2, (h * 0.6) / 2, 0.3]} castShadow receiveShadow>
        <StdMat material={material} />
      </Box>
      <Box args={[2.8, 0.6, 2.8]} position={[0, h + 0.3, 0]} castShadow>
        <StdMat material={material} />
      </Box>
    </group>
  )
}

const ENERGY_STRIP = '#E6B85C'
const TEAL_GLOW = '#2DD4BF'
const TOWER_TOP_GLOW = '#E8C547'
const FLICKER_THROTTLE = 0.5
function Tower({ material, importance = 1, projectId = 'tower-east' }) {
  const isEast = projectId === 'tower-east'
  const stripRefs = useRef([])
  const stripAuraRefs = useRef([])
  const topGlowRefs = useRef([])
  const beaconHaloRef = useRef(null)
  const lastFlickerRef = useRef(0)
  const beaconFlickerRef = useRef(1)
  const { themeBlend } = useTheme()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const nightMult = 1 - themeBlend
    // Side strip: brighter at night, slow sine pulse (neon spine)
    const stripPulse = 0.6 + 0.4 * Math.sin(t * 0.9)
    const stripOpacity = themeBlend > 0.6 ? 0.35 : 0.5 + nightMult * (0.45 * stripPulse)
    const stripBright = themeBlend > 0.6 ? 0.8 : 0.85 + nightMult * 0.4
    stripRefs.current.forEach((mesh) => {
      if (mesh?.material) {
        mesh.material.color.set(ENERGY_STRIP)
        mesh.material.opacity = Math.min(1, stripOpacity)
        if (mesh.material.emissive) {
          mesh.material.emissive.set(ENERGY_STRIP)
          mesh.material.emissiveIntensity = nightMult * 0.25 * stripPulse
        }
      }
    })
    stripAuraRefs.current.forEach((mesh) => {
      if (mesh?.material) {
        mesh.material.color.set(ENERGY_STRIP)
        mesh.material.opacity = nightMult * 0.2 * stripPulse
      }
    })
    // Top beacon: flicker (not constant) + stronger range
    if (nightMult > 0.1 && state.clock.elapsedTime - lastFlickerRef.current > FLICKER_THROTTLE) {
      lastFlickerRef.current = state.clock.elapsedTime
      beaconFlickerRef.current = 0.7 + pseudoRand(Math.floor(t * 2)) * 0.4
    }
    const beaconPulse = 0.7 + 0.3 * Math.sin(t * 1.5)
    const topIntensity = nightMult * beaconFlickerRef.current * beaconPulse * 1.4
    topGlowRefs.current.forEach((obj) => {
      const mesh = obj?.isMesh ? obj : obj?.children?.[0]
      if (mesh?.material?.emissiveIntensity !== undefined) {
        mesh.material.emissiveIntensity = topIntensity
      }
    })
    if (beaconHaloRef.current?.material) {
      beaconHaloRef.current.material.opacity = nightMult * (0.18 + 0.08 * Math.sin(t * 1.2))
    }
  })
  const h = 9 + importance * 1.2
  const cols = 3
  const rows = Math.floor((h - 0.8) / 0.58)
  const towerWinGroupCount = 6
  const towerWinGroupMats = useMemo(() => Array.from({ length: towerWinGroupCount }, () => new THREE.MeshBasicMaterial({ color: WINDOW_DARK })), [])
  const towerFlickerRef = useRef(0)
  const towerModesRef = useRef(getWindowModes(towerWinGroupCount, 23))
  const towerBrightnessRef = useRef([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (themeBlend < 0.5) {
      if (t - towerFlickerRef.current > FLICKER_INTERVAL_MIN + pseudoRand(Math.floor(t * 2)) * (FLICKER_INTERVAL_MAX - FLICKER_INTERVAL_MIN)) {
        towerModesRef.current = getWindowModes(towerWinGroupCount, 23 + Math.floor(t))
        towerFlickerRef.current = t
      }
      if (towerBrightnessRef.current.length !== towerWinGroupCount) towerBrightnessRef.current = Array(towerWinGroupCount).fill(0)
      towerWinGroupMats.forEach((mat, i) => {
        const targetB = brightnessForMode(towerModesRef.current[i], t)
        let cur = towerBrightnessRef.current[i]
        cur += (targetB - cur) * FLICKER_LERP_SPEED
        towerBrightnessRef.current[i] = cur
        mat.color.lerpColors(new THREE.Color(WINDOW_DARK), new THREE.Color(TOWER_TOP_GLOW), cur)
      })
    } else {
      towerWinGroupMats.forEach((mat) => mat.color.set(WINDOW_LIT))
    }
  })
  return (
    <group>
      {/* Beveled base plinth */}
      <Box args={[1.52, 0.28, 1.52]} position={[0, 0.14, 0]} castShadow receiveShadow>
        <StdMat material={material} />
      </Box>
      <Box args={[1.38, 0.08, 1.38]} position={[0, 0.32, 0]} castShadow receiveShadow>
        <StdMat material={material} />
      </Box>
      {/* Main shaft */}
      <Box args={[1.32, h - 0.4, 1.32]} position={[0, 0.4 + (h - 0.4) / 2, 0]} castShadow receiveShadow>
        <StdMat material={material} />
      </Box>
      {/* Vertical facade lines — teal edge hint in day */}
      {[[0.68, 0.68], [0.68, -0.68], [-0.68, 0.68], [-0.68, -0.68]].map(([sx, sz], idx) => (
        <mesh key={idx} position={[sx, h * 0.5, sz]} castShadow={false} receiveShadow={false}>
          <boxGeometry args={[0.04, h * 0.92, 0.04]} />
          <meshBasicMaterial color={themeBlend > 0.3 ? TEAL_GLOW : STONE_DARK} transparent opacity={themeBlend > 0.3 ? 0.4 : 1} />
        </mesh>
      ))}
      {/* Window grid — day: golden (west) or static; night: flicker by group */}
      {Array.from({ length: cols * rows * 2 }).map((_, idx) => {
        const face = idx < cols * rows ? 1 : -1
        const i = idx % (cols * rows)
        const col = i % cols
        const row = Math.floor(i / cols)
        const px = (col - 1) * 0.42 * face
        const py = 0.52 + row * 0.58
        const useGolden = !isEast && themeBlend > 0.4
        const useNightFlicker = themeBlend < 0.5
        return (
          <mesh key={idx} position={[0.68 * face, py, px]} castShadow={false} receiveShadow={false}>
            <boxGeometry args={[0.1, 0.32, 0.025]} />
            {useGolden ? <meshBasicMaterial color="#D4B56A" /> : useNightFlicker ? <primitive object={towerWinGroupMats[idx % towerWinGroupCount]} attach="material" /> : <primitive object={WIN_MATS[idx % WIN_MATS.length]} attach="material" />}
          </mesh>
        )
      })}
      {/* Vertical LED strip — core (brighter, intentional neon spine) */}
      <mesh ref={(el) => (stripRefs.current[0] = el)} position={[0.69, h * 0.5, 0]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[0.035, h * 0.88, 0.02]} />
        <meshStandardMaterial color={ENERGY_STRIP} emissive={ENERGY_STRIP} emissiveIntensity={0} transparent opacity={0.9} />
      </mesh>
      {/* Strip aura (slightly behind) for core+halo */}
      <mesh ref={(el) => (stripAuraRefs.current[0] = el)} position={[0.695, h * 0.5, 0]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[0.06, h * 0.88, 0.02]} />
        <meshBasicMaterial color={ENERGY_STRIP} transparent opacity={0.25} depthWrite={false} />
      </mesh>
      <mesh ref={(el) => (stripRefs.current[1] = el)} position={[0, h * 0.5, 0.69]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[0.02, h * 0.88, 0.035]} />
        <meshStandardMaterial color={ENERGY_STRIP} emissive={ENERGY_STRIP} emissiveIntensity={0} transparent opacity={0.9} />
      </mesh>
      <mesh ref={(el) => (stripAuraRefs.current[1] = el)} position={[0, h * 0.5, 0.695]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[0.02, h * 0.88, 0.06]} />
        <meshBasicMaterial color={ENERGY_STRIP} transparent opacity={0.25} depthWrite={false} />
      </mesh>
      {!isEast && (
        <>
          <mesh ref={(el) => (stripRefs.current[2] = el)} position={[-0.69, h * 0.5, 0]} castShadow={false} receiveShadow={false}>
            <boxGeometry args={[0.035, h * 0.75, 0.02]} />
            <meshStandardMaterial color={ENERGY_STRIP} emissive={ENERGY_STRIP} emissiveIntensity={0} transparent opacity={0.9} />
          </mesh>
          <mesh ref={(el) => (stripAuraRefs.current[2] = el)} position={[-0.695, h * 0.5, 0]} castShadow={false} receiveShadow={false}>
            <boxGeometry args={[0.06, h * 0.75, 0.02]} />
            <meshBasicMaterial color={ENERGY_STRIP} transparent opacity={0.25} depthWrite={false} />
          </mesh>
        </>
      )}
      {/* Crown */}
      <Box args={[1.48, 0.12, 1.48]} position={[0, h + 0.06, 0]} castShadow>
        {!isEast && themeBlend > 0.4 ? (
          <meshStandardMaterial color="#3A3F4B" roughness={0.85} metalness={0.1} />
        ) : (
          <StdMat material={material} />
        )}
      </Box>
      <Box args={[1.38, 0.35, 1.38]} position={[0, h + 0.27, 0]} castShadow>
        <StdMat material={material} />
      </Box>
      <Box args={[1.18, 0.4, 1.18]} position={[0, h + 0.55, 0]} castShadow>
        <StdMat material={material} />
      </Box>
      {isEast ? (
        <>
          <Box args={[0.9, 0.15, 0.9]} position={[0, h + 0.85, 0]} castShadow={false} receiveShadow={false}>
            <meshBasicMaterial color={SAND} />
          </Box>
          <Box ref={(el) => (topGlowRefs.current[0] = el)} args={[0.28, 0.65, 0.28]} position={[0, h + 1.28, 0]} castShadow={false} receiveShadow={false}>
            <meshStandardMaterial color={SAND} emissive={TOWER_TOP_GLOW} emissiveIntensity={0} />
          </Box>
          <mesh ref={(el) => (topGlowRefs.current[1] = el)} position={[0, h + 1.65, 0]} castShadow={false} receiveShadow={false}>
            <sphereGeometry args={[0.14, 10, 8]} />
            <meshStandardMaterial color={TOWER_TOP_GLOW} emissive={TOWER_TOP_GLOW} emissiveIntensity={0} />
          </mesh>
          {/* Beacon halo — visible from far, subtle glow */}
          <mesh ref={beaconHaloRef} position={[0, h + 1.65, 0]} castShadow={false} receiveShadow={false}>
            <sphereGeometry args={[0.32, 16, 12]} />
            <meshBasicMaterial color={TOWER_TOP_GLOW} transparent opacity={0} depthWrite={false} />
          </mesh>
        </>
      ) : (
        <>
          <Box args={[0.85, 0.18, 0.85]} position={[0, h + 0.82, 0]} castShadow>
            <StdMat material={material} />
          </Box>
          <Box ref={(el) => (topGlowRefs.current[0] = el)} args={[0.22, 0.4, 0.22]} position={[0, h + 1.12, 0]} castShadow={false} receiveShadow={false}>
            <meshStandardMaterial color={MAROON} emissive={TOWER_TOP_GLOW} emissiveIntensity={0} />
          </Box>
          <mesh ref={(el) => (topGlowRefs.current[1] = el)} position={[0, h + 1.58, 0]} castShadow={false} receiveShadow={false}>
            <sphereGeometry args={[0.12, 10, 8]} />
            <meshStandardMaterial color={TOWER_TOP_GLOW} emissive={TOWER_TOP_GLOW} emissiveIntensity={0} />
          </mesh>
          <mesh ref={beaconHaloRef} position={[0, h + 1.58, 0]} castShadow={false} receiveShadow={false}>
            <sphereGeometry args={[0.28, 16, 12]} />
            <meshBasicMaterial color={TOWER_TOP_GLOW} transparent opacity={0} depthWrite={false} />
          </mesh>
        </>
      )}
    </group>
  )
}

function DefaultBuilding({ material, importance = 1 }) {
  const h = 4 + importance * 1.5
  const w = 2.2
  const d = 2.2
  const baseY = 0.18
  const yStart = h * 0.55
  const yEnd = h * 0.92
  const winCount = 8
  const winMats = useMemo(() => Array.from({ length: winCount }, () => new THREE.MeshBasicMaterial({ color: WINDOW_DARK })), [])
  const lastThrottleRef = useRef(0)
  const modesRef = useRef(getWindowModes(winCount, 42))
  const currentBrightnessRef = useRef([])
  const { themeBlend } = useTheme()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (themeBlend < 0.5) {
      if (t - lastThrottleRef.current > FLICKER_INTERVAL_MIN + pseudoRand(Math.floor(t * 2)) * (FLICKER_INTERVAL_MAX - FLICKER_INTERVAL_MIN)) {
        modesRef.current = getWindowModes(winCount, 42 + Math.floor(t))
        lastThrottleRef.current = t
      }
      if (currentBrightnessRef.current.length !== winCount) currentBrightnessRef.current = Array(winCount).fill(0)
      winMats.forEach((mat, i) => {
        const targetB = brightnessForMode(modesRef.current[i], t)
        let cur = currentBrightnessRef.current[i]
        cur += (targetB - cur) * FLICKER_LERP_SPEED
        currentBrightnessRef.current[i] = cur
        mat.color.lerpColors(new THREE.Color(WINDOW_DARK), new THREE.Color(WINDOW_LIT), cur)
      })
    } else {
      winMats.forEach((mat) => mat.color.set(WINDOW_LIT))
    }
  })
  const row1Y = baseY + yStart + (yEnd - yStart) * 0.33
  const row2Y = baseY + yStart + (yEnd - yStart) * 0.66
  const winPositions = [
    [-0.6, row1Y, 1.02], [0.6, row1Y, 1.02], [-0.6, row2Y, 1.02], [0.6, row2Y, 1.02],
    [-1.02, row1Y, 0.6], [-1.02, row1Y, -0.6], [-1.02, row2Y, 0.6], [-1.02, row2Y, -0.6],
  ]
  return (
    <group>
      {/* Base plinth */}
      <Box args={[w + 0.4, 0.18, d + 0.4]} position={[0, 0.09, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={TRIM_DARK} roughness={0.9} metalness={0.05} />
      </Box>
      <Box args={[w, h, d]} position={[0, 0.18 + h / 2, 0]} castShadow receiveShadow>
        <StdMat material={material} />
      </Box>
      {/* Corner trims / pilasters */}
      {[[1,1],[1,-1],[-1,1],[-1,-1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (w/2 + 0.04), 0.18 + h/2, sz * (d/2 + 0.04)]} castShadow receiveShadow>
          <boxGeometry args={[0.08, h + 0.05, 0.08]} />
          <meshStandardMaterial color={TRIM_DARK} roughness={0.85} metalness={0.08} />
        </mesh>
      ))}
      {/* Door — recessed + steps */}
      <Box args={[0.5, 0.08, 0.5]} position={[0.55, 0.22, 1.02]} castShadow receiveShadow>
        <meshStandardMaterial color={TRIM_DARK} roughness={0.9} />
      </Box>
      <Box args={[0.44, 0.7, 0.04]} position={[0.55, 0.6, 1.04]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={CHARCOAL} roughness={0.9} />
      </Box>
      {/* Full-height window band (two faces) */}
      {winPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow={false} receiveShadow={false}>
          <boxGeometry args={[0.32, 0.5, 0.03]} />
          <primitive object={winMats[i]} attach="material" />
        </mesh>
      ))}
      {/* Roofline — parapet / cornice */}
      <Box args={[w + 0.12, 0.12, d + 0.12]} position={[0, 0.18 + h + 0.06, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={TRIM_DARK} roughness={0.85} metalness={0.06} />
      </Box>
    </group>
  )
}

function Resort({ material, importance = 1 }) {
  const h = 2 + importance * 0.4
  const winCount = 6
  const winMats = useMemo(() => Array.from({ length: winCount }, () => new THREE.MeshBasicMaterial({ color: WINDOW_DARK })), [])
  const lastThrottleRef = useRef(0)
  const modesRef = useRef(getWindowModes(winCount, 13))
  const currentBrightnessRef = useRef([])
  const { themeBlend } = useTheme()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (themeBlend < 0.5) {
      if (t - lastThrottleRef.current > FLICKER_INTERVAL_MIN + pseudoRand(Math.floor(t * 2)) * (FLICKER_INTERVAL_MAX - FLICKER_INTERVAL_MIN)) {
        modesRef.current = getWindowModes(winCount, 13 + Math.floor(t))
        lastThrottleRef.current = t
      }
      if (currentBrightnessRef.current.length !== winCount) currentBrightnessRef.current = Array(winCount).fill(0)
      winMats.forEach((mat, i) => {
        const targetB = brightnessForMode(modesRef.current[i], t)
        let cur = currentBrightnessRef.current[i]
        cur += (targetB - cur) * FLICKER_LERP_SPEED
        currentBrightnessRef.current[i] = cur
        mat.color.lerpColors(new THREE.Color(WINDOW_DARK), new THREE.Color(WINDOW_LIT), cur)
      })
    } else {
      winMats.forEach((mat) => mat.color.set(WINDOW_LIT))
    }
  })
  return (
    <group>
      {/* Base plinth */}
      <Box args={[3.4, 0.2, 3.4]} position={[0, 0.1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={TRIM_DARK} roughness={0.9} metalness={0.05} />
      </Box>
      <Box args={[2.4, h, 2.4]} position={[0, 0.2 + h / 2, 0]} castShadow receiveShadow>
        <StdMat material={material} />
      </Box>
      <Box args={[1.2, h * 0.65, 1.2]} position={[-1.9, 0.2 + (h * 0.65) / 2, 1.3]} castShadow>
        <StdMat material={material} />
      </Box>
      <Box args={[1.2, h * 0.55, 1.2]} position={[1.7, 0.2 + (h * 0.55) / 2, 0.9]} castShadow>
        <StdMat material={material} />
      </Box>
      {/* Door + lit lobby strip (ground band) */}
      <Box args={[0.6, 0.65, 0.06]} position={[0.4, 0.2 + 0.5, 1.23]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={CHARCOAL} roughness={0.9} />
      </Box>
      <Box args={[1.8, 0.12, 0.04]} position={[0, 0.2 + 0.18, 1.23]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={WINDOW_LIT} emissive={WINDOW_LIT} emissiveIntensity={themeBlend < 0.5 ? 0.4 : 0.15} />
      </Box>
      {/* Full-height windows — upper 60–90% */}
      {[0, 1, 2].map((i) => {
        const rowY = 0.2 + h * 0.55 + (h * 0.37) * (i / 2)
        return (
          <mesh key={i} position={[-0.6 + i * 0.6, rowY, 1.23]} castShadow={false} receiveShadow={false}>
            <boxGeometry args={[0.4, 0.4, 0.03]} />
            <primitive object={winMats[i]} attach="material" />
          </mesh>
        )
      })}
      {[0, 1, 2].map((i) => {
        const rowY = 0.2 + h * 0.6 + (h * 0.32) * (i / 2)
        return (
          <mesh key={i + 3} position={[1.24, rowY, 0.3]} castShadow={false} receiveShadow={false}>
            <boxGeometry args={[0.03, 0.4, 0.35]} />
            <primitive object={winMats[i + 3]} attach="material" />
          </mesh>
        )
      })}
      {/* Rooftop — parapet + terrace rails (balconies) */}
      <mesh position={[0, 0.2 + h + 0.12, 0]} castShadow>
        <boxGeometry args={[2.6, 0.2, 2.6]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.9} />
      </mesh>
      {/* Pool deck edge */}
      <mesh position={[-1.2, 0.18, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 1.2]} />
        <meshStandardMaterial color={MOONLIGHT} transparent opacity={0.4} />
      </mesh>
      <Box args={[1.25, 0.06, 1.25]} position={[-1.2, 0.15, 1.2]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={TRIM_DARK} roughness={0.9} />
      </Box>
      {/* Balcony / terrace rail */}
      <group position={[1.3, 0.2 + h * 0.35, 1.25]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.08, 0.5]} />
          <meshStandardMaterial color={STONE_DARK} />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow={false}>
          <boxGeometry args={[0.55, 0.04, 0.04]} />
          <meshStandardMaterial color={TRIM_DARK} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow={false}>
          <boxGeometry args={[0.04, 0.35, 0.04]} />
          <meshStandardMaterial color={TRIM_DARK} />
        </mesh>
      </group>
    </group>
  )
}

const MIXEDUSE_CORAL = '#E06C75'
const MIXEDUSE_CREAM = '#FFF8E7'
function MixedUse({ material, importance = 1 }) {
  const { themeBlend } = useTheme()
  const h = 3.8 + importance * 0.6
  const baseY = 0.5
  const winCount = 4
  const winMats = useMemo(() => Array.from({ length: winCount }, () => new THREE.MeshBasicMaterial({ color: WINDOW_DARK })), [])
  const lastThrottleRef = useRef(0)
  const modesRef = useRef(getWindowModes(winCount, 17))
  const currentBrightnessRef = useRef([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (themeBlend < 0.5) {
      if (t - lastThrottleRef.current > FLICKER_INTERVAL_MIN + pseudoRand(Math.floor(t * 2)) * (FLICKER_INTERVAL_MAX - FLICKER_INTERVAL_MIN)) {
        modesRef.current = getWindowModes(winCount, 17 + Math.floor(t))
        lastThrottleRef.current = t
      }
      if (currentBrightnessRef.current.length !== winCount) currentBrightnessRef.current = Array(winCount).fill(0)
      winMats.forEach((mat, i) => {
        const targetB = brightnessForMode(modesRef.current[i], t)
        let cur = currentBrightnessRef.current[i]
        cur += (targetB - cur) * FLICKER_LERP_SPEED
        currentBrightnessRef.current[i] = cur
        mat.color.lerpColors(new THREE.Color(WINDOW_DARK), new THREE.Color(MIXEDUSE_CREAM), cur)
      })
    } else {
      winMats.forEach((mat) => mat.color.set(MIXEDUSE_CREAM))
    }
  })
  // Courtyard: windows DOWN — just above door/entrance (special case, not upper 60–90%)
  const lowRow1Y = baseY + 0.95
  const lowRow2Y = baseY + 1.35
  const W = 4.2
  const D = 3.4
  return (
    <group>
      {/* Base plinth */}
      <Box args={[W, 0.18, D]} position={[0, 0.09, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={TRIM_DARK} roughness={0.9} metalness={0.05} />
      </Box>
      <Box args={[W - 0.2, 0.5, D - 0.2]} position={[0, 0.27, 0]} castShadow receiveShadow>
        <StdMat material={material} />
      </Box>
      {/* Ground-floor storefront band (2 tones) */}
      <Box args={[W - 0.6, h * 0.35, D - 0.5]} position={[0, 0.5 + (h * 0.35) / 2, 0]} castShadow receiveShadow>
        <StdMat material={material} />
      </Box>
      <Box args={[W - 1.2, h * 0.4, D - 1.2]} position={[0.1, 0.5 + h * 0.35 + (h * 0.4) / 2, 0]} castShadow receiveShadow>
        <StdMat material={material} />
      </Box>
      <Box args={[W - 2, h * 0.25, D - 1.6]} position={[-0.1, 0.5 + h * 0.75 + (h * 0.25) / 2, 0]} castShadow receiveShadow>
        <StdMat material={material} />
      </Box>
      {/* Vertical edge trims + slight panel variation */}
      {[[1,1],[1,-1],[-1,-1],[-1,1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (W / 2 - 0.05), 0.5 + h * 0.5, sz * (D / 2 - 0.05)]} castShadow={false} receiveShadow={false}>
          <boxGeometry args={[0.12, h + 0.1, 0.12]} />
          <meshStandardMaterial color={TRIM_DARK} roughness={0.85} />
        </mesh>
      ))}
      {/* Window spacing rhythm — extra strip */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-W / 2 + 0.4 + i * (W * 0.32), 0.5 + h * 0.5, D / 2 + 0.02]} castShadow={false} receiveShadow={false}>
          <boxGeometry args={[0.08, h * 0.7, 0.04]} />
          <meshStandardMaterial color={TRIM_DARK} roughness={0.86} />
        </mesh>
      ))}
      {/* Door in storefront — base zone */}
      <Box args={[0.55, 0.75, 0.05]} position={[-0.3, 0.5 + 0.5, D / 2 + 0.02]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={CHARCOAL} roughness={0.9} />
      </Box>
      {/* Front entrance overhang */}
      <Box args={[0.9, 0.06, 0.4]} position={[-0.3, 0.5 + 0.88, D / 2 + 0.22]} castShadow receiveShadow>
        <meshStandardMaterial color={TRIM_DARK} roughness={0.85} />
      </Box>
      {/* Ground storefront band — lit strip */}
      <Box args={[W - 1.2, 0.1, 0.04]} position={[0, 0.52, D / 2 + 0.02]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={MIXEDUSE_CREAM} emissive={MIXEDUSE_CREAM} emissiveIntensity={themeBlend < 0.5 ? 0.25 : 0.08} />
      </Box>
      {/* Courtyard: windows DOWN — just above door, rhythm spacing */}
      {[0, 1].map((i) => (
        <mesh key={i} position={[-W / 2 + 0.5 + i * 1.0, lowRow1Y, D / 2 + 0.02]} castShadow={false} receiveShadow={false}>
          <boxGeometry args={[0.45, 0.4, 0.04]} />
          {themeBlend > 0.4 ? <meshBasicMaterial color={MIXEDUSE_CREAM} /> : <primitive object={winMats[i]} attach="material" />}
        </mesh>
      ))}
      {[0, 1].map((i) => (
        <mesh key={i + 2} position={[-W / 2 + 0.6 + i * 2.0, lowRow2Y, D / 2 + 0.02]} castShadow={false} receiveShadow={false}>
          <boxGeometry args={[0.5, 0.35, 0.04]} />
          {themeBlend > 0.4 ? <meshBasicMaterial color={MIXEDUSE_CREAM} /> : <primitive object={winMats[i + 2]} attach="material" />}
        </mesh>
      ))}
      {/* Roofline + roof outline trim */}
      <Box args={[W - 0.15, 0.1, D - 0.05]} position={[0, 0.5 + h + 0.05, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={TRIM_DARK} roughness={0.85} metalness={0.06} />
      </Box>
      <mesh position={[0, 0.5 + h + 0.08, D / 2 + 0.02]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[W, 0.04, 0.04]} />
        <meshStandardMaterial color={TRIM_DARK} roughness={0.86} />
      </mesh>
    </group>
  )
}

const SAND_LIGHT = '#c9b896'
const SAND_MID = '#C2B280'
const SAND_DARK = '#a89870'
const PYRAMID_DAY = ['#D6B98C', '#C69C6D', '#A67C52', '#E5C07B', '#D6B98C', '#C69C6D']
const PYRAMID_EDGE = '#8a7a5a'

function Pyramid({ material, importance = 1 }) {
  const { themeBlend } = useTheme()
  const scale = importance === 3 ? 1.1 : importance === 2 ? 0.95 : 0.78
  const steps = importance === 3 ? 6 : importance === 2 ? 5 : 4
  const base = (2.2 + importance * 0.4) * scale
  const stepH = 0.45 * scale
  const stepShrink = 0.35 * scale
  const stepColorsNight = [SAND_DARK, SAND_MID, SAND_LIGHT, SAND_MID, SAND_DARK, SAND_MID]
  return (
    <group>
      {/* Base plinth — one step larger */}
      <Box args={[base + stepShrink * 0.6, stepH * 0.35, base + stepShrink * 0.6]} position={[0, stepH * 0.175, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={PYRAMID_EDGE} roughness={0.88} metalness={0.05} />
      </Box>
      {Array.from({ length: steps }).map((_, i) => {
        const w = base - i * stepShrink
        const y = stepH * 0.35 + (i + 0.5) * stepH
        const nightC = new THREE.Color(stepColorsNight[i % stepColorsNight.length])
        const dayC = new THREE.Color(PYRAMID_DAY[i % PYRAMID_DAY.length])
        nightC.lerp(dayC, themeBlend)
        const stepColor = '#' + nightC.getHexString()
        const roughness = 0.82 + (i % 3) * 0.04
        return (
          <group key={i}>
            <Box args={[w, stepH, w]} position={[0, y, 0]} castShadow receiveShadow>
              <meshStandardMaterial color={stepColor} roughness={roughness} metalness={0.06} />
            </Box>
            {/* Edge bevel / inset line — 2-tone step edge */}
            <mesh position={[0, y + stepH / 2 - 0.02, w / 2 + 0.01]} castShadow={false} receiveShadow={false}>
              <boxGeometry args={[w * 0.98, 0.03, 0.04]} />
              <meshStandardMaterial color={PYRAMID_EDGE} roughness={0.9} />
            </mesh>
          </group>
        )
      })}
      {/* Small cap on top */}
      <Box args={[stepShrink * 0.5, stepH * 0.4, stepShrink * 0.5]} position={[0, stepH * 0.35 + steps * stepH, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={PYRAMID_EDGE} roughness={0.85} metalness={0.06} />
      </Box>
    </group>
  )
}
