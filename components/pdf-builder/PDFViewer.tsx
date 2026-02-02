'use client';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useState, memo } from 'react';

// Configurar worker
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PDFViewerProps {
  fileUrl: string;
  currentPage: number;
  scale?: number;
  onPageChange?: (page: number) => void;
  onLoadSuccess?: (numPages: number) => void;
  className?: string;
}

export const PDFViewer = memo(function PDFViewer({
  fileUrl,
  currentPage,
  scale = 1.5,
  onPageChange,
  onLoadSuccess,
  className = '',
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    if (onLoadSuccess) onLoadSuccess(numPages);
  };

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <Document
        file={fileUrl}
        onLoadSuccess={handleLoadSuccess}
        className="flex justify-center border border-gray-200 shadow-lg"
        loading={
          <div className="flex h-96 w-full items-center justify-center bg-gray-100">
            <span className="text-gray-400">Cargando PDF...</span>
          </div>
        }
      >
        <Page
          pageNumber={currentPage}
          scale={scale}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="bg-white"
        />
      </Document>

      {/* Controles de Paginación Flotantes */}
      {numPages > 1 && (
        <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full bg-gray-900/90 px-6 py-3 text-white shadow-xl backdrop-blur-sm">
          <button
            onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="flex items-center gap-1 rounded px-2 hover:bg-white/20 disabled:opacity-30"
          >
            <span>←</span> Ant
          </button>

          <span className="font-mono text-sm">
            {currentPage} / {numPages}
          </span>

          <button
            onClick={() => onPageChange?.(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages}
            className="flex items-center gap-1 rounded px-2 hover:bg-white/20 disabled:opacity-30"
          >
            Sig <span>→</span>
          </button>
        </div>
      )}
    </div>
  );
});
