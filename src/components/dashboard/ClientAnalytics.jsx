import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Users, Eye, Clock, MousePointer } from "lucide-react";

export default function ClientAnalytics({ websiteIntakeId }) {
  const { data: analytics = [] } = useQuery({
    queryKey: ['my-analytics', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteAnalytics.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  // Get last 30 days stats
  const getLast30DaysStats = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAnalytics = analytics.filter(a => 
      new Date(a.date) >= thirtyDaysAgo
    );

    const totalPageViews = recentAnalytics.reduce((sum, a) => sum + (a.page_views || 0), 0);
    const totalVisitors = recentAnalytics.reduce((sum, a) => sum + (a.unique_visitors || 0), 0);
    const avgBounceRate = recentAnalytics.length > 0 
      ? (recentAnalytics.reduce((sum, a) => sum + (a.bounce_rate || 0), 0) / recentAnalytics.length).toFixed(1)
      : 0;
    const avgSessionDuration = recentAnalytics.length > 0
      ? Math.round(recentAnalytics.reduce((sum, a) => sum + (a.avg_session_duration || 0), 0) / recentAnalytics.length)
      : 0;

    // Aggregate traffic sources
    const trafficSources = recentAnalytics.reduce((acc, a) => {
      if (a.traffic_sources) {
        acc.direct += a.traffic_sources.direct || 0;
        acc.search += a.traffic_sources.search || 0;
        acc.social += a.traffic_sources.social || 0;
        acc.referral += a.traffic_sources.referral || 0;
      }
      return acc;
    }, { direct: 0, search: 0, social: 0, referral: 0 });

    // Get top pages
    const pagesMap = new Map();
    recentAnalytics.forEach(a => {
      if (a.top_pages) {
        a.top_pages.forEach(p => {
          const current = pagesMap.get(p.page) || 0;
          pagesMap.set(p.page, current + (p.views || 0));
        });
      }
    });
    const topPages = Array.from(pagesMap.entries())
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    return {
      totalPageViews,
      totalVisitors,
      avgBounceRate,
      avgSessionDuration,
      trafficSources,
      topPages
    };
  };

  const stats = getLast30DaysStats();

  if (analytics.length === 0) {
    return (
      <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardContent className="py-12 text-center">
          <Activity className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-300 mb-2">No analytics data yet</p>
          <p className="text-sm text-slate-400">
            Analytics will appear once your website starts receiving traffic
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Page Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">{stats.totalPageViews.toLocaleString()}</div>
              <Eye className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">{stats.totalVisitors.toLocaleString()}</div>
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">{stats.avgBounceRate}%</div>
              <MousePointer className="w-6 h-6 text-yellow-400" />
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
              <div className="text-2xl font-bold text-white">{stats.avgSessionDuration}s</div>
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.trafficSources).map(([source, count]) => {
              const total = Object.values(stats.trafficSources).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
              
              return (
                <div key={source} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300 capitalize">{source}</span>
                      <span className="text-sm font-semibold text-white">{count.toLocaleString()} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages on your site</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topPages.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No page data yet</p>
            ) : (
              <div className="space-y-3">
                {stats.topPages.map((page, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-sm text-slate-300 truncate flex-1">{page.page}</span>
                    <span className="text-sm font-semibold text-white ml-2">{page.views.toLocaleString()} views</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}