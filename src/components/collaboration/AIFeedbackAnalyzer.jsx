import React, { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, MessageSquare, FileText } from "lucide-react";
import { toast } from "sonner";

export default function AIFeedbackAnalyzer({ websiteIntakeId }) {
  const [analysis, setAnalysis] = useState(null);
  const [reportGenerated, setReportGenerated] = useState(false);

  const { data: comments = [] } = useQuery({
    queryKey: ['all-comments', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteComment.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: websiteIntake } = useQuery({
    queryKey: ['website-for-feedback', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteIntake.filter({ id: websiteIntakeId }).then(w => w[0]),
    enabled: !!websiteIntakeId,
  });

  const { data: revisions = [] } = useQuery({
    queryKey: ['revisions-feedback', websiteIntakeId],
    queryFn: () => base44.entities.ModificationRequest.filter({ project_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const analyzeFeedbackMutation = useMutation({
    mutationFn: async () => {
      const openComments = comments.filter(c => c.status === 'open');
      const changeRequests = comments.filter(c => c.comment_type === 'change_request');

      const prompt = `Analyze client feedback and suggest website revisions.

Website: ${websiteIntake?.company_name}
Status: ${websiteIntake?.website_status}

All Comments: ${comments.length}
Open Comments: ${openComments.length}
Change Requests: ${changeRequests.length}

Recent Feedback:
${comments.slice(0, 10).map(c => `
Type: ${c.comment_type}
Page: ${c.page_reference}
Section: ${c.section_reference}
Comment: ${c.comment_text}
`).join('\n---\n')}

Analyze the feedback and provide:
1. Common themes and patterns
2. Priority revisions to make
3. Specific content changes suggested
4. Design/layout modifications needed
5. Overall satisfaction assessment
6. Actionable next steps

Return as JSON with structured recommendations.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            common_themes: { type: "array", items: { type: "string" } },
            priority_revisions: { type: "array", items: { type: "string" } },
            content_changes: { type: "array", items: { type: "string" } },
            design_modifications: { type: "array", items: { type: "string" } },
            satisfaction_score: { type: "string" },
            next_steps: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      toast.success('Feedback analysis complete!');
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Generate structured project team report from client feedback.

Comments:
${comments.slice(0, 20).map(c => `
- ${c.comment_type}: ${c.comment_text}
  Section: ${c.section_reference}
  Status: ${c.status}
  ${c.admin_response ? `Response: ${c.admin_response}` : ''}
`).join('\n')}

Revision Requests:
${revisions.slice(0, 20).map(r => `
- ${r.request_type}: ${r.description}
  Priority: ${r.priority}
  Status: ${r.status}
`).join('\n')}

Generate comprehensive team report including:
1. Executive Summary
2. Common Themes/Patterns
3. Priority Issues
4. Action Items by Department
5. Timeline Recommendations
6. Resource Requirements

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            common_themes: { type: "array", items: { type: "string" } },
            priority_issues: { type: "array", items: { type: "string" } },
            action_items: {
              type: "object",
              properties: {
                development: { type: "array", items: { type: "string" } },
                design: { type: "array", items: { type: "string" } },
                content: { type: "array", items: { type: "string" } }
              }
            },
            timeline_recommendations: { type: "string" },
            resource_requirements: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setReportGenerated(true);
      setAnalysis(data);
      toast.success('Team report generated!');
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
            <MessageSquare className="w-5 h-5 text-blue-400" />
            AI Feedback Analysis
          </CardTitle>
          <CardDescription>Analyze client comments and suggest improvements</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => analyzeFeedbackMutation.mutate()}
            disabled={analyzeFeedbackMutation.isPending || comments.length === 0}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {analyzeFeedbackMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Analyze Feedback
          </Button>
          <Button
            onClick={() => generateReportMutation.mutate()}
            disabled={generateReportMutation.isPending || (comments.length === 0 && revisions.length === 0)}
            size="sm"
            variant="outline"
          >
            {generateReportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
            Generate Team Report
          </Button>
        </div>
        </div>
      </CardHeader>
      <CardContent>
        {comments.length === 0 ? (
          <p className="text-center text-slate-400 py-4">No feedback to analyze yet</p>
        ) : analysis ? (
          <div className="space-y-3">
            <Alert className="bg-blue-600/10 border-blue-500/30">
              <AlertDescription className="text-blue-300">
                <strong className="text-blue-200">Common Themes:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {analysis.common_themes?.map((theme, idx) => (
                    <li key={idx}>{theme}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-red-600/10 border-red-500/30">
              <AlertDescription className="text-red-300">
                <strong className="text-red-200">Priority Revisions:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {analysis.priority_revisions?.map((revision, idx) => (
                    <li key={idx}>{revision}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-purple-600/10 border-purple-500/30">
              <AlertDescription className="text-purple-300">
                <strong className="text-purple-200">Content Changes:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {analysis.content_changes?.map((change, idx) => (
                    <li key={idx}>{change}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-green-600/10 border-green-500/30">
              <AlertDescription className="text-green-300">
                <strong className="text-green-200">Satisfaction: {analysis.satisfaction_score}</strong>
                <div className="mt-2">
                  <strong>Next Steps:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {analysis.next_steps?.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <p className="text-center text-slate-400 py-4">{comments.length} comments available for analysis</p>
        )}

        {reportGenerated && analysis.executive_summary && (
          <div className="space-y-3 mt-6 pt-6 border-t border-slate-700">
            <h4 className="font-semibold text-white">Project Team Report</h4>
            
            <Alert className="bg-blue-600/10 border-blue-500/30">
              <AlertDescription className="text-blue-300">
                <strong>Executive Summary:</strong>
                <p className="mt-1 text-sm">{analysis.executive_summary}</p>
              </AlertDescription>
            </Alert>

            <Alert className="bg-purple-600/10 border-purple-500/30">
              <AlertDescription className="text-purple-300">
                <strong>Action Items - Development:</strong>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {analysis.action_items?.development?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-green-600/10 border-green-500/30">
              <AlertDescription className="text-green-300">
                <strong>Action Items - Design:</strong>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {analysis.action_items?.design?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-yellow-600/10 border-yellow-500/30">
              <AlertDescription className="text-yellow-300">
                <strong>Timeline:</strong>
                <p className="mt-1 text-sm">{analysis.timeline_recommendations}</p>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}