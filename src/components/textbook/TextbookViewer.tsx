import React, { useRef, useState, useEffect, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useAllTextbookPages, 
  useTextbookBookmark, 
  useUpdateBookmark,
  useTextbookSearch,
  TextbookPage,
  TextbookChapter 
} from '@/hooks/useTextbook';
import { BookPage } from './BookPage';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  BookOpen, 
  List,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TextbookViewerProps {
  courseId: string;
  courseName: string;
}

// Page component wrapper for react-pageflip
const PageWrapper = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => (
    <div ref={ref} className="page-content">
      {children}
    </div>
  )
);
PageWrapper.displayName = 'PageWrapper';

export function TextbookViewer({ courseId, courseName }: TextbookViewerProps) {
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const { data: pages, isLoading } = useAllTextbookPages(courseId);
  const { data: bookmark } = useTextbookBookmark(courseId);
  const updateBookmark = useUpdateBookmark();
  const { data: searchResults } = useTextbookSearch(courseId, isSearching ? searchQuery : '');
  const { toast } = useToast();

  // Go to bookmarked page on load
  useEffect(() => {
    if (bookmark && pages?.length && bookRef.current) {
      const pageIndex = pages.findIndex(p => p.id === bookmark.page_id);
      if (pageIndex >= 0) {
        setTimeout(() => {
          bookRef.current?.pageFlip()?.turnToPage(pageIndex);
        }, 500);
      }
    }
  }, [bookmark, pages]);

  const handleFlip = useCallback((e: any) => {
    setCurrentPage(e.data);
  }, []);

  const goToPrev = () => {
    bookRef.current?.pageFlip()?.flipPrev();
  };

  const goToNext = () => {
    bookRef.current?.pageFlip()?.flipNext();
  };

  const goToPage = (pageIndex: number) => {
    bookRef.current?.pageFlip()?.turnToPage(pageIndex);
  };

  const handleBookmark = async () => {
    if (!pages?.length) return;
    
    const currentPageData = pages[currentPage];
    if (!currentPageData) return;

    try {
      await updateBookmark.mutateAsync({
        courseId,
        chapterId: currentPageData.chapter.id,
        pageId: currentPageData.id,
      });
      toast({ title: 'Bookmark saved!' });
    } catch (error: any) {
      toast({
        title: 'Failed to save bookmark',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
    }
  };

  const handleSearchResultClick = (page: TextbookPage & { chapter: TextbookChapter }) => {
    const pageIndex = pages?.findIndex(p => p.id === page.id);
    if (pageIndex !== undefined && pageIndex >= 0) {
      goToPage(pageIndex);
      setIsSearching(false);
      setSearchQuery('');
    }
  };

  // Group pages by chapter for table of contents
  const tableOfContents = pages?.reduce((acc, page, index) => {
    const chapterId = page.chapter.id;
    if (!acc[chapterId]) {
      acc[chapterId] = {
        chapter: page.chapter,
        firstPageIndex: index,
        pages: [],
      };
    }
    acc[chapterId].pages.push({ page, index });
    return acc;
  }, {} as Record<string, { chapter: TextbookChapter; firstPageIndex: number; pages: { page: typeof pages[0]; index: number }[] }>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pages?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center">
        <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No content yet</h3>
        <p className="text-muted-foreground">
          This textbook doesn't have any pages yet.
        </p>
      </div>
    );
  }

  const isBookmarked = bookmark?.page_id === pages[currentPage]?.id;

  return (
    <div className="flex flex-col items-center">
      {/* Toolbar */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-4 mb-6 px-4">
        <div className="flex items-center gap-2">
          {/* Table of Contents */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <List className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Table of Contents</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                <div className="space-y-4">
                  {tableOfContents && Object.values(tableOfContents).map(({ chapter, firstPageIndex }) => (
                    <button
                      key={chapter.id}
                      onClick={() => goToPage(firstPageIndex)}
                      className="block w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <span className="font-medium">{chapter.title}</span>
                      {chapter.is_preview && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Preview
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Search */}
          <Sheet open={isSearching} onOpenChange={setIsSearching}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Search Textbook</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="space-y-2">
                    {searchResults?.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSearchResultClick(result)}
                        className="block w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="text-sm font-medium">{result.chapter.title}</span>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {result.content.substring(0, 150)}...
                        </p>
                      </button>
                    ))}
                    {searchQuery && !searchResults?.length && (
                      <p className="text-center text-muted-foreground py-4">
                        No results found
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <h2 className="text-lg font-semibold text-center flex-1">{courseName}</h2>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {pages.length}
          </span>
        </div>
      </div>

      {/* Book */}
      <div className="relative w-full max-w-4xl" style={{ perspective: '2000px' }}>
        <HTMLFlipBook
          ref={bookRef}
          width={550}
          height={700}
          size="stretch"
          minWidth={300}
          maxWidth={600}
          minHeight={400}
          maxHeight={800}
          showCover={false}
          mobileScrollSupport={true}
          onFlip={handleFlip}
          className="mx-auto shadow-2xl"
          style={{}}
          startPage={0}
          drawShadow={true}
          flippingTime={800}
          usePortrait={true}
          startZIndex={0}
          autoSize={true}
          maxShadowOpacity={0.5}
          showPageCorners={true}
          disableFlipByClick={false}
          swipeDistance={30}
          clickEventForward={true}
          useMouseEvents={true}
        >
          {pages.map((page, index) => (
            <PageWrapper key={page.id}>
              <BookPage
                page={page}
                pageIndex={index}
                totalPages={pages.length}
                isBookmarked={bookmark?.page_id === page.id}
                onBookmark={handleBookmark}
              />
            </PageWrapper>
          ))}
        </HTMLFlipBook>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4 mt-6">
        <Button
          variant="outline"
          onClick={goToPrev}
          disabled={currentPage === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={goToNext}
          disabled={currentPage >= pages.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
