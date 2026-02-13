import { useState, useEffect, useRef, Suspense } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { useTheme } from '../context/ThemeContext'
import { useLighthouseWorld } from '../context/LighthouseWorldContext'
import ZForgottenHQ from '../components/ZForgottenHQ'
import ErrorBoundary from '../components/ErrorBoundary'
import './Lighthouse.css'

const TITLE_VARIANTS = [
  'ZForgotten',
  'ZForgotten // dev mode',
  'ZF // lighthouse operator',
]

const BOOT_LINES = [
  '> Booting Maram City…',
  '> Loading voxel streets… OK',
  '> Syncing with Eng. Maram… OK',
  '> Mission: build the best city on Earth.',
]

const ROADMAP_ITEMS = [
  { id: '1', text: 'Add airport takeoff loops', status: 'DONE' },
  { id: '2', text: 'Add bird flocks in morning', status: 'DONE' },
  { id: '3', text: 'Upgrade water shader', status: 'NEXT' },
  { id: '4', text: 'Add interactive train schedule', status: 'LATER' },
  { id: '5', text: 'Performance: instanced trees', status: 'NEXT' },
  { id: '6', text: 'Project pages match voxel vibe', status: 'IN PROGRESS' },
  { id: '7', text: 'Lighthouse dev page (you are here)', status: 'DONE' },
]

const MAP_KEY_LOCATIONS = [
  { id: 'school', color: 'blue', label: 'Elementary School', poem: 'Where light teaches form.' },
  { id: 'hospital', color: 'red', label: 'Hospital', poem: 'Where structure holds healing.' },
  { id: 'airport', color: 'yellow', label: 'Airport', poem: 'Where ideas take flight.' },
  { id: 'volcano', color: 'green', label: 'Hidden Volcano', poem: 'Where chaos dreams of creation.' },
  { id: 'lighthouse', color: 'purple', label: 'Lighthouse', poem: 'Signal tower of forgotten code.' },
  { id: 'towers', color: 'cyan', label: 'Towers', poem: 'Where the sky meets the city.' },
  { id: 'pyramids', color: 'orange', label: 'Pyramids', poem: 'Where heritage meets light.' },
]

const POEM_LINES = [
  '🌌 "Maram City"',
  '',
  'We built an island out of code and light,',
  'Where towers breathe in shadowed night.',
  'Where runways stretch like silver veins,',
  'And cities rise from voxel plains.',
  '',
  'A lighthouse hums in golden air,',
  'Guarding secrets we both share.',
  'A school that blooms in morning glow,',
  'A hospital where soft lights flow.',
  '',
  'Planes lift thoughts into the sky,',
  'Grass hills whisper when winds pass by.',
  'Volcano heart with ember core,',
  'Dreaming of becoming more.',
  '',
  'If you found this hidden place,',
  'You traced the signal in the space.',
  'The city lives because we dared —',
  'To build what others never shared.',
]

function Hero3DCanvas({ onScrollToContent }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="lighthouse-hero-3d-placeholder" />
  return (
    <Suspense fallback={<div className="lighthouse-hero-3d-placeholder" />}>
      <Canvas camera={{ position: [0, 1.95, 6.8], fov: 48 }} gl={{ antialias: true }} dpr={[1, 1.5]}>
        <ZForgottenHQ heroOnly onWallScreenClick={onScrollToContent} />
      </Canvas>
    </Suspense>
  )
}

function LighthousePage() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const lhWorld = useLighthouseWorld()
  const [titleIndex, setTitleIndex] = useState(0)
  const [bootIndex, setBootIndex] = useState(0)
  const [showDevNotes, setShowDevNotes] = useState(false)
  const [mapKeyOpen, setMapKeyOpen] = useState(false)
  const [pinnedCards, setPinnedCards] = useState(new Set())
  const [sliderValue, setSliderValue] = useState(50)
  const [roadmapOpen, setRoadmapOpen] = useState(false)
  const [commandInput, setCommandInput] = useState('')
  const [commandLog, setCommandLog] = useState([])
  const [poemVisible, setPoemVisible] = useState(false)
  const [poemLineIndex, setPoemLineIndex] = useState(0)
  const [nightSecretHover, setNightSecretHover] = useState(false)
  const [nightSecretReveal, setNightSecretReveal] = useState(false)
  const [secretCommandReveal, setSecretCommandReveal] = useState(false)
  const [beamPulse, setBeamPulse] = useState(false)
  const nightSecretTimerRef = useRef(null)
  const titleHoverRef = useRef(null)
  const pageContentRef = useRef(null)

  // Apply dev commands to world context
  const runCommand = (cmd) => {
    const c = cmd.trim().toLowerCase()
    if (c === '/ignite') {
      lhWorld?.setVolcanoGlow(true)
      setTimeout(() => lhWorld?.setVolcanoGlow(false), 5000)
      setCommandLog((prev) => [...prev, '> Volcano ignited for 5s.'])
    } else if (c === '/blueprint') {
      lhWorld?.setWireframeMode((v) => !v)
      setCommandLog((prev) => [...prev, '> Wireframe mode toggled.'])
    } else if (c === '/chaos') {
      lhWorld?.setChaosMode(true)
      setTimeout(() => lhWorld?.setChaosMode(false), 8000)
      setCommandLog((prev) => [...prev, '> Chaos mode: 8s.'])
    } else if (c === '/memory') {
      setPoemVisible(true)
      setPoemLineIndex(0)
      setCommandLog((prev) => [...prev, '> Memory signal opened.'])
      setSecretCommandReveal(true)
    } else if (c) {
      setCommandLog((prev) => [...prev, `> Unknown: ${cmd}`])
    }
    if (['/ignite', '/blueprint', '/chaos', '/memory'].includes(c)) setSecretCommandReveal(true)
  }

  // Title hover flicker
  useEffect(() => {
    if (!titleHoverRef.current) return
    const el = titleHoverRef.current
    const onEnter = () => {
      let i = 0
      const id = setInterval(() => {
        setTitleIndex((prev) => (prev + 1) % TITLE_VARIANTS.length)
        i++
        if (i >= 6) clearInterval(id)
      }, 180)
      return () => clearInterval(id)
    }
    const onLeave = () => setTitleIndex(0)
    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  // Typewriter boot sequence
  useEffect(() => {
    if (bootIndex >= BOOT_LINES.length) return
    const t = setTimeout(() => setBootIndex((i) => i + 1), 600 + bootIndex * 400)
    return () => clearTimeout(t)
  }, [bootIndex])

  // Poem typewriter
  useEffect(() => {
    if (!poemVisible || poemLineIndex >= POEM_LINES.length) return
    const delay = POEM_LINES[poemLineIndex] === '' ? 300 : 120 + Math.random() * 80
    const t = setTimeout(() => setPoemLineIndex((i) => i + 1), delay)
    return () => clearTimeout(t)
  }, [poemVisible, poemLineIndex])

  // Night-only secret: hover 3s
  useEffect(() => {
    if (!nightSecretHover || theme !== 'night') return
    nightSecretTimerRef.current = setTimeout(() => setNightSecretReveal(true), 3000)
    return () => {
      if (nightSecretTimerRef.current) clearTimeout(nightSecretTimerRef.current)
    }
  }, [nightSecretHover, theme])

  const handlePing = () => {
    setBeamPulse(true)
    setTimeout(() => setBeamPulse(false), 1500)
  }

  const togglePin = (id) => {
    setPinnedCards((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleMapLocationClick = (id) => {
    lhWorld?.setCameraTarget(id)
    setMapKeyOpen(false)
    navigate('/world')
  }

  const handleCommandSubmit = (e) => {
    e.preventDefault()
    if (!commandInput.trim()) return
    runCommand(commandInput)
    setCommandInput('')
  }

  return (
    <div className={`lighthouse-page ${theme === 'night' ? 'dark' : ''} ${theme === 'night' && beamPulse ? 'beam-pulse' : ''}`}>
      {/* 3D hero: you found zforgotten — scroll down to see the rest; fallback if 3D fails */}
      <ErrorBoundary
        fallback={
          <section className="lighthouse-hero-3d lighthouse-hero-3d-fallback">
            <div className="lighthouse-hero-3d-fallback-content">
              <h1 className="lighthouse-hero-3d-fallback-title">ZFORGOTTEN</h1>
              <p className="lighthouse-hero-3d-fallback-sub">you found zforgotten.</p>
              <p className="lighthouse-hero-3d-fallback-hint">Scroll down ↓</p>
            </div>
          </section>
        }
      >
        <section className="lighthouse-hero-3d" aria-label="ZForgotten HQ">
          <Hero3DCanvas onScrollToContent={() => pageContentRef.current?.scrollIntoView({ behavior: 'smooth' })} />
        </section>
      </ErrorBoundary>

      {lhWorld?.islandBuilderUnlocked && (
        <div className="lighthouse-badge">Island Builder Level 1</div>
      )}

      {/* Map overlay — B&W minimal, gold outline on hover */}
      {mapKeyOpen && (
        <div className="lighthouse-map-overlay" onClick={() => setMapKeyOpen(false)}>
          <div className="lighthouse-map-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="lighthouse-section-title">Map of the Island</h2>
            <div className="lighthouse-map-schematic">
              {MAP_KEY_LOCATIONS.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  className="lighthouse-map-zone"
                  onClick={() => handleMapLocationClick(loc.id)}
                >
                  <span className="lighthouse-map-zone-label">{loc.label}</span>
                  <span className="lighthouse-map-zone-poem">{loc.poem}</span>
                </button>
              ))}
            </div>
            <button type="button" className="lighthouse-map-close" onClick={() => setMapKeyOpen(false)}>
              Close map
            </button>
          </div>
        </div>
      )}

      {/* Poem overlay */}
      {poemVisible && (
        <div className="lighthouse-poem-overlay" onClick={() => setPoemVisible(false)}>
          <div className="lighthouse-poem-panel" onClick={(e) => e.stopPropagation()}>
            {POEM_LINES.slice(0, poemLineIndex).map((line, i) => (
              <div key={i} className="lighthouse-poem-line">{line || '\u00A0'}</div>
            ))}
            {poemLineIndex < POEM_LINES.length && <span className="lighthouse-system-cursor">_</span>}
            <button type="button" className="lighthouse-btn lighthouse-poem-close" onClick={() => setPoemVisible(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {theme === 'night' && (
        <div
          className="lighthouse-night-secret"
          onMouseEnter={() => setNightSecretHover(true)}
          onMouseLeave={() => { setNightSecretHover(false); setNightSecretReveal(false) }}
        >
          <p className="lighthouse-night-line">The island listens at night.</p>
          {nightSecretReveal && (
            <p className="lighthouse-night-message">You are not alone here. The lighthouse remembers.</p>
          )}
        </div>
      )}

      <header className="lighthouse-hud">
        <Link to="/world" className="lighthouse-hud-back"><span>← Back to World</span></Link>
        <span className="lighthouse-hud-badge">LIGHTHOUSE // DEV</span>
      </header>

      <main ref={pageContentRef} id="lighthouse-page-content" className="lighthouse-main">
        {/* Hero — asymmetric */}
        <section className="lighthouse-hero">
          <div className="lighthouse-hero-left">
            <h1
              ref={titleHoverRef}
              className={`lighthouse-title ${secretCommandReveal ? 'secret-reveal' : ''}`}
            >
              {TITLE_VARIANTS[titleIndex]}
            </h1>
            <p className="lighthouse-sub">i build cities with light.</p>
          </div>
          <div className="lighthouse-hero-right">
            <p className="lighthouse-hero-label">Lighthouse // Island Core</p>
          </div>
          <div className="lighthouse-hero-line" aria-hidden="true" />
        </section>

        {/* Manifesto */}
        <section className="lighthouse-manifesto">
          <p className="lighthouse-manifesto-line">We build cities from memory.</p>
          <p className="lighthouse-manifesto-line">We design in layers.</p>
          <p className="lighthouse-manifesto-line">We construct with light.</p>
        </section>

        <div className="lighthouse-section-rule" aria-hidden="true" />

        {/* System log — minimal */}
        <section className="lighthouse-system-wrap">
          <h2 className="lighthouse-section-title">System Log</h2>
          {BOOT_LINES.slice(0, bootIndex).map((line, i) => (
            <div key={i} className="lighthouse-system-line">{line}</div>
          ))}
          {commandLog.map((line, i) => (
            <div key={`log-${i}`} className="lighthouse-system-line">{line}</div>
          ))}
          {bootIndex < BOOT_LINES.length && (
            <span className="lighthouse-system-cursor">_</span>
          )}
          {bootIndex >= BOOT_LINES.length && (
            <>
              <div className="lighthouse-actions">
                <button type="button" className="lighthouse-btn" onClick={handlePing}>Ping the Lighthouse</button>
                <button type="button" className="lighthouse-btn" onClick={() => setMapKeyOpen(true)}>Open Island Map</button>
                <button type="button" className="lighthouse-btn" onClick={() => { setPoemVisible(true); setPoemLineIndex(0) }}>Signal Memory</button>
                <button type="button" className="lighthouse-btn" onClick={() => setShowDevNotes((v) => !v)}>Dev Notes</button>
                <button type="button" className="lighthouse-btn" onClick={() => { lhWorld?.setChaosMode(true); setTimeout(() => lhWorld?.setChaosMode(false), 8000) }}>Toggle Chaos Mode</button>
                <button type="button" className={`lighthouse-btn ${lhWorld?.architectMode ? 'lighthouse-btn-active' : ''}`} onClick={() => lhWorld?.setArchitectMode((v) => !v)}>Architect Mode</button>
              </div>
              <form onSubmit={handleCommandSubmit} className="lighthouse-command-form">
                <span className="lighthouse-command-prompt">&gt;</span>
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder=" Type a command…"
                  className="lighthouse-command-input"
                  spellCheck={false}
                />
              </form>
            </>
          )}
          {showDevNotes && (
            <div className="lighthouse-dev-notes">
              <p>Future ideas live here. Drop by the lighthouse when you have one.</p>
              <button type="button" className="lighthouse-btn" onClick={() => setShowDevNotes(false)}>Close</button>
            </div>
          )}
        </section>

        <div className="lighthouse-section-rule" aria-hidden="true" />

        {/* Collab — minimal */}
        <section className="lighthouse-collab">
          <h2 className="lighthouse-section-title">Co-building with Eng. Maram</h2>
          <div className="lighthouse-collab-visual">
            <div className="lighthouse-chip">
              <span className="lighthouse-chip-name">Eng. Maram</span>
              <span className="lighthouse-chip-role">Architect</span>
            </div>
            <div className="lighthouse-collab-cable" aria-hidden="true" />
            <div className="lighthouse-chip">
              <span className="lighthouse-chip-name">ZForgotten</span>
              <span className="lighthouse-chip-role">Builder</span>
            </div>
          </div>
          <div className="lighthouse-slider-wrap">
            <span className="lighthouse-slider-label">Architect</span>
            <input type="range" min={0} max={100} value={sliderValue} onChange={(e) => setSliderValue(Number(e.target.value))} className="lighthouse-slider" />
            <span className="lighthouse-slider-label">Builder</span>
          </div>
          <p className="lighthouse-slider-hint">{sliderValue > 50 ? 'Builder' : 'Architect'}</p>
        </section>

        {/* Roadmap */}
        <section className="lighthouse-roadmap-wrap">
          <button type="button" className="lighthouse-roadmap-toggle" onClick={() => setRoadmapOpen((v) => !v)}>
            {roadmapOpen ? '▼' : '▶'} If you&apos;re reading this… you found the lighthouse.
          </button>
          {roadmapOpen && (
            <div className="lighthouse-roadmap-cards">
              {ROADMAP_ITEMS.map((item) => (
                <button key={item.id} type="button" className={`lighthouse-roadmap-card ${pinnedCards.has(item.id) ? 'lighthouse-pinned' : ''}`} onClick={() => togglePin(item.id)}>
                  <span className="lighthouse-roadmap-stamp">{item.status}</span>
                  <span className="lighthouse-roadmap-text">{item.text}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Booth */}
        <section className="lighthouse-booth">
          <p className="lighthouse-booth-text">When we finish building the city…</p>
          <p className="lighthouse-booth-text lighthouse-booth-highlight">we&apos;ll live in the booth on the island together.</p>
        </section>

        <section className="lighthouse-cta">
          <p>Got ideas for future upgrades? Drop by the lighthouse.</p>
        </section>

        <footer className="lighthouse-footer">
          <p className="lighthouse-footer-line">Come visit me here in the lighthouse…</p>
          <p className="lighthouse-footer-warning">but be careful on your way at night… you might notice things you weren&apos;t supposed to.</p>
        </footer>
      </main>
    </div>
  )
}

export default LighthousePage
