import React from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function SEOAuditReport({ websiteIntake }) {
  const [auditReport, setAuditReport] = React.useState(null);

  const generateAuditMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Generate comprehensive technical SEO audit report.

Website: ${websiteIntake.company_name}
URL: ${websiteIntake.live_url || websiteIntake.preview_url || 'Not live yet'}
Goals: ${websiteIntake.business_goals?.join(', ')}

Analyze and identify issues in:
1. Technical SEO (site speed, mobile, HTTPS, sitemap, robots.txt)
2. On-page SEO (titles, meta, headings, content quality)
3. Off-page SEO (backlinks, social signals)
4. User Experience (navigation, readability, CTAs)
5. Local SEO (if applicable)

For each issue provide:
- Severity (critical/high/medium/low)
- Description
- Impact on rankings
- Specific fix instructions
- Priority order (1-10)

Return as JSON with prioritized recommendations.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  severity: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" },
                  fix: { type: "string" },
                  priority: { type: "number" }
                }
              }
            },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setAuditReport(data);
      toast.success('Audit report generated!');
    },
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      default: return 'bg-blue-600';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
      case 'high': return <XCircle className="w-4 h-4" />;
      case 'medium': return <AlertTriangle className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              SEO Audit Report
            </CardTitle>
            <CardDescription>Identify and fix technical SEO issues</CardDescription>
          </div>
          <Button
            onClick={() => generateAuditMutation.mutate()}
            disabled={generateAuditMutation.isPending}
          >
            {generateAuditMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate Audit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {auditReport && (
          <div className="space-y-4">
            <Card className="bg-slate-700/30">
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-white mb-1">{auditReport.overall_score}/100</p>
                  <p className="text-sm text-slate-400">Overall SEO Score</p>
                </div>
              </CardContent>
            </Card>

            <div>
              <h4 className="font-semibold text-white mb-3">Issues Found (Prioritized)</h4>
              <div className="space-y-2">
                {auditReport.issues?.sort((a, b) => a.priority - b.priority).map((issue, idx) => (
                  <Card key={idx} className="bg-slate-700/30">
                    <CardContent className="pt-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(issue.severity)}>
                            {getSeverityIcon(issue.severity)}
                            <span className="ml-1">{issue.severity}</span>
                          </Badge>
                          <Badge variant="outline">{issue.category}</Badge>
                        </div>
                        <Badge className="bg-purple-600">Priority {issue.priority}</Badge>
                      </div>
                      <h5 className="font-semibold text-white mb-1">{issue.title}</h5>
                      <p className="text-sm text-slate-300 mb-2">{issue.description}</p>
                      <Alert className="bg-blue-600/10 border-blue-500/30">
                        <AlertDescription className="text-blue-300 text-xs">
                          <strong>Impact:</strong> {issue.impact}
                        </AlertDescription>
                      </Alert>
                      <Alert className="bg-green-600/10 border-green-500/30 mt-2">
                        <AlertDescription className="text-green-300 text-xs">
                          <strong>How to Fix:</strong> {issue.fix}
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Alert className="bg-purple-600/10 border-purple-500/30">
              <AlertDescription className="text-purple-300">
                <strong>Key Recommendations:</strong>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {auditReport.recommendations?.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
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