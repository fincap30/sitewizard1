import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function ContentOptimizer({ targetKeywords }) {
  const [content, setContent] = useState('');
  const [suggestions, setSuggestions] = useState(null);

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Analyze content and provide SEO optimization suggestions.

Target Keywords: ${targetKeywords || 'Not specified'}

Content to analyze:
${content}

Provide:
1. Keyword density analysis
2. Missing keywords to add
3. Readability score (0-100)
4. Structural improvements (headings, paragraphs)
5. Meta description suggestions
6. Internal linking opportunities
7. Content length recommendations
8. Specific line-by-line suggestions

Return as JSON with actionable, specific feedback.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            keyword_density: { type: "number" },
            missing_keywords: { type: "array", items: { type: "string" } },
            readability_score: { type: "number" },
            structure_improvements: { type: "array", items: { type: "string" } },
            meta_suggestions: { type: "string" },
            linking_opportunities: { type: "array", items: { type: "string" } },
            length_recommendation: { type: "string" },
            specific_edits: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setSuggestions(data);
      toast.success('Content analyzed!');
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Content Optimizer
        </CardTitle>
        <CardDescription>Real-time SEO optimization suggestions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Paste your content here for optimization..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
        />
        <Button
          onClick={() => optimizeMutation.mutate()}
          disabled={optimizeMutation.isPending || !content}
          className="w-full"
        >
          {optimizeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Analyze & Optimize
        </Button>

        {suggestions && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-slate-700/30">
                <CardContent className="pt-4">
                  <p className="text-2xl font-bold text-white">{suggestions.keyword_density}%</p>
                  <p className="text-xs text-slate-400">Keyword Density</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-700/30">
                <CardContent className="pt-4">
                  <p className="text-2xl font-bold text-white">{suggestions.readability_score}/100</p>
                  <p className="text-xs text-slate-400">Readability</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-700/30">
                <CardContent className="pt-4">
                  <p className="text-2xl font-bold text-white">{content.split(' ').length}</p>
                  <p className="text-xs text-slate-400">Word Count</p>
                </CardContent>
              </Card>
            </div>

            <Alert className="bg-yellow-600/10 border-yellow-500/30">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <AlertDescription className="text-yellow-300">
                <strong>Missing Keywords:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {suggestions.missing_keywords?.map((kw, idx) => (
                    <Badge key={idx} variant="outline">{kw}</Badge>
                  ))}
                </div>
              </AlertDescription>
            </Alert>

            <Alert className="bg-blue-600/10 border-blue-500/30">
              <AlertDescription className="text-blue-300">
                <strong>Structure Improvements:</strong>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {suggestions.structure_improvements?.map((imp, idx) => (
                    <li key={idx}>{imp}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-green-600/10 border-green-500/30">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <AlertDescription className="text-green-300">
                <strong>Specific Edits:</strong>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {suggestions.specific_edits?.map((edit, idx) => (
                    <li key={idx}>{edit}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-purple-600/10 border-purple-500/30">
              <AlertDescription className="text-purple-300">
                <strong>Length Recommendation:</strong>
                <p className="mt-1 text-sm">{suggestions.length_recommendation}</p>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}