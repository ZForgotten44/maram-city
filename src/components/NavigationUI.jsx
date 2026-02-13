import TimeDial from './TimeDial'
import './NavigationUI.css'

function NavigationUI({
  selectedBuilding,
  sustainabilityMode,
  onSustainabilityToggle,
  theme,
  onResetCamera,
}) {
  const isDay = theme === 'day'
  const catchphrase = isDay
    ? 'Catch the Sun to meet the Architect'
    : 'Hover the Moon to meet the Architect'

  return (
    <div className="navigation-ui" data-theme={theme}>
      <div className="nav-left-stack">
        <TimeDial />
        {theme === 'night' && (
          <div className="sustainability-toggle-container">
            <button
              className={`sustainability-toggle ${sustainabilityMode ? 'active' : ''}`}
              onClick={onSustainabilityToggle}
              title="X-ray Vision: Reveal sustainable materials"
            >
              <span className="toggle-icon">🌱</span>
              <span className="toggle-label">X-ray Vision</span>
            </button>
            {sustainabilityMode && (
              <div className="sustainability-legend">
                <div className="legend-item legend-item-sustainable">
                  <span className="legend-color green"></span>
                  <span>Sustainable</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color amber"></span>
                  <span>Reused</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="nav-right-stack">
        {onResetCamera && (
          <button
            type="button"
            className="nav-reset-camera"
            onClick={onResetCamera}
            title="Return to default view"
            aria-label="Reset camera to default view"
          >
            Reset view
          </button>
        )}
        <p className="nav-catchphrase" role="status">
          {catchphrase}
        </p>
      </div>

      <div className="instructions">
        <p>Click a building to enter · Drag to pan · Scroll to zoom · Right-click + drag to rotate</p>
      </div>
    </div>
  )
}

export default NavigationUI
