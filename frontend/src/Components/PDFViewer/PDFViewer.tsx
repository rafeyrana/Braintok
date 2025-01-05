import React, { useState, useMemo, useEffect } from 'react';
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
  const [selectedText, setSelectedText] = useState('');

  // Reset state when URL changes
  useEffect(() => {
    setError(null);
    setNumPages(0);
    setCurrentPage(1);
    setSelectedText('');
  }, [url]);

  // Memoize the file prop
  const file = useMemo(() => ({ url }), [url]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
    setCurrentPage(1);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    let errorMessage = 'Error loading document';
    
    if (error.name === 'MissingPDFException' || error.message.includes('Missing PDF')) {
      errorMessage = 'Document not found or access denied';
    } else if (error.message.includes('network')) {
      errorMessage = 'Network error occurred while loading the document';
    } else if (error.message.includes('404')) {
      errorMessage = 'Document not found';
    }
    
    setError(errorMessage);
    setNumPages(0);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      const text = selection.toString().trim();
      if (text && text !== selectedText) {
        setSelectedText(text);
        onTextSelect?.(text);
      }
    }
  };

  return (
    <div className="pdf-viewer flex flex-col gap-4 w-[800px]">
      {error ? (
        <div className="error-message text-red-500 p-4 bg-red-100/10 rounded-lg text-center">
          {error}
        </div>
      ) : (
        <>
          <div className="controls bg-gray-800 p-4 rounded w-full">
            <div className="flex justify-between items-center">
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
          </div>

          <div className="document-container bg-gray-900/50 rounded-lg w-full h-[calc(100vh-200px)]">
            <div className="pdf-content h-full overflow-auto">
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="text-white p-4 bg-gray-800/50 rounded-lg text-center">
                    Loading document...
                  </div>
                }
              >
                <div className="flex justify-center min-h-full p-4" onMouseUp={handleTextSelection}>
                  <Page
                    key={`page_${currentPage}_${scale}`}
                    pageNumber={currentPage}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </div>
              </Document>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PDFViewer; 