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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate page width based on container size
  const getPageWidth = () => {
    // For mobile (< 768px), use full width minus padding
    if (windowWidth < 768) {
      return windowWidth - 32; // 16px padding on each side
    }
    // For desktop, use standard width
    return Math.min(windowWidth - 48, 800);
  };

  return (
    <div className="pdf-viewer flex flex-col gap-4 w-full">
      {error ? (
        <div className="error-message text-red-500 p-4 bg-red-100/10 rounded-lg text-center">
          {error}
        </div>
      ) : (
        <>
          <div className="controls bg-gray-800 rounded-lg w-full">
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4">
              <div className="pagination flex items-center gap-2 w-full sm:w-auto justify-center">
                <button
                  className="bg-purple-500 px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50 min-w-[80px]"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                >
                  Previous
                </button>
                <span className="text-white text-sm min-w-[100px] text-center">
                  Page {currentPage} of {numPages}
                </span>
                <button
                  className="bg-purple-500 px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50 min-w-[80px]"
                  onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                  disabled={currentPage >= numPages}
                >
                  Next
                </button>
              </div>
              
              <div className="zoom flex items-center gap-2 justify-center w-full sm:w-auto">
                <button
                  className="bg-purple-500 w-8 h-8 rounded-lg text-white flex items-center justify-center"
                  onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
                >
                  -
                </button>
                <span className="text-white text-sm min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  className="bg-purple-500 w-8 h-8 rounded-lg text-white flex items-center justify-center"
                  onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="document-container bg-gray-900/50 rounded-lg w-full flex-1 min-h-0">
            <div className="pdf-content h-full overflow-auto">
              <div 
                className="flex items-center justify-center p-2 sm:p-4" 
                onMouseUp={handleTextSelection}
              >
                <Document
                  file={file}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="text-white p-4 bg-gray-800/50 rounded-lg">
                      Loading document...
                    </div>
                  }
                >
                  <Page
                    key={`page_${currentPage}_${scale}`}
                    pageNumber={currentPage}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    width={getPageWidth()}
                    className="max-w-full"
                  />
                </Document>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PDFViewer; 