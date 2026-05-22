import { useState, Suspense, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei'
import { getProjectById } from '../data/projects'
import BlueprintViewer from '../components/BlueprintViewer'
import RVTViewer from '../components/RVTViewer'
import GlbViewer from '../components/GlbViewer'
import { useTheme } from '../context/ThemeContext'
import './ProjectDetail.css'

function ProjectDetail({ embedded, projectId: projectIdProp, onClose }) {
  const { id: routeId } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const id = embedded && projectIdProp != null ? projectIdProp : routeId
  const project = getProjectById(id)
  const [activeView, setActiveView] = useState('overview')
  const [selectedBlueprint, setSelectedBlueprint] = useState(null)
  const [sustainabilityMode, setSustainabilityMode] = useState(false)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setEntered(true), 20)
    return () => clearTimeout(id)
  }, [])

  if (!project) {
    const isAirport = id === 'airport'
    return (
      <div className="project-not-found" data-theme={theme}>
        <h2>{isAirport ? 'Airport' : 'Project not found'}</h2>
        {isAirport && <p>Coming soon (Graduation project 2026/27)!</p>}
        {embedded && onClose ? (
          <button type="button" onClick={onClose}>Close</button>
        ) : (
          <Link to="/world">Return to World</Link>
        )}
      </div>
    )
  }

  if (project.buildingType === 'museum') {
    return <MuseumOfLovingMaram embedded={embedded} onClose={onClose} theme={theme} />
  }

  const isDay = theme === 'day'
  const images = project.images || []

  return (
    <div
      className={`project-detail project-detail-enter ${entered ? 'entered' : ''}`}
      data-theme={theme}
    >
      {/* Voxel grid background + optional building silhouette */}
      <div className="project-detail-bg" aria-hidden="true">
        <div className="voxel-grid-bg" />
        <div className="building-silhouette" data-building={project.buildingType} />
      </div>

      {/* Title + description always under title; metadata right */}
      <header className="project-header">
        <div className="project-header-left">
          <h1 className="project-title">{project.title}</h1>
          <p className="project-description-under-title">{project.description}</p>
        </div>
        <div className="project-meta-stack">
          <div className="meta-box">
            <span className="meta-label">Year</span>
            <span className="meta-value">{project.year}</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">Type</span>
            <span className="meta-value">{project.concept}</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">Location</span>
            <span className="meta-value">{project.location}</span>
          </div>
          {project.designDuration && (
            <div className="meta-box meta-box-accent">
              <span className="meta-label">Duration</span>
              <span className="meta-value">{project.designDuration}</span>
            </div>
          )}
        </div>
      </header>

      {/* Nav: voxel-style buttons */}
      <nav className="project-nav">
        <button
          className={`nav-tab ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          Overview
        </button>
        <button
          className={`nav-tab ${activeView === 'blueprints' ? 'active' : ''}`}
          onClick={() => setActiveView('blueprints')}
        >
          Blueprints
        </button>
        <button
          className={`nav-tab ${activeView === '3d' ? 'active' : ''}`}
          onClick={() => setActiveView('3d')}
        >
          3D Model
        </button>
        {images.length > 3 && (
          <button
            className={`nav-tab ${activeView === 'gallery' ? 'active' : ''}`}
            onClick={() => setActiveView('gallery')}
          >
            Gallery
          </button>
        )}
        <button
          className={`sustainability-btn ${sustainabilityMode ? 'active' : ''}`}
          onClick={() => setSustainabilityMode(!sustainabilityMode)}
          title="X-ray Vision"
        >
          🌱
        </button>
      </nav>

      <main className="project-content">
        {activeView === 'overview' && (
          <div className="overview-section">
            {/* Overview: first 3 pictures + "See more pictures" (clear of close button) */}
            <div className={`project-images voxel-image-grid ${images.length <= 1 ? 'single-image' : ''}`}>
              {images.slice(0, 3).map((src) => (
                <div key={src} className="image-block">
                  <div className="image-frame">
                    <img src={src} alt="" loading="lazy" />
                  </div>
                </div>
              ))}
            </div>
            {images.length > 3 && (
              <button
                type="button"
                className="see-more-pictures"
                onClick={() => setActiveView('gallery')}
              >
                See more pictures
              </button>
            )}

            {sustainabilityMode && (
              <div className="materials-section">
                <h3>Materials</h3>
                <div className="materials-grid">
                  {project.materials.sustainable?.length > 0 && (
                    <div className="material-category green">
                      <h4>Sustainable</h4>
                      <ul>
                        {project.materials.sustainable.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {project.materials.reused?.length > 0 && (
                    <div className="material-category amber">
                      <h4>Reused</h4>
                      <ul>
                        {project.materials.reused.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {project.materials.experimental?.length > 0 && (
                    <div className="material-category red">
                      <h4>Experimental</h4>
                      <ul>
                        {project.materials.experimental.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'gallery' && (
          <div className="gallery-section">
            <h3 className="gallery-section-title">All pictures</h3>
            <div className="project-images voxel-image-grid project-gallery-all">
              {images.map((src) => (
                <div key={src} className="image-block gallery-item">
                  <div className="image-frame">
                    <img src={src} alt="" loading="lazy" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'blueprints' && (
          <div className="blueprints-section">
            <div className="blueprints-grid">
              {(project.blueprints || []).map((blueprint, index) => (
                <button
                  key={index}
                  type="button"
                  className="blueprint-card"
                  onClick={() => setSelectedBlueprint(blueprint)}
                >
                  <span className="blueprint-icon">📐</span>
                  <h4>{blueprint.name}</h4>
                  <p>Click to view</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeView === '3d' && (
          <div className="model-viewer-section">
            {project.model3d?.glbOrGltf ? (
              <>
                <GlbViewer url={project.model3d.glbOrGltf.downloadUrl} />
              </>
            ) : project.rvtFile || project.model3d?.rvt ? (
              <>
                <RVTViewer rvtFile={project.rvtFile || (project.model3d?.rvt && { url: project.model3d.rvt.downloadUrl, name: project.model3d.rvt.name })} />
                <div className="model-badge needs-conversion" role="status">
                  .rvt cannot be viewed in browser. Export to .glb for 3D view.
                </div>
              </>
            ) : (
              <div className="placeholder-3d">
                <Canvas shadows gl={{ antialias: true }} className="model-canvas">
                  <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={50} />
                  <ambientLight intensity={0.4} />
                  <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
                  <pointLight position={[-10, 5, -10]} intensity={0.4} color="#d4af37" />
                  <Suspense fallback={null}>
                    <Environment preset="night" />
                    <mesh castShadow receiveShadow>
                      <boxGeometry args={[4, 6, 4]} />
                      <meshStandardMaterial color="#8b7355" metalness={0.3} roughness={0.6} />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                      <planeGeometry args={[20, 20]} />
                      <meshStandardMaterial color="#1a1a1a" />
                    </mesh>
                  </Suspense>
                  <OrbitControls enablePan enableZoom enableRotate minDistance={5} maxDistance={20} />
                </Canvas>
                <div className="placeholder-text">
                  <p>3D Model will be displayed here</p>
                  <p className="hint">Add a .glb or .gltf in Photos and 3D, or export from Revit</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {embedded && onClose ? (
        <button type="button" className="back-button" onClick={onClose}>← Close</button>
      ) : (
        <button type="button" className="back-button" onClick={() => navigate('/world')}>
          ← Return to World
        </button>
      )}

      {selectedBlueprint && (
        <BlueprintViewer
          blueprint={selectedBlueprint}
          onClose={() => setSelectedBlueprint(null)}
        />
      )}
    </div>
  )
}

export default ProjectDetail

const museumDoors = [
  { title: 'Before You', unlocked: true, tone: 'moonlit', unlock: 'Enter', symbol: 'I' },
  { title: 'The Smile Exhibit', unlocked: false, tone: 'gold', unlock: 'Opens May 23', symbol: 'II' },
  { title: 'Little Things', unlocked: false, tone: 'amber', unlock: 'Opens May 24', symbol: 'III' },
  { title: 'You Changed My Life', unlocked: false, tone: 'rose', unlock: 'Opens May 25', symbol: 'IV' },
  { title: 'Constellation Room', unlocked: false, tone: 'starlit', unlock: 'Opens May 26', symbol: 'V' },
  { title: 'Sound of Us', unlocked: false, tone: 'violet', unlock: 'Opens May 27', symbol: 'VI' },
  { title: '100 Years Together', unlocked: false, tone: 'sacred', unlock: 'Opens May 29', symbol: 'VII' },
]

const beforeYouPoem = `Before I knew your name,
life was crowded. Loud, Aflame.
Rooms overflowed. The tables wide,
yet something starving lived inside.

I laughed the loudest in the hall,
that boy they swore could charm them all.
I wore my joy like borrowed clothes,
while emptiness beneath it froze.

Room 206 would breathe at night,
drowned in smoke and restless light.
Voices crashing wall to wall,
yet somehow I was not there at all.

The laughter rang, the music swayed,
young hearts performed, young egos played.
And there I stood among the noise,
a mighty king surrounded by his toys?

I thought that this was what life meant:
A loud applause. A quick event.
A racing pulse. A sleepless high,
Never asking myself how or why.

But darkness is the patient part,
it builds a new home inside my heart.
Sometimes a boy can glow for years
while quietly dissolving into cheers.

Then came that corridor one night,
half asleep in silver light.
The music room. The whole school.
The air so cold, the dark so blue.

And there you were.
So simple. Unaware.
As if God had hidden spring itself
inside a girl with midnight hair.

No orchestra announced your face.
No thunder split the sky in place.
Yet when your fingers touched my hand,
something eternal chose to land.

A simple touch. A passing thing.
No violins or flutes began to sing.
Yet when your hand fell into mine,
the stars rearranged their design.

And Oh God, how strange the air became,
how suddenly I just knew my name.
As if my chest, for all those years,
had only borrowed breath and gears.

I carried that touch for months like fire,
a quiet wound, a sacred wire.
I replayed it before I’d sleep,
the way starving men remember feast.

Before you, mornings used to pass
like trains disappearing behind glass.
Now dawn itself began to bloom
because one day it might lead to you.

I used to worship crowds and noise,
the reckless glow of boys with boys.
Now place me where your soul is not,
and every color starts to rot.

My friends still laugh the way they did,
repeat the same old drunken bits.
But if your name is not somewhere near,
their voices fade against my ear.

I became the boy who checks his phone
in rooms where he once ruled alone.
The boy who leaves the brightest place
just to wait for your typing pace.

And God, how deeply you have grown
through every corner I call home.
You live inside my smallest ways,
inside my work, my nights, my days.

At work, while people speak and move,
I build our future in my head like truth.
Curtains dancing in softened light,
your sleepy voice at two past night.

You do not know how much you changed.
How every wire rearranged.
How ambition bent its knee
the moment it included “we.”

I wait for your replies like a flower waits for rain,
like deserts ache through months of pain.
One little notification sound
could pull my world back around.

You became my favorite place.
My silence. My escape. My grace.
Not just the girl I wished to hold,
but the first warmth in a freezing world.

And if you built a cage from your arms,
I would mistake those bars for stars.
Lock every door and keep the key,
The only freedom with you near me.`

function MuseumOfLovingMaram({ embedded, onClose, theme }) {
  const [enteredRoom, setEnteredRoom] = useState(false)
  const [countdown, setCountdown] = useState(() => getMuseumCountdown())
  const [isMuted, setIsMuted] = useState(() => window.localStorage.getItem('museum-muted') === 'true')
  const [roomProgress, setRoomProgress] = useState(0)
  const hallAudioRef = useRef(null)
  const roomAudioRef = useRef(null)
  const audioFadeRef = useRef({})
  const roomRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setCountdown(getMuseumCountdown()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const hallAudio = new Audio('/audio/song1.mp3')
    const roomAudio = new Audio('/audio/door1.mp3')
    ;[hallAudio, roomAudio].forEach((audio) => {
      audio.loop = true
      audio.preload = 'auto'
      audio.volume = 0
    })
    hallAudioRef.current = hallAudio
    roomAudioRef.current = roomAudio

    return () => {
      Object.values(audioFadeRef.current).forEach(cancelAnimationFrame)
      ;[hallAudio, roomAudio].forEach((audio) => {
        audio.pause()
        audio.src = ''
      })
      hallAudioRef.current = null
      roomAudioRef.current = null
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('museum-muted', String(isMuted))
  }, [isMuted])

  useEffect(() => {
    const hallAudio = hallAudioRef.current
    const roomAudio = roomAudioRef.current
    if (!hallAudio || !roomAudio) return undefined

    const fadeAudio = (audio, targetVolume, duration = 1800, pauseAtEnd = false) => {
      if (audioFadeRef.current[audio.src]) cancelAnimationFrame(audioFadeRef.current[audio.src])
      const startVolume = audio.volume
      const startedAt = performance.now()
      const tick = (now) => {
        const progress = Math.min(1, (now - startedAt) / duration)
        audio.volume = startVolume + (targetVolume - startVolume) * progress
        if (progress < 1) {
          audioFadeRef.current[audio.src] = requestAnimationFrame(tick)
        } else if (pauseAtEnd) {
          audio.pause()
        }
      }
      audioFadeRef.current[audio.src] = requestAnimationFrame(tick)
    }

    const activeAudio = enteredRoom ? roomAudio : hallAudio
    const inactiveAudio = enteredRoom ? hallAudio : roomAudio
    const activeVolume = isMuted ? 0 : enteredRoom ? 0.24 : 0.22

    const syncAudio = () => {
      if (!isMuted) {
        activeAudio.play().catch(() => {})
      }
      fadeAudio(activeAudio, activeVolume, 3200)
      fadeAudio(inactiveAudio, 0, 1600, true)
    }

    syncAudio()
    window.addEventListener('pointerdown', syncAudio, { once: true })
    window.addEventListener('keydown', syncAudio, { once: true })

    return () => {
      window.removeEventListener('pointerdown', syncAudio)
      window.removeEventListener('keydown', syncAudio)
    }
  }, [enteredRoom, isMuted])

  const updateRoomProgress = () => {
    const room = roomRef.current
    if (!room) return
    const maxScroll = Math.max(1, room.scrollHeight - room.clientHeight)
    setRoomProgress(Math.min(1, room.scrollTop / maxScroll))
  }

  return (
    <div className="museum-experience" data-theme={theme}>
      <div className="museum-aurora" aria-hidden="true" />
      <div className="museum-dust" aria-hidden="true">
        {Array.from({ length: 34 }, (_, i) => (
          <span key={i} style={{ '--i': i, left: `${(i * 29) % 100}%`, top: `${(i * 47) % 100}%` }} />
        ))}
      </div>

      <header className="museum-topbar">
        {embedded && onClose ? (
          <button type="button" className="museum-close" onClick={onClose}>Close</button>
        ) : (
          <Link className="museum-close" to="/world">Return to World</Link>
        )}
      </header>
      <button
        type="button"
        className="museum-audio-toggle"
        onClick={() => setIsMuted((muted) => !muted)}
        aria-label={isMuted ? 'Unmute museum music' : 'Mute museum music'}
        aria-pressed={isMuted}
      >
        {isMuted ? '♪' : '♫'}
      </button>

      {!enteredRoom ? (
        <section className="museum-hall" aria-label="Museum hallway with seven memory doors">
          <div className="museum-ceiling" aria-hidden="true">
            <span className="museum-oculus" />
            <span className="museum-balcony-ring" />
            <span className="museum-chandelier" />
          </div>
          <div className="museum-architecture" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => <span key={i} />)}
          </div>
          <div className="museum-hall-depth" aria-hidden="true" />
          <div className="museum-floor" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => <span key={i} style={{ '--i': i }} />)}
          </div>
          <div className="museum-light-rays" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="museum-centerpiece" aria-hidden="true">
            <span className="museum-star-heart" />
            <span className="museum-orbit museum-orbit-one" />
            <span className="museum-orbit museum-orbit-two" />
          </div>
          <div className="museum-countdown" aria-label="Countdown to Maram birthday, EEST">
            <p>almost May 29</p>
            <b>waiting for her birthday</b>
            <div>
              <span><strong>{countdown.days}</strong><em>days</em></span>
              <span><strong>{countdown.hours}</strong><em>hours</em></span>
              <span><strong>{countdown.minutes}</strong><em>minutes</em></span>
              <span><strong>{countdown.seconds}</strong><em>seconds</em></span>
            </div>
          </div>
          <div className="museum-doors">
            {museumDoors.map((door, i) => (
              <button
                key={i}
                type="button"
                className={`museum-door museum-door-${door.tone} ${door.unlocked ? 'unlocked' : 'locked'} ${i === museumDoors.length - 1 ? 'final-door' : ''}`}
                onClick={() => door.unlocked && setEnteredRoom(true)}
                aria-label={door.unlocked ? 'Enter Before You' : 'Locked memory door'}
              >
                <span className="museum-door-niche" />
                <span className="museum-door-interior" />
                <span className="museum-door-number">{String(i + 1).padStart(2, '0')}</span>
                <span className="museum-door-glow" />
                <span className="museum-door-symbol">{door.symbol}</span>
                <span className="museum-door-handle" />
                <span className="museum-door-threshold" />
                <span className="museum-door-lock">{door.unlock}</span>
                <span className="museum-door-room-particles" />
                {!door.unlocked && <span className="museum-door-seal" />}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section
          ref={roomRef}
          className="before-you-room"
          aria-label="Before You room"
          onScroll={updateRoomProgress}
          style={{ '--room-progress': roomProgress }}
        >
          <button type="button" className="museum-back" onClick={() => setEnteredRoom(false)}>Back to hallway</button>
          <div className="before-you-room-architecture" aria-hidden="true">
            <span className="before-you-sun" />
            <span className="before-you-floor" />
            <span className="before-you-bench before-you-bench-left" />
            <span className="before-you-flower-line" />
            <span className="before-you-note before-you-note-one" />
            <span className="before-you-note before-you-note-two" />
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className="before-you-petal" style={{ '--i': i }} />
            ))}
          </div>
          <div className="before-you-room-title">
            <p>Room 01</p>
            <h2>Before You</h2>
            <span>A quiet room for the life before your name arrived.</span>
          </div>

          <div className="before-you-poem-room">
            <div className="before-you-poem-wall" aria-label="Before You poem">
              {beforeYouPoem.split('\n\n').map((stanza, i) => (
                <p key={i}>
                  {stanza.split('\n').map((line, lineIndex) => (
                    <span key={lineIndex}>{line}</span>
                  ))}
                </p>
              ))}
            </div>
            <div className="before-you-signature" aria-label="Museum signatures">
              <span>your lover forever,</span>
              <strong>Mahmoud</strong>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function getMuseumCountdown() {
  // May 29, 2026 at 12:00 AM in UTC+3/EEST is May 28, 21:00 UTC.
  const targetTime = Date.UTC(2026, 4, 28, 21, 0, 0)
  const totalSeconds = Math.max(0, Math.floor((targetTime - Date.now()) / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  }
}
