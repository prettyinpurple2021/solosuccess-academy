/**
 * @file portfolioGenerator.ts — Portfolio PDF Compiler
 * 
 * Generates a professional PDF portfolio compiling all 9 course projects
 * from the SoloSuccess Academy curriculum. This is the culmination of
 * the student's learning journey.
 * 
 * WHAT'S INCLUDED PER COURSE:
 * - Course number, title, and project title
 * - Summary (project description from the course)
 * - Final score (combined grade from useStudentGrades)
 * - Submission text (from milestone submissions or legacy project)
 * - Certificate reference (verification code if earned)
 * 
 * USED BY: CourseProject.tsx for the Course 10 graduation project
 */
import jsPDF from 'jspdf';
import { format } from 'date-fns';

export interface PortfolioCourseEntry {
  orderNumber: number;
  courseTitle: string;
  projectTitle: string;
  projectDescription: string;
  /** The student's combined grade percentage + letter */
  gradePercent: number;
  gradeLetter: string;
  /** The actual submission content (concatenated milestones or legacy) */
  submissionText: string;
  /** Certificate verification code, if earned */
  certificateCode: string | null;
}

export interface PortfolioData {
  studentName: string;
  generatedAt: string;
  entries: PortfolioCourseEntry[];
}

/**
 * Generate and download a professional portfolio PDF.
 * Uses jsPDF to create a multi-page document.
 */
export function downloadPortfolioPDF(data: PortfolioData): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // ─── Cover Page ───
  drawCoverPage(doc, data, pageWidth, pageHeight, margin);

  // ─── Table of Contents ───
  doc.addPage();
  drawTableOfContents(doc, data, margin, contentWidth);

  // ─── Individual Course Entries ───
  data.entries.forEach((entry, index) => {
    doc.addPage();
    drawCourseEntry(doc, entry, index, margin, contentWidth, pageWidth, pageHeight);
  });

  // ─── Final Page ───
  doc.addPage();
  drawFinalPage(doc, data, pageWidth, pageHeight, margin);

  // Download
  const fileName = `SoloSuccess_Portfolio_${data.studentName.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}

/** Draw the cover page with student name and date */
function drawCoverPage(
  doc: jsPDF, data: PortfolioData,
  pageWidth: number, pageHeight: number, margin: number
) {
  // Decorative border
  doc.setDrawColor(139, 92, 246); // primary purple
  doc.setLineWidth(2);
  doc.rect(margin - 5, margin - 5, pageWidth - (margin - 5) * 2, pageHeight - (margin - 5) * 2);
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

  // Academy name
  doc.setFontSize(14);
  doc.setTextColor(139, 92, 246);
  doc.text('SOLOSUCCESS ACADEMY', pageWidth / 2, 60, { align: 'center' });

  // Title
  doc.setFontSize(32);
  doc.setTextColor(30, 30, 30);
  doc.text('Professional', pageWidth / 2, 90, { align: 'center' });
  doc.text('Portfolio', pageWidth / 2, 105, { align: 'center' });

  // Decorative line
  doc.setDrawColor(139, 92, 246);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 40, 115, pageWidth / 2 + 40, 115);

  // Student name
  doc.setFontSize(20);
  doc.setTextColor(60, 60, 60);
  doc.text(data.studentName, pageWidth / 2, 135, { align: 'center' });

  // Date
  doc.setFontSize(12);
  doc.setTextColor(120, 120, 120);
  doc.text(
    format(new Date(data.generatedAt), 'MMMM d, yyyy'),
    pageWidth / 2, 150,
    { align: 'center' }
  );

  // Course count summary
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Comprising ${data.entries.length} course projects from the complete curriculum`,
    pageWidth / 2, 170,
    { align: 'center' }
  );
}

/** Draw table of contents */
function drawTableOfContents(
  doc: jsPDF, data: PortfolioData,
  margin: number, contentWidth: number
) {
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text('Table of Contents', margin, 35);

  doc.setDrawColor(139, 92, 246);
  doc.setLineWidth(0.5);
  doc.line(margin, 40, margin + 60, 40);

  let y = 55;
  data.entries.forEach((entry) => {
    doc.setFontSize(11);
    doc.setTextColor(139, 92, 246);
    doc.text(`${String(entry.orderNumber).padStart(2, '0')}`, margin, y);

    doc.setTextColor(30, 30, 30);
    doc.text(entry.courseTitle, margin + 12, y);

    // Dotted line to grade
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    const gradeText = entry.gradeLetter !== '—' ? `${entry.gradeLetter} (${entry.gradePercent}%)` : 'In Progress';
    const gradeWidth = doc.getTextWidth(gradeText);
    doc.text(gradeText, margin + contentWidth - gradeWidth, y);

    // Project subtitle
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text(entry.projectTitle, margin + 12, y + 5);

    y += 14;
  });
}

/** Draw a single course entry page */
function drawCourseEntry(
  doc: jsPDF, entry: PortfolioCourseEntry, _index: number,
  margin: number, contentWidth: number, pageWidth: number, pageHeight: number
) {
  let y = 30;

  // Course number + title header
  doc.setFontSize(10);
  doc.setTextColor(139, 92, 246);
  doc.text(`COURSE ${String(entry.orderNumber).padStart(2, '0')}`, margin, y);
  y += 8;

  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text(entry.courseTitle, margin, y);
  y += 8;

  // Project title
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text(entry.projectTitle, margin, y);
  y += 6;

  // Decorative line
  doc.setDrawColor(139, 92, 246);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentWidth, y);
  y += 8;

  // Grade badge
  if (entry.gradeLetter !== '—') {
    doc.setFontSize(10);
    doc.setTextColor(139, 92, 246);
    doc.text(`Grade: ${entry.gradeLetter} (${entry.gradePercent}%)`, margin, y);
    
    // Certificate reference
    if (entry.certificateCode) {
      doc.setTextColor(100, 100, 100);
      doc.text(`  |  Certificate: ${entry.certificateCode}`, margin + 55, y);
    }
    y += 8;
  }

  // Summary section
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('PROJECT SUMMARY', margin, y);
  y += 5;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const summaryLines = doc.splitTextToSize(entry.projectDescription, contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 6;

  // Submission content
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('SUBMISSION', margin, y);
  y += 5;

  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  
  const submissionText = entry.submissionText || '(No submission content)';
  // Truncate very long submissions to fit reasonable PDF size
  const truncated = submissionText.length > 3000 
    ? submissionText.substring(0, 3000) + '\n\n[Content truncated for portfolio — full submission available in course project]'
    : submissionText;
  
  const lines = doc.splitTextToSize(truncated, contentWidth);
  
  // Handle pagination for long content
  for (const line of lines) {
    if (y > pageHeight - margin - 10) {
      doc.addPage();
      y = 30;
    }
    doc.text(line, margin, y);
    y += 4.5;
  }
}

/** Draw the closing page */
function drawFinalPage(
  doc: jsPDF, data: PortfolioData,
  pageWidth: number, pageHeight: number, margin: number
) {
  // Decorative border
  doc.setDrawColor(139, 92, 246);
  doc.setLineWidth(1);
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

  doc.setFontSize(14);
  doc.setTextColor(139, 92, 246);
  doc.text('SOLOSUCCESS ACADEMY', pageWidth / 2, 80, { align: 'center' });

  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.text('Portfolio Complete', pageWidth / 2, 100, { align: 'center' });

  doc.setDrawColor(139, 92, 246);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 30, 107, pageWidth / 2 + 30, 107);

  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(`Prepared by ${data.studentName}`, pageWidth / 2, 120, { align: 'center' });
  doc.text(
    format(new Date(data.generatedAt), 'MMMM d, yyyy'),
    pageWidth / 2, 130,
    { align: 'center' }
  );

  // Stats summary
  const completedCount = data.entries.filter(e => e.gradeLetter !== '—').length;
  const certCount = data.entries.filter(e => e.certificateCode).length;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`${data.entries.length} Course Projects  •  ${completedCount} Graded  •  ${certCount} Certificates`, pageWidth / 2, 150, { align: 'center' });
}
