import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Loader2, Calendar as CalendarIcon, Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { toast } from "sonner";

export default function SocialMediaScheduler({ websiteIntakeId }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPlatforms, setSelectedPlatforms] = useState(['facebook']);
  const [customContent, setCustomContent] = useState('');
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

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
    { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'bg-slate-800' }
  ];

  const togglePlatform = (platformId) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const generatePostMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Generate engaging social media post for multiple platforms.

Business: ${websiteIntake.company_name}
Industry: ${websiteIntake.goal_description}
Goals: ${websiteIntake.business_goals?.join(', ')}
Platforms: ${selectedPlatforms.join(', ')}

Create platform-optimized content with:
- Compelling copy that drives engagement
- Relevant hashtags (5-10)
- Clear call-to-action
- Emojis where appropriate
- Platform-specific best practices
- Estimated engagement score

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            content: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
            engagement_score: { type: "number" },
            optimization_tips: { type: "array", items: { type: "string" } },
            platform_variations: {
              type: "object",
              properties: {
                facebook: { type: "string" },
                instagram: { type: "string" },
                linkedin: { type: "string" },
                twitter: { type: "string" }
              }
            }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setCustomContent(data.content);
      toast.success('AI-generated content ready!');
    },
  });

  const schedulePostMutation = useMutation({
    mutationFn: async () => {
      const postsToCreate = selectedPlatforms.map(platform => ({
        website_intake_id: websiteIntakeId,
        platform,
        post_content: generatePostMutation.data?.platform_variations?.[platform] || customContent,
        hashtags: generatePostMutation.data?.hashtags || [],
        scheduled_time: selectedDate.toISOString(),
        engagement_score: generatePostMutation.data?.engagement_score,
        optimization_tips: generatePostMutation.data?.optimization_tips,
        status: 'scheduled'
      }));

      await Promise.all(
        postsToCreate.map(post => base44.entities.SocialMediaPost.create(post))
      );
    },
    onSuccess: () => {
      toast.success(`Posted scheduled to ${selectedPlatforms.length} platform(s)!`);
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      setCustomContent('');
      setSelectedDate(new Date());
    },
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: async ({ days }) => {
      const prompt = `Generate ${days}-day social media content calendar.

Business: ${websiteIntake.company_name}
Goals: ${websiteIntake.business_goals?.join(', ')}
Platforms: All major platforms

Create diverse content mix:
- Promotional posts (30%)
- Educational content (30%)
- Engagement posts (20%)
- Behind-the-scenes (10%)
- User-generated content ideas (10%)

Return as JSON array with daily posts.`;

      const calendar = await base44.integrations.Core.InvokeLLM({
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
                  date: { type: "string" },
                  platform: { type: "string" },
                  content: { type: "string" },
                  hashtags: { type: "array", items: { type: "string" } },
                  content_type: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Create all posts
      const today = new Date();
      await Promise.all(
        calendar.posts.map((post, idx) => {
          const postDate = new Date(today);
          postDate.setDate(postDate.getDate() + idx);
          
          return base44.entities.SocialMediaPost.create({
            website_intake_id: websiteIntakeId,
            platform: post.platform,
            post_content: post.content,
            hashtags: post.hashtags,
            scheduled_time: postDate.toISOString(),
            status: 'scheduled'
          });
        })
      );

      return calendar;
    },
    onSuccess: () => {
      toast.success('Bulk content calendar created!');
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-purple-400" />
          Social Media Scheduler
        </CardTitle>
        <CardDescription>Create and schedule posts across multiple platforms</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create Post</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled ({scheduledPosts.length})</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Generate</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Select Platforms</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {platforms.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = selectedPlatforms.includes(platform.id);
                  return (
                    <Button
                      key={platform.id}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => togglePlatform(platform.id)}
                      className={isSelected ? platform.color : ''}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {platform.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Schedule Date & Time</label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border border-slate-700"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <Button
                onClick={() => generatePostMutation.mutate()}
                disabled={generatePostMutation.isPending || selectedPlatforms.length === 0}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {generatePostMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> AI Generate Content</>
                )}
              </Button>

              <Button
                onClick={() => schedulePostMutation.mutate()}
                disabled={schedulePostMutation.isPending || !customContent || selectedPlatforms.length === 0}
                className="w-full"
              >
                {schedulePostMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Schedule Post
              </Button>
            </div>

            {generatePostMutation.data && (
              <Card className="bg-slate-700/30">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-600">
                      Score: {generatePostMutation.data.engagement_score}/100
                    </Badge>
                  </div>

                  <Textarea
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    rows={6}
                    className="font-mono text-sm"
                  />

                  {generatePostMutation.data.hashtags && (
                    <div className="flex flex-wrap gap-1">
                      {generatePostMutation.data.hashtags.map((tag, idx) => (
                        <Badge key={idx} variant="outline">#{tag}</Badge>
                      ))}
                    </div>
                  )}

                  {generatePostMutation.data.optimization_tips && (
                    <div className="text-xs text-slate-400">
                      <p className="font-medium mb-1">Optimization Tips:</p>
                      {generatePostMutation.data.optimization_tips.map((tip, idx) => (
                        <p key={idx}>• {tip}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-3">
            {scheduledPosts.length === 0 ? (
              <Card className="bg-slate-700/30">
                <CardContent className="py-12 text-center">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-slate-300">No scheduled posts yet</p>
                </CardContent>
              </Card>
            ) : (
              scheduledPosts.map((post) => {
                const platform = platforms.find(p => p.id === post.platform);
                const Icon = platform?.icon || CalendarIcon;
                return (
                  <Card key={post.id} className="bg-slate-700/30">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5" />
                          <Badge className={platform?.color}>{post.platform}</Badge>
                          <Badge variant="outline">{post.status}</Badge>
                          {post.engagement_score && (
                            <Badge className="bg-green-600">{post.engagement_score}/100</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {new Date(post.scheduled_time).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{post.post_content}</p>
                      {post.hashtags && (
                        <div className="flex flex-wrap gap-1">
                          {post.hashtags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">#{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <Card className="bg-slate-700/30">
              <CardContent className="pt-4">
                <h4 className="font-semibold text-white mb-3">Bulk Content Generation</h4>
                <p className="text-sm text-slate-300 mb-4">
                  Generate a complete content calendar with AI-optimized posts for the next 7, 14, or 30 days.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={() => bulkGenerateMutation.mutate({ days: 7 })}
                    disabled={bulkGenerateMutation.isPending}
                    variant="outline"
                  >
                    7 Days
                  </Button>
                  <Button
                    onClick={() => bulkGenerateMutation.mutate({ days: 14 })}
                    disabled={bulkGenerateMutation.isPending}
                    variant="outline"
                  >
                    14 Days
                  </Button>
                  <Button
                    onClick={() => bulkGenerateMutation.mutate({ days: 30 })}
                    disabled={bulkGenerateMutation.isPending}
                    variant="outline"
                  >
                    30 Days
                  </Button>
                </div>
                {bulkGenerateMutation.isPending && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                    <span className="text-slate-300">Generating content calendar...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}