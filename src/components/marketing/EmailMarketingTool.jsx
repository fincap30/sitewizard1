import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Loader2, Mail, Send, Users } from "lucide-react";
import { toast } from "sonner";

export default function EmailMarketingTool({ websiteIntakeId }) {
  const [campaignData, setCampaignData] = useState({
    name: '',
    theme: '',
    targetSegment: 'all'
  });
  const [generatedEmail, setGeneratedEmail] = useState(null);
  const queryClient = useQueryClient();

  const { data: websiteIntake } = useQuery({
    queryKey: ['website-intake', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteIntake.filter({ id: websiteIntakeId }).then(r => r[0]),
    enabled: !!websiteIntakeId,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['email-campaigns', websiteIntakeId],
    queryFn: () => base44.entities.EmailCampaign.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const generateEmailMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Generate professional email marketing campaign.

Business: ${websiteIntake.company_name}
Campaign Theme: ${campaignData.theme}
Target Audience: ${campaignData.targetSegment}
Goals: ${websiteIntake.business_goals?.join(', ')}

Create complete email with:
1. Attention-grabbing subject line (40-50 chars)
2. Preheader text (90-100 chars)
3. Personalized greeting
4. Compelling opening paragraph
5. 2-3 main content sections with clear value
6. Strong call-to-action button
7. Professional closing
8. P.S. line for urgency/bonus
9. Responsive HTML structure

Best practices:
- Clear hierarchy and scannable content
- Mobile-optimized design
- One primary CTA
- Brand-consistent tone

Return as JSON.`;

      const email = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            subject_line: { type: "string" },
            preheader: { type: "string" },
            email_body: { type: "string" },
            cta_text: { type: "string" },
            cta_url: { type: "string" },
            ps_line: { type: "string" },
            predicted_open_rate: { type: "number" },
            predicted_click_rate: { type: "number" },
            optimization_tips: { type: "array", items: { type: "string" } }
          }
        }
      });

      return email;
    },
    onSuccess: (data) => {
      setGeneratedEmail(data);
      toast.success('Email campaign generated!');
    },
  });

  const saveCampaignMutation = useMutation({
    mutationFn: async ({ status }) => {
      await base44.entities.EmailCampaign.create({
        website_intake_id: websiteIntakeId,
        campaign_name: campaignData.name,
        subject_line: generatedEmail.subject_line,
        email_body: generatedEmail.email_body,
        cta_text: generatedEmail.cta_text,
        cta_url: generatedEmail.cta_url || '#',
        segment_id: campaignData.targetSegment,
        status,
        scheduled_date: status === 'scheduled' ? new Date().toISOString() : null
      });
    },
    onSuccess: (_, { status }) => {
      toast.success(status === 'draft' ? 'Campaign saved as draft!' : 'Campaign scheduled!');
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      setCampaignData({ name: '', theme: '', targetSegment: 'all' });
      setGeneratedEmail(null);
    },
  });

  const generateThemesMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Generate 10 email newsletter theme ideas.

Business: ${websiteIntake.company_name}
Industry: ${websiteIntake.goal_description}
Goals: ${websiteIntake.business_goals?.join(', ')}

Create diverse themes:
- Promotional (sales, discounts)
- Educational (tips, guides)
- Engagement (surveys, stories)
- Product launches
- Seasonal campaigns

Return as JSON array with theme and description.`;

      const themes = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            themes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  best_time: { type: "string" }
                }
              }
            }
          }
        }
      });

      return themes;
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-400" />
          Email Marketing Tool
        </CardTitle>
        <CardDescription>Design and send AI-powered email campaigns</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create Campaign</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns ({campaigns.length})</TabsTrigger>
            <TabsTrigger value="themes">Theme Ideas</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Campaign Name *</label>
                <Input
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({...campaignData, name: e.target.value})}
                  placeholder="e.g., Summer Sale Newsletter"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Target Segment</label>
                <select
                  value={campaignData.targetSegment}
                  onChange={(e) => setCampaignData({...campaignData, targetSegment: e.target.value})}
                  className="w-full border rounded-md px-3 py-2 bg-slate-700 text-white"
                >
                  <option value="all">All Subscribers</option>
                  <option value="active">Active Users</option>
                  <option value="new">New Subscribers</option>
                  <option value="inactive">Re-engagement</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-1 block">Campaign Theme *</label>
              <Textarea
                value={campaignData.theme}
                onChange={(e) => setCampaignData({...campaignData, theme: e.target.value})}
                placeholder="e.g., Announcing new product features and exclusive discount"
                rows={3}
              />
            </div>

            <Button
              onClick={() => generateEmailMutation.mutate()}
              disabled={generateEmailMutation.isPending || !campaignData.name || !campaignData.theme}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {generateEmailMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating Email...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> AI Generate Email</>
              )}
            </Button>

            {generatedEmail && (
              <Card className="bg-slate-700/30">
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1 block">Subject Line</label>
                    <Input value={generatedEmail.subject_line} readOnly className="font-semibold" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1 block">Preheader Text</label>
                    <Input value={generatedEmail.preheader} readOnly className="text-sm" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1 block">Email Body</label>
                    <Textarea
                      value={generatedEmail.email_body}
                      rows={12}
                      readOnly
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-1 block">CTA Button</label>
                      <Button className="w-full" disabled>{generatedEmail.cta_text}</Button>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-1 block">P.S. Line</label>
                      <p className="text-sm text-slate-300 italic">{generatedEmail.ps_line}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-600">
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Predicted Open Rate</p>
                      <p className="text-2xl font-bold text-green-400">{generatedEmail.predicted_open_rate}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Predicted Click Rate</p>
                      <p className="text-2xl font-bold text-blue-400">{generatedEmail.predicted_click_rate}%</p>
                    </div>
                  </div>

                  {generatedEmail.optimization_tips && (
                    <div className="bg-blue-600/10 border border-blue-500/30 rounded p-3">
                      <p className="text-xs font-medium text-blue-300 mb-2">Optimization Tips:</p>
                      {generatedEmail.optimization_tips.map((tip, idx) => (
                        <p key={idx} className="text-xs text-slate-300 mb-1">• {tip}</p>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => saveCampaignMutation.mutate({ status: 'draft' })}
                      disabled={saveCampaignMutation.isPending}
                      variant="outline"
                    >
                      Save as Draft
                    </Button>
                    <Button
                      onClick={() => saveCampaignMutation.mutate({ status: 'scheduled' })}
                      disabled={saveCampaignMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Schedule Campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-3">
            {campaigns.length === 0 ? (
              <Card className="bg-slate-700/30">
                <CardContent className="py-12 text-center">
                  <Mail className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-slate-300">No campaigns yet</p>
                </CardContent>
              </Card>
            ) : (
              campaigns.map((campaign) => (
                <Card key={campaign.id} className="bg-slate-700/30">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
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
                    {campaign.sent_count > 0 && (
                      <div className="grid grid-cols-3 gap-4 text-center text-xs mt-3 pt-3 border-t border-slate-600">
                        <div>
                          <p className="text-slate-400">Sent</p>
                          <p className="font-semibold text-white">{campaign.sent_count}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Open Rate</p>
                          <p className="font-semibold text-white">{campaign.open_rate}%</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Click Rate</p>
                          <p className="font-semibold text-white">{campaign.click_rate}%</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="themes" className="space-y-4">
            <Button
              onClick={() => generateThemesMutation.mutate()}
              disabled={generateThemesMutation.isPending}
              className="w-full"
            >
              {generateThemesMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating Ideas...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Generate Theme Ideas</>
              )}
            </Button>

            {generateThemesMutation.data?.themes && (
              <div className="space-y-3">
                {generateThemesMutation.data.themes.map((theme, idx) => (
                  <Card key={idx} className="bg-slate-700/30 cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => setCampaignData({...campaignData, theme: theme.description})}>
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-white mb-1">{theme.title}</h4>
                      <p className="text-sm text-slate-300 mb-2">{theme.description}</p>
                      <Badge variant="outline" className="text-xs">{theme.best_time}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}