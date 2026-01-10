import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, MessageSquare, CheckSquare, Users } from "lucide-react";
import { toast } from "sonner";
import AITaskManager from "./AITaskManager";
import FeedbackSummary from "./FeedbackSummary";
import CommunicationCenter from "./CommunicationCenter";

export default function CollaborationHub({ websiteIntakeId, userEmail }) {
  const { data: websiteIntake } = useQuery({
    queryKey: ['website-collab', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteIntake.filter({ id: websiteIntakeId }).then(w => w[0]),
    enabled: !!websiteIntakeId,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['all-comments', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteComment.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['collab-tasks', websiteIntakeId],
    queryFn: () => base44.entities.CollaborationTask.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const generateProjectSummaryMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Generate comprehensive project status summary.

Project: ${websiteIntake?.company_name}
Status: ${websiteIntake?.website_status}
Total Comments: ${comments.length}
Open Comments: ${comments.filter(c => c.status === 'open').length}
Total Tasks: ${tasks.length}
Completed Tasks: ${tasks.filter(t => t.status === 'completed').length}

Recent Comments:
${comments.slice(0, 10).map(c => `- ${c.comment_text}`).join('\n')}

Provide executive summary including:
1. Overall project health
2. Key accomplishments
3. Current blockers
4. Client sentiment analysis
5. Next milestones
6. Recommendations

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            project_health: { type: "string" },
            accomplishments: { type: "array", items: { type: "string" } },
            blockers: { type: "array", items: { type: "string" } },
            client_sentiment: { type: "string" },
            next_milestones: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Collaboration Hub
            </CardTitle>
            <CardDescription>Manage tasks, feedback, and team communication</CardDescription>
          </div>
          <Button
            onClick={() => generateProjectSummaryMutation.mutate()}
            disabled={generateProjectSummaryMutation.isPending}
            size="sm"
          >
            {generateProjectSummaryMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
            AI Summary
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {generateProjectSummaryMutation.data && (
          <div className="space-y-3 mb-4">
            <Alert className={`border ${
              generateProjectSummaryMutation.data.project_health === 'Excellent' ? 'bg-green-600/10 border-green-500/30' :
              generateProjectSummaryMutation.data.project_health === 'Good' ? 'bg-blue-600/10 border-blue-500/30' :
              'bg-yellow-600/10 border-yellow-500/30'
            }`}>
              <AlertDescription className={
                generateProjectSummaryMutation.data.project_health === 'Excellent' ? 'text-green-300' :
                generateProjectSummaryMutation.data.project_health === 'Good' ? 'text-blue-300' :
                'text-yellow-300'
              }>
                <strong>Project Health:</strong> {generateProjectSummaryMutation.data.project_health}
                <p className="text-xs mt-1">Client Sentiment: {generateProjectSummaryMutation.data.client_sentiment}</p>
              </AlertDescription>
            </Alert>

            <Alert className="bg-green-600/10 border-green-500/30">
              <AlertDescription className="text-green-300 text-sm">
                <strong>Recent Accomplishments:</strong>
                <ul className="list-disc list-inside mt-1">
                  {generateProjectSummaryMutation.data.accomplishments?.map((acc, idx) => (
                    <li key={idx}>{acc}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            {generateProjectSummaryMutation.data.blockers?.length > 0 && (
              <Alert className="bg-red-600/10 border-red-500/30">
                <AlertDescription className="text-red-300 text-sm">
                  <strong>Current Blockers:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {generateProjectSummaryMutation.data.blockers.map((blocker, idx) => (
                      <li key={idx}>{blocker}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Tabs defaultValue="tasks">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks">
              <CheckSquare className="w-4 h-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="feedback">
              <MessageSquare className="w-4 h-4 mr-2" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="communication">
              <Users className="w-4 h-4 mr-2" />
              Communication
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <AITaskManager websiteIntakeId={websiteIntakeId} />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackSummary websiteIntakeId={websiteIntakeId} />
          </TabsContent>

          <TabsContent value="communication">
            <CommunicationCenter websiteIntakeId={websiteIntakeId} userEmail={userEmail} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}