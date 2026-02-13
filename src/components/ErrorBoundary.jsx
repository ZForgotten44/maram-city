import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          color: '#000000',
          fontFamily: 'Cinzel, serif'
        }}>
          <h2>Something went wrong</h2>
          <p style={{ marginTop: '1rem', fontFamily: 'Inter, sans-serif' }}>
            Please refresh the page
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
