import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BookOpen, 
  CheckCircle2, 
  FileText, 
  MessageSquare, 
  MessagesSquare,
  Sparkles,
  Loader2
} from 'lucide-react';
import { UserAchievements } from '@/hooks/useProfile';

interface AchievementsCardProps {
  achievements: UserAchievements | undefined;
  isLoading: boolean;
}

interface AchievementItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}

function AchievementItem({ icon, label, value, description }: AchievementItemProps) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}

export function AchievementsCard({ achievements, isLoading }: AchievementsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Your Achievements
          </CardTitle>
          <CardDescription>Track your learning progress</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const stats = achievements || {
    coursesPurchased: 0,
    lessonsCompleted: 0,
    projectsSubmitted: 0,
    projectsWithFeedback: 0,
    discussionsStarted: 0,
    commentsPosted: 0,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Your Achievements
        </CardTitle>
        <CardDescription>Track your learning progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <AchievementItem
            icon={<BookOpen className="h-5 w-5" />}
            label="Courses Enrolled"
            value={stats.coursesPurchased}
            description="Courses you've purchased"
          />
          <AchievementItem
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Lessons Completed"
            value={stats.lessonsCompleted}
            description="Lessons you've finished"
          />
          <AchievementItem
            icon={<FileText className="h-5 w-5" />}
            label="Projects Submitted"
            value={stats.projectsSubmitted}
            description="Course projects submitted"
          />
          <AchievementItem
            icon={<Sparkles className="h-5 w-5" />}
            label="AI Feedback Received"
            value={stats.projectsWithFeedback}
            description="Projects with AI feedback"
          />
          <AchievementItem
            icon={<MessageSquare className="h-5 w-5" />}
            label="Discussions Started"
            value={stats.discussionsStarted}
            description="Topics you've created"
          />
          <AchievementItem
            icon={<MessagesSquare className="h-5 w-5" />}
            label="Comments Posted"
            value={stats.commentsPosted}
            description="Contributions to discussions"
          />
        </div>
      </CardContent>
    </Card>
  );
}
