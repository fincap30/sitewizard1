import React, { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, Users, Eye, Activity, Sparkles, Loader2 } from "lucide-react";

export default function AdminAnalyticsDashboard() {
  const [aiInsights, setAiInsights] = useState(null);

  const { data: allAnalytics = [] } = useQuery({
    queryKey: ['all-analytics'],
    queryFn: () => base44.entities.WebsiteAnalytics.list('-date'),
  });

  const { data: websites = [] } = useQuery({
    queryKey: ['all-websites'],
    queryFn: () => base44.entities.WebsiteIntake.filter({ website_status: 'live' }),
  });

  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const stats = getLast30DaysStats();
      const topSites = websiteStats.slice(0, 5);
      const bottomSites = websiteStats.slice(-3);

      const prompt = `Analyze website performance data and provide insights:

Total Stats (30 days):
- Page Views: ${stats.totalPageViews}
- Visitors: ${stats.totalVisitors}
- Avg Bounce Rate: ${stats.avgBounceRate}%
- Avg Session: ${stats.avgSessionDuration}s

Top Performing Sites:
${topSites.map(s => `${s.company}: ${s.totalViews} views`).join('\n')}

Bottom Performing Sites:
${bottomSites.map(s => `${s.company}: ${s.totalViews} views`).join('\n')}

Provide:
1. Key trends and patterns
2. Sites needing attention (with specific recommendations)
3. Best performing sites (what they're doing right)
4. Actionable optimization suggestions

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            key_trends: { type: "array", items: { type: "string" } },
            sites_needing_attention: { type: "array", items: { type: "string" } },
            best_performers: { type: "array", items: { type: "string" } },
            optimization_tips: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setAiInsights(data);
    },
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
      {/* AI Insights */}
      <Card className="border-2 border-purple-500/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI Performance Insights
              </CardTitle>
              <CardDescription>Automated analysis and recommendations</CardDescription>
            </div>
            <Button
              onClick={() => generateInsightsMutation.mutate()}
              disabled={generateInsightsMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {generateInsightsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Insights
            </Button>
          </div>
        </CardHeader>
        {aiInsights && (
          <CardContent className="space-y-4">
            <Alert className="bg-blue-600/10 border-blue-500/30">
              <AlertDescription className="text-blue-300">
                <strong className="text-blue-200">Key Trends:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {aiInsights.key_trends?.map((trend, idx) => (
                    <li key={idx}>{trend}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-red-600/10 border-red-500/30">
              <AlertDescription className="text-red-300">
                <strong className="text-red-200">Sites Needing Attention:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {aiInsights.sites_needing_attention?.map((site, idx) => (
                    <li key={idx}>{site}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-green-600/10 border-green-500/30">
              <AlertDescription className="text-green-300">
                <strong className="text-green-200">Top Performers:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {aiInsights.best_performers?.map((performer, idx) => (
                    <li key={idx}>{performer}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-purple-600/10 border-purple-500/30">
              <AlertDescription className="text-purple-300">
                <strong className="text-purple-200">Optimization Tips:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {aiInsights.optimization_tips?.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

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