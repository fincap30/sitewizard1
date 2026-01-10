import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, Shield, Zap, Eye, Search, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function WebsiteAudit({ websiteIntake }) {
  const [auditResults, setAuditResults] = useState(null);

  const runAuditMutation = useMutation({
    mutationFn: async () => {
      if (!websiteIntake?.live_url && websiteIntake?.website_status !== 'live') {
        throw new Error('Website must be live to run audit');
      }

      const prompt = `Perform comprehensive website audit.

Website: ${websiteIntake.company_name}
URL: ${websiteIntake.live_url || 'Not yet live'}
Industry: Based on company name
Goals: ${websiteIntake.business_goals?.join(', ')}

Conduct audit across four key areas:

1. SEO (Search Engine Optimization):
   - Meta tags presence and quality
   - Keyword optimization
   - Content structure (headings, etc)
   - Mobile-friendliness
   - Page speed impact on SEO

2. Performance:
   - Estimated page load time
   - Image optimization
   - Code efficiency
   - Caching recommendations

3. Accessibility:
   - Alt text for images
   - Color contrast
   - Keyboard navigation
   - Screen reader compatibility
   - ARIA labels

4. Security:
   - HTTPS implementation
   - Form security
   - Data protection
   - Cookie policies

For each area, provide:
- Score (0-100)
- Issues found (specific problems)
- Recommendations (actionable improvements)

Return as JSON with detailed results.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            seo: {
              type: "object",
              properties: {
                score: { type: "number" },
                issues: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } }
              }
            },
            performance: {
              type: "object",
              properties: {
                score: { type: "number" },
                issues: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } }
              }
            },
            accessibility: {
              type: "object",
              properties: {
                score: { type: "number" },
                issues: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } }
              }
            },
            security: {
              type: "object",
              properties: {
                score: { type: "number" },
                issues: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } }
              }
            },
            overall_score: { type: "number" }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setAuditResults(data);
      toast.success('Website audit complete!');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const renderAuditSection = (title, icon, data, color) => {
    const Icon = icon;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${color}`} />
            <h3 className="font-semibold text-white">{title}</h3>
          </div>
          <Badge className={getScoreBadge(data.score)}>{data.score}/100</Badge>
        </div>
        
        <Progress value={data.score} className="h-2" />

        {data.issues && data.issues.length > 0 && (
          <Alert className="bg-red-600/10 border-red-500/30">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <AlertDescription className="text-red-300">
              <strong className="text-red-200">Issues Found:</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-sm">
                {data.issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {data.recommendations && data.recommendations.length > 0 && (
          <Alert className="bg-blue-600/10 border-blue-500/30">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              <strong className="text-blue-200">Recommendations:</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-sm">
                {data.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const canRunAudit = websiteIntake?.website_status === 'live' || websiteIntake?.live_url;

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Website Audit
            </CardTitle>
            <CardDescription>
              Comprehensive analysis of SEO, performance, accessibility, and security
            </CardDescription>
          </div>
          <Button
            onClick={() => runAuditMutation.mutate()}
            disabled={!canRunAudit || runAuditMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {runAuditMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Run Audit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!canRunAudit ? (
          <Alert className="bg-yellow-600/10 border-yellow-500/30">
            <AlertDescription className="text-yellow-300">
              Website audit will be available once your website is live.
            </AlertDescription>
          </Alert>
        ) : !auditResults ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <p className="text-slate-300 mb-2">Ready to audit your website</p>
            <p className="text-sm text-slate-400">
              Click "Run Audit" to get a comprehensive analysis with actionable recommendations
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="text-center p-6 bg-slate-700/30 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Overall Score</p>
              <p className={`text-5xl font-bold ${getScoreColor(auditResults.overall_score)}`}>
                {auditResults.overall_score}
              </p>
              <p className="text-xs text-slate-500 mt-1">/100</p>
            </div>

            {/* SEO */}
            {renderAuditSection('SEO Optimization', Search, auditResults.seo, 'text-blue-400')}

            {/* Performance */}
            {renderAuditSection('Performance', Zap, auditResults.performance, 'text-yellow-400')}

            {/* Accessibility */}
            {renderAuditSection('Accessibility', Eye, auditResults.accessibility, 'text-green-400')}

            {/* Security */}
            {renderAuditSection('Security', Shield, auditResults.security, 'text-purple-400')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}