
"use client";

// IMPORTANT: This is a STUBBED service.
// You need to implement the actual Google Analytics 4 Data API calls.
// This will involve authentication and using the googleapis library.

import { format, subDays, eachDayOfInterval } from 'date-fns';

export interface DailyTrendDataPoint {
  date: string; // Formatted date string e.g., "MMM dd"
  visitors: number;
}

export interface VisitorTypeDataPoint {
  name: 'New Visitors' | 'Returning Visitors'; // 'name' is used by Recharts PieChart
  value: number; // 'value' is used by Recharts PieChart
  fill: string; // Color for the pie slice
}

export interface WebsiteAnalyticsData {
  liveUsers: number | null;
  totalPageViews7d: number | null;
  bounceRate7d: number | null; // As a percentage, e.g., 45 for 45%

  visitors7dTrend: DailyTrendDataPoint[];
  visitors30dTrend: DailyTrendDataPoint[];
  visitorTypes7d: VisitorTypeDataPoint[];
}

function generateMockTrendData(days: number): DailyTrendDataPoint[] {
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);
  const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });
  
  return dateInterval.map(day => ({
    date: format(day, 'MMM dd'),
    visitors: Math.floor(Math.random() * (days === 7 ? 200 : 150)) + (days === 7 ? 50 : 30),
  }));
}

function generateMockVisitorTypes(): VisitorTypeDataPoint[] {
  const newVisitors = Math.floor(Math.random() * 700) + 300; // 300-1000
  const returningVisitors = Math.floor(Math.random() * 500) + 200; // 200-700
  return [
    { name: 'New Visitors', value: newVisitors, fill: 'hsl(var(--chart-1))' },
    { name: 'Returning Visitors', value: returningVisitors, fill: 'hsl(var(--chart-2))' },
  ];
}

/**
 * Fetches the number of live users.
 * Replace with actual GA4 Realtime API call.
 */
export async function getLiveUsers(): Promise<number> {
  console.warn("[GoogleAnalyticsService] getLiveUsers: Using mock data.");
  await new Promise(resolve => setTimeout(resolve, 300));
  return Math.floor(Math.random() * 50);
}

/**
 * Fetches data for the 7-day visitor trend.
 * Replace with actual GA4 Data API call.
 */
export async function getVisitors7dTrendData(): Promise<DailyTrendDataPoint[]> {
  console.warn("[GoogleAnalyticsService] getVisitors7dTrendData: Using mock data.");
  await new Promise(resolve => setTimeout(resolve, 500));
  return generateMockTrendData(7);
}

/**
 * Fetches data for the 30-day visitor trend.
 * Replace with actual GA4 Data API call.
 */
export async function getVisitors30dTrendData(): Promise<DailyTrendDataPoint[]> {
  console.warn("[GoogleAnalyticsService] getVisitors30dTrendData: Using mock data.");
  await new Promise(resolve => setTimeout(resolve, 800));
  return generateMockTrendData(30);
}

/**
 * Fetches data for new vs. returning visitors.
 * Replace with actual GA4 Data API call.
 */
export async function getVisitorTypes7dData(): Promise<VisitorTypeDataPoint[]> {
  console.warn("[GoogleAnalyticsService] getVisitorTypes7dData: Using mock data.");
  await new Promise(resolve => setTimeout(resolve, 600));
  return generateMockVisitorTypes();
}

/**
 * Fetches total page views for the last 7 days.
 * Replace with actual GA4 Data API call.
 */
export async function getTotalPageViews7d(): Promise<number> {
    console.warn("[GoogleAnalyticsService] getTotalPageViews7d: Using mock data.");
    await new Promise(resolve => setTimeout(resolve, 400));
    return Math.floor(Math.random() * 5000) + 1000;
}

/**
 * Fetches bounce rate for the last 7 days.
 * Replace with actual GA4 Data API call.
 */
export async function getBounceRate7d(): Promise<number> {
    console.warn("[GoogleAnalyticsService] getBounceRate7d: Using mock data.");
    await new Promise(resolve => setTimeout(resolve, 450));
    return Math.floor(Math.random() * 50) + 20; // Bounce rate between 20% and 70%
}

// Function to fetch all data - this is what the dashboard page will call
export async function fetchAllWebsiteAnalyticsData(): Promise<WebsiteAnalyticsData> {
  console.warn("[GoogleAnalyticsService] fetchAllWebsiteAnalyticsData: Using MOCK data. Implement actual GA4 API calls.");
  // Simulate parallel fetching
  const [
    liveUsers,
    totalPageViews7d,
    bounceRate7d,
    visitors7dTrend,
    visitors30dTrend,
    visitorTypes7d
  ] = await Promise.all([
    getLiveUsers(),
    getTotalPageViews7d(),
    getBounceRate7d(),
    getVisitors7dTrendData(),
    getVisitors30dTrendData(),
    getVisitorTypes7dData()
  ]);

  return {
    liveUsers,
    totalPageViews7d,
    bounceRate7d,
    visitors7dTrend,
    visitors30dTrend,
    visitorTypes7d
  };
}
