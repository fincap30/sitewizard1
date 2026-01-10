import React, { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Loader2, AlertTriangle, FileText, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function AIAutomationTools() {
  const [structureSuggestion, setStructureSuggestion] = useState(null);
  const [buildIssues, setBuildIssues] = useState(null);
  const [progressReport, setProgressReport] = useState(null);
  const [selectedWebsite, setSelectedWebsite] = useState('');

  const { data: websites = [] } = useQuery({
    queryKey: ['all-websites-for-ai'],
    queryFn: () => base44.entities.WebsiteIntake.list('-created_date'),
  });

  const { data: buildTasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.BuildTask.list('-created_date'),
  });

  const suggestStructureMutation = useMutation({
    mutationFn: async (websiteId) => {
      const website = websites.find(w => w.id === websiteId);
      
      const prompt = `Suggest optimal website structure and page layouts.

Business: ${website.company_name}
Industry: Based on name
Goals: ${website.business_goals?.join(', ')}
Style: ${website.style_preference}
Current Website: ${website.current_website || 'None'}

Provide:
1. Recommended page structure (which pages to include)
2. Optimal layout for each page type
3. Key sections to prioritize
4. Navigation structure
5. Special features to consider

Return as JSON with detailed recommendations.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_pages: { type: "array", items: { type: "string" } },
            layout_recommendations: { type: "object" },
            priority_sections: { type: "array", items: { type: "string" } },
            navigation_structure: { type: "string" },
            special_features: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setStructureSuggestion(data);
      toast.success('Structure suggestions generated!');
    },
  });

  const identifyIssuesMutation = useMutation({
    mutationFn: async () => {
      const activeProjects = websites.filter(w => 
        w.website_status === 'generating' || w.website_status === 'approved'
      );

      const tasksData = buildTasks.filter(t => t.status === 'pending' || t.status === 'blocked');

      const prompt = `Analyze active website projects and identify potential issues or delays.

Active Projects: ${activeProjects.length}
Projects in generation: ${activeProjects.filter(w => w.website_status === 'generating').length}
Projects being built: ${activeProjects.filter(w => w.website_status === 'approved').length}

Pending/Blocked Tasks: ${tasksData.length}
Task Details:
${tasksData.slice(0, 10).map(t => `- ${t.task_name} (${t.status}, Priority: ${t.priority})`).join('\n')}

Identify:
1. Projects likely to face delays
2. Bottlenecks in the build process
3. Tasks that need immediate attention
4. Resource allocation issues
5. Recommended actions for each issue

Return as JSON with actionable alerts.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            high_priority_alerts: { type: "array", items: { type: "string" } },
            potential_delays: { type: "array", items: { type: "string" } },
            bottlenecks: { type: "array", items: { type: "string" } },
            recommended_actions: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setBuildIssues(data);
      toast.success('Build analysis complete!');
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async (websiteId) => {
      const website = websites.find(w => w.id === websiteId);
      const milestones = await base44.entities.ProjectMilestone.filter({ website_intake_id: websiteId });
      const analytics = await base44.entities.WebsiteAnalytics.filter({ website_intake_id: websiteId });

      const prompt = `Generate a comprehensive progress report for client.

Website: ${website.company_name}
Status: ${website.website_status}

Milestones:
${milestones.map(m => `- ${m.milestone_name}: ${m.status} ${m.completed_date ? '(Completed)' : ''}`).join('\n')}

Analytics (if live):
Total data points: ${analytics.length}

Create a professional progress report including:
1. Executive summary
2. Completed milestones
3. Current status and next steps
4. Performance metrics (if available)
5. Timeline and estimated completion
6. Recommendations

Write in a professional, client-friendly tone.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      return response;
    },
    onSuccess: (data) => {
      setProgressReport(data);
      toast.success('Progress report generated!');
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Automation Tools
        </CardTitle>
        <CardDescription>Automated analysis and recommendations</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="structure">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="structure">Structure Suggestions</TabsTrigger>
            <TabsTrigger value="issues">Build Issues</TabsTrigger>
            <TabsTrigger value="reports">Progress Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="structure" className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Select Website</label>
              <select
                className="w-full border rounded-md px-3 py-2 mb-3 bg-slate-700 text-white"
                value={selectedWebsite}
                onChange={(e) => setSelectedWebsite(e.target.value)}
              >
                <option value="">-- Select Website --</option>
                {websites.filter(w => w.website_status === 'pending' || w.website_status === 'generating').map(w => (
                  <option key={w.id} value={w.id}>{w.company_name}</option>
                ))}
              </select>
              <Button
                onClick={() => suggestStructureMutation.mutate(selectedWebsite)}
                disabled={!selectedWebsite || suggestStructureMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {suggestStructureMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                Generate Structure Suggestions
              </Button>
            </div>

            {structureSuggestion && (
              <div className="space-y-3">
                <Alert className="bg-blue-600/10 border-blue-500/30">
                  <AlertDescription className="text-blue-300">
                    <strong className="text-blue-200">Recommended Pages:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {structureSuggestion.recommended_pages?.map((page, idx) => (
                        <li key={idx}>{page}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>

                <Alert className="bg-green-600/10 border-green-500/30">
                  <AlertDescription className="text-green-300">
                    <strong className="text-green-200">Priority Sections:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {structureSuggestion.priority_sections?.map((section, idx) => (
                        <li key={idx}>{section}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>

                <Alert className="bg-purple-600/10 border-purple-500/30">
                  <AlertDescription className="text-purple-300">
                    <strong className="text-purple-200">Special Features:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {structureSuggestion.special_features?.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            <Button
              onClick={() => identifyIssuesMutation.mutate()}
              disabled={identifyIssuesMutation.isPending}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {identifyIssuesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
              Analyze Build Issues
            </Button>

            {buildIssues && (
              <div className="space-y-3">
                <Alert className="bg-red-600/10 border-red-500/30">
                  <AlertDescription className="text-red-300">
                    <strong className="text-red-200">High Priority Alerts:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {buildIssues.high_priority_alerts?.map((alert, idx) => (
                        <li key={idx}>{alert}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>

                <Alert className="bg-yellow-600/10 border-yellow-500/30">
                  <AlertDescription className="text-yellow-300">
                    <strong className="text-yellow-200">Potential Delays:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {buildIssues.potential_delays?.map((delay, idx) => (
                        <li key={idx}>{delay}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>

                <Alert className="bg-blue-600/10 border-blue-500/30">
                  <AlertDescription className="text-blue-300">
                    <strong className="text-blue-200">Recommended Actions:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {buildIssues.recommended_actions?.map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Select Website</label>
              <select
                className="w-full border rounded-md px-3 py-2 mb-3 bg-slate-700 text-white"
                value={selectedWebsite}
                onChange={(e) => setSelectedWebsite(e.target.value)}
              >
                <option value="">-- Select Website --</option>
                {websites.map(w => (
                  <option key={w.id} value={w.id}>{w.company_name} ({w.website_status})</option>
                ))}
              </select>
              <Button
                onClick={() => generateReportMutation.mutate(selectedWebsite)}
                disabled={!selectedWebsite || generateReportMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {generateReportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                Generate Progress Report
              </Button>
            </div>

            {progressReport && (
              <div className="p-4 bg-slate-700/30 rounded-lg">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap">{progressReport}</pre>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}