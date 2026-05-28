// Building.jsx — Gothic Voxel City
import { useMemo, useRef, useState, memo } from "react"
import { Box, Html, useCursor } from "@react-three/drei"
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
const HOSPITAL_DAY = '#B7422E' // deep red brick (day base)
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
    if (buildingType === "museum") return <MuseumOfLovingMaramBuilding material={palette} importance={importance} />
    if (buildingType === "mosque") return <Mosque material={palette} importance={importance} />
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
  const h = { resort: 2.5, museum: 4.6, mosque: 5.5, school: 3, 'mixed-use': 4, tower: 9 + importance * 1.2, pyramid: pyramidH, hospital: 4.2, default: 4 }
  return h[type] ?? 4 + importance
}

function OutlineBox({ height, buildingType, isSelected }) {
  const w = buildingType === 'tower' ? 1.4 : buildingType === 'hospital' ? 12 : buildingType === 'mixed-use' ? 4.2 : buildingType === 'pyramid' ? 1.8 : buildingType === 'museum' ? 6.4 : buildingType === 'mosque' ? 5.2 : 3
  const d = buildingType === 'tower' ? 1.4 : buildingType === 'hospital' ? 5.2 : buildingType === 'mixed-use' ? 3.4 : buildingType === 'pyramid' ? 1.8 : buildingType === 'museum' ? 5.15 : buildingType === 'mosque' ? 4.5 : 2.5
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

// Life Line Hospital — proportion guide: main bar 10×4×2.2, bridge 6×2×1.2, V columns H1.5 base 0.3
const HOSPITAL_BRICK = '#B7422E'
const HOSPITAL_MORTAR = '#8A2C1F'
const HOSPITAL_BRICK_NIGHT = '#5a1f18'
const HOSPITAL_WHITE = '#E7E2D8'
const HOSPITAL_WHITE_NIGHT = '#8a8580'
const HOSPITAL_GLASS = '#7E9FB5'
const HOSPITAL_ROOF = '#E2DDD3'
const HOSPITAL_ROOF_NIGHT = '#7a7570'
const HOSPITAL_SIGNAGE = '#222222'
const HOSPITAL_TRIM = '#1a1a1a'
const HOSPITAL_HVAC = '#a8a8a0'
function Hospital({ material, importance = 1 }) {
  const { themeBlend } = useTheme()
  // Civic anchor scale: +15–20% footprint, +10% height vs base proportion
  const MAIN_W = 11.5
  const MAIN_D = 4.6
  const FLOOR_H = 1.21
  const PARAPET_H = 0.26
  const totalBrickH = FLOOR_H * 2 + PARAPET_H
  const LEVEL_INSET = 0.05
  const BRIDGE_W = 7
  const BRIDGE_D = 2.3
  const BRIDGE_H = 1.35
  const V_COLUMN_H = 1.8
  const BRIDGE_BOTTOM = V_COLUMN_H
  const WING_W = 2.8
  const WING_D = 4
  const WING_H = 1.15
  const RECESS_DEPTH = 0.5
  const brickColor = themeBlend > 0.5 ? HOSPITAL_BRICK : HOSPITAL_BRICK_NIGHT
  const whiteColor = themeBlend > 0.5 ? HOSPITAL_WHITE : HOSPITAL_WHITE_NIGHT
  const roofColor = themeBlend > 0.5 ? HOSPITAL_ROOF : HOSPITAL_ROOF_NIGHT
  const glassColor = themeBlend > 0.4 ? HOSPITAL_GLASS : '#4a5a68'
  const glassEmissive = themeBlend < 0.5 ? '#ffcc66' : null
  const glassEmissiveIntensity = themeBlend < 0.5 ? 1.15 : 0
  const ribDepth = 0.3
  const ribW = 0.2
  const ribSpacing = 0.25
  const zigzagSegs = 12
  const zigzagSegW = MAIN_W / zigzagSegs
  const vCount = 5
  const vBaseW = 0.36
  const vSpacing = MAIN_W / (vCount + 1)
  const winStripY = [FLOOR_H + FLOOR_H * 0.25, FLOOR_H + FLOOR_H * 0.55, FLOOR_H + FLOOR_H * 0.88]

  return (
    <group>
      {/* —— 1) Main two-story brick bar — clear 2 floors, 0.05 inset between levels —— */}
      <Box args={[MAIN_W, FLOOR_H, MAIN_D]} position={[0, FLOOR_H / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={brickColor} roughness={0.88} metalness={0.02} />
      </Box>
      <Box args={[MAIN_W - LEVEL_INSET * 2, FLOOR_H, MAIN_D - LEVEL_INSET * 2]} position={[0, FLOOR_H + FLOOR_H / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={brickColor} roughness={0.88} metalness={0.02} />
      </Box>
      {/* Horizontal brick courses — aligned with window strips, equal spacing —— */}
      {[
        ...winStripY.map((y) => y - 0.06),
        ...winStripY.map((y) => y + 0.06),
        0.2, 0.5, 0.8, FLOOR_H - 0.04,
        FLOOR_H * 2 - 0.08,
      ].sort((a, b) => a - b).map((y, i) => (
        <mesh key={i} position={[0, y, MAIN_D / 2 + 0.02]} castShadow={false} receiveShadow={false}>
          <boxGeometry args={[MAIN_W * 1.01, 0.04, 0.03]} />
          <meshStandardMaterial color={HOSPITAL_MORTAR} roughness={0.92} />
        </mesh>
      ))}

      {/* —— 2) Secondary wing (attached) —— */}
      <Box args={[WING_W, WING_H, WING_D]} position={[MAIN_W / 2 + WING_W / 2 + 0.1, WING_H / 2, -0.1]} castShadow receiveShadow>
        <meshStandardMaterial color={brickColor} roughness={0.88} metalness={0.02} />
      </Box>
      <Box args={[WING_W * 0.7, 0.55, 0.05]} position={[MAIN_W / 2 + WING_W / 2 + 0.1, 0.5, WING_D / 2 + 0.02]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={glassColor} roughness={0.3} metalness={0.05} emissive={glassEmissive} emissiveIntensity={glassEmissiveIntensity} />
      </Box>

      {/* —— 3) Left mass: vertical brick ribs + window strip + signage —— */}
      {Array.from({ length: 8 }, (_, i) => {
        const z = -MAIN_D / 2 + 0.4 + i * (ribSpacing + ribW)
        if (z > MAIN_D / 2 - 0.35) return null
        return (
          <mesh key={`rib-${i}`} position={[-MAIN_W / 2 - ribDepth / 2, FLOOR_H, z]} castShadow receiveShadow>
            <boxGeometry args={[ribDepth, FLOOR_H * 2, ribW]} />
            <meshStandardMaterial color={HOSPITAL_MORTAR} roughness={0.9} metalness={0} />
          </mesh>
        )
      })}
      <Box args={[0.05, FLOOR_H * 1.9, MAIN_D * 0.9]} position={[-MAIN_W / 2 + 0.025, FLOOR_H, 0]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={glassColor} roughness={0.35} metalness={0.05} emissive={glassEmissive} emissiveIntensity={glassEmissiveIntensity} />
      </Box>
      {/* Signage: BLOOD BANK, PHARMACY, LIFELINE HOSPITAL, VASCULAR DEPARTMENT — dark gray, 3D extrusion —— */}
      <group position={[-MAIN_W / 2 - 0.18, FLOOR_H * 0.55, 0.7]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.1, 0.32, 1.1]} />
          <meshStandardMaterial color={HOSPITAL_SIGNAGE} roughness={0.95} />
        </mesh>
      </group>
      <group position={[-MAIN_W / 2 - 0.18, FLOOR_H * 0.55, -0.55]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.1, 0.32, 0.85]} />
          <meshStandardMaterial color={HOSPITAL_SIGNAGE} roughness={0.95} />
        </mesh>
      </group>
      {/* VASCULAR DEPARTMENT on bridge (smaller label) —— */}
      <group position={[0, BRIDGE_BOTTOM + BRIDGE_H / 2 - 0.1, MAIN_D / 2 + 0.5 + BRIDGE_D / 2 + 0.04]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.14, 0.05]} />
          <meshStandardMaterial color={HOSPITAL_SIGNAGE} roughness={0.95} />
        </mesh>
      </group>
      {/* LIFELINE HOSPITAL on WHITE bridge north facade — centered on white panel, above V columns, below roof —— */}
      <group position={[0, BRIDGE_BOTTOM + BRIDGE_H / 2, MAIN_D / 2 + 0.5 + BRIDGE_D / 2 + 0.06]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[BRIDGE_W * 0.65, BRIDGE_H * 0.38, 0.08]} />
          <meshStandardMaterial color={brickColor} roughness={0.95} />
        </mesh>
      </group>

      {/* —— 4) Zigzag roof edge _|‾|_|‾|_ — continuous, even spacing, same depth —— */}
      {Array.from({ length: zigzagSegs }, (_, i) => {
        const x = -MAIN_W / 2 + zigzagSegW * (i + 0.5)
        const up = (i % 2) * 0.12
        const segH = PARAPET_H + up
        return (
          <mesh key={`zig-${i}`} position={[x, FLOOR_H * 2 + segH / 2 + up * 0.5, MAIN_D / 2 + 0.03]} castShadow receiveShadow>
            <boxGeometry args={[zigzagSegW * 0.98, segH, 0.28]} />
            <meshStandardMaterial color={brickColor} roughness={0.88} metalness={0} />
          </mesh>
        )
      })}
      <mesh position={[0, FLOOR_H * 2 - 0.02, MAIN_D / 2]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[MAIN_W + 0.06, 0.04, 0.04]} />
        <meshStandardMaterial color={HOSPITAL_TRIM} roughness={0.9} />
      </mesh>
      <Box args={[MAIN_W, 0.1, MAIN_D]} position={[0, FLOOR_H * 2 + PARAPET_H / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={roofColor} roughness={0.85} metalness={0} />
      </Box>
      {[[-2, 0.2], [-0.5, -0.15], [1, 0.18], [2.2, -0.12]].map(([ox, oz], i) => (
        <Box key={i} args={[0.5, 0.28, 0.45]} position={[ox, FLOOR_H * 2 + PARAPET_H + 0.18, oz]} castShadow receiveShadow>
          <meshStandardMaterial color={HOSPITAL_HVAC} roughness={0.8} metalness={0.05} />
        </Box>
      ))}
      <Box args={[MAIN_W * 0.45, 0.06, 0.08]} position={[0, FLOOR_H * 2 + PARAPET_H + 0.08, -0.35]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={glassColor} roughness={0.3} metalness={0.08} emissive={glassEmissive} emissiveIntensity={glassEmissiveIntensity} />
      </Box>

      {/* —— 5) White vascular bridge: 6×2×1.2, heavy, elevated at 1.5 —— */}
      <Box args={[BRIDGE_W, BRIDGE_H, BRIDGE_D]} position={[0, BRIDGE_BOTTOM + BRIDGE_H / 2, MAIN_D / 2 + 0.5]} castShadow receiveShadow>
        <meshStandardMaterial color={whiteColor} roughness={0.82} metalness={0.03} />
      </Box>
      {/* V-shaped columns: thicker, clean, extend to bridge underside; no glass behind —— */}
      {Array.from({ length: vCount }, (_, i) => {
        const x = -MAIN_W / 2 + vSpacing * (i + 1)
        return (
          <group key={`v-${i}`} position={[x, 0, MAIN_D / 2 + 0.18]}>
            <mesh position={[-vBaseW / 2 - 0.02, V_COLUMN_H / 2, 0.06]} rotation={[0, 0, 0.14]} castShadow receiveShadow>
              <boxGeometry args={[vBaseW, V_COLUMN_H, 0.24]} />
              <meshStandardMaterial color={whiteColor} roughness={0.82} />
            </mesh>
            <mesh position={[vBaseW / 2 + 0.02, V_COLUMN_H / 2, 0.06]} rotation={[0, 0, -0.14]} castShadow receiveShadow>
              <boxGeometry args={[vBaseW, V_COLUMN_H, 0.24]} />
              <meshStandardMaterial color={whiteColor} roughness={0.82} />
            </mesh>
          </group>
        )
      })}

      {/* Canopy slab in front (supported by V columns); nothing between columns and recess —— */}
      <group position={[0, 0, MAIN_D / 2 + 0.12]}>
        <Box args={[2.9, 0.16, 0.5]} position={[0, FLOOR_H * 2 + 0.02, 0.15]} castShadow receiveShadow>
          <meshStandardMaterial color={whiteColor} roughness={0.85} />
        </Box>
      </group>

      {/* Recessed entrance: glass and fins only at back of recess (no glass behind V columns) —— */}
      <group position={[0, 0, MAIN_D / 2 - RECESS_DEPTH]}>
        <mesh position={[0, FLOOR_H, -0.02]} castShadow={false} receiveShadow={false}>
          <boxGeometry args={[2.65, FLOOR_H * 2.02, 0.04]} />
          <meshStandardMaterial color={brickColor} roughness={0.95} />
        </mesh>
        <Box args={[2.6, FLOOR_H * 1.98, 0.06]} position={[0, FLOOR_H, 0.02]} castShadow={false} receiveShadow={false}>
          <meshStandardMaterial color={glassColor} roughness={0.3} metalness={0.05} emissive={glassEmissive} emissiveIntensity={glassEmissiveIntensity} />
        </Box>
        {[-0.6, -0.3, 0, 0.3, 0.6].map((ox, i) => (
          <Box key={i} args={[0.12, FLOOR_H * 1.95, 0.12]} position={[ox, FLOOR_H, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={whiteColor} roughness={0.8} />
          </Box>
        ))}
        <Box args={[0.5, 0.08, 0.04]} position={[0.15, FLOOR_H * 1.12, 0.04]} castShadow={false} receiveShadow={false}>
          <meshStandardMaterial color={OXIDE} emissive={OXIDE} emissiveIntensity={themeBlend > 0.3 ? 0.1 : 0.05} roughness={0.9} />
        </Box>
        <Box args={[0.08, 0.6, 0.04]} position={[0.15, FLOOR_H * 0.82, 0.04]} castShadow={false} receiveShadow={false}>
          <meshStandardMaterial color={OXIDE} emissive={OXIDE} emissiveIntensity={themeBlend > 0.3 ? 0.1 : 0.05} roughness={0.9} />
        </Box>
      </group>

      {/* —— 7) Windows: upper strips aligned with brick bands; lower = large curtain —— */}
      {winStripY.map((y, i) => (
        <mesh key={i} position={[0, y, MAIN_D / 2 + 0.03]} castShadow={false} receiveShadow={false}>
          <boxGeometry args={[MAIN_W * 0.88, 0.12, 0.05]} />
          <meshStandardMaterial color={glassColor} roughness={0.35} metalness={0.05} emissive={glassEmissive} emissiveIntensity={glassEmissiveIntensity} />
        </mesh>
      ))}
      {[0, 1].map((row) => (
        <mesh key={row} position={[-2.5 + row * 2.2, FLOOR_H * 0.5, MAIN_D / 2 + 0.025]} castShadow={false} receiveShadow={false}>
          <boxGeometry args={[1.4, 0.75, 0.04]} />
          <meshStandardMaterial color={glassColor} roughness={0.35} metalness={0.05} emissive={glassEmissive} emissiveIntensity={glassEmissiveIntensity} />
        </mesh>
      ))}
      {Array.from({ length: 6 }, (_, i) => {
        const x = -MAIN_W / 2 + (MAIN_W / 7) * (i + 1)
        return (
          <mesh key={i} position={[x, FLOOR_H, MAIN_D / 2 + 0.026]} castShadow receiveShadow>
            <boxGeometry args={[0.08, FLOOR_H * 2, 0.03]} />
            <meshStandardMaterial color={brickColor} roughness={0.88} />
          </mesh>
        )
      })}

      {/* —— 8) Walkway + plinth —— */}
      <Box args={[2.2, 0.04, 1]} position={[0, 0.02, MAIN_D / 2 + 0.4]} castShadow receiveShadow>
        <meshStandardMaterial color="#b0b0a8" roughness={0.9} metalness={0} />
      </Box>
      <Box args={[MAIN_W + WING_W + 0.4, 0.06, MAIN_D + 0.25]} position={[WING_W * 0.15, -0.03, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={HOSPITAL_MORTAR} roughness={0.92} metalness={0} />
      </Box>
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
const QUEEN_PINK_GLOW = '#ff9ec6'
const QUEEN_PURPLE_GLOW = '#b88cff'
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
    const stripPulse = 0.62 + 0.38 * Math.sin(t * 0.9)
    const celebrationPulse = 0.65 + 0.35 * Math.sin(t * 0.72 + (isEast ? 0 : 1.4))
    const stripOpacity = Math.min(1, 0.52 + nightMult * 0.34 + celebrationPulse * 0.16)
    stripRefs.current.forEach((mesh, i) => {
      if (mesh?.material) {
        mesh.material.color.set(i % 2 ? QUEEN_PINK_GLOW : ENERGY_STRIP)
        mesh.material.opacity = Math.min(1, stripOpacity)
        if (mesh.material.emissive) {
          mesh.material.emissive.set(i % 2 ? QUEEN_PINK_GLOW : ENERGY_STRIP)
          mesh.material.emissiveIntensity = 0.08 + nightMult * 0.28 + celebrationPulse * 0.18
        }
      }
    })
    stripAuraRefs.current.forEach((mesh, i) => {
      if (mesh?.material) {
        mesh.material.color.set(i % 2 ? QUEEN_PURPLE_GLOW : ENERGY_STRIP)
        mesh.material.opacity = 0.1 + nightMult * 0.16 + stripPulse * 0.08
      }
    })
    // Top beacon: flicker (not constant) + stronger range
    if (nightMult > 0.1 && state.clock.elapsedTime - lastFlickerRef.current > FLICKER_THROTTLE) {
      lastFlickerRef.current = state.clock.elapsedTime
      beaconFlickerRef.current = 0.7 + pseudoRand(Math.floor(t * 2)) * 0.4
    }
    const beaconPulse = 0.7 + 0.3 * Math.sin(t * 1.5)
    const topIntensity = 0.18 + nightMult * beaconFlickerRef.current * beaconPulse * 1.4 + celebrationPulse * 0.28
    topGlowRefs.current.forEach((obj) => {
      const mesh = obj?.isMesh ? obj : obj?.children?.[0]
      if (mesh?.material?.emissiveIntensity !== undefined) {
        mesh.material.emissiveIntensity = topIntensity
      }
    })
    if (beaconHaloRef.current?.material) {
      beaconHaloRef.current.material.opacity = 0.14 + nightMult * 0.2 + 0.08 * Math.sin(t * 1.2)
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
        const targetColor = i % 3 === 0 ? QUEEN_PINK_GLOW : i % 3 === 1 ? TOWER_TOP_GLOW : QUEEN_PURPLE_GLOW
        mat.color.lerpColors(new THREE.Color(WINDOW_DARK), new THREE.Color(targetColor), cur)
      })
    } else {
      towerWinGroupMats.forEach((mat, i) => mat.color.set(i % 3 === 0 ? '#ffd7e5' : i % 3 === 1 ? WINDOW_LIT : '#d8c5ff'))
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
      {[0, 1].map((i) => (
        <mesh key={`tower-celebration-halo-${i}`} position={[0, h + 0.25 + i * 0.55, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow={false} receiveShadow={false}>
          <ringGeometry args={[0.94 + i * 0.18, 0.99 + i * 0.18, 36]} />
          <meshBasicMaterial color={i === 0 ? ENERGY_STRIP : QUEEN_PINK_GLOW} transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
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

function MuseumOfLovingMaramBuilding({ material, importance = 1 }) {
  const { themeBlend } = useTheme()
  const birthdayRefs = useRef([])
  const queenLightRefs = useRef([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    birthdayRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      mesh.position.y = mesh.userData.baseY + Math.sin(t * 0.32 + i) * 0.08
      mesh.rotation.y = Math.sin(t * 0.18 + i) * 0.08
    })
    queenLightRefs.current.forEach((mesh, i) => {
      if (!mesh?.material) return
      const pulse = 0.58 + 0.28 * Math.sin(t * 0.9 + i * 0.7)
      mesh.material.opacity = (mesh.userData.baseOpacity ?? 0.24) * pulse
      if (mesh.material.emissiveIntensity !== undefined) {
        mesh.material.emissiveIntensity = 0.45 + pulse * 0.5
      }
    })
  })

  const night = themeBlend < 0.5
  const limestone = night ? '#d2c7b7' : '#f0eadf'
  const travertine = night ? '#b9aa94' : '#d8cdbd'
  const plaster = night ? '#efe6d8' : '#f7f1e8'
  const shadowStone = night ? '#a99982' : '#c9b9a3'
  const maroon = '#5b1f2d'
  const maroonDark = '#321018'
  const brass = '#b99962'
  const champagne = '#d6be92'
  const warmLight = '#ffe2b5'
  const glass = night ? '#d8d2c6' : '#e7e1d8'

  return (
    <group>
      {/* Pale stone forecourt: quiet approach instead of a game-like moat. */}
      <Box args={[6.4, 0.18, 5.15]} position={[0, 0.09, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={travertine} roughness={0.88} metalness={0.02} />
      </Box>
      <Box args={[1.55, 0.035, 3.1]} position={[0, 0.2, 3.15]} receiveShadow>
        <meshStandardMaterial color={plaster} roughness={0.82} metalness={0.02} />
      </Box>
      <Box args={[1.95, 0.12, 0.42]} position={[0, 0.29, 2.15]} castShadow receiveShadow>
        <meshStandardMaterial color={shadowStone} roughness={0.86} metalness={0.02} />
      </Box>
      <Box args={[1.55, 0.1, 0.36]} position={[0, 0.39, 1.86]} castShadow receiveShadow>
        <meshStandardMaterial color={travertine} roughness={0.86} metalness={0.02} />
      </Box>

      {/* Main pavilion: calm symmetry, warm limestone, and soft shadow lines. */}
      <Box args={[5.35, 0.32, 3.95]} position={[0, 0.36, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={shadowStone} roughness={0.9} metalness={0.02} />
      </Box>
      <Box args={[4.75, 3.05, 3.28]} position={[0, 1.98, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={limestone} roughness={0.84} metalness={0.02} />
      </Box>
      <Box args={[1.05, 2.36, 2.92]} position={[-2.9, 1.68, -0.06]} castShadow receiveShadow>
        <meshStandardMaterial color={plaster} roughness={0.86} metalness={0.02} />
      </Box>
      <Box args={[1.05, 2.36, 2.92]} position={[2.9, 1.68, -0.06]} castShadow receiveShadow>
        <meshStandardMaterial color={plaster} roughness={0.86} metalness={0.02} />
      </Box>
      <Box args={[5.55, 0.18, 3.75]} position={[0, 3.6, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={travertine} roughness={0.78} metalness={0.03} />
      </Box>
      <Box args={[4.85, 0.055, 0.08]} position={[0, 2.92, 1.7]} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={champagne} roughness={0.42} metalness={0.32} />
      </Box>

      {/* Recessed private-gallery entrance. */}
      <group position={[0, 1.64, 1.75]}>
        <Box args={[2.35, 2.75, 0.34]} position={[0, 0.15, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={plaster} roughness={0.82} metalness={0.02} />
        </Box>
        <Box args={[1.78, 2.2, 0.18]} position={[0, 0.02, 0.12]} castShadow receiveShadow>
          <meshStandardMaterial color={shadowStone} roughness={0.86} metalness={0.02} />
        </Box>
        <Box args={[1.22, 1.74, 0.08]} position={[0, -0.28, 0.25]} castShadow receiveShadow>
          <meshStandardMaterial color={maroon} emissive={night ? maroonDark : '#000000'} emissiveIntensity={night ? 0.08 : 0} roughness={0.72} metalness={0.04} />
        </Box>
        <Box args={[0.035, 0.55, 0.045]} position={[0.42, -0.24, 0.31]} castShadow={false} receiveShadow={false}>
          <meshStandardMaterial color={brass} roughness={0.32} metalness={0.48} />
        </Box>
        <Box args={[1.42, 0.045, 0.07]} position={[0, 0.72, 0.31]} castShadow={false} receiveShadow={false}>
          <meshStandardMaterial color={warmLight} emissive={warmLight} emissiveIntensity={night ? 0.28 : 0.08} roughness={0.55} />
        </Box>
        <Box args={[0.06, 2.28, 0.07]} position={[-0.94, 0.02, 0.28]} castShadow={false} receiveShadow={false}>
          <meshStandardMaterial color={brass} roughness={0.38} metalness={0.38} />
        </Box>
        <Box args={[0.06, 2.28, 0.07]} position={[0.94, 0.02, 0.28]} castShadow={false} receiveShadow={false}>
          <meshStandardMaterial color={brass} roughness={0.38} metalness={0.38} />
        </Box>
      </group>

      {/* Minimal recessed gallery windows with warm interior light. */}
      {[
        [-1.55, 1.76, 1.72],
        [1.55, 1.76, 1.72],
        [-2.9, 1.54, 1.42],
        [2.9, 1.54, 1.42],
      ].map(([x, y, z], i) => (
        <group key={`museum-window-${i}`} position={[x, y, z]}>
          <Box args={[0.46, 1.45, 0.12]} position={[0, 0, 0]} castShadow={false} receiveShadow={false}>
            <meshStandardMaterial color={shadowStone} roughness={0.88} metalness={0.02} />
          </Box>
          <Box args={[0.32, 1.2, 0.06]} position={[0, 0, 0.08]} castShadow={false} receiveShadow={false}>
            <meshStandardMaterial color={maroonDark} emissive={warmLight} emissiveIntensity={night ? 0.18 : 0.05} roughness={0.44} metalness={0.06} />
          </Box>
          <Box args={[0.02, 1.25, 0.08]} position={[0, 0, 0.12]} castShadow={false} receiveShadow={false}>
            <meshStandardMaterial color={champagne} roughness={0.42} metalness={0.34} />
          </Box>
        </group>
      ))}

      {/* Frosted glass skylight: integrated museum dome, not a sci-fi beacon. */}
      <mesh position={[0, 3.86, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.98, 1.08, 0.35, 32]} />
        <meshStandardMaterial color={glass} emissive={warmLight} emissiveIntensity={night ? 0.08 : 0.02} roughness={0.34} metalness={0.08} transparent opacity={0.72} />
      </mesh>
      <mesh position={[0, 4.08, 0]} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[0.98, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={glass} emissive={warmLight} emissiveIntensity={night ? 0.52 : 0.22} roughness={0.24} metalness={0.06} transparent opacity={0.72} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`skylight-rib-${i}`} position={[0, 4.13, 0]} rotation={[0, (Math.PI / 4) * i, 0]} castShadow={false} receiveShadow={false}>
          <boxGeometry args={[0.018, 0.045, 1.95]} />
          <meshStandardMaterial color={brass} roughness={0.36} metalness={0.4} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh
          key={`queen-dome-beam-${i}`}
          ref={(el) => {
            if (el) {
              el.userData.baseOpacity = i === 1 ? 0.22 : 0.16
              queenLightRefs.current[i] = el
            }
          }}
          position={[0, 7.1, 0]}
          rotation={[0, (i - 1) * 0.42, (i - 1) * 0.18]}
          castShadow={false}
          receiveShadow={false}
        >
          <coneGeometry args={[1.25 + i * 0.2, 6.1, 32, 1, true]} />
          <meshBasicMaterial color={i === 1 ? '#ffd478' : '#ff9ec6'} transparent opacity={0.16} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {[1.3, 1.85, 2.4].map((radius, i) => (
        <mesh
          key={`queen-dome-halo-${i}`}
          ref={(el) => {
            if (el) {
              el.userData.baseOpacity = 0.32 - i * 0.06
              queenLightRefs.current[4 + i] = el
            }
          }}
          position={[0, 4.12 + i * 0.08, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          castShadow={false}
          receiveShadow={false}
        >
          <ringGeometry args={[radius, radius + 0.035, 48]} />
          <meshBasicMaterial color={i === 1 ? '#ff9ec6' : '#ffd478'} transparent opacity={0.24} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Curated birthday details: restrained balloons, flowers, and candle-like path lights. */}
      {[
        [-2.35, 3.0, 1.95, '#f1d6d4'],
        [-2.08, 3.2, 1.8, '#f6eadb'],
        [2.35, 2.9, 1.95, '#6b2736'],
        [2.08, 3.12, 1.78, '#d7bd88'],
      ].map(([x, y, z, color], i) => (
        <group key={`birthday-balloon-${i}`} ref={(el) => { if (el) { el.userData.baseY = y; birthdayRefs.current[i] = el } }} position={[x, y, z]}>
          <mesh castShadow={false} receiveShadow={false}>
            <sphereGeometry args={[0.16, 16, 12]} />
            <meshStandardMaterial color={color} transparent opacity={0.72} roughness={0.2} metalness={0.04} />
          </mesh>
          <mesh position={[0, -0.34, 0]} castShadow={false} receiveShadow={false}>
            <cylinderGeometry args={[0.005, 0.005, 0.62, 4]} />
            <meshBasicMaterial color={champagne} transparent opacity={0.65} />
          </mesh>
        </group>
      ))}
      {[-1.45, 1.45].map((x, i) => (
        <group key={`floral-${i}`} position={[x, 0.46, 2.02]}>
          <Box args={[0.42, 0.12, 0.18]} position={[0, 0, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={travertine} roughness={0.84} />
          </Box>
          {[-0.14, 0, 0.14].map((dx, j) => (
            <mesh key={j} position={[dx, 0.13 + j * 0.02, 0]} castShadow={false} receiveShadow={false}>
              <sphereGeometry args={[0.055, 8, 6]} />
              <meshStandardMaterial color={j === 1 ? '#f1d6d4' : '#f8f0e5'} roughness={0.7} />
            </mesh>
          ))}
        </group>
      ))}
      {[-2.1, -1.25, 1.25, 2.1].map((x, i) => (
        <mesh key={`path-light-${i}`} position={[x, 0.34, 2.75]} castShadow={false} receiveShadow={false}>
          <sphereGeometry args={[0.065, 10, 8]} />
          <meshStandardMaterial color={warmLight} emissive={warmLight} emissiveIntensity={night ? 0.32 : 0.08} transparent opacity={0.86} roughness={0.4} />
        </mesh>
      ))}
      <group position={[0, 0.34, 3.22]} rotation={[0, 0, 0]}>
        <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
          <coneGeometry args={[0.46, 1.25, 28]} />
          <meshStandardMaterial color="#9b314b" emissive="#ffb2c8" emissiveIntensity={night ? 0.24 : 0.08} roughness={0.64} metalness={0.04} />
        </mesh>
        <mesh position={[0, 1.42, 0]} castShadow={false} receiveShadow={false}>
          <sphereGeometry args={[0.17, 18, 14]} />
          <meshStandardMaterial color="#f0caa8" roughness={0.58} />
        </mesh>
        <mesh position={[0, 1.64, 0]} castShadow={false} receiveShadow={false}>
          <coneGeometry args={[0.18, 0.3, 5]} />
          <meshStandardMaterial color="#d9ad4f" emissive="#ffe0a0" emissiveIntensity={night ? 0.22 : 0.08} roughness={0.36} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow={false} receiveShadow={false}>
          <ringGeometry args={[0.52, 0.78, 32]} />
          <meshBasicMaterial color="#ffd478" transparent opacity={0.34} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <Html position={[0, 1.95, 0]} center distanceFactor={8} zIndexRange={[40, 0]} transform={false}>
          <div className="island-queen-label">Island Queen</div>
        </Html>
      </group>

      {/* Minimal landscape and benches keep the pavilion quiet inside the city. */}
      {[-2.35, 2.35].map((x, i) => (
        <group key={`museum-bench-${i}`} position={[x, 0.36, 2.55]}>
          <Box args={[0.9, 0.1, 0.25]} position={[0, 0, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={travertine} roughness={0.78} />
          </Box>
          <Box args={[0.08, 0.22, 0.2]} position={[-0.32, -0.13, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={shadowStone} roughness={0.82} />
          </Box>
          <Box args={[0.08, 0.22, 0.2]} position={[0.32, -0.13, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={shadowStone} roughness={0.82} />
          </Box>
        </group>
      ))}
      {[
        [-2.95, 0.48],
        [2.95, 0.48],
        [-2.95, -1.15],
        [2.95, -1.15],
      ].map(([x, z], i) => (
        <group key={`soft-planting-${i}`} position={[x, 0.27, z]}>
          <Box args={[0.54, 0.08, 0.34]} position={[0, 0, 0]} receiveShadow>
            <meshStandardMaterial color={shadowStone} roughness={0.9} />
          </Box>
          {[0, 1, 2, 3].map((j) => (
            <mesh key={j} position={[-0.18 + j * 0.12, 0.1, (j % 2) * 0.08 - 0.04]} castShadow={false} receiveShadow={false}>
              <sphereGeometry args={[0.055, 8, 6]} />
              <meshStandardMaterial color={j % 2 ? '#e9cfcc' : '#f8f3ea'} roughness={0.75} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// Mosque: single root group, all Y from structural hierarchy (foundation → body → roof → drum → dome)
const MOSQUE_WALL = '#E8E3DA'
const MOSQUE_DOME = '#DAD6CE'
const MOSQUE_DOOR = '#4A2E1F'
const MOSQUE_METAL = '#1F1F1F'
const MOSQUE_FINIAL = '#C7A63A'
function Mosque({ material, importance = 1 }) {
  const { themeBlend } = useTheme()

  // ——— STRUCTURAL HEIGHTS (every Y is derived from these) ———
  const foundationH = 0.6
  const bodyH = 2.24
  const bodyW = 5
  const bodyD = 4.5
  const roofSlabH = 0.08
  const roofTop = foundationH + bodyH + roofSlabH

  const centralDrumH = 1.0
  const centralDrumR = 1.0
  const centralDomeR = 1.1
  const drumTop = roofTop + centralDrumH
  const centralDomeCenterY = drumTop + centralDomeR
  const centralFinialH = 0.2

  const smallBaseH = 0.3
  const smDrumH = 0.15
  const smDomeR = 0.26
  const smDrumR = smDomeR * 0.95
  const cornerOffset = 0.55
  const smallCornerX = bodyW / 2 - cornerOffset
  const smallCornerZ = bodyD / 2 - cornerOffset

  const mainDomeTotalH = centralDrumH + centralDomeR
  const minaretTotalH = mainDomeTotalH * 1.5 * 1.6
  const minaretBaseH = 0.25
  const minaretBaseR = 0.22
  const minaretShaftR = 0.14
  const minaretShaftH = minaretTotalH - minaretBaseH - 0.16 - 0.55 - 0.24 - 0.2
  const minaretBalconyH = 0.16
  const minaretBalconyR = 0.22
  const minaretUpperH = 0.55
  const minaretUpperR = 0.11
  const minaretOnionH = 0.24
  const minaretTipH = 0.2
  const minaretX = bodyW / 2 + 0.3
  const minaretZ = bodyD / 2 + 0.35

  const wallColor = themeBlend > 0.5 ? MOSQUE_WALL : '#a8a49c'
  const domeColor = themeBlend > 0.5 ? MOSQUE_DOME : '#9a9690'
  const doorColor = MOSQUE_DOOR
  const finialColor = MOSQUE_FINIAL
  const glassEmissive = themeBlend < 0.5 ? '#ffe8b8' : null
  const glassEi = themeBlend < 0.5 ? 0.5 : 0

  return (
    <group>
      {/* 1. Foundation — anchor, slightly wider, everything sits on this */}
      <Box args={[bodyW + 0.5, foundationH, bodyD + 0.5]} position={[0, foundationH / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={wallColor} roughness={0.9} metalness={0.02} />
      </Box>

      {/* 2. Main cube body — sits on foundation */}
      <Box args={[bodyW, bodyH, bodyD]} position={[0, foundationH + bodyH / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={wallColor} roughness={0.88} metalness={0.02} />
      </Box>

      {/* 3. Roof slab — sits on body */}
      <Box args={[bodyW, roofSlabH, bodyD]} position={[0, roofTop - roofSlabH / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={domeColor} roughness={0.88} />
      </Box>
      <Box args={[bodyW + 0.1, 0.04, bodyD + 0.1]} position={[0, roofTop, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={domeColor} roughness={0.9} />
      </Box>

      {/* 4. Central drum — on roof, centered */}
      <mesh position={[0, roofTop + centralDrumH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[centralDrumR, centralDrumR * 1.02, centralDrumH, 20]} />
        <meshStandardMaterial color={domeColor} roughness={0.85} metalness={0} />
      </mesh>

      {/* 5. Big dome — bottom exactly on drum top: center Y = drumTop + domeR */}
      <mesh position={[0, centralDomeCenterY, 0]} castShadow receiveShadow>
        <sphereGeometry args={[centralDomeR, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={domeColor} roughness={0.85} metalness={0} />
      </mesh>
      <mesh position={[0, centralDomeCenterY + centralDomeR + 0.06, 0]} castShadow>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshStandardMaterial color={finialColor} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, centralDomeCenterY + centralDomeR + 0.06 + centralFinialH / 2 + 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, centralFinialH, 8]} />
        <meshStandardMaterial color={finialColor} roughness={0.4} metalness={0.3} />
      </mesh>

      {/* 6. Four small domes — each: cylindrical base on roof, mini drum, dome; corners x = ±(bodyW/2 - offset), z = ±(bodyD/2 - offset) */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], i) => (
        <group key={`sm-${i}`} position={[sx * smallCornerX, roofTop, sz * smallCornerZ]}>
          <mesh position={[0, smallBaseH / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[smDrumR * 1.4, smDrumR * 1.4, smallBaseH, 12]} />
            <meshStandardMaterial color={domeColor} roughness={0.88} />
          </mesh>
          <mesh position={[0, smallBaseH + smDrumH / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[smDrumR, smDrumR, smDrumH, 12]} />
            <meshStandardMaterial color={domeColor} roughness={0.85} />
          </mesh>
          <mesh position={[0, smallBaseH + smDrumH + smDomeR, 0]} castShadow receiveShadow>
            <sphereGeometry args={[smDomeR, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={domeColor} roughness={0.85} />
          </mesh>
          <mesh position={[0, smallBaseH + smDrumH + smDomeR + 0.05, 0]} castShadow>
            <sphereGeometry args={[0.05, 6, 4]} />
            <meshStandardMaterial color={finialColor} roughness={0.4} metalness={0.3} />
          </mesh>
        </group>
      ))}

      {/* 7. Minarets — base Y = foundation top (anchored to ground); all parts stacked in local space */}
      {[-1, 1].map((side, i) => (
        <group key={`min-${i}`} position={[side * minaretX, foundationH, minaretZ]}>
          <mesh position={[0, minaretBaseH / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[minaretBaseR, minaretBaseR * 1.05, minaretBaseH, 12]} />
            <meshStandardMaterial color={wallColor} roughness={0.88} />
          </mesh>
          <mesh position={[0, minaretBaseH + minaretShaftH / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[minaretShaftR, minaretShaftR * 1.02, minaretShaftH, 12]} />
            <meshStandardMaterial color={wallColor} roughness={0.88} />
          </mesh>
          <mesh position={[0, minaretBaseH + minaretShaftH + minaretBalconyH / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[minaretBalconyR, minaretBalconyR, minaretBalconyH, 12]} />
            <meshStandardMaterial color={wallColor} roughness={0.88} />
          </mesh>
          <mesh position={[0, minaretBaseH + minaretShaftH + minaretBalconyH + minaretUpperH / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[minaretUpperR, minaretUpperR * 0.98, minaretUpperH, 12]} />
            <meshStandardMaterial color={wallColor} roughness={0.88} />
          </mesh>
          <mesh position={[0, minaretBaseH + minaretShaftH + minaretBalconyH + minaretUpperH + minaretOnionH / 2, 0]} castShadow>
            <sphereGeometry args={[minaretUpperR * 1.8, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={domeColor} roughness={0.85} />
          </mesh>
          <mesh position={[0, minaretBaseH + minaretShaftH + minaretBalconyH + minaretUpperH + minaretOnionH + minaretTipH / 2, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, minaretTipH, 6]} />
            <meshStandardMaterial color={finialColor} roughness={0.4} metalness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Entrance — Y from foundation + half body */}
      <group position={[0, foundationH + bodyH / 2, bodyD / 2 + 0.01]}>
        <mesh position={[0, 0.2, 0.14]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 1.85, 0.28]} />
          <meshStandardMaterial color={wallColor} roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.05, 0.18]} castShadow>
          <boxGeometry args={[1.2, 1.35, 0.06]} />
          <meshStandardMaterial color={doorColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.95, 0.18]} castShadow={false} receiveShadow={false}>
          <boxGeometry args={[1.1, 0.18, 0.03]} />
          <meshStandardMaterial color={MOSQUE_METAL} roughness={0.9} />
        </mesh>
      </group>

      {/* Side windows — Y from foundation + body */}
      {[-1, 1].map((side, i) => (
        <group key={`win-${i}`} position={[side * (bodyW / 2 + 0.02), foundationH + bodyH * 0.58, 0.25]}>
          <mesh castShadow={false} receiveShadow={false}>
            <boxGeometry args={[0.1, 0.75, 0.05]} />
            <meshStandardMaterial color={wallColor} roughness={0.88} />
          </mesh>
          <mesh position={[0, 0, 0.03]} castShadow={false} receiveShadow={false}>
            <boxGeometry args={[0.06, 0.6, 0.02]} />
            <meshStandardMaterial color="#2a3540" emissive={glassEmissive} emissiveIntensity={glassEi} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* 3 front steps — on foundation top */}
      <Box args={[bodyW * 0.4, 0.08, 0.3]} position={[0, foundationH + 0.04, bodyD / 2 + 0.28]} castShadow receiveShadow>
        <meshStandardMaterial color={domeColor} roughness={0.92} />
      </Box>
      <Box args={[bodyW * 0.43, 0.08, 0.3]} position={[0, foundationH + 0.12, bodyD / 2 + 0.25]} castShadow receiveShadow>
        <meshStandardMaterial color={domeColor} roughness={0.92} />
      </Box>
      <Box args={[bodyW * 0.46, 0.08, 0.3]} position={[0, foundationH + 0.2, bodyD / 2 + 0.22]} castShadow receiveShadow>
        <meshStandardMaterial color={domeColor} roughness={0.92} />
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
