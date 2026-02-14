import { useState } from 'react';
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
import { useAdminCourses } from '@/hooks/useAdmin';
import { useGradebook, StudentProgress, CourseProgress, QuizScore } from '@/hooks/useGradebook';
import { 
  GraduationCap, 
  Search, 
  Users, 
  Trophy,
  BookOpen,
  FileCheck,
  ChevronRight,
  Edit2,
  MessageSquare
} from 'lucide-react';

export default function Gradebook() {
  const { data: students, isLoading: studentsLoading } = useGradebook();
  const { data: courses } = useAdminCourses();
  
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

  const handleEditGrade = (quiz: QuizScore, studentId: string, studentName: string, courseTitle: string) => {
    setEditingGrade({
      progressId: quiz.progressId,
      studentId,
      studentName,
      lessonTitle: quiz.lessonTitle,
      courseTitle,
      currentScore: quiz.score,
      currentOverride: quiz.adminOverrideScore,
      currentNotes: quiz.adminNotes,
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
      <div className="flex items-center gap-4 mb-8">
        <div className="h-14 w-14 rounded-full bg-info/20 flex items-center justify-center shadow-[0_0_30px_hsl(var(--info)/0.4)]">
          <GraduationCap className="h-8 w-8 text-info" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--info)))' }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold neon-text">Gradebook</h1>
          <p className="text-muted-foreground">Track student progress and performance</p>
        </div>
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
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex justify-center mb-2">
                    <ProgressRing progress={selectedStudent.overallProgress} size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Progress</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-2xl font-bold text-warning">
                    {selectedStudent.quizCount > 0 ? `${selectedStudent.totalQuizScore}%` : '—'}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Quiz Score</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-2xl font-bold text-success">
                    {selectedStudent.courses.filter(c => c.progressPercent === 100).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Courses Completed</p>
                </div>
              </div>

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
