import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import './BlueprintViewer.css'

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
}

function BlueprintViewer({ blueprint, onClose }) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.5)

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages)
  }

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
            <button onClick={() => setScale(Math.max(0.5, scale - 0.25))}>−</button>
            <span>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(Math.min(3, scale + 0.25))}>+</button>
          </div>
        </div>

        <div className="blueprint-viewer">
          <Document
            file={blueprint.url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div className="loading">Loading blueprint...</div>}
            error={<div className="error">Failed to load blueprint</div>}
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
