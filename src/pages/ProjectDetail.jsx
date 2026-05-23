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
  { title: 'Before You', unlocked: true, tone: 'moonlit', unlock: 'Enter', symbol: 'I', roomId: 'before-you' },
  { title: 'Little Things', unlocked: true, tone: 'gold', unlock: 'Enter', symbol: 'II', roomId: 'balloon-notes' },
  { title: 'The Smile Exhibit', unlocked: false, tone: 'amber', unlock: 'Opens May 24', symbol: 'III' },
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

const balloonNotes = [
  'The way your voice becomes softer when you talk to me, as if your heart changes clothes around me.',
  'The way you come to me when you are sad or complaining. I could genuinely listen to you for hours without getting tired. Even your complaints sound adorable. Especially your complaints.',
  'Your reels are the second cutest thing in the world after the girl sending them.',
  'The amount of patience you have with my late replies because of work still confuses me. You give me grace in a world that rushes everyone.',
  'The way you get genuinely grateful over the smallest things I do for you makes me want to do a million more.',
  'Your face when you join a call with me. The smile. The eyes. The excitement. It genuinely makes me feel like the luckiest man alive.',
  'The colorful emoji messages after I get you something make my entire day look like butterflies and fireworks.',
  'Your snap hauls and reviews deserve their own Netflix series.',
  'The way you get angry is so peaceful. You are genuinely a cute criminal.',
  'Every outfit on you looks illegal. I still do not understand how one person can wear anything and somehow become prettier.',
  'The way you instantly say “yes” whenever I ask you for something… then only later realize you have absolutely no idea how you’re going to do it.',
  'The way you handle stress by immediately coming to me. Excellent decision-making by the way.',
  'You are genuinely the most talented architect I know, and one day the world will have buildings standing because your mind existed.',
  'Your gossip sessions deserve podcast sponsorships.',
  'You speak at x4 speed and expect me to survive.',
  'Your movie taste is terrifyingly good.',
  'Your series taste… Allah yehdeeki.',
  'Your random songs always somehow arrive exactly when I need them.',
  'Your random “I love you” messages could fix entire wars.',
  '14-hour Discord calls somehow still feel too short.',
  'Sleeping on your voice gives me the most vivid dreams. This is scientifically true.',
  'YOUR DRESSES. That’s it. That’s the note.',
  'I have traveled to different countries and met thousands of people, and somehow your beauty still feels unfair compared to all of them.',
  'The way you pronounce words with your own personal dictionary and still defend it confidently like a lawyer.',
  'The way you stare at my lips while I’m talking sometimes. (Yes, I notice. Yes, I do the same thing.)',
  'The way you become interested in literally anything I’m interested in.',
  'The way you ask me to teach you everything I know feels like my heart is raising another heart.',
  'The way you naturally became my princess without either of us even discussing it.',
  'The child inside you is unbelievably innocent and soft. The world better never ruin that part of you.',
  'Your wink attempts are genuinely one of the funniest cute things I’ve ever witnessed.',
  'The way you send selfies just to show me the tiniest detail of your day.',
  'Your nicknames for me would probably cure a dying Victorian child.',
  'Your tone with me versus your tone with everyone else. I notice it every single time.',
  'The juice you drink during movie nights somehow became part of the memory itself.',
  'The way you watch all the horrible “eye pollution” videos I send while I eat quickly just because you know I enjoy them.',
  'The way you care about feeding me feels like love in its purest form.',
  'The way you “give me space” by only asking: where, why, how, with who, when, how long, what if, why her, why there, and what are you eating.',
  'When you ask me for help, I swear my entire brain becomes a superhero montage.',
  'Reading Quran together heals parts of me I cannot explain.',
  'You make me happy. Not normal happy. Scary happy.',
  'Every time I look at you I genuinely say Alhamdulillah because there is absolutely no logical explanation for how I got you.',
  'The way you say “حاضر” feels softer than music.',
  'The way you overuse everything I get you makes me feel like the smallest things I do matter.',
  'Your oversized cozy home shirts deserve their own museum section.',
  'I love being your personal Google search engine.',
  'Your duas for me melt me completely.',
  'Waking up and reading your long updates about your day first thing in the morning feels like opening the window after a long winter.',
  'Your notifications genuinely change my mood instantly.',
  'You have the kindest heart I have ever met in a human being.',
  'Your family feels warm in the same way you do.',
  'You are art pretending to be a person.',
  'The way you catch my Quran mistakes with full confidence.',
  'Your virtual kisses somehow still feel real.',
  'Every request you make is adorable even when it ruins my schedule.',
  'Picking pictures for you to post is one of my favorite side quests in life.',
  'Every picture you post somehow looks like it belongs in a perfume ad.',
  'You are incredibly smart but somehow still have the brain of an innocent child.',
  'Watching you learn something new with zero ego is one of the prettiest things about you.',
  'You are genuinely the light of my life. Like actually. This is not poetry anymore.',
  'Your jokes are so bad they became cute.',
  'Every atom in you deserves a paragraph but HR policies prevent me from continuing.',
  'Your soul is prettier than your face, which is honestly terrifying considering your face.',
  'The way you love babies makes me accidentally imagine entire futures.',
  'The way you love animals just because I showed them to you.',
  'The way you love nature like it personally wrote you a thank-you letter.',
  'You somehow have your own way of doing literally everything.',
  'Hello Kitty was definitely inspired by you somehow.',
  'Your FBI-level stalking skills should concern me more than they do.',
  'The way you automatically respect the people I love and dislike the people I dislike.',
  'The way you buy things and then return to me with a full courtroom presentation explaining why it was “actually necessary.”',
  'The thing I love most about your relationship with money is that your happiness matters more to you than showing off.',
  'Your shyness is so cute it physically hurts me sometimes.',
  'The way you get surprised like a little kid on Eid morning.',
  'Your random “I miss you” messages ruin my ability to focus for the next three business days.',
  'Your emojis somehow sound like you.',
  'Your humor is terrible. I’m crying. Please continue forever.',
  'The way I can fully be myself with you without performing, pretending, or shrinking parts of me.',
  'The way your face changes when you’re trying not to laugh.',
  'The tiny silence before you say “okay” when you’re pretending not to be jealous.',
  'The way your sleepy voice sounds like home after a long day.',
  'The way you ask “did you eat?” like it carries the weight of a love language.',
  'The way you become softer after we solve an argument.',
  'The way your eyes search for my reaction first.',
  'The way your happiness instantly becomes my happiness.',
  'The way your sadness physically changes my day.',
  'The way your existence made the future stop feeling scary.',
  'The way I no longer dream alone in any dream I have.',
  'The way loving you made me understand why poets ruined their lives writing.',
]

const balloonPalette = ['#e9b8bd', '#f6ecd9', '#f2eadf', '#7a2c3d', '#d6bd8d']

function getBalloonStyle(index) {
  const lanes = [18, 37, 62, 81, 27, 52, 73]
  const x = lanes[index % lanes.length] + (((index * 7) % 9) - 4)
  const top = 28 + index * 28 + (index % 3) * 6
  const note = balloonNotes[index]
  const important = isImportantBalloonNote(note)
  return {
    '--x': `${Math.max(10, Math.min(90, x))}%`,
    '--top': `${top}vh`,
    '--delay': `${-(index % 9) * 0.55}s`,
    '--size': `${1.1 + (index % 5) * 0.04 + (important ? 0.1 : 0)}`,
    '--note-angle': `${((index * 11) % 10) - 5}deg`,
    '--balloon-color': balloonPalette[index % balloonPalette.length],
    '--paper-width': `${getBalloonNoteWidth(note)}px`,
  }
}

function getBalloonCount(note) {
  if (note.length > 135 || isImportantBalloonNote(note)) return 3
  if (note.length > 74) return 2
  return 1
}

function getBalloonNoteWidth(note) {
  if (note.length > 135 || isImportantBalloonNote(note)) return 390
  if (note.length > 74) return 330
  return 270
}

function isImportantBalloonNote(note) {
  return [
    'light of my life',
    'favorite place',
    'kindest heart',
    'Alhamdulillah',
    'future stop feeling scary',
    'poets ruined their lives',
  ].some((phrase) => note.includes(phrase))
}

function MuseumOfLovingMaram({ embedded, onClose, theme }) {
  const [activeRoom, setActiveRoom] = useState(null)
  const [countdown, setCountdown] = useState(() => getMuseumCountdown())
  const [isMuted, setIsMuted] = useState(() => window.localStorage.getItem('museum-muted') === 'true')
  const [roomProgress, setRoomProgress] = useState(0)
  const [selectedBalloonNote, setSelectedBalloonNote] = useState(null)
  const hallAudioRef = useRef(null)
  const roomAudioRef = useRef(null)
  const roomTwoAudioRef = useRef(null)
  const audioFadeRef = useRef({})
  const roomRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setCountdown(getMuseumCountdown()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const hallAudio = new Audio('/audio/song1.mp3')
    const roomAudio = new Audio('/audio/door1.mp3')
    const roomTwoAudio = new Audio('/audio/door2.mp3')
    ;[hallAudio, roomAudio, roomTwoAudio].forEach((audio) => {
      audio.loop = true
      audio.preload = 'auto'
      audio.volume = 0
    })
    hallAudioRef.current = hallAudio
    roomAudioRef.current = roomAudio
    roomTwoAudioRef.current = roomTwoAudio

    return () => {
      Object.values(audioFadeRef.current).forEach(cancelAnimationFrame)
      ;[hallAudio, roomAudio, roomTwoAudio].forEach((audio) => {
        audio.pause()
        audio.src = ''
      })
      hallAudioRef.current = null
      roomAudioRef.current = null
      roomTwoAudioRef.current = null
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('museum-muted', String(isMuted))
  }, [isMuted])

  useEffect(() => {
    const hallAudio = hallAudioRef.current
    const roomAudio = roomAudioRef.current
    const roomTwoAudio = roomTwoAudioRef.current
    if (!hallAudio || !roomAudio || !roomTwoAudio) return undefined

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

    const activeAudio = activeRoom === 'before-you' ? roomAudio : activeRoom === 'balloon-notes' ? roomTwoAudio : hallAudio
    const inactiveAudios = [hallAudio, roomAudio, roomTwoAudio].filter((audio) => audio !== activeAudio)
    const activeVolume = isMuted ? 0 : activeRoom === 'before-you' ? 0.24 : activeRoom === 'balloon-notes' ? 0.23 : 0.22

    const syncAudio = () => {
      if (!isMuted) {
        activeAudio.play().catch(() => {})
      }
      fadeAudio(activeAudio, activeVolume, 3200)
      inactiveAudios.forEach((audio) => fadeAudio(audio, 0, 1600, true))
    }

    syncAudio()
    window.addEventListener('pointerdown', syncAudio, { once: true })
    window.addEventListener('keydown', syncAudio, { once: true })

    return () => {
      window.removeEventListener('pointerdown', syncAudio)
      window.removeEventListener('keydown', syncAudio)
    }
  }, [activeRoom, isMuted])

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

      {!activeRoom ? (
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
                onClick={() => {
                  if (!door.unlocked) return
                  setRoomProgress(0)
                  setActiveRoom(door.roomId)
                }}
                aria-label={door.unlocked ? `Enter ${door.title}` : 'Locked memory door'}
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
      ) : activeRoom === 'before-you' ? (
        <section
          ref={roomRef}
          className="before-you-room"
          aria-label="Before You room"
          onScroll={updateRoomProgress}
          style={{ '--room-progress': roomProgress }}
        >
          <button type="button" className="museum-back" onClick={() => setActiveRoom(null)}>Back to hallway</button>
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
      ) : (
        <section
          ref={roomRef}
          className={`balloon-notes-room ${selectedBalloonNote ? 'has-open-note' : ''}`}
          aria-label="Room II floating balloon notes"
          onScroll={updateRoomProgress}
          style={{ '--room-progress': roomProgress }}
        >
          <button type="button" className="museum-back" onClick={() => setActiveRoom(null)}>Back to hallway</button>
          <div className="balloon-room-architecture" aria-hidden="true">
            <span className="balloon-room-sun" />
            <span className="balloon-room-floor" />
            <span className="balloon-room-flowers" />
          </div>
          <div className="balloon-room-title">
            <p>Room 02</p>
            <h2>Little Things</h2>
            <span>Things I love about you.</span>
            <em>Scroll down and click any note to read it.</em>
          </div>
          <div className="balloon-notes-field" style={{ height: `calc(${balloonNotes.length * 28}vh + 115vh)` }}>
            {balloonNotes.map((note, i) => (
              <button
                key={`${note.slice(0, 24)}-${i}`}
                type="button"
                className="balloon-note"
                style={getBalloonStyle(i)}
                onClick={() => setSelectedBalloonNote(note)}
                aria-label={`Open note ${i + 1}`}
              >
                <span className={`balloon-cluster balloon-cluster-${getBalloonCount(note)}`}>
                  {Array.from({ length: getBalloonCount(note) }, (_, balloonIndex) => (
                    <span key={balloonIndex} className="balloon-shape" style={{ '--balloon-index': balloonIndex }} />
                  ))}
                </span>
                <span className={`balloon-string balloon-string-${getBalloonCount(note)}`} />
                <span className="balloon-paper">{note}</span>
              </button>
            ))}
            <div className="balloon-goodbye" aria-label="Final Room II note">
              <span className="balloon-goodbye-shape" />
              <span className="balloon-goodbye-string" />
              <span className="balloon-goodbye-paper">
                I’ve officially run out of balloons…
                <br />
                see you tomorrow ♡
              </span>
            </div>
          </div>
        </section>
      )}
      {selectedBalloonNote && (
        <div className="balloon-note-modal" role="dialog" aria-modal="true" aria-label="Opened balloon note">
          <button type="button" className="balloon-note-backdrop" onClick={() => setSelectedBalloonNote(null)} aria-label="Close note" />
          <article className="balloon-note-expanded">
            <button type="button" className="balloon-note-close" onClick={() => setSelectedBalloonNote(null)}>Close</button>
            <p>{selectedBalloonNote}</p>
          </article>
        </div>
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
