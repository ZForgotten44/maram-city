import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// Sound Design Component
// Provides ambient sounds for different sections
// Note: Audio files should be added to public/audio/ directory
// For now, this sets up the structure - actual audio files can be added later

function SoundDesign() {
  const location = useLocation()
  const ambientSoundRef = useRef(null)

  useEffect(() => {
    // Initialize ambient sound based on current route
    const currentPath = location.pathname

    // Different ambient sounds for different sections
    let soundFile = null
    
    if (currentPath === '/') {
      // Homepage: soft wind/echo
      soundFile = '/audio/wind-ambient.mp3'
    } else if (currentPath === '/world') {
      // World map: distant metallic resonance
      soundFile = '/audio/metallic-resonance.mp3'
    } else if (currentPath.startsWith('/project/')) {
      // Project detail: cathedral reverb
      soundFile = '/audio/cathedral-reverb.mp3'
    } else if (currentPath === '/about') {
      // About: silence (luxury)
      soundFile = null
    }

    // Load and play ambient sound if available
    // Note: Audio files should be added to public/audio/ directory
    // Web Audio API requires user interaction first, so this is disabled by default
    // Uncomment and add audio files to enable sound design
    
    // if (soundFile) {
    //   try {
    //     const audio = new Audio(soundFile)
    //     audio.loop = true
    //     audio.volume = 0.1
    //     audio.play().catch(() => {
    //       // Audio requires user interaction - will play after first click
    //     })
    //     ambientSoundRef.current = audio
    //     
    //     return () => {
    //       if (ambientSoundRef.current) {
    //         ambientSoundRef.current.pause()
    //         ambientSoundRef.current = null
    //       }
    //     }
    //   } catch (error) {
    //     console.log('Audio not available:', error)
    //   }
    // }

    // Cleanup function
    return () => {
      if (ambientSoundRef.current) {
        if (ambientSoundRef.current.oscillator) {
          ambientSoundRef.current.oscillator.stop()
        }
        if (ambientSoundRef.current.audioContext) {
          ambientSoundRef.current.audioContext.close()
        }
      }
    }
  }, [location.pathname])

  // This component doesn't render anything
  return null
}

export default SoundDesign
