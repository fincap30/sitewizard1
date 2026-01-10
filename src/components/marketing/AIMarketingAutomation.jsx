import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, Mail, Share2, Search, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function AIMarketingAutomation({ websiteIntakeId }) {
  const queryClient = useQueryClient();

  const { data: segments = [] } = useQuery({
    queryKey: ['segments-marketing', websiteIntakeId],
    queryFn: () => base44.entities.UserSegment.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns', websiteIntakeId],
    queryFn: () => base44.entities.EmailCampaign.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: socialPosts = [] } = useQuery({
    queryKey: ['social-posts', websiteIntakeId],
    queryFn: () => base44.entities.SocialMediaPost.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ['analytics-marketing', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteAnalytics.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: websiteIntake } = useQuery({
    queryKey: ['website-marketing', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteIntake.filter({ id: websiteIntakeId }).then(w => w[0]),
    enabled: !!websiteIntakeId,
  });

  const generateCampaignMutation = useMutation({
    mutationFn: async (segmentId) => {
      const segment = segments.find(s => s.id === segmentId);
      const recentAnalytics = analytics.slice(-7);

      const prompt = `Generate email campaign for user segment.

Business: ${websiteIntake?.company_name}
Goals: ${websiteIntake?.business_goals?.join(', ')}

Target Segment: ${segment?.segment_name}
Segment Criteria: ${JSON.stringify(segment?.criteria)}
Personalization: ${JSON.stringify(segment?.personalization_rules)}

Recent Performance:
- Page Views: ${recentAnalytics.reduce((s, a) => s + (a.page_views || 0), 0)}
- Visitors: ${recentAnalytics.reduce((s, a) => s + (a.unique_visitors || 0), 0)}

Create compelling email campaign with:
1. Attention-grabbing subject line
2. Personalized email body (200-300 words)
3. Strong call-to-action
4. Optimal send time recommendation

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            subject_line: { type: "string" },
            email_body: { type: "string" },
            cta_text: { type: "string" },
            cta_url: { type: "string" },
            recommended_time: { type: "string" }
          }
        }
      });

      await base44.entities.EmailCampaign.create({
        website_intake_id: websiteIntakeId,
        segment_id: segmentId,
        campaign_name: `Campaign for ${segment?.segment_name}`,
        subject_line: response.subject_line,
        email_body: response.email_body,
        cta_text: response.cta_text,
        cta_url: response.cta_url
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign generated!');
    },
  });

  const generateSocialPostsMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Generate social media content strategy.

Business: ${websiteIntake?.company_name}
Goals: ${websiteIntake?.business_goals?.join(', ')}
Style: ${websiteIntake?.style_preference}

Create 5 engaging social media posts for Facebook, Instagram, and LinkedIn.
Each post should include:
- Platform-optimized content
- Relevant hashtags
- Predicted engagement score
- Optimization tips

Return as JSON array.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            posts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  platform: { type: "string" },
                  content: { type: "string" },
                  hashtags: { type: "array", items: { type: "string" } },
                  engagement_score: { type: "number" },
                  tips: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      for (const post of response.posts) {
        await base44.entities.SocialMediaPost.create({
          website_intake_id: websiteIntakeId,
          platform: post.platform.toLowerCase(),
          post_content: post.content,
          hashtags: post.hashtags,
          engagement_score: post.engagement_score,
          optimization_tips: post.tips
        });
      }

      return response.posts;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      toast.success('Social posts generated!');
    },
  });

  const generateSEOStrategyMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Create comprehensive SEO content strategy.

Business: ${websiteIntake?.company_name}
Goals: ${websiteIntake?.business_goals?.join(', ')}

Current Performance:
- Total Views: ${analytics.reduce((s, a) => s + (a.page_views || 0), 0)}
- Traffic Sources: ${JSON.stringify(analytics[0]?.traffic_sources || {})}

Generate:
1. Target keywords (primary and secondary)
2. Content topics for blog posts (10 topics)
3. On-page SEO recommendations
4. Link building strategies
5. Content calendar suggestions (monthly)

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            primary_keywords: { type: "array", items: { type: "string" } },
            secondary_keywords: { type: "array", items: { type: "string" } },
            blog_topics: { type: "array", items: { type: "string" } },
            onpage_recommendations: { type: "array", items: { type: "string" } },
            link_building: { type: "array", items: { type: "string" } },
            content_calendar: { type: "string" }
          }
        }
      });

      return response;
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          AI Marketing Automation
        </CardTitle>
        <CardDescription>Automated campaigns, social scheduling, and SEO strategy</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email">Email Campaigns</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="seo">SEO Strategy</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => segments[0] && generateCampaignMutation.mutate(segments[0].id)}
                disabled={generateCampaignMutation.isPending || segments.length === 0}
                size="sm"
              >
                {generateCampaignMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
                Generate Campaign
              </Button>
            </div>

            {campaigns.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No campaigns yet. Generate your first campaign!</p>
            ) : (
              <div className="space-y-3">
                {campaigns.map(campaign => (
                  <Card key={campaign.id} className="bg-slate-700/30">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{campaign.campaign_name}</h4>
                          <p className="text-sm text-slate-400">{campaign.subject_line}</p>
                        </div>
                        <Badge className={
                          campaign.status === 'sent' ? 'bg-green-600' :
                          campaign.status === 'scheduled' ? 'bg-blue-600' :
                          'bg-slate-600'
                        }>
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 mb-2">{campaign.email_body}</p>
                      {campaign.cta_text && (
                        <Badge variant="outline" className="text-xs">{campaign.cta_text}</Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => generateSocialPostsMutation.mutate()}
                disabled={generateSocialPostsMutation.isPending}
                size="sm"
              >
                {generateSocialPostsMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Share2 className="w-3 h-3 mr-2" />}
                Generate Posts
              </Button>
            </div>

            {socialPosts.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No posts yet. Generate social content!</p>
            ) : (
              <div className="space-y-3">
                {socialPosts.map(post => (
                  <Card key={post.id} className="bg-slate-700/30">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge className="bg-blue-600 capitalize">{post.platform}</Badge>
                        <Badge variant="outline">Score: {post.engagement_score}/10</Badge>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{post.post_content}</p>
                      {post.hashtags && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {post.hashtags.map((tag, idx) => (
                            <span key={idx} className="text-xs text-blue-400">#{tag}</span>
                          ))}
                        </div>
                      )}
                      {post.optimization_tips && post.optimization_tips.length > 0 && (
                        <Alert className="bg-blue-600/10 border-blue-500/30 mt-2">
                          <AlertDescription className="text-blue-300 text-xs">
                            <strong>Tips:</strong> {post.optimization_tips.join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <Button
              onClick={() => generateSEOStrategyMutation.mutate()}
              disabled={generateSEOStrategyMutation.isPending}
              className="w-full"
            >
              {generateSEOStrategyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              Generate SEO Strategy
            </Button>

            {generateSEOStrategyMutation.data && (
              <div className="space-y-3">
                <Alert className="bg-green-600/10 border-green-500/30">
                  <AlertDescription className="text-green-300">
                    <strong>Primary Keywords:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {generateSEOStrategyMutation.data.primary_keywords?.map((kw, idx) => (
                        <Badge key={idx} className="bg-green-600">{kw}</Badge>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>

                <Alert className="bg-blue-600/10 border-blue-500/30">
                  <AlertDescription className="text-blue-300">
                    <strong>Blog Topics:</strong>
                    <ul className="list-disc list-inside mt-1 text-sm">
                      {generateSEOStrategyMutation.data.blog_topics?.slice(0, 5).map((topic, idx) => (
                        <li key={idx}>{topic}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>

                <Alert className="bg-purple-600/10 border-purple-500/30">
                  <AlertDescription className="text-purple-300">
                    <strong>On-Page Recommendations:</strong>
                    <ul className="list-disc list-inside mt-1 text-sm">
                      {generateSEOStrategyMutation.data.onpage_recommendations?.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}