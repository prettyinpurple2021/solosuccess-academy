import { useState, useCallback } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { ProgressRing } from '@/components/ui/progress-ring';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { GradeEditor } from '@/components/admin/GradeEditor';
import { GradeWeightsPanel } from '@/components/admin/GradeWeightsPanel';
import { useAdminCourses } from '@/hooks/useAdmin';
import { useGradebook, StudentProgress, CourseProgress, QuizScore, ActivityScore, WorksheetScore, calculateCombinedGrade } from '@/hooks/useGradebook';
import { useGradeSettings, getWeightsForCourse } from '@/hooks/useGradeSettings';
import { 
  GraduationCap, 
  Search, 
  Users, 
  Trophy,
  BookOpen,
  FileCheck,
  ChevronRight,
  Edit2,
  MessageSquare,
  Activity,
  Download,
  FileText,
  ClipboardList
} from 'lucide-react';
import jsPDF from 'jspdf';

export default function Gradebook() {
  const { data: students, isLoading: studentsLoading } = useGradebook();
  const { data: courses } = useAdminCourses();
  const { data: gradeSettings } = useGradeSettings();
  
  // Resolve effective global weights for display
  const globalWeights = getWeightsForCourse(gradeSettings);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null);
  const [editingGrade, setEditingGrade] = useState<{
    progressId: string;
    studentId: string;
    studentName: string;
    lessonTitle: string;
    courseTitle: string;
    currentScore: number | null;
    currentOverride: number | null;
    currentNotes: string | null;
  } | null>(null);

  /** Generate a PDF progress report for a student */
  const generateProgressReport = useCallback((student: StudentProgress) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Progress Report', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Student: ${student.displayName}`, 20, y);
    y += 7;
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
    y += 7;
    doc.text(`Overall Progress: ${student.overallProgress}%`, 20, y);
    y += 7;
    if (student.quizCount > 0) {
      doc.text(`Average Quiz Score: ${student.totalQuizScore}%`, 20, y);
      y += 7;
    }
    if (student.activityCount > 0) {
      doc.text(`Average Activity Score: ${student.totalActivityScore}%`, 20, y);
      y += 7;
    }
    if (student.worksheetCount > 0) {
      doc.text(`Average Worksheet Completion: ${student.totalWorksheetScore}%`, 20, y);
      y += 7;
    }
    if (student.combinedGrade.letter !== '—') {
      doc.setFont('helvetica', 'bold');
      doc.text(`Combined Grade: ${student.combinedGrade.letter} (${student.combinedGrade.percentage}%)`, 20, y);
      doc.setFont('helvetica', 'normal');
      y += 7;
    }

    y += 5;
    doc.setDrawColor(150);
    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    student.courses.forEach(course => {
      if (y > 250) { doc.addPage(); y = 20; }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(course.courseTitle, 20, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Lessons: ${course.lessonsCompleted}/${course.totalLessons} (${course.progressPercent}%)`, 25, y);
      y += 6;

      if (course.quizScores.length > 0) {
        doc.text('Quiz Scores:', 25, y);
        y += 5;
        course.quizScores.forEach(q => {
          const override = q.adminOverrideScore !== null ? ` (Override: ${q.adminOverrideScore}%)` : '';
          const notes = q.adminNotes ? ` — ${q.adminNotes}` : '';
          doc.text(`  • ${q.lessonTitle}: ${q.effectiveScore}%${override}${notes}`, 30, y);
          y += 5;
        });
      }

      if (course.activityScores.length > 0) {
        doc.text('Activity Scores:', 25, y);
        y += 5;
        course.activityScores.forEach(a => {
          doc.text(`  • ${a.lessonTitle}: ${a.effectiveScore}%`, 30, y);
          y += 5;
        });
      }

      if (course.worksheetScores.length > 0) {
        doc.text('Worksheet Completion:', 25, y);
        y += 5;
        course.worksheetScores.forEach(w => {
          doc.text(`  • ${w.lessonTitle}: ${w.completionPercent}% (${w.answeredCount}/${w.totalCount} exercises)`, 30, y);
          y += 5;
        });
      }

      if (course.projectStatus) {
        doc.text(`Project: ${course.projectStatus}${course.projectSubmittedAt ? ` (submitted ${new Date(course.projectSubmittedAt).toLocaleDateString()})` : ''}`, 25, y);
        y += 6;
      }

      y += 5;
    });

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('SoloSuccess Academy — Confidential Student Report', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    doc.save(`progress-report-${student.displayName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }, []);

  if (studentsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <NeonSpinner size="lg" />
      </div>
    );
  }

  // Filter students
  const filteredStudents = students?.filter(student => {
    const matchesSearch = student.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = courseFilter === 'all' || 
      student.courses.some(c => c.courseId === courseFilter);
    return matchesSearch && matchesCourse;
  }) || [];

  // Stats
  const totalStudents = students?.length || 0;
  const avgProgress = students?.length 
    ? Math.round(students.reduce((acc, s) => acc + s.overallProgress, 0) / students.length) 
    : 0;
  const avgQuizScore = students?.length
    ? Math.round(students.filter(s => s.quizCount > 0).reduce((acc, s) => acc + s.totalQuizScore, 0) / 
        (students.filter(s => s.quizCount > 0).length || 1))
    : 0;

  const handleEditGrade = (score: QuizScore | ActivityScore, studentId: string, studentName: string, courseTitle: string) => {
    setEditingGrade({
      progressId: score.progressId,
      studentId,
      studentName,
      lessonTitle: score.lessonTitle,
      courseTitle,
      currentScore: score.score,
      currentOverride: score.adminOverrideScore,
      currentNotes: score.adminNotes,
    });
  };


  const getProjectStatusBadge = (status: string | null) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-info/20 text-info border-info/30">Submitted</Badge>;
      case 'reviewed':
        return <Badge className="bg-success/20 text-success border-success/30">Reviewed</Badge>;
      case 'draft':
        return <Badge className="bg-muted/50 text-muted-foreground border-muted-foreground/30">Draft</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Not Started</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-info/20 flex items-center justify-center shadow-[0_0_30px_hsl(var(--info)/0.4)]">
            <GraduationCap className="h-8 w-8 text-info" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--info)))' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold neon-text">Gradebook</h1>
            <p className="text-muted-foreground">Track student progress and performance</p>
          </div>
        </div>
        {/* Grade Weights Settings Panel */}
        <GradeWeightsPanel courses={courses?.map(c => ({ id: c.id, title: c.title })) || []} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <div className="glass-card border-primary/30 p-6 hover:border-primary/50 transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/20 shadow-[0_0_15px_hsl(var(--primary)/0.3)] group-hover:shadow-[0_0_25px_hsl(var(--primary)/0.5)] transition-all">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
              <p className="text-sm text-muted-foreground">Enrolled Students</p>
            </div>
          </div>
        </div>

        <div className="glass-card border-success/30 p-6 hover:border-success/50 transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/20 shadow-[0_0_15px_hsl(var(--success)/0.3)] group-hover:shadow-[0_0_25px_hsl(var(--success)/0.5)] transition-all">
              <BookOpen className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{avgProgress}%</p>
              <p className="text-sm text-muted-foreground">Avg. Progress</p>
            </div>
          </div>
        </div>

        <div className="glass-card border-warning/30 p-6 hover:border-warning/50 transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/20 shadow-[0_0_15px_hsl(var(--warning)/0.3)] group-hover:shadow-[0_0_25px_hsl(var(--warning)/0.5)] transition-all">
              <Trophy className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{avgQuizScore}%</p>
              <p className="text-sm text-muted-foreground">Avg. Quiz Score</p>
            </div>
          </div>
        </div>

        <div className="glass-card border-info/30 p-6 hover:border-info/50 transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-info/20 shadow-[0_0_15px_hsl(var(--info)/0.3)] group-hover:shadow-[0_0_25px_hsl(var(--info)/0.5)] transition-all">
              <FileCheck className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {students?.filter(s => s.courses.some(c => c.projectStatus === 'submitted' || c.projectStatus === 'reviewed')).length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Projects Submitted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card border-primary/30 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background/50 border-primary/30 focus:border-primary"
              />
            </div>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full md:w-[250px] bg-background/50 border-primary/30">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent className="bg-background border-primary/30">
                <SelectItem value="all">All Courses</SelectItem>
                {courses?.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Student Table */}
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Student Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <NeonSpinner size="lg" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No students found</h3>
              <p className="text-muted-foreground">
                {searchTerm || courseFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Students will appear here once they enroll'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                 <TableRow className="border-primary/20 hover:bg-transparent">
                     <TableHead className="text-muted-foreground">Student</TableHead>
                     <TableHead className="text-muted-foreground">Courses Enrolled</TableHead>
                     <TableHead className="text-muted-foreground">Overall Progress</TableHead>
                      <TableHead className="text-muted-foreground">Avg Quiz Score</TableHead>
                      <TableHead className="text-muted-foreground">Avg Activity Score</TableHead>
                      <TableHead className="text-muted-foreground">Avg Worksheet</TableHead>
                      <TableHead className="text-muted-foreground">Combined Grade</TableHead>
                      <TableHead className="text-muted-foreground">Projects</TableHead>
                     <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow 
                      key={student.userId} 
                      className="border-primary/10 hover:bg-primary/5 cursor-pointer"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-primary/30">
                            <AvatarImage src={student.avatarUrl || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {student.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{student.displayName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-primary/50">
                          {student.courses.length} course{student.courses.length !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Progress 
                            value={student.overallProgress} 
                            className="w-24 h-2 bg-muted/50" 
                          />
                          <span className="text-sm font-medium">{student.overallProgress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.quizCount > 0 ? (
                          <span className={`font-medium ${
                            student.totalQuizScore >= 80 ? 'text-success' :
                            student.totalQuizScore >= 60 ? 'text-warning' : 'text-destructive'
                          }`}>
                            {student.totalQuizScore}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.activityCount > 0 ? (
                          <span className={`font-medium ${
                            student.totalActivityScore >= 80 ? 'text-success' :
                            student.totalActivityScore >= 60 ? 'text-warning' : 'text-destructive'
                          }`}>
                            {student.totalActivityScore}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.worksheetCount > 0 ? (
                          <span className={`font-medium ${
                            student.totalWorksheetScore >= 80 ? 'text-success' :
                            student.totalWorksheetScore >= 60 ? 'text-warning' : 'text-destructive'
                          }`}>
                            {student.totalWorksheetScore}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.combinedGrade.letter !== '—' ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`inline-flex items-center gap-1.5 font-bold text-lg ${
                                  student.combinedGrade.percentage >= 80 ? 'text-success' :
                                  student.combinedGrade.percentage >= 70 ? 'text-warning' :
                                  student.combinedGrade.percentage >= 60 ? 'text-orange-400' : 'text-destructive'
                                }`}>
                                  {student.combinedGrade.letter}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="bg-background border-primary/30">
                                <p className="text-sm">{student.combinedGrade.percentage}% weighted average</p>
                                <p className="text-xs text-muted-foreground">Quiz {globalWeights.quizWeight}% · Activity {globalWeights.activityWeight}% · Worksheet {globalWeights.worksheetWeight}%</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {student.courses.some(c => c.projectStatus === 'reviewed') && (
                            <Badge className="bg-success/20 text-success border-success/30 text-xs">
                              {student.courses.filter(c => c.projectStatus === 'reviewed').length} reviewed
                            </Badge>
                          )}
                          {student.courses.some(c => c.projectStatus === 'submitted') && (
                            <Badge className="bg-info/20 text-info border-info/30 text-xs">
                              {student.courses.filter(c => c.projectStatus === 'submitted').length} pending
                            </Badge>
                          )}
                          {!student.courses.some(c => c.projectStatus) && (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-info/10 hover:text-info"
                            onClick={(e) => {
                              e.stopPropagation();
                              generateProgressReport(student);
                            }}
                            title="Download Progress Report"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="hover:bg-primary/10 hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudent(student);
                            }}
                          >
                            View Details
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Detail Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-3xl bg-background/95 backdrop-blur-xl border-primary/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedStudent && (
                <>
                  <Avatar className="h-10 w-10 border-2 border-primary/30">
                    <AvatarImage src={selectedStudent.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {selectedStudent.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{selectedStudent.displayName}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6">
              {/* Overall Stats */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex justify-center mb-2">
                    <ProgressRing progress={selectedStudent.overallProgress} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">Progress</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-xl font-bold text-warning">
                    {selectedStudent.quizCount > 0 ? `${selectedStudent.totalQuizScore}%` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Quiz</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-info/10 border border-info/20">
                  <p className="text-xl font-bold text-info">
                    {selectedStudent.activityCount > 0 ? `${selectedStudent.totalActivityScore}%` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Activity</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-xl font-bold text-accent">
                    {selectedStudent.worksheetCount > 0 ? `${selectedStudent.totalWorksheetScore}%` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Worksheet</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                  <p className={`text-xl font-bold ${
                    selectedStudent.combinedGrade.percentage >= 80 ? 'text-success' :
                    selectedStudent.combinedGrade.percentage >= 70 ? 'text-warning' :
                    selectedStudent.combinedGrade.percentage >= 60 ? 'text-orange-400' : 'text-destructive'
                  }`}>
                    {selectedStudent.combinedGrade.letter}
                  </p>
                  <p className="text-xs text-muted-foreground">Grade</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-xl font-bold text-success">
                    {selectedStudent.courses.filter(c => c.progressPercent === 100).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>

              {/* Download Report Button */}
              <Button
                variant="outline"
                className="w-full gap-2 border-info/30 hover:bg-info/10 hover:text-info"
                onClick={() => generateProgressReport(selectedStudent)}
              >
                <Download className="h-4 w-4" />
                Download Progress Report (PDF)
              </Button>

              {/* Course Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Course Progress
                </h3>
                <div className="space-y-4">
                  {selectedStudent.courses.map((course) => (
                    <div 
                      key={course.courseId} 
                      className="p-4 rounded-lg bg-muted/20 border border-primary/10"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{course.courseTitle}</h4>
                        {getProjectStatusBadge(course.projectStatus)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Lesson Progress</p>
                          <div className="flex items-center gap-2">
                            <Progress value={course.progressPercent} className="flex-1 h-2" />
                            <span className="text-sm font-medium">
                              {course.lessonsCompleted}/{course.totalLessons}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Quiz Scores</p>
                          {course.quizScores.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              <TooltipProvider>
                                {course.quizScores.map((quiz, idx) => (
                                  <Tooltip key={idx}>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => handleEditGrade(quiz, selectedStudent.userId, selectedStudent.displayName, course.courseTitle)}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${
                                          quiz.effectiveScore >= 80 ? 'bg-success/20 text-success border-success/30' :
                                          quiz.effectiveScore >= 60 ? 'bg-warning/20 text-warning border-warning/30' :
                                          'bg-destructive/20 text-destructive border-destructive/30'
                                        }`}
                                      >
                                        {quiz.adminOverrideScore !== null && (
                                          <Edit2 className="h-3 w-3" />
                                        )}
                                        {quiz.effectiveScore}%
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-background border-primary/30">
                                      <div className="text-sm">
                                        <p className="font-medium">{quiz.lessonTitle}</p>
                                        {quiz.adminOverrideScore !== null && (
                                          <p className="text-muted-foreground">
                                            Original: {quiz.score}% → Override: {quiz.adminOverrideScore}%
                                          </p>
                                        )}
                                        {quiz.adminNotes && (
                                          <p className="text-muted-foreground flex items-center gap-1 mt-1">
                                            <MessageSquare className="h-3 w-3" />
                                            {quiz.adminNotes}
                                          </p>
                                        )}
                                        <p className="text-primary mt-1">Click to edit</p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </TooltipProvider>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No quizzes taken</span>
                          )}
                        </div>
                        </div>

                        {/* Activity Scores */}
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground mb-1">Activity Scores</p>
                          {course.activityScores.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              <TooltipProvider>
                                {course.activityScores.map((activity, idx) => (
                                  <Tooltip key={idx}>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => handleEditGrade(activity, selectedStudent.userId, selectedStudent.displayName, course.courseTitle)}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${
                                          activity.effectiveScore >= 80 ? 'bg-success/20 text-success border-success/30' :
                                          activity.effectiveScore >= 60 ? 'bg-warning/20 text-warning border-warning/30' :
                                          'bg-destructive/20 text-destructive border-destructive/30'
                                        }`}
                                      >
                                        <Activity className="h-3 w-3" />
                                        {activity.effectiveScore}%
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-background border-primary/30">
                                      <div className="text-sm">
                                        <p className="font-medium">{activity.lessonTitle}</p>
                                        <p className="text-muted-foreground">{activity.score}% steps completed</p>
                                        <p className="text-primary mt-1">Click to edit</p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </TooltipProvider>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No activities started</span>
                          )}
                        </div>

                        {/* Worksheet Scores */}
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground mb-1">Worksheet Completion</p>
                          {course.worksheetScores.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              <TooltipProvider>
                                {course.worksheetScores.map((ws, idx) => (
                                  <Tooltip key={idx}>
                                    <TooltipTrigger asChild>
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${
                                        ws.completionPercent >= 80 ? 'bg-success/20 text-success border-success/30' :
                                        ws.completionPercent >= 50 ? 'bg-warning/20 text-warning border-warning/30' :
                                        'bg-muted/20 text-muted-foreground border-muted-foreground/30'
                                      }`}>
                                        <ClipboardList className="h-3 w-3" />
                                        {ws.completionPercent}%
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-background border-primary/30">
                                      <div className="text-sm">
                                        <p className="font-medium">{ws.lessonTitle}</p>
                                        <p className="text-muted-foreground">{ws.answeredCount}/{ws.totalCount} exercises completed</p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </TooltipProvider>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No worksheets started</span>
                          )}
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Grade Editor Dialog */}
      {editingGrade && (
        <GradeEditor
          open={!!editingGrade}
          onOpenChange={(open) => !open && setEditingGrade(null)}
          progressId={editingGrade.progressId}
          studentId={editingGrade.studentId}
          studentName={editingGrade.studentName}
          lessonTitle={editingGrade.lessonTitle}
          courseTitle={editingGrade.courseTitle}
          currentScore={editingGrade.currentScore}
          currentOverride={editingGrade.currentOverride}
          currentNotes={editingGrade.currentNotes}
        />
      )}
    </div>
  );
}
