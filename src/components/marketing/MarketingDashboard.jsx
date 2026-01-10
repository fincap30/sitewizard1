import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Sparkles, Loader2, TrendingUp, Calendar as CalendarIcon, Send, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function MarketingDashboard({ websiteIntakeId }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [contentType, setContentType] = useState('blog');
  const queryClient = useQueryClient();

  const { data: websiteIntake } = useQuery({
    queryKey: ['website-intake', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteIntake.filter({ id: websiteIntakeId }).then(r => r[0]),
    enabled: !!websiteIntakeId,
  });

  const { data: scheduledPosts = [] } = useQuery({
    queryKey: ['social-posts', websiteIntakeId],
    queryFn: () => base44.entities.SocialMediaPost.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const generateContentCalendarMutation = useMutation({
    mutationFn: async ({ months = 3 }) => {
      const prompt = `Generate ${months}-month content marketing calendar.

Business: ${websiteIntake.company_name}
Goals: ${websiteIntake.business_goals?.join(', ')}
Industry: ${websiteIntake.goal_description}

Create comprehensive content strategy with:
1. Weekly blog post topics (SEO-optimized)
2. Daily social media posts (platform-specific)
3. Monthly email newsletter themes
4. Quarterly campaign ideas
5. Content themes and pillars
6. Keyword targets for each piece
7. Cross-promotion strategy

Return as JSON with scheduled items.`;

      const calendar = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            blog_posts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  week: { type: "string" },
                  topic: { type: "string" },
                  keywords: { type: "array", items: { type: "string" } },
                  target_date: { type: "string" }
                }
              }
            },
            social_posts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  platform: { type: "string" },
                  content_idea: { type: "string" },
                  hashtags: { type: "array", items: { type: "string" } }
                }
              }
            },
            newsletters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "string" },
                  theme: { type: "string" },
                  topics: { type: "array", items: { type: "string" } }
                }
              }
            },
            campaigns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  quarter: { type: "string" },
                  name: { type: "string" },
                  description: { type: "string" },
                  channels: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      return calendar;
    },
    onSuccess: () => {
      toast.success('Content calendar generated!');
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
    },
  });

  const generatePostMutation = useMutation({
    mutationFn: async ({ platform, scheduledTime }) => {
      const prompt = `Generate engaging ${platform} post.

Business: ${websiteIntake.company_name}
Industry: ${websiteIntake.goal_description}
Scheduled: ${scheduledTime}

Create platform-optimized post with:
- Compelling copy
- Relevant hashtags
- Call-to-action
- Engagement hooks

Best practices for ${platform}.`;

      const post = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            content: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
            engagement_score: { type: "number" },
            optimization_tips: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Save to database
      await base44.entities.SocialMediaPost.create({
        website_intake_id: websiteIntakeId,
        platform,
        post_content: post.content,
        hashtags: post.hashtags,
        scheduled_time: scheduledTime,
        engagement_score: post.engagement_score,
        optimization_tips: post.optimization_tips,
        status: 'scheduled'
      });

      return post;
    },
    onSuccess: () => {
      toast.success('Social post scheduled!');
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
    },
  });

  const analyzePerformanceMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Analyze marketing performance and provide insights.

Posts scheduled: ${scheduledPosts.length}
Platforms: ${[...new Set(scheduledPosts.map(p => p.platform))].join(', ')}

Analyze:
1. Content mix balance
2. Posting frequency recommendations
3. Best performing content types
4. Engagement optimization tips
5. Missing opportunities
6. Competitive benchmarks

Return actionable insights.`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            insights: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            next_actions: { type: "array", items: { type: "string" } }
          }
        }
      });

      return analysis;
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          SEO & Marketing Dashboard
        </CardTitle>
        <CardDescription>
          AI-powered content generation, scheduling, and performance tracking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="calendar">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calendar">Content Calendar</TabsTrigger>
            <TabsTrigger value="generate">Generate Content</TabsTrigger>
            <TabsTrigger value="schedule">Scheduled Posts</TabsTrigger>
            <TabsTrigger value="analytics">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <Card className="bg-slate-700/30">
              <CardContent className="pt-4">
                <h4 className="font-semibold text-white mb-4">AI Content Calendar Generator</h4>
                <p className="text-sm text-slate-300 mb-4">
                  Generate a complete content marketing calendar with blog posts, social media content, and email campaigns.
                </p>
                
                <div className="grid gap-4">
                  <Button
                    onClick={() => generateContentCalendarMutation.mutate({ months: 3 })}
                    disabled={generateContentCalendarMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {generateContentCalendarMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating Calendar...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Generate 3-Month Calendar</>
                    )}
                  </Button>

                  {generateContentCalendarMutation.data && (
                    <div className="space-y-3 mt-4">
                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <h5 className="font-medium text-white mb-2">Blog Posts</h5>
                        <div className="space-y-2">
                          {generateContentCalendarMutation.data.blog_posts?.slice(0, 5).map((post, idx) => (
                            <div key={idx} className="text-sm">
                              <Badge variant="outline" className="mr-2">{post.week}</Badge>
                              <span className="text-slate-300">{post.topic}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <h5 className="font-medium text-white mb-2">Social Media</h5>
                        <div className="space-y-2">
                          {generateContentCalendarMutation.data.social_posts?.slice(0, 5).map((post, idx) => (
                            <div key={idx} className="text-sm">
                              <Badge variant="outline" className="mr-2">{post.platform}</Badge>
                              <span className="text-slate-300">{post.content_idea}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <h5 className="font-medium text-white mb-2">Email Campaigns</h5>
                        <div className="space-y-2">
                          {generateContentCalendarMutation.data.newsletters?.map((nl, idx) => (
                            <div key={idx} className="text-sm">
                              <Badge variant="outline" className="mr-2">{nl.month}</Badge>
                              <span className="text-slate-300">{nl.theme}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <Card className="bg-slate-700/30">
              <CardContent className="pt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Content Type</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 bg-slate-700 text-white"
                  >
                    <option value="blog">Blog Post</option>
                    <option value="social-facebook">Social - Facebook</option>
                    <option value="social-instagram">Social - Instagram</option>
                    <option value="social-linkedin">Social - LinkedIn</option>
                    <option value="email">Email Newsletter</option>
                  </select>
                </div>

                {contentType.startsWith('social') && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-2 block">Schedule Date</label>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border border-slate-700"
                      />
                    </div>

                    <Button
                      onClick={() => generatePostMutation.mutate({ 
                        platform: contentType.replace('social-', ''), 
                        scheduledTime: selectedDate.toISOString() 
                      })}
                      disabled={generatePostMutation.isPending}
                      className="w-full"
                    >
                      {generatePostMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
                      ) : (
                        <><Send className="w-4 h-4 mr-2" /> Generate & Schedule Post</>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-3">
            {scheduledPosts.length === 0 ? (
              <Card className="bg-slate-700/30">
                <CardContent className="pt-12 pb-12 text-center">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-slate-300">No scheduled posts yet</p>
                  <p className="text-sm text-slate-400 mt-1">Generate content to start scheduling</p>
                </CardContent>
              </Card>
            ) : (
              scheduledPosts.map((post) => (
                <Card key={post.id} className="bg-slate-700/30">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="capitalize">{post.platform}</Badge>
                          <Badge variant="outline">{post.status}</Badge>
                          {post.engagement_score && (
                            <Badge className="bg-green-600">Score: {post.engagement_score}/100</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-300">{post.post_content}</p>
                        {post.hashtags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {post.hashtags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">#{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Scheduled: {new Date(post.scheduled_time).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Button
              onClick={() => analyzePerformanceMutation.mutate()}
              disabled={analyzePerformanceMutation.isPending || scheduledPosts.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {analyzePerformanceMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing...</>
              ) : (
                <><BarChart3 className="w-4 h-4 mr-2" /> Analyze Performance</>
              )}
            </Button>

            {analyzePerformanceMutation.data && (
              <Card className="bg-slate-700/30">
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Performance Score</h4>
                    <div className="text-4xl font-bold text-green-400">
                      {analyzePerformanceMutation.data.score}/100
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Key Insights</h4>
                    {analyzePerformanceMutation.data.insights?.map((insight, idx) => (
                      <p key={idx} className="text-sm text-slate-300 mb-1">• {insight}</p>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Recommendations</h4>
                    {analyzePerformanceMutation.data.recommendations?.map((rec, idx) => (
                      <p key={idx} className="text-sm text-blue-300 mb-1">→ {rec}</p>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Next Actions</h4>
                    {analyzePerformanceMutation.data.next_actions?.map((action, idx) => (
                      <Badge key={idx} className="mr-2 mb-2">{action}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}