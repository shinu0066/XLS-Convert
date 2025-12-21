
"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminUsersList, type AdminUserData } from '@/lib/firebase-admin-service';
import LoadingSpinner from '@/components/core/loading-spinner';
import { format } from 'date-fns';
import { Users, Users2, Eye, BarChart3, LineChart, PieChartIcon, TrendingUp, Percent } from 'lucide-react'; 
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  Line,
  Area,
  AreaChart,
  Pie,
  PieChart as RechartsPieChart, // Renamed to avoid conflict with lucide icon
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip, // Explicit import for recharts tooltip if needed alongside shadcn
  Legend as RechartsLegend,
  Cell
} from "recharts";

import {
  fetchAllWebsiteAnalyticsData,
  type WebsiteAnalyticsData,
  type DailyTrendDataPoint,
  type VisitorTypeDataPoint
} from '@/lib/google-analytics-service';
import { cn } from "@/lib/utils"; // Added import for cn

const initialAnalyticsData: WebsiteAnalyticsData = {
  liveUsers: null,
  totalPageViews7d: null,
  bounceRate7d: null,
  visitors7dTrend: [],
  visitors30dTrend: [],
  visitorTypes7d: [],
};

const trendChartConfig = {
  visitors: {
    label: "Visitors",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const visitorTypeChartConfig = {
  newVisitors: {
    label: "New Visitors",
    color: "hsl(var(--chart-1))",
  },
  returningVisitors: {
    label: "Returning Visitors",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;


export default function AdminDashboardPage() {
  const { adminUser, adminSignOut, loading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [adminUsersList, setAdminUsersList] = useState<AdminUserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [errorLoadingUsers, setErrorLoadingUsers] = useState<string | null>(null);

  const [websiteAnalytics, setWebsiteAnalytics] = useState<WebsiteAnalyticsData>(initialAnalyticsData);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [activeTrendView, setActiveTrendView] = useState<'7d' | '30d'>('7d');
  
  const fetchAdminUsers = useCallback(async () => {
    if (!adminUser) return;
    setIsLoadingUsers(true);
    setErrorLoadingUsers(null);
    try {
      const users = await getAdminUsersList();
      setAdminUsersList(users);
    } catch (error) {
      setErrorLoadingUsers("Could not load admin user data.");
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch admin users list." });
    } finally {
      setIsLoadingUsers(false);
    }
  }, [adminUser, toast]);

  const fetchWebsiteAnalytics = useCallback(async () => {
    if (!adminUser) return;
    setIsLoadingAnalytics(true);
    try {
      const data = await fetchAllWebsiteAnalyticsData();
      setWebsiteAnalytics(data);
      // toast({ title: "Analytics Loaded", description: "Website visitor data (mocked) loaded." });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({ variant: "destructive", title: "Analytics Error", description: `Failed to fetch website analytics: ${errorMessage}` });
      setWebsiteAnalytics(initialAnalyticsData); // Fallback
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [adminUser, toast]);

  useEffect(() => {
    fetchAdminUsers();
    fetchWebsiteAnalytics();
  }, [fetchAdminUsers, fetchWebsiteAnalytics]);


  const handleSignOut = async () => {
    try {
      await adminSignOut();
      toast({ title: "Logged Out", description: "Admin successfully logged out." });
      router.push('/admin/login');
    } catch (error) {
      toast({ variant: "destructive", title: "Logout Error", description: "Failed to log out admin." });
    }
  };

  if (authLoading) {
    return <div className="flex h-full items-center justify-center"><LoadingSpinner message="Loading Dashboard..." /></div>;
  }

  if (!adminUser) {
    return <div className="flex h-full items-center justify-center"><LoadingSpinner message="Verifying admin access..." /></div>;
  }

  const currentTrendData = activeTrendView === '7d' ? websiteAnalytics.visitors7dTrend : websiteAnalytics.visitors30dTrend;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard Overview</CardTitle>
          <CardDescription>
            Welcome, {adminUser.email}. Manage your application settings and view user data.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
           <Button onClick={handleSignOut} variant="outline">
              Sign Out Admin
            </Button>
        </CardContent>
      </Card>

      {/* Website Analytics Section */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary">Website Analytics (GA4)</CardTitle>
          <CardDescription>Overview of your website visitor engagement.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Top Stat Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Live Users"
              value={websiteAnalytics.liveUsers !== null ? websiteAnalytics.liveUsers.toLocaleString() : 'N/A'}
              icon={<Eye className="h-5 w-5 text-accent" />}
              isLoading={isLoadingAnalytics}
              description="Users currently on site"
            />
            <StatCard
              title="Page Views (Last 7d)"
              value={websiteAnalytics.totalPageViews7d !== null ? websiteAnalytics.totalPageViews7d.toLocaleString() : 'N/A'}
              icon={<TrendingUp className="h-5 w-5 text-accent" />}
              isLoading={isLoadingAnalytics}
              description="Total pages viewed"
            />
            <StatCard
              title="Bounce Rate (Last 7d)"
              value={websiteAnalytics.bounceRate7d !== null ? `${websiteAnalytics.bounceRate7d.toFixed(1)}%` : 'N/A'}
              icon={<Percent className="h-5 w-5 text-accent" />}
              isLoading={isLoadingAnalytics}
              description="Avg. single-page sessions"
            />
          </div>

          {/* Visitor Trends Line Chart */}
          <Card className="pt-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Visitor Trends</CardTitle>
                  <CardDescription>Unique visitors over the selected period.</CardDescription>
                </div>
                <Tabs value={activeTrendView} onValueChange={(value) => setActiveTrendView(value as '7d' | '30d')} className="w-auto">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
                    <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
              {isLoadingAnalytics ? <div className="flex h-full items-center justify-center"><LoadingSpinner message="Loading trend data..." /></div> :
                currentTrendData.length > 0 ? (
                <ChartContainer config={trendChartConfig} className="h-full w-full">
                  <AreaChart data={currentTrendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false}/>
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Area
                      dataKey="visitors"
                      type="natural"
                      fill="var(--color-visitors)"
                      fillOpacity={0.3}
                      stroke="var(--color-visitors)"
                      stackId="a"
                    />
                  </AreaChart>
                </ChartContainer>
              ) : <p className="text-center text-muted-foreground pt-10">No trend data available.</p>}
            </CardContent>
          </Card>

          {/* Daily Visits Bar Chart & Visitor Types Pie Chart (Side-by-side) */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="pt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Daily Visits (Last 7 Days)</CardTitle>
                <CardDescription>Breakdown of visits per day.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] w-full">
                {isLoadingAnalytics ? <div className="flex h-full items-center justify-center"><LoadingSpinner message="Loading daily data..." /></div> :
                  websiteAnalytics.visitors7dTrend.length > 0 ? (
                  <ChartContainer config={trendChartConfig} className="h-full w-full">
                    <BarChart data={websiteAnalytics.visitors7dTrend} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false}/>
                      <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Bar dataKey="visitors" fill="var(--color-visitors)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                ) : <p className="text-center text-muted-foreground pt-10">No daily visit data available.</p>}
              </CardContent>
            </Card>

            <Card className="pt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Visitor Types (Last 7 Days)</CardTitle>
                <CardDescription>New vs. Returning visitors.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] w-full flex items-center justify-center">
                {isLoadingAnalytics ? <div className="flex h-full items-center justify-center"><LoadingSpinner message="Loading visitor types..." /></div> :
                  websiteAnalytics.visitorTypes7d.length > 0 ? (
                  <ChartContainer config={visitorTypeChartConfig} className="h-full w-full aspect-square">
                     <RechartsPieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                       <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                       <Pie
                        data={websiteAnalytics.visitorTypes7d}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        labelLine={false}
                        // label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                        //   const RADIAN = Math.PI / 180;
                        //   const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        //   const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        //   const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        //   return (
                        //     <text x={x} y={y} fill="hsl(var(--card-foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs">
                        //       {`${name} (${(percent * 100).toFixed(0)}%)`}
                        //     </text>
                        //   );
                        // }}
                      >
                        {websiteAnalytics.visitorTypes7d.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </RechartsPieChart>
                  </ChartContainer>
                ) : <p className="text-center text-muted-foreground pt-10">No visitor type data available.</p>}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      {/* Admin Users List Section */}
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className='space-y-1'>
                <CardTitle className="text-xl font-medium">Admin Users</CardTitle>
                <CardDescription>List of all registered administrators.</CardDescription>
            </div>
            <Users2 className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold mb-1">
              {isLoadingUsers ? <span className="text-sm">Loading...</span> : adminUsersList.length}
            </div>
          {isLoadingUsers ? (
            <LoadingSpinner message="Loading admin users..." />
          ) : errorLoadingUsers ? (
            <p className="text-destructive">{errorLoadingUsers}</p>
          ) : adminUsersList.length === 0 ? (
            <p>No admin users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Date Joined</TableHead>
                    <TableHead>Admin UID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsersList.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        {user.createdAt ? format(user.createdAt, 'PPP p') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.id}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for Stat Cards
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  isLoading: boolean;
  description?: string;
}

function StatCard({ title, value, icon, isLoading, description }: StatCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {isLoading ? <Skeleton className="h-8 w-24" /> : value}
        </div>
        {description && !isLoading && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
        {isLoading && <Skeleton className="h-4 w-32 mt-1" />}
      </CardContent>
    </Card>
  );
}

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/50", className)}
      {...props}
    />
  )
}
