import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface CourseBreadcrumbProps {
  segments: BreadcrumbSegment[];
  className?: string;
}

export function CourseBreadcrumb({ segments, className }: CourseBreadcrumbProps) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {/* Home link */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Dashboard</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;

          return (
            <span key={index} className="contents">
              <BreadcrumbSeparator className="text-primary/40" />
              <BreadcrumbItem>
              {isLast || !segment.href ? (
                  <BreadcrumbPage className="text-secondary font-medium truncate max-w-[200px]">
                    {segment.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link 
                      to={segment.href} 
                      className="text-muted-foreground hover:text-primary transition-colors truncate max-w-[200px]"
                    >
                      {segment.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
