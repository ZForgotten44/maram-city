import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import GothicGate from '../components/GothicGate'
import './Homepage.css'

function Homepage() {
  const navigate = useNavigate()
  const [inboxOpen, setInboxOpen] = useState(false)
  const [shake, setShake] = useState(false)
  const shakeIntervalRef = useRef(null)

  useEffect(() => {
    shakeIntervalRef.current = setInterval(() => {
      setShake(true)
      setTimeout(() => setShake(false), 400)
    }, 10000)
    return () => { if (shakeIntervalRef.current) clearInterval(shakeIntervalRef.current) }
  }, [])

  const handleEnter = () => {
    navigate('/world')
  }

  return (
    <div className="homepage homepage-gate">
      <p className="homepage-tagline">Catch the sun. Meet the architect.</p>
      <button
        type="button"
        className={`homepage-inbox-btn ${shake ? 'homepage-inbox-shake' : ''}`}
        onClick={() => setInboxOpen(true)}
        aria-label="Open inbox (1 unread)"
      >
        <span className="homepage-inbox-icon" aria-hidden="true">✉</span>
        <span className="homepage-inbox-badge" aria-hidden="true">1</span>
      </button>

      {inboxOpen && (
        <div className="world-content-modal-overlay" onClick={() => setInboxOpen(false)} role="dialog" aria-modal="true">
          <div className="world-content-modal-panel homepage-inbox-panel" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="world-content-modal-close" onClick={() => setInboxOpen(false)} aria-label="Close">×</button>
            <div className="world-content-modal-inner">
              <h2 className="inbox-modal-title">Inbox</h2>
              <p className="inbox-modal-intro">You have an unread message from your beloved.</p>
              <div className="inbox-modal-message inbox-modal-poem">
                <div className="inbox-poem-text">{`My sweet Marmora, my cute lovely girl,
This Valentine I gathered your whole bright world.
Every building you dreamed, every line you drew,
I carried them softly and built them for you.
I made you a city from patience and flame,
From nights whispering your beautiful name.
I felt what architects silently feel,
The weight of a vision you refuse to kneel.
I struggled with angles, with shadows and light,
Just to make the skyline stand perfect and right.
And all I could think as I measured each part
Was how perfectly you are seated in my heart.

Your eyes are windows with warm golden glow,
Your lips are soft terraces dusted in folks flow.
Your smile is a sunrise over every street,
Turning cold stone into something sweet.
You are softer than marble, stronger than steel,
The kind of beauty foundations can feel.
And I am so proud of the woman you are,
My architect genius, my brightest star.

Come live with me in this city I made,
Where fear and doubt become a fade.
We will walk through the dreams you once sketched,
Now real in the skyline, our hands are stretched.
And I will keep building as long as I breathe,
Adding new codes with every weave.
For this city is more than brick and art,
It's forever wrapped around my heart.`}</div>
              </div>
              <button type="button" className="world-content-modal-close-btn" onClick={() => setInboxOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <Canvas
        shadows
        gl={{ antialias: true }}
        className="gate-canvas"
        camera={{ position: [0, 2.2, 7], fov: 42 }}
      >
        <PerspectiveCamera makeDefault position={[0, 2.2, 7]} fov={42} />
        <ambientLight intensity={0.15} />
        <directionalLight position={[2, 6, 4]} intensity={0.4} castShadow />
        <GothicGate onEnter={handleEnter} />
        {/* Ground — charcoal, receives shadow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[24, 24]} />
          <meshStandardMaterial color="#1B1B1B" roughness={0.98} metalness={0} />
        </mesh>
        {/* Subtle ground fog layer */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <planeGeometry args={[24, 24]} />
          <meshBasicMaterial color="#AAB7C4" transparent opacity={0.06} depthWrite={false} />
        </mesh>
      </Canvas>
    </div>
  )
}

export default Homepage
