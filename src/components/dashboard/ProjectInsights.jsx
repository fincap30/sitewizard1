import React, { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function ProjectInsights({ websiteIntakeId }) {
  const [insights, setInsights] = useState(null);

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones-insights', websiteIntakeId],
    queryFn: () => base44.entities.ProjectMilestone.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ['analytics-insights', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteAnalytics.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: websiteIntake } = useQuery({
    queryKey: ['website-insights', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteIntake.filter({ id: websiteIntakeId }).then(w => w[0]),
    enabled: !!websiteIntakeId,
  });

  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const completedMilestones = milestones.filter(m => m.status === 'completed');
      const pendingMilestones = milestones.filter(m => m.status === 'pending');
      const inProgressMilestones = milestones.filter(m => m.status === 'in_progress');

      const recentAnalytics = analytics.slice(-7); // Last 7 days
      const totalViews = recentAnalytics.reduce((sum, a) => sum + (a.page_views || 0), 0);
      const totalVisitors = recentAnalytics.reduce((sum, a) => sum + (a.unique_visitors || 0), 0);

      const prompt = `Analyze project progress and provide actionable insights.

Business: ${websiteIntake?.company_name}
Status: ${websiteIntake?.website_status}
Goals: ${websiteIntake?.business_goals?.join(', ')}

Milestones:
- Completed: ${completedMilestones.length}
- In Progress: ${inProgressMilestones.length}
- Pending: ${pendingMilestones.length}

Milestone Details:
${milestones.slice(0, 10).map(m => `${m.milestone_name}: ${m.status} ${m.completed_date ? `(${new Date(m.completed_date).toLocaleDateString()})` : ''}`).join('\n')}

Recent Performance (7 days):
- Page Views: ${totalViews}
- Visitors: ${totalVisitors}

Provide:
1. Project Progress Summary (overall assessment)
2. Performance Trends (what's improving, what's declining)
3. Potential Bottlenecks (tasks that may delay timeline)
4. Timeline Impact (estimated delays if any)
5. Recommended Next Steps (specific actions to take)
6. Optimization Suggestions (based on current performance and goals)

Return as JSON with actionable insights.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            progress_summary: { type: "string" },
            performance_trends: { type: "array", items: { type: "string" } },
            potential_bottlenecks: { type: "array", items: { type: "string" } },
            timeline_impact: { type: "string" },
            next_steps: { type: "array", items: { type: "string" } },
            optimization_suggestions: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setInsights(data);
      toast.success('Project insights generated!');
    },
  });

  if (!websiteIntakeId) {
    return null;
  }

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              AI Project Insights
            </CardTitle>
            <CardDescription>Progress analysis and recommendations</CardDescription>
          </div>
          <Button
            onClick={() => generateInsightsMutation.mutate()}
            disabled={generateInsightsMutation.isPending}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {generateInsightsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate Insights
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!insights ? (
          <div className="text-center py-8">
            <p className="text-slate-400">Click "Generate Insights" to analyze your project progress</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-blue-600/10 border-blue-500/30">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <strong className="text-blue-200">Project Progress:</strong>
                <p className="mt-1">{insights.progress_summary}</p>
              </AlertDescription>
            </Alert>

            <Alert className="bg-green-600/10 border-green-500/30">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <AlertDescription className="text-green-300">
                <strong className="text-green-200">Performance Trends:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {insights.performance_trends?.map((trend, idx) => (
                    <li key={idx}>{trend}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            {insights.potential_bottlenecks && insights.potential_bottlenecks.length > 0 && (
              <Alert className="bg-yellow-600/10 border-yellow-500/30">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <AlertDescription className="text-yellow-300">
                  <strong className="text-yellow-200">Potential Bottlenecks:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {insights.potential_bottlenecks.map((bottleneck, idx) => (
                      <li key={idx}>{bottleneck}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {insights.timeline_impact && (
              <Alert className="bg-orange-600/10 border-orange-500/30">
                <Clock className="w-4 h-4 text-orange-400" />
                <AlertDescription className="text-orange-300">
                  <strong className="text-orange-200">Timeline Impact:</strong>
                  <p className="mt-1">{insights.timeline_impact}</p>
                </AlertDescription>
              </Alert>
            )}

            <Alert className="bg-purple-600/10 border-purple-500/30">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <AlertDescription className="text-purple-300">
                <strong className="text-purple-200">Recommended Next Steps:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {insights.next_steps?.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-indigo-600/10 border-indigo-500/30">
              <AlertDescription className="text-indigo-300">
                <strong className="text-indigo-200">Optimization Suggestions:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {insights.optimization_suggestions?.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}