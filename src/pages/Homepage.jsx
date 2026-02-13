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
                <div className="inbox-poem-text">{`I built you a city out of ache and desire,
 Out of sleepless nights full of fire.
 Not just from love, not gentle or mild,
 But the one that makes a grown man wild.

I traced your darkness in steel and black,
 Strong and sharp, yet no softness you lack.
 You move like a skyline cutting the night,
 All shadows and curves are dangerous light.

I built you a city from hunger and flame,
 From nights saying your beautiful name.
 I built it from tension I carry in skin,
 From wanting you close, from pulling you in.

I learned your patience in steel and stone,
 The boring silence that you've only known.
 I measured the skyline the way that I trace
 The slow soft curve of your lips and your face.

You are softer than marbles, stronger than steels,
Yet my little girl came down on her knees.
And I am so proud of the woman you are,
My architect genius, my super star.

You stand like a tower, dark, precise,
 Gothic and beautiful, built from ice.
 But under that clothes I know the heat,
 The way your body answers when ours meet.

Your eyes don't glance, they lock and command,
 Your lips taste sweeter the closer I stand.
 Your hips are promises tight and warm,
 Built like a structure that shapes a storm.

If I had known you liked poems like this,
 I'd write you one with every kiss.
 Every morning. Every breath.
 Every second until my death.

I'd write them on skin, not only on page,
 Across your neck, across the ribcage.
 I'd earn you in ways that feel too chill,
 In the heat of your body under my will.

This city stands because you exist,
 Because of the fire in every kiss.
 Not just buildings. Not just art.
 But your name carved deep in my heart.

When you walk through what I made,
 Know every brick holds the way you sway.
 This city is yours. The nights are too.
 And every hot, unfinished dream of you.

And when you walk through what I've done,
Know this was built for only one.
Not just buildings rising above, 
But a kingdom ruled by obsession and love.
`}</div>
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
