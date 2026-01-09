import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Users, Eye, Activity } from "lucide-react";

export default function AdminAnalyticsDashboard() {
  const { data: allAnalytics = [] } = useQuery({
    queryKey: ['all-analytics'],
    queryFn: () => base44.entities.WebsiteAnalytics.list('-date'),
  });

  const { data: websites = [] } = useQuery({
    queryKey: ['all-websites'],
    queryFn: () => base44.entities.WebsiteIntake.filter({ website_status: 'live' }),
  });

  // Calculate aggregate stats
  const getLast30DaysStats = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAnalytics = allAnalytics.filter(a => 
      new Date(a.date) >= thirtyDaysAgo
    );

    return {
      totalPageViews: recentAnalytics.reduce((sum, a) => sum + (a.page_views || 0), 0),
      totalVisitors: recentAnalytics.reduce((sum, a) => sum + (a.unique_visitors || 0), 0),
      avgBounceRate: recentAnalytics.length > 0 
        ? (recentAnalytics.reduce((sum, a) => sum + (a.bounce_rate || 0), 0) / recentAnalytics.length).toFixed(1)
        : 0,
      avgSessionDuration: recentAnalytics.length > 0
        ? Math.round(recentAnalytics.reduce((sum, a) => sum + (a.avg_session_duration || 0), 0) / recentAnalytics.length)
        : 0
    };
  };

  const stats = getLast30DaysStats();

  // Group analytics by website
  const websiteStats = websites.map(website => {
    const siteAnalytics = allAnalytics.filter(a => a.website_intake_id === website.id);
    const totalViews = siteAnalytics.reduce((sum, a) => sum + (a.page_views || 0), 0);
    const totalVisitors = siteAnalytics.reduce((sum, a) => sum + (a.unique_visitors || 0), 0);
    
    return {
      company: website.company_name,
      client: website.client_email,
      totalViews,
      totalVisitors,
      live_url: website.live_url
    };
  }).sort((a, b) => b.totalViews - a.totalViews);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Page Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{stats.totalPageViews.toLocaleString()}</div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{stats.totalVisitors.toLocaleString()}</div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Avg Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{stats.avgBounceRate}%</div>
              <TrendingUp className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Avg Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{stats.avgSessionDuration}s</div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-Website Performance */}
      <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Website Performance</CardTitle>
          <CardDescription>Traffic overview for all live websites</CardDescription>
        </CardHeader>
        <CardContent>
          {websiteStats.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No analytics data yet
            </div>
          ) : (
            <div className="space-y-3">
              {websiteStats.map((site, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{site.company}</h4>
                    <p className="text-sm text-slate-400">{site.client}</p>
                    {site.live_url && (
                      <a href={site.live_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                        {site.live_url}
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{site.totalViews.toLocaleString()}</div>
                    <p className="text-sm text-slate-400">{site.totalVisitors} visitors</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}