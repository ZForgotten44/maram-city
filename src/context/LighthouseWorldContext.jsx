import { createContext, useContext, useState, useCallback } from 'react'

const LighthouseWorldContext = createContext(null)

const SECRET_SEQUENCE = ['lighthouse', 'volcano', 'airport']

export function LighthouseWorldProvider({ children }) {
  const [volcanoGlow, setVolcanoGlow] = useState(false)
  const [wireframeMode, setWireframeMode] = useState(false)
  const [chaosMode, setChaosMode] = useState(false)
  const [architectMode, setArchitectMode] = useState(false)
  const [cameraTarget, setCameraTarget] = useState(null) // 'school' | 'hospital' | 'airport' | 'towers' | 'pyramids' | 'volcano' | 'lighthouse' | null
  const [secretClicks, setSecretClicks] = useState([])
  const [volcanoClickCount, setVolcanoClickCount] = useState(0)
  const [islandBuilderUnlocked, setIslandBuilderUnlocked] = useState(false)
  const [showVolcanoMessage, setShowVolcanoMessage] = useState(false)
  const [satelliteMessage, setSatelliteMessage] = useState(false)

  const addSecretClick = useCallback((id) => {
    setSecretClicks((prev) => {
      const next = [...prev, id]
      if (next.length >= 3 && next[0] === SECRET_SEQUENCE[0] && next[1] === SECRET_SEQUENCE[1] && next[2] === SECRET_SEQUENCE[2]) {
        setIslandBuilderUnlocked(true)
      }
      return next.slice(-3)
    })
  }, [])

  const addVolcanoClick = useCallback(() => {
    setVolcanoClickCount((c) => {
      const next = c + 1
      if (next >= 5) setShowVolcanoMessage(true)
      return next
    })
  }, [])

  const clearCameraTarget = useCallback(() => setCameraTarget(null), [])

  const value = {
    volcanoGlow,
    setVolcanoGlow,
    wireframeMode,
    setWireframeMode,
    chaosMode,
    setChaosMode,
    architectMode,
    setArchitectMode,
    cameraTarget,
    setCameraTarget,
    clearCameraTarget,
    secretClicks,
    addSecretClick,
    volcanoClickCount,
    addVolcanoClick,
    islandBuilderUnlocked,
    showVolcanoMessage,
    setShowVolcanoMessage,
    satelliteMessage,
    setSatelliteMessage,
  }

  return (
    <LighthouseWorldContext.Provider value={value}>
      {children}
    </LighthouseWorldContext.Provider>
  )
}

export function useLighthouseWorld() {
  const ctx = useContext(LighthouseWorldContext)
  if (!ctx) return null
  return ctx
}
