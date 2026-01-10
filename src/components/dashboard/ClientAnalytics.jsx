import React, { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, Users, Eye, Clock, MousePointer, Sparkles, Loader2, Activity } from "lucide-react";
import { toast } from "sonner";

export default function ClientAnalytics({ websiteIntakeId }) {
  const [aiInsights, setAiInsights] = useState(null);

  const { data: analytics = [] } = useQuery({
    queryKey: ['my-analytics', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteAnalytics.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: websiteIntake } = useQuery({
    queryKey: ['website-intake-analytics', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteIntake.filter({ id: websiteIntakeId }).then(w => w[0]),
    enabled: !!websiteIntakeId,
  });

  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const stats = getLast30DaysStats();

      const prompt = `Analyze website performance and provide actionable insights.

Website: ${websiteIntake?.company_name}
Business Goals: ${websiteIntake?.business_goals?.join(', ')}

Performance (30 days):
- Page Views: ${stats.totalPageViews}
- Visitors: ${stats.totalVisitors}
- Bounce Rate: ${stats.avgBounceRate}%
- Avg Session: ${stats.avgSessionDuration}s

Traffic Sources:
${Object.entries(stats.trafficSources).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Top Pages:
${stats.topPages.map(p => `- ${p.page}: ${p.views} views`).join('\n')}

Provide:
1. What's driving performance (key success factors)
2. Areas for improvement (specific recommendations)
3. Traffic source optimization tips
4. Content performance insights
5. Actionable next steps

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            performance_drivers: { type: "array", items: { type: "string" } },
            improvement_areas: { type: "array", items: { type: "string" } },
            traffic_tips: { type: "array", items: { type: "string" } },
            content_insights: { type: "array", items: { type: "string" } },
            next_steps: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setAiInsights(data);
      toast.success('AI insights generated!');
    },
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
      {/* AI Insights */}
      <Card className="border-2 border-purple-500/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI Performance Insights
              </CardTitle>
              <CardDescription>Get personalized recommendations for your website</CardDescription>
            </div>
            <Button
              onClick={() => generateInsightsMutation.mutate()}
              disabled={generateInsightsMutation.isPending || analytics.length === 0}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {generateInsightsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Insights
            </Button>
          </div>
        </CardHeader>
        {aiInsights && (
          <CardContent className="space-y-3">
            <Alert className="bg-green-600/10 border-green-500/30">
              <AlertDescription className="text-green-300">
                <strong className="text-green-200">What's Driving Performance:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {aiInsights.performance_drivers?.map((driver, idx) => (
                    <li key={idx}>{driver}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-yellow-600/10 border-yellow-500/30">
              <AlertDescription className="text-yellow-300">
                <strong className="text-yellow-200">Areas for Improvement:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {aiInsights.improvement_areas?.map((area, idx) => (
                    <li key={idx}>{area}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-blue-600/10 border-blue-500/30">
              <AlertDescription className="text-blue-300">
                <strong className="text-blue-200">Traffic Optimization Tips:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {aiInsights.traffic_tips?.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-purple-600/10 border-purple-500/30">
              <AlertDescription className="text-purple-300">
                <strong className="text-purple-200">Next Steps:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {aiInsights.next_steps?.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

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