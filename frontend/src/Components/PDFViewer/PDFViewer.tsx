import React, { useState, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Use CDN worker with exact version match
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  onTextSelect?: (text: string) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url, onTextSelect }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [error, setError] = useState<string | null>(null);

  // Memoize the file prop
  const file = useMemo(() => ({ url }), [url]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    if (error.message.includes('404') || error.message.includes('not found')) {
      setError('Document not found');
    } else if (error.message.includes('network')) {
      setError('Network error occurred while loading the document');
    } else {
      setError('Error loading document');
    }
  };

  const [selectedText, setSelectedText] = useState('');

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      const selectedText = selection.toString().trim();
      console.log("selectedText: ", selectedText);
      setSelectedText(selectedText);
      if (onTextSelect) {
        onTextSelect(selectedText);
      }
    }
  };

  return (
    <div className="pdf-viewer flex flex-col gap-4">
      {error ? (
        <div className="error-message text-red-500">{error}</div>
      ) : (
        <>
          {/* Controls */}
          <div className="controls flex justify-between items-center bg-gray-800 p-4 rounded">
            <div className="pagination flex items-center gap-4">
              <button
                className="bg-purple-500 px-4 py-2 rounded disabled:opacity-50"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
              >
                Previous
              </button>
              <span className="text-white">
                Page {currentPage} of {numPages}
              </span>
              <button
                className="bg-purple-500 px-4 py-2 rounded disabled:opacity-50"
                onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                disabled={currentPage >= numPages}
              >
                Next
              </button>
            </div>
            
            <div className="zoom flex items-center gap-4">
              <button
                className="bg-purple-500 px-4 py-2 rounded"
                onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
              >
                -
              </button>
              <span className="text-white">{Math.round(scale * 100)}%</span>
              <button
                className="bg-purple-500 px-4 py-2 rounded"
                onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
              >
                +
              </button>
            </div>
          </div>

          {/* PDF Document */}
          <div className="document-container overflow-auto max-h-[calc(100vh-200px)]" onMouseUp={handleTextSelection}>
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className="text-white">Loading document...</div>}
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          </div>
        </>
      )}
    </div>
  );
};

export default PDFViewer; 