import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Users, Eye, MousePointer, Clock, Mail, Share2 } from "lucide-react";

export default function PerformanceTracker({ websiteIntakeId }) {
  const { data: analytics = [] } = useQuery({
    queryKey: ['analytics', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteAnalytics.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: socialPosts = [] } = useQuery({
    queryKey: ['social-posts', websiteIntakeId],
    queryFn: () => base44.entities.SocialMediaPost.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: emailCampaigns = [] } = useQuery({
    queryKey: ['email-campaigns', websiteIntakeId],
    queryFn: () => base44.entities.EmailCampaign.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  // Calculate metrics
  const last30Days = analytics.filter(a => {
    const date = new Date(a.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date >= thirtyDaysAgo;
  });

  const totalPageViews = last30Days.reduce((sum, a) => sum + (a.page_views || 0), 0);
  const totalVisitors = last30Days.reduce((sum, a) => sum + (a.unique_visitors || 0), 0);
  const avgBounceRate = last30Days.length > 0
    ? last30Days.reduce((sum, a) => sum + (a.bounce_rate || 0), 0) / last30Days.length
    : 0;
  const avgSessionDuration = last30Days.length > 0
    ? last30Days.reduce((sum, a) => sum + (a.avg_session_duration || 0), 0) / last30Days.length
    : 0;

  const sentCampaigns = emailCampaigns.filter(c => c.status === 'sent');
  const avgOpenRate = sentCampaigns.length > 0
    ? sentCampaigns.reduce((sum, c) => sum + (c.open_rate || 0), 0) / sentCampaigns.length
    : 0;
  const avgClickRate = sentCampaigns.length > 0
    ? sentCampaigns.reduce((sum, c) => sum + (c.click_rate || 0), 0) / sentCampaigns.length
    : 0;

  const publishedPosts = socialPosts.filter(p => p.status === 'published');
  const avgEngagement = publishedPosts.length > 0
    ? publishedPosts.reduce((sum, p) => sum + (p.engagement_score || 0), 0) / publishedPosts.length
    : 0;

  const MetricCard = ({ icon: Icon, title, value, change, color }) => (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <Icon className={`w-8 h-8 ${color}`} />
          {change !== undefined && (
            <Badge className={change >= 0 ? 'bg-green-600' : 'bg-red-600'}>
              {change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {Math.abs(change)}%
            </Badge>
          )}
        </div>
        <p className="text-sm text-slate-400 mb-1">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </CardContent>
    </Card>
  );

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Performance Tracking Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="website">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="website">Website</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
          </TabsList>

          <TabsContent value="website" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <MetricCard
                icon={Eye}
                title="Page Views"
                value={totalPageViews.toLocaleString()}
                change={12}
                color="text-blue-400"
              />
              <MetricCard
                icon={Users}
                title="Unique Visitors"
                value={totalVisitors.toLocaleString()}
                change={8}
                color="text-purple-400"
              />
              <MetricCard
                icon={MousePointer}
                title="Bounce Rate"
                value={`${avgBounceRate.toFixed(1)}%`}
                change={-5}
                color="text-orange-400"
              />
              <MetricCard
                icon={Clock}
                title="Avg. Session"
                value={`${Math.floor(avgSessionDuration / 60)}m ${Math.round(avgSessionDuration % 60)}s`}
                change={15}
                color="text-green-400"
              />
            </div>

            <Card className="bg-slate-700/30">
              <CardContent className="pt-4">
                <h4 className="font-semibold text-white mb-4">Traffic Sources</h4>
                <div className="space-y-3">
                  {last30Days.reduce((sources, day) => {
                    if (day.traffic_sources) {
                      Object.entries(day.traffic_sources).forEach(([source, count]) => {
                        sources[source] = (sources[source] || 0) + count;
                      });
                    }
                    return sources;
                  }, {}) && Object.entries(last30Days.reduce((sources, day) => {
                    if (day.traffic_sources) {
                      Object.entries(day.traffic_sources).forEach(([source, count]) => {
                        sources[source] = (sources[source] || 0) + count;
                      });
                    }
                    return sources;
                  }, {})).map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between">
                      <span className="text-slate-300 capitalize">{source}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-slate-600 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(count / totalVisitors) * 100}%` }}
                          />
                        </div>
                        <span className="text-white font-semibold w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-700/30">
              <CardContent className="pt-4">
                <h4 className="font-semibold text-white mb-4">Top Pages</h4>
                <div className="space-y-2">
                  {last30Days
                    .reduce((pages, day) => {
                      if (day.page_url) {
                        pages[day.page_url] = (pages[day.page_url] || 0) + (day.page_views || 0);
                      }
                      return pages;
                    }, {})
                    && Object.entries(last30Days.reduce((pages, day) => {
                      if (day.page_url) {
                        pages[day.page_url] = (pages[day.page_url] || 0) + (day.page_views || 0);
                      }
                      return pages;
                    }, {}))
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([page, views]) => (
                      <div key={page} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                        <span className="text-sm text-slate-300">{page}</span>
                        <Badge>{views} views</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <MetricCard
                icon={Mail}
                title="Campaigns Sent"
                value={sentCampaigns.length}
                color="text-blue-400"
              />
              <MetricCard
                icon={Eye}
                title="Avg. Open Rate"
                value={`${avgOpenRate.toFixed(1)}%`}
                change={5}
                color="text-green-400"
              />
              <MetricCard
                icon={MousePointer}
                title="Avg. Click Rate"
                value={`${avgClickRate.toFixed(1)}%`}
                change={3}
                color="text-purple-400"
              />
              <MetricCard
                icon={Users}
                title="Total Subscribers"
                value={sentCampaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0)}
                change={8}
                color="text-orange-400"
              />
            </div>

            <Card className="bg-slate-700/30">
              <CardContent className="pt-4">
                <h4 className="font-semibold text-white mb-4">Recent Campaigns</h4>
                <div className="space-y-3">
                  {sentCampaigns.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                      <div>
                        <p className="font-medium text-white">{campaign.campaign_name}</p>
                        <p className="text-xs text-slate-400">{campaign.subject_line}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-600 mb-1">{campaign.open_rate}% opened</Badge>
                        <p className="text-xs text-slate-400">{campaign.sent_count} sent</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <MetricCard
                icon={Share2}
                title="Posts Published"
                value={publishedPosts.length}
                color="text-pink-400"
              />
              <MetricCard
                icon={TrendingUp}
                title="Avg. Engagement"
                value={`${avgEngagement.toFixed(0)}/100`}
                change={10}
                color="text-purple-400"
              />
              <MetricCard
                icon={Users}
                title="Scheduled Posts"
                value={socialPosts.filter(p => p.status === 'scheduled').length}
                color="text-blue-400"
              />
              <MetricCard
                icon={Eye}
                title="Draft Posts"
                value={socialPosts.filter(p => p.status === 'draft').length}
                color="text-slate-400"
              />
            </div>

            <Card className="bg-slate-700/30">
              <CardContent className="pt-4">
                <h4 className="font-semibold text-white mb-4">Platform Distribution</h4>
                <div className="space-y-3">
                  {['facebook', 'instagram', 'linkedin', 'twitter'].map(platform => {
                    const count = socialPosts.filter(p => p.platform === platform).length;
                    const percentage = socialPosts.length > 0 ? (count / socialPosts.length) * 100 : 0;
                    return (
                      <div key={platform} className="flex items-center justify-between">
                        <span className="text-slate-300 capitalize">{platform}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-slate-600 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-white font-semibold w-12 text-right">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-700/30">
              <CardContent className="pt-4">
                <h4 className="font-semibold text-white mb-4">Top Performing Posts</h4>
                <div className="space-y-3">
                  {publishedPosts
                    .sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0))
                    .slice(0, 5)
                    .map((post) => (
                      <div key={post.id} className="p-3 bg-slate-800/50 rounded">
                        <div className="flex items-start justify-between mb-2">
                          <Badge className="capitalize">{post.platform}</Badge>
                          <Badge className="bg-green-600">{post.engagement_score}/100</Badge>
                        </div>
                        <p className="text-sm text-slate-300 line-clamp-2">{post.post_content}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}