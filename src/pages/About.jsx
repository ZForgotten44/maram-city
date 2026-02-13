import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { projects } from '../data/projects'
import './About.css'

const designPhilosophy = [
  'Climate is the first client. Shade, airflow, and orientation before aesthetics.',
  'Details carry the story. Corners, thresholds, stairs, and window rhythm matter more than "big concepts."',
  'Dark doesn\'t mean heavy. I like bold shadows—but the structure should still feel light and efficient.',
  'Sustainable ≠ boring. Performance can be beautiful.',
]

const valuesList = [
  { title: 'Light', body: 'Design with shadow as much as light.' },
  { title: 'Material', body: 'Every surface tells a story.' },
  { title: 'Place', body: 'Context shapes form and memory.' },
  { title: 'Craft', body: 'Detail is the soul of architecture.' },
  { title: 'Responsibility', body: 'Build for people and planet.' },
  { title: 'Narrative', body: 'Spaces that feel, not just function.' },
]

const processSteps = [
  { id: 'sketch', label: 'Sketch', desc: 'Hand and digital exploration' },
  { id: 'massing', label: 'Massing', desc: 'Volume and scale studies' },
  { id: 'drawings', label: 'Drawings', desc: 'Plans, sections, details' },
  { id: 'render', label: 'Render', desc: 'Light and material studies' },
]

const toolTags = [
  'Revit', 'Rhino', 'SketchUp', 'Lumion', 'Enscape', 'Unreal Engine',
  'AutoCAD', 'Adobe Suite', 'Photoshop',
]

const recognitionItems = [
  { year: '2024', title: 'Design Award shortlist', org: 'Egyptian Architects' },
  { year: '2023', title: 'Student Exhibition', org: 'E-JUST' },
  { year: '2024', title: 'Sustainability Prize', org: 'Regional Council' },
]

const timelineProjects = [...projects].sort((a, b) => a.year - b.year)

function About({ embedded, onClose }) {
  const { theme, toggleTheme } = useTheme()
  const timelineRef = useRef(null)
  const railRef = useRef(null)
  const scaleLeftRef = useRef(0)
  const [scaleLeft, setScaleLeft] = useState(0)
  const rafRef = useRef(null)
  const scrollEndRef = useRef(null)
  const [isScrolling, setIsScrolling] = useState(false)

  const flushScaleLeft = () => {
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(() => {
      setScaleLeft(scaleLeftRef.current)
      rafRef.current = null
    })
  }

  useEffect(() => {
    const el = timelineRef.current
    if (!el) return
    const onWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault()
        el.scrollLeft += e.deltaY * 0.8
        scaleLeftRef.current = el.scrollLeft
        flushScaleLeft()
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    const el = timelineRef.current
    if (!el) return
    const onScroll = () => {
      scaleLeftRef.current = el.scrollLeft
      flushScaleLeft()
      if (scrollEndRef.current) clearTimeout(scrollEndRef.current)
      setIsScrolling(true)
      scrollEndRef.current = setTimeout(() => setIsScrolling(false), 120)
    }
    el.addEventListener('scroll', onScroll)
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (scrollEndRef.current) clearTimeout(scrollEndRef.current)
    }
  }, [])

  return (
    <div className={`about-page architect-page ${theme}`} data-theme={theme}>
      <div className="about-blueprint-grid" aria-hidden="true" />

      <header className="about-hud">
        {embedded && onClose ? (
          <button type="button" className="about-hud-back" onClick={onClose}>← Close</button>
        ) : (
          <Link to="/world" className="about-hud-back">← Return to World</Link>
        )}
        <div className="about-hud-right">
          {!embedded && <Link to="/world" className="about-hud-btn">Portfolio</Link>}
          <a href="mailto:mramashraf18@gmail.com" className="about-hud-btn">Contact</a>
          <button
            type="button"
            className={`about-hud-chip ${theme}`}
            onClick={toggleTheme}
            aria-label={theme === 'day' ? 'Switch to night mode' : 'Switch to day mode'}
          >
            {theme === 'day' ? '☀ DAY' : '☽ NIGHT'}
          </button>
        </div>
      </header>

      <main className="about-main">
        {/* 1) Studio Manifesto — tracing paper */}
        <section className="about-manifesto">
          <div className="about-manifesto-paper">
            <h1 className="about-hero-name">Maram Ashraf</h1>
            <p className="about-hero-title">Sustainable Architecture • Gothic soul, desert roots • New Valley, Egypt</p>
            <p className="about-manifesto-text">
              I like designing buildings that actually make sense. I'm into dark, precise aesthetics, especially gothic forms, but I care more about how a space breathes at noon than how it looks in a render at midnight. Give me shade, airflow, honest materials, and structures that can handle heat and time, that's the kind of architecture I build.
            </p>
            <div className="about-hero-stats">
              <div className="about-stat">
                <span className="about-stat-label">Focus</span>
                <span className="about-stat-value">Sustainable Architecture</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-label">Tags</span>
                <span className="about-stat-value">Passive Design • Environmental Systems • Gothic / Heritage</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-label">Lang</span>
                <span className="about-stat-value">Arabic (Native) • English (Fluent) • Japanese (Learning)</span>
              </div>
            </div>
          </div>
          <div className="about-portrait-card about-manifesto-portrait">
            <div className="about-portrait-placeholder">
              <img
                src="https://scontent-ord5-2.xx.fbcdn.net/v/t39.30808-6/476353146_986614863346248_3768629912820237016_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=2vFpzNmio1QQ7kNvwFx7VwZ&_nc_oc=AdmAapTC4EuuHpZl-Cmy0MZchWownnpHXu2yWk-56RNV5RY4gdjOXQeyuAVgzGEMZMs&_nc_zt=23&_nc_ht=scontent-ord5-2.xx&_nc_gid=0OVsm8VGrSFlzeEwO3-7DQ&oh=00_Afs0LbMRnTMo7vE_Jkv7ccpkW9AAOpx9YVfgM8VTx5DLzQ&oe=69932713"
                alt="Maram Ashraf"
              />
            </div>
            <div className="about-portrait-grain" aria-hidden="true" />
            <p className="about-portrait-caption">Portrait, 2026</p>
          </div>
        </section>

        {/* 2) Projects — horizontal timeline rail */}
        <section className="about-timeline-rail-wrap">
          <h2 className="about-section-head">Projects — Site Plan Timeline</h2>
          <div className={`about-timeline-rail-container ${isScrolling ? 'is-scrolling' : ''}`} ref={timelineRef}>
            <div className="about-timeline-rail" ref={railRef}>
              <div className="about-timeline-line" aria-hidden="true" />
              {timelineProjects.map((proj, i) => (
                <Link
                  key={proj.id}
                  to={`/project/${proj.id}`}
                  className="about-timeline-node"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <span className="about-timeline-node-pin" />
                  <span className="about-timeline-node-year">{proj.year}</span>
                  <span className="about-timeline-node-title">{proj.title}</span>
                  {proj.location && (
                    <span className="about-timeline-node-meta">{proj.location}</span>
                  )}
                  {proj.designDuration && (
                    <span className="about-timeline-node-meta">{proj.designDuration}</span>
                  )}
                  <span className="about-timeline-node-mass" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
          <div className="about-scale-ruler">
            <span style={{ transform: `translateX(${-scaleLeft * 0.05}px)` }}>0m</span>
            <span style={{ transform: `translateX(${80 - scaleLeft * 0.05}px)` }}>10m</span>
            <span style={{ transform: `translateX(${160 - scaleLeft * 0.05}px)` }}>20m</span>
            <span style={{ transform: `translateX(${240 - scaleLeft * 0.05}px)` }}>30m</span>
          </div>
        </section>

        {/* 3) Process: Sketch → Massing → Drawings → Render */}
        <section className="about-process-wrap">
          <h2 className="about-section-head">Process</h2>
          <div className="about-process-conveyor">
            {processSteps.map((step, i) => (
              <div
                key={step.id}
                className={`about-process-step about-process-${step.id}`}
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <span className="about-process-step-label">{step.label}</span>
                <span className="about-process-step-desc">{step.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 4) Design Philosophy — sharp, non-cliché */}
        <section className="about-philosophy">
          <h2 className="about-section-head">Design Philosophy</h2>
          <div className="about-quotes-grid">
            {designPhilosophy.map((line, i) => (
              <div key={i} className="about-quote-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <p>{line}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5) Values — material swatches wall */}
        <section className="about-values-wrap">
          <h2 className="about-section-head">Values — Material Library</h2>
          <div className="about-values-grid">
            {valuesList.map((v, i) => (
              <div
                key={v.title}
                className="about-value-tile"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="about-value-tile-inner">
                  <div className="about-value-tile-front">
                    <span className="about-value-swatch" />
                    <span className="about-value-tile-title">{v.title}</span>
                  </div>
                  <div className="about-value-tile-back">
                    <span className="about-value-tile-body">{v.body}</span>
                    <span className="about-value-arrow" aria-hidden="true">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6) Tools — voxel tiles */}
        <section className="about-tools-wrap">
          <h2 className="about-section-head">Design Stack</h2>
          <div className="about-tool-wall">
            {toolTags.map((tool, i) => (
              <span key={tool} className="about-tool-tag" style={{ animationDelay: `${i * 0.04}s` }}>
                {tool}
              </span>
            ))}
          </div>
        </section>

        {/* 7) Recognition — plaque wall */}
        <section className="about-recognition-wrap">
          <h2 className="about-section-head">Recognition</h2>
          <div className="about-plaque-wall">
            {recognitionItems.map((item, i) => (
              <div key={i} className="about-plaque" style={{ animationDelay: `${i * 0.12}s` }}>
                <span className="about-plaque-year">{item.year}</span>
                <span className="about-plaque-title">{item.title}</span>
                <span className="about-plaque-org">{item.org}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 8) Contact — gate footer */}
        <footer className="about-footer about-footer-gate">
          <div className="about-gate-line" aria-hidden="true" />
          <Link to="/world" className="about-enter-city">
            Enter Maram City →
          </Link>
          <a
            href="mailto:mramashraf18@gmail.com"
            className="about-send-message"
          >
            Send message
          </a>
        </footer>
      </main>
    </div>
  )
}

export default About
