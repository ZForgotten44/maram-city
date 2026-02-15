import { useState, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import './BlueprintViewer.css'

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
}

const ZOOM_STEP = 0.15
const ZOOM_MIN = 0.5
const ZOOM_MAX = 3
const DEBOUNCE_MS = 150

function BlueprintViewer({ blueprint, onClose }) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [pendingScale, setPendingScale] = useState(1.0)
  const [documentLoaded, setDocumentLoaded] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    setPendingScale(1.0)
    setScale(1.0)
    setDocumentLoaded(false)
  }, [blueprint?.url])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setScale(pendingScale)
      debounceRef.current = null
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [pendingScale])

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages)
    setDocumentLoaded(true)
  }

  function zoomOut() {
    setPendingScale((p) => Math.max(ZOOM_MIN, p - ZOOM_STEP))
  }
  function zoomIn() {
    setPendingScale((p) => Math.min(ZOOM_MAX, p + ZOOM_STEP))
  }

  const displayScale = pendingScale

  return (
    <div className="blueprint-modal" onClick={onClose}>
      <div className="blueprint-content" onClick={(e) => e.stopPropagation()}>
        <div className="blueprint-header">
          <h3>{blueprint.name}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="blueprint-controls">
          <button
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
          >
            ← Previous
          </button>
          <span>
            Page {pageNumber} of {numPages || '--'}
          </span>
          <button
            onClick={() => setPageNumber(Math.min(numPages || 1, pageNumber + 1))}
            disabled={pageNumber >= (numPages || 1)}
          >
            Next →
          </button>
          <div className="zoom-controls">
            <button onClick={zoomOut}>−</button>
            <span>{Math.round(displayScale * 100)}%</span>
            <button onClick={zoomIn}>+</button>
          </div>
        </div>

        <div className="blueprint-viewer">
          {!documentLoaded && (
            <div className="blueprint-loading-overlay" aria-live="polite">
              <span className="blueprint-loading-spinner" />
              <p>Loading PDF…</p>
            </div>
          )}
          <Document
            file={blueprint.url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={null}
            error={<div className="error">Failed to load blueprint</div>}
            renderMode="canvas"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>
      </div>
    </div>
  )
}

export default BlueprintViewer
