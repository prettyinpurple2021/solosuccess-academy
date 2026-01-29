import { useState, useCallback } from 'react';

interface ParsedDocument {
  content: string;
  fileName: string;
  charCount: number;
}

export function useDocumentParser() {
  const [document, setDocument] = useState<ParsedDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDocumentParsed = useCallback((content: string, fileName: string) => {
    setDocument({
      content,
      fileName,
      charCount: content.length,
    });
    setError(null);
  }, []);

  const clearDocument = useCallback(() => {
    setDocument(null);
    setError(null);
  }, []);

  return {
    document,
    documentContent: document?.content || null,
    fileName: document?.fileName || null,
    isLoading,
    error,
    handleDocumentParsed,
    clearDocument,
  };
}
