/**
 * @file DocumentUpload.tsx — Document Parser Upload Component
 *
 * PURPOSE: Allows admins to upload documents (PDF, DOCX, TXT) which are
 * parsed client-side via useDocumentParser. The extracted text is then
 * used as context for AI content generation (bulk curriculum, lessons, etc.).
 *
 * SUPPORTED FORMATS: .pdf, .docx, .doc, .txt, .md, .csv
 * MAX SIZE: 10MB
 *
 * PRODUCTION TODO:
 * - Add server-side document parsing for larger files
 * - Support drag-and-drop upload area
 * - Add document preview before parsing
 */
import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, X, Loader2, FileUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  onDocumentParsed: (content: string, fileName: string) => void;
  onClear: () => void;
  documentContent: string | null;
  fileName: string | null;
  isLoading?: boolean;
  className?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DocumentUpload({
  onDocumentParsed,
  onClear,
  documentContent,
  fileName,
  isLoading = false,
  className,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseDocument = useCallback(async (file: File) => {
    setError(null);
    setParseProgress(10);

    try {
      let content = '';
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      // Handle text-based files natively
      if (
        file.type === 'text/plain' ||
        file.type === 'text/markdown' ||
        fileExtension === 'txt' ||
        fileExtension === 'md'
      ) {
        setParseProgress(50);
        content = await file.text();
        setParseProgress(100);
      } else if (fileExtension === 'docx') {
        // For DOCX, extract text from the XML inside the zip
        setParseProgress(20);
        const arrayBuffer = await file.arrayBuffer();
        const JSZip = (await import('jszip')).default;
        
        setParseProgress(40);
        const zip = await JSZip.loadAsync(arrayBuffer);
        const docXml = await zip.file('word/document.xml')?.async('string');
        
        if (!docXml) {
          throw new Error('Could not read document content');
        }
        
        setParseProgress(70);
        // Extract text from XML and neutralize any remaining HTML-significant characters
        const textMatches = docXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
        content = textMatches
          .map(match => match.replace(/<[^>]+>/g, '').replace(/[<>]/g, ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        setParseProgress(100);
      } else if (fileExtension === 'pdf') {
        // For PDF, read as text (basic extraction) or show info
        setParseProgress(30);
        
        // Read as ArrayBuffer and convert to base64 for potential server-side processing
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        // Try to extract text from PDF (basic approach)
        let textContent = '';
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const rawText = decoder.decode(bytes);
        
        // Extract text between stream markers (simplified PDF text extraction)
        const streamMatches = rawText.match(/stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g) || [];
        
        for (const stream of streamMatches) {
          // Try to find readable text in streams
          const readable = stream.replace(/[^\x20-\x7E\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
          if (readable.length > 50) {
            textContent += readable + '\n';
          }
        }
        
        // Also try to extract text objects
        const textObjects = rawText.match(/\(([^)]+)\)\s*Tj/g) || [];
        for (const obj of textObjects) {
          const text = obj.replace(/^\(|\)\s*Tj$/g, '');
          if (text.length > 0) {
            textContent += text + ' ';
          }
        }
        
        setParseProgress(80);
        
        if (textContent.trim().length < 100) {
          // If basic extraction didn't work well, provide guidance
          content = `[PDF Document: ${file.name}]\n\nNote: This PDF may contain images or encoded text that requires OCR processing. The AI will work with available text content.\n\nExtracted content preview:\n${textContent.substring(0, 500)}...\n\nFor best results with PDF documents, consider converting to DOCX or TXT format, or paste the content directly.`;
        } else {
          content = textContent.trim();
        }
        
        setParseProgress(100);
      } else {
        throw new Error(`Unsupported file type. Please upload TXT, MD, DOCX, or PDF files.`);
      }

      if (content.trim().length === 0) {
        throw new Error('No text content could be extracted from the document');
      }

      onDocumentParsed(content, file.name);
    } catch (err: any) {
      console.error('Document parsing error:', err);
      setError(err.message || 'Failed to parse document');
      setParseProgress(0);
    }
  }, [onDocumentParsed]);

  const handleFile = useCallback((file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10MB limit');
      return;
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['txt', 'md', 'pdf', 'docx'];

    if (!validExtensions.includes(fileExtension || '')) {
      setError('Please upload a PDF, DOCX, TXT, or MD file');
      return;
    }

    parseDocument(file);
  }, [parseDocument]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleClear = useCallback(() => {
    setError(null);
    setParseProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClear();
  }, [onClear]);

  const isProcessing = parseProgress > 0 && parseProgress < 100;

  if (documentContent && fileName) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label>Source Document</Label>
        <div className="p-3 rounded-lg border border-success/50 bg-success/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-success">{fileName}</span>
              <Badge variant="outline" className="text-xs border-success/50 text-success">
                {Math.round(documentContent.length / 1000)}k chars
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {documentContent.substring(0, 200)}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Upload Source Document (Optional)</Label>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-4 transition-all duration-200 cursor-pointer",
          isDragging
            ? "border-primary bg-primary/10"
            : "border-border/50 hover:border-primary/50 hover:bg-primary/5",
          isProcessing && "pointer-events-none opacity-75",
          error && "border-destructive/50 bg-destructive/5"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isProcessing || isLoading}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <div className="w-full max-w-xs">
              <Progress value={parseProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center mt-1">
                Extracting text... {parseProgress}%
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            {error ? (
              <>
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm text-destructive text-center">{error}</p>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleClear(); }}>
                  Try Again
                </Button>
              </>
            ) : (
              <>
                <FileUp className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-primary font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOCX, TXT, or MD (max 10MB)
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Upload a document to use as source material. The AI will extract and use its content to generate educational materials.
      </p>
    </div>
  );
}
