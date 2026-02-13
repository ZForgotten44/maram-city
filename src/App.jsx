import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import Homepage from './pages/Homepage'
import WorldMap from './pages/WorldMap'
import ProjectDetail from './pages/ProjectDetail'
import { ThemeProvider } from './context/ThemeContext'
import { LighthouseWorldProvider } from './context/LighthouseWorldContext'
import About from './pages/About'
import LighthousePage from './pages/Lighthouse'
import SoundDesign from './components/SoundDesign'
import ErrorBoundary from './components/ErrorBoundary'

function ScrollHandler() {
  const location = useLocation()
  
  useEffect(() => {
    const allowScroll = location.pathname.startsWith('/project/') || location.pathname === '/about' || location.pathname === '/lighthouse'
    if (allowScroll) {
      document.body.style.overflow = 'auto'
      document.documentElement.style.overflow = 'auto'
    } else {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    }
    
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [location.pathname])
  
  return null
}

function ZFEasterEgg() {
  const navigate = useNavigate()
  const bufferRef = useRef('')
  const timeoutRef = useRef(null)

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const key = e.key?.toLowerCase()
      if (!key || key.length > 1) return
      bufferRef.current = (bufferRef.current + key).slice(-4)
      if (bufferRef.current.endsWith('zf')) {
        navigate('/lighthouse')
        bufferRef.current = ''
      }
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => { bufferRef.current = '' }, 800)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      clearTimeout(timeoutRef.current)
    }
  }, [navigate])

  return null
}

// Single ThemeProvider wraps entire app so TimeDial and Canvas/WorldMap share the same context.
function App() {
  console.log('App component rendering')
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LighthouseWorldProvider>
        <Router>
          <ScrollHandler />
          <ZFEasterEgg />
          <SoundDesign />
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/world" element={<WorldMap />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/lighthouse" element={<LighthousePage />} />
          </Routes>
        </Router>
        </LighthouseWorldProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
