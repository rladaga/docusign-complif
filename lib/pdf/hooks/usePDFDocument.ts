import { useState, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * Hook para manejar el estado de un documento PDF
 */
export function usePDFDocument() {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const onLoadSuccess = useCallback((pdf: PDFDocumentProxy) => {
    setDocument(pdf);
    setNumPages(pdf.numPages);
    setIsLoading(false);
    setError(null);
  }, []);

  const onLoadError = useCallback((error: Error) => {
    setError(error);
    setIsLoading(false);
    console.error('Error loading PDF:', error);
  }, []);

  const reset = useCallback(() => {
    setDocument(null);
    setNumPages(0);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    document,
    numPages,
    isLoading,
    error,
    onLoadSuccess,
    onLoadError,
    reset,
  };
}
