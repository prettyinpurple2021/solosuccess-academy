import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useRevenueAnalytics,
  useCourseCompletionAnalytics,
  useEngagementAnalytics,
  useAnalyticsSummary,
} from '@/hooks/useAnalytics';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  BookOpen,
  Activity,
  ArrowLeft,
} from 'lucide-react';

const chartConfig = {
  amount: {
    label: 'Revenue',
    color: 'hsl(var(--primary))',
  },
  count: {
    label: 'Purchases',
    color: 'hsl(var(--secondary))',
  },
  completions: {
    label: 'Completions',
    color: 'hsl(var(--success))',
  },
  activeUsers: {
    label: 'Active Users',
    color: 'hsl(var(--info))',
  },
  lessonsCompleted: {
    label: 'Lessons Completed',
    color: 'hsl(var(--primary))',
  },
};

export default function AdminAnalytics() {
  const { data: revenueData, isLoading: revenueLoading } = useRevenueAnalytics();
  const { data: completionData, isLoading: completionLoading } = useCourseCompletionAnalytics();
  const { data: engagementData, isLoading: engagementLoading } = useEngagementAnalytics();
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary();

  const chartsLoading = revenueLoading || completionLoading || engagementLoading || summaryLoading;

  return (
    <div className="p-6 md:p-8 lg:p-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="shrink-0 hover:bg-primary/10 hover:text-primary"
        >
          <Link to="/admin">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
          <BarChart3
            className="h-8 w-8 text-primary"
            style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary)))' }}
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold neon-text">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track student engagement and revenue metrics</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="glass-card border-warning/30 hover:border-warning/50 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-warning">
                  ${summary?.totalRevenue.toLocaleString() || '0'}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {(summary?.revenueGrowth || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                  <span
                    className={`text-sm ${
                      (summary?.revenueGrowth || 0) >= 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {summary?.revenueGrowth || 0}% vs last month
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-warning/20 shadow-[0_0_15px_hsl(var(--warning)/0.3)]">
                <DollarSign className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-info/30 hover:border-info/50 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold text-info">{summary?.totalStudents || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Active learners</p>
              </div>
              <div className="p-3 rounded-lg bg-info/20 shadow-[0_0_15px_hsl(var(--info)/0.3)]">
                <Users className="h-6 w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-success/30 hover:border-success/50 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lessons Completed</p>
                <p className="text-2xl font-bold text-success">{summary?.totalCompletions || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">All time</p>
              </div>
              <div className="p-3 rounded-lg bg-success/20 shadow-[0_0_15px_hsl(var(--success)/0.3)]">
                <BookOpen className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/30 hover:border-primary/50 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Engagement</p>
                <p className="text-2xl font-bold text-primary">{summary?.averageEngagement || 0} XP</p>
                <p className="text-sm text-muted-foreground mt-1">Per student</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/20 shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
                <Activity className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="bg-background/50 border border-primary/30 backdrop-blur-md">
          <TabsTrigger
            value="revenue"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            Revenue
          </TabsTrigger>
          <TabsTrigger
            value="engagement"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            Engagement
          </TabsTrigger>
          <TabsTrigger
            value="courses"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            Courses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card className="glass-card border-primary/30">
            <CardHeader>
              <CardTitle className="neon-text">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {chartsLoading ? (
                <div className="flex items-center justify-center h-80">
                  <NeonSpinner />
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-80 w-full">
                  <BarChart data={revenueData || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                      className="text-muted-foreground"
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) =>
                            name === 'amount' ? `$${value}` : `${value} sales`
                          }
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="amount"
                      fill="var(--color-amount)"
                      radius={[4, 4, 0, 0]}
                      className="drop-shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <Card className="glass-card border-primary/30">
            <CardHeader>
              <CardTitle className="neon-text">Daily Engagement (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {chartsLoading ? (
                <div className="flex items-center justify-center h-80">
                  <NeonSpinner />
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-80 w-full">
                  <AreaChart data={engagementData || []}>
                    <defs>
                      <linearGradient id="colorActiveUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorLessons" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                      interval="preserveStartEnd"
                    />
                    <YAxis tickLine={false} axisLine={false} className="text-muted-foreground" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area
                      type="monotone"
                      dataKey="activeUsers"
                      stroke="hsl(var(--info))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorActiveUsers)"
                    />
                    <Area
                      type="monotone"
                      dataKey="lessonsCompleted"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorLessons)"
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card className="glass-card border-primary/30">
            <CardHeader>
              <CardTitle className="neon-text">Course Completions</CardTitle>
            </CardHeader>
            <CardContent>
              {chartsLoading ? (
                <div className="flex items-center justify-center h-80">
                  <NeonSpinner />
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-80 w-full">
                  <BarChart data={completionData || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="courseTitle"
                      tickLine={false}
                      axisLine={false}
                      width={120}
                      className="text-muted-foreground text-xs"
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="completions"
                      fill="hsl(var(--success))"
                      radius={[0, 4, 4, 0]}
                      className="drop-shadow-[0_0_10px_hsl(var(--success)/0.5)]"
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
