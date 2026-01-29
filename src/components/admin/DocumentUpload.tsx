import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, Loader2, FileUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  onDocumentParsed: (content: string, fileName: string) => void;
  onClear: () => void;
  documentContent: string | null;
  fileName: string | null;
  isLoading?: boolean;
  className?: string;
}

const ACCEPTED_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
  'text/markdown': '.md',
};

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
      const fileType = file.type;
      let content = '';

      if (fileType === 'text/plain' || fileType === 'text/markdown' || file.name.endsWith('.md')) {
        // Plain text / markdown
        setParseProgress(50);
        content = await file.text();
        setParseProgress(100);
      } else if (fileType === 'application/pdf') {
        // PDF parsing
        setParseProgress(20);
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        
        setParseProgress(30);
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        const numPages = pdf.numPages;
        const textParts: string[] = [];
        
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          textParts.push(pageText);
          setParseProgress(30 + Math.round((i / numPages) * 60));
        }
        
        content = textParts.join('\n\n');
        setParseProgress(100);
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.docx')
      ) {
        // DOCX parsing
        setParseProgress(30);
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        
        setParseProgress(60);
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
        setParseProgress(100);
      } else {
        throw new Error(`Unsupported file type: ${fileType || file.name}`);
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

    const isValidType = Object.keys(ACCEPTED_TYPES).includes(file.type) ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.pdf') ||
      file.name.endsWith('.docx');

    if (!isValidType) {
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
