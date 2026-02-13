// ZForgotten HQ — voxel interior. No HTML overlay; everything 3D. Theme-aware.
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Box, Text, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useTheme } from '../context/ThemeContext'

const WALL_COLOR = '#F2F2F2'
const ACCENT_GOLD = '#E1B45C'
const MONITOR_GLOW = '#00C8FF'
const NIGHT_AMBIENT = '#0D0D18'
const NIGHT_WALL = '#1a1a1e'

const BOOT_LINES = [
  'booting maram city...',
  'loading voxel streets...',
  'syncing with Eng. Maram...',
  'status: unstoppable.',
]

const POEM_LINES = [
  'in blocks we built',
  'in light we trusted',
  'in silence we coded',
  'in love we designed',
]

function HeroHint() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(t)
  }, [])
  return (
    <Html position={[0, -2, 0]} center>
      <div
        className="zf-hq-hero-hint"
        style={{
          opacity: visible ? 0.65 : 0,
          transition: 'opacity 0.9s ease',
        }}
      >
        Scroll down for more
      </div>
    </Html>
  )
}

// Back wall screen: ZFORGOTTEN, then "you found zforgotten.", then access message; click = scroll to page content
function WallScreen({
  isNight,
  screenContent,
  titleLetters,
  subtitleLetters,
  accessLetters,
  cursorBlink,
  ultraSecret,
  onScreenClick,
}) {
  const meshRef = useRef()
  const emissive = isNight ? 0.08 : 0.02
  const glow = ACCENT_GOLD

  return (
    <group position={[0, 2.5, -4.95]}>
      {/* Screen quad — clickable for scroll to content */}
      <mesh ref={meshRef} position={[0, 0, 0]} onClick={(e) => { e.stopPropagation(); onScreenClick?.() }}>
        <planeGeometry args={[6, 3.2]} />
        <meshStandardMaterial
          color={isNight ? '#0a0a0c' : '#1a1a1a'}
          emissive={glow}
          emissiveIntensity={ultraSecret ? 0.15 : emissive}
          roughness={0.9}
          metalness={0}
        />
      </mesh>
      {/* Invisible hit area so click works over text */}
      <mesh position={[0, 0, 0.03]} onClick={(e) => { e.stopPropagation(); onScreenClick?.() }}>
        <planeGeometry args={[6, 3.2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Text content — use Html for crisp text that scales, or Text from drei */}
      <group position={[0, 0, 0.02]}>
        {screenContent === 'title' && (
          <>
            <Text position={[0, 0.35, 0]} fontSize={0.5} color="#EDEDED" anchorX="center" anchorY="middle" letterSpacing={0.12}>
              {titleLetters}
            </Text>
            <Text position={[0, -0.15, 0]} fontSize={0.12} color="#A8A8A8" anchorX="center" anchorY="middle">
              {subtitleLetters}
              {cursorBlink ? '|' : ''}
            </Text>
          </>
        )}
        {screenContent === 'access' && (
          <>
            <Text position={[0, 0.2, 0]} fontSize={0.14} color="#00C8FF" anchorX="center" anchorY="middle">
              {accessLetters}
              {cursorBlink ? '_' : ''}
            </Text>
          </>
        )}
        {screenContent === 'glitch' && (
          <Text position={[0, 0, 0]} fontSize={0.12} color={ACCENT_GOLD} anchorX="center" anchorY="middle" maxWidth={4}>
            You really shouldn't be here.{'\n'}But since you are…{'\n'}Let's build something legendary.
          </Text>
        )}
        {screenContent === 'poem' && (
          <Text position={[0, 0, 0]} fontSize={0.13} color={ACCENT_GOLD} anchorX="center" anchorY="middle" maxWidth={3.5}>
            {POEM_LINES.join('\n')}
          </Text>
        )}
      </group>
    </group>
  )
}

// Red emergency-style buzzer button — bottom right of room; same behavior as former cube
function RedBuzzerButton({ onPress }) {
  const [pressed, setPressed] = useState(false)
  const groupRef = useRef()
  return (
    <group ref={groupRef} position={[2.2, 0.45, -2.2]}>
      {/* Dark base */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.08, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Red button — slightly glossy */}
      <mesh
        position={[0, 0.12 + (pressed ? -0.02 : 0), 0]}
        onClick={(e) => { e.stopPropagation(); setPressed(true); onPress(); setTimeout(() => setPressed(false), 120) }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'default' }}
      >
        <cylinderGeometry args={[0.16, 0.16, 0.06, 24]} />
        <meshStandardMaterial
          color="#c62828"
          emissive="#8B0000"
          emissiveIntensity={0.08}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
    </group>
  )
}

// Desk: monitor (click = boot animation), keyboard, mug, mini lighthouse; monitorRef for flicker
function Desk({ isNight, onMonitorClick, monitorBootIndex, cursorBlink, monitorActive, monitorRef }) {
  const bootText = BOOT_LINES.slice(0, monitorBootIndex).join('\n') + (cursorBlink && monitorActive ? '\n_' : '')
  return (
    <group position={[0, 0.9, -3.2]}>
      {/* Desk surface */}
      <Box args={[2.2, 0.12, 1.1]} position={[0, 0, 0]}>
        <meshStandardMaterial color={isNight ? '#2a2a2e' : '#3a3a3a'} roughness={0.8} />
      </Box>
      {/* Monitor — ref for scanline/brightness flicker */}
      <group position={[-0.5, 0.35, 0]}>
        <Box ref={monitorRef} args={[0.6, 0.4, 0.05]} position={[0, 0.25, 0]}>
          <meshStandardMaterial
            color="#1a1a1a"
            emissive={MONITOR_GLOW}
            emissiveIntensity={isNight ? 0.2 : 0.08}
            roughness={0.9}
          />
        </Box>
        <Box args={[0.1, 0.25, 0.05]} position={[0, -0.05, 0]} />
        <Box args={[0.5, 0.05, 0.3]} position={[0, -0.2, 0]}>
          <meshStandardMaterial color="#252528" roughness={0.8} />
        </Box>
        {monitorActive && (
          <Text position={[0, 0.25, 0.031]} fontSize={0.028} color="#00C8FF" anchorX="left" anchorY="top" maxWidth={0.5}>
            {bootText}
          </Text>
        )}
        <mesh position={[0, 0.25, 0.03]} onClick={(e) => { e.stopPropagation(); onMonitorClick() }}>
          <planeGeometry args={[0.55, 0.35]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
      {/* Keyboard */}
      <Box args={[0.35, 0.02, 0.12]} position={[0.25, 0.07, 0]}>
        <meshStandardMaterial color={isNight ? '#1e1e22' : '#2e2e32'} roughness={0.7} />
      </Box>
      {/* Mug */}
      <Box args={[0.08, 0.1, 0.08]} position={[0.6, 0.11, 0.1]}>
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </Box>
      {/* Mini lighthouse */}
      <group position={[0.55, 0.15, -0.15]}>
        <Box args={[0.06, 0.12, 0.06]} position={[0, 0.06, 0]}>
          <meshStandardMaterial color="#F2EFEA" roughness={0.85} />
        </Box>
        <Box args={[0.04, 0.03, 0.04]} position={[0, 0.135, 0]}>
          <meshStandardMaterial color={ACCENT_GOLD} emissive={ACCENT_GOLD} emissiveIntensity={0.4} />
        </Box>
      </group>
    </group>
  )
}

// Mini hologram island — click = zoom to island then back (simulated with brief scale)
function MiniMap({ isNight, onClick }) {
  const ref = useRef()
  const [zooming, setZooming] = useState(false)
  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 0.2
    if (zooming) return
  })

  const handleClick = () => {
    setZooming(true)
    onClick?.()
    setTimeout(() => setZooming(false), 2000)
  }

  return (
    <group ref={ref} position={[1.2, 2, -2.5]} onClick={(e) => { e.stopPropagation(); handleClick() }}>
      <mesh>
        <boxGeometry args={[0.4, 0.25, 0.4]} />
        <meshStandardMaterial
          color={isNight ? '#1a1a22' : '#2a2a35'}
          emissive={ACCENT_GOLD}
          emissiveIntensity={0.15}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  )
}

export default function ZForgottenHQ({ onExit, startWithGlitch = false, heroOnly = false, onWallScreenClick }) {
  const { camera } = useThree()
  const { theme } = useTheme()
  const isNight = theme === 'night'

  const [screenContent, setScreenContent] = useState(startWithGlitch ? 'glitch' : 'title') // title | access | glitch | poem
  const [titleLetters, setTitleLetters] = useState('')
  const [subtitleLetters, setSubtitleLetters] = useState('')
  const [accessLetters, setAccessLetters] = useState('')
  const [accessDone, setAccessDone] = useState(false)
  const [cursorBlink, setCursorBlink] = useState(true)
  const [monitorBootIndex, setMonitorBootIndex] = useState(0)
  const [monitorActive, setMonitorActive] = useState(false)
  const [antennaClicks, setAntennaClicks] = useState(0)
  const [glitchRevealed, setGlitchRevealed] = useState(startWithGlitch)
  const [ultraSecret, setUltraSecret] = useState(false)
  const [commandBuffer, setCommandBuffer] = useState('')
  const lampRef = useRef()
  const monitorRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const flicker = 0.03 * Math.sin(t * 40) + 0.02 * Math.sin(t * 73)
    if (lampRef.current) lampRef.current.intensity = 0.35 + flicker * 2
    if (monitorRef.current?.material) {
      const base = isNight ? 0.2 : 0.08
      monitorRef.current.material.emissiveIntensity = base + flicker * 3
    }
  })

  // Set camera when mounted: frame full screen, slight tilt down, less floor
  useLayoutEffect(() => {
    if (!camera) return
    camera.position.set(0, 1.95, 6.8)
    camera.lookAt(0, 1.35, -2.2)
    if (typeof camera.updateProjectionMatrix === 'function') camera.updateProjectionMatrix()
  }, [camera])

  // Typewriter: title "ZFORGOTTEN"
  useEffect(() => {
    const full = 'ZFORGOTTEN'
    if (titleLetters.length >= full.length) return
    const t = setTimeout(() => setTitleLetters(full.slice(0, titleLetters.length + 1)), 80)
    return () => clearTimeout(t)
  }, [titleLetters])

  // Then subtitle "you found zforgotten."
  useEffect(() => {
    if (titleLetters !== 'ZFORGOTTEN') return
    const full = 'you found zforgotten.'
    if (subtitleLetters.length >= full.length) {
      setScreenContent('access')
      return
    }
    const t = setTimeout(() => setSubtitleLetters(full.slice(0, subtitleLetters.length + 1)), 100)
    return () => clearTimeout(t)
  }, [titleLetters, subtitleLetters])

  // Access message (after subtitle done)
  const accessText = '> ACCESS GRANTED\n> Welcome to ZForgotten HQ.\n> You found the hidden builder of Maram City.'
  useEffect(() => {
    if (screenContent !== 'access') return
    if (accessDone) return
    if (accessLetters.length >= accessText.length) {
      setAccessDone(true)
      return
    }
    const t = setTimeout(() => setAccessLetters(accessText.slice(0, accessLetters.length + 1)), 30)
    return () => clearTimeout(t)
  }, [screenContent, accessDone, accessLetters])

  // Cursor blink
  useEffect(() => {
    const id = setInterval(() => setCursorBlink((b) => !b), 530)
    return () => clearInterval(id)
  }, [])

  // Monitor boot animation
  const handleMonitorClick = () => {
    setScreenContent('monitor')
    setMonitorActive(true)
    if (monitorBootIndex < BOOT_LINES.length) {
      const id = setInterval(() => {
        setMonitorBootIndex((i) => Math.min(i + 1, BOOT_LINES.length))
      }, 600)
      return () => clearInterval(id)
    }
  }
  useEffect(() => {
    if (!monitorActive) return
    if (monitorBootIndex >= BOOT_LINES.length) return
    const t = setTimeout(() => setMonitorBootIndex((i) => i + 1), 600)
    return () => clearTimeout(t)
  }, [monitorActive, monitorBootIndex])

  // Buzzer: only toggle screen on/off (no message switching)
  const [screenVisible, setScreenVisible] = useState(true)
  const handleBuzzerPress = () => setScreenVisible((v) => !v)

  // Antenna 5 clicks (desk antenna or a small antenna mesh) -> glitch
  const handleAntennaClick = () => {
    const next = antennaClicks + 1
    setAntennaClicks(next)
    if (next >= 5) {
      setGlitchRevealed(true)
      setScreenContent('glitch')
    }
  }

  // /lighthouse key buffer
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const key = e.key?.toLowerCase()
      if (!key || key.length > 1) return
      setCommandBuffer((buf) => {
        const next = (buf + key).slice(-12)
        if (next.includes('/lighthouse')) {
          setUltraSecret(true)
          setScreenContent('poem')
          return ''
        }
        return next
      })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const wallColor = isNight ? NIGHT_WALL : WALL_COLOR
  const floorColor = isNight ? '#12121a' : '#e8e8e8'
  const ambient = isNight ? NIGHT_AMBIENT : '#f8f8f8'

  return (
    <>
      <color attach="background" args={[ambient]} />
      <ambientLight intensity={ultraSecret ? 0.05 : (isNight ? 0.2 : 0.5)} />
      <hemisphereLight args={[isNight ? '#1a1a24' : '#e8e8ec', isNight ? '#0a0a0e' : '#c0c0c8', ultraSecret ? 0.02 : (isNight ? 0.25 : 0.35)]} />
      <directionalLight position={[3, 5, 5]} intensity={ultraSecret ? 0 : (isNight ? 0.4 : 1)} />
      {ultraSecret && <pointLight position={[0.55, 0.2, -0.15]} color={ACCENT_GOLD} intensity={2} distance={3} />}
      <pointLight ref={lampRef} position={[1.4, 2.2, -2.8]} color="#f0e6c8" intensity={0.35} distance={5} />

      {/* Room: back wall */}
      <mesh position={[0, 2.5, -5]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {/* Floor */}
      <mesh position={[0, 0, -2.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color={floorColor} roughness={0.85} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 5, -2.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color={isNight ? '#151518' : '#e0e0e0'} roughness={0.9} />
      </mesh>
      {/* Side walls */}
      <mesh position={[-5, 2.5, -2.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      <mesh position={[5, 2.5, -2.5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {screenVisible && (
        <WallScreen
          isNight={isNight}
          screenContent={screenContent}
          titleLetters={titleLetters}
          subtitleLetters={subtitleLetters}
          accessLetters={accessLetters}
          cursorBlink={cursorBlink}
          ultraSecret={ultraSecret}
          onScreenClick={onWallScreenClick}
        />
      )}

      <RedBuzzerButton onPress={handleBuzzerPress} />

      <Desk
        isNight={isNight}
        onMonitorClick={handleMonitorClick}
        monitorBootIndex={monitorBootIndex}
        cursorBlink={cursorBlink}
        monitorActive={monitorActive}
        monitorRef={monitorRef}
      />

      {/* Mini antenna on desk for 5-click secret */}
      <group position={[0.7, 1.05, -3.1]} onClick={(e) => { e.stopPropagation(); handleAntennaClick() }}>
        <Box args={[0.02, 0.08, 0.02]} position={[0, 0.04, 0]}>
          <meshStandardMaterial color="#555" />
        </Box>
        <Box args={[0.04, 0.02, 0.04]} position={[0, 0.09, 0]}>
          <meshStandardMaterial color={ACCENT_GOLD} emissive={ACCENT_GOLD} emissiveIntensity={0.2} />
        </Box>
      </group>

      <MiniMap isNight={isNight} onClick={() => {}} />

      {/* Exit or Scroll hint — Html overlay */}
      {!heroOnly && onExit && (
        <Html position={[2.5, 2.5, -2]} center>
          <button
            type="button"
            onClick={onExit}
            style={{
              padding: '8px 16px',
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid #E1B45C',
              color: '#E1B45C',
              cursor: 'pointer',
              fontFamily: 'sans-serif',
              fontSize: '12px',
            }}
          >
            Exit HQ
          </button>
        </Html>
      )}
      {heroOnly && (
        <HeroHint />
      )}
    </>
  )
}
