import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Loader2, Edit } from "lucide-react";
import { toast } from "sonner";

export default function AIWebsitePreview({ websiteIntake, customizedTemplate }) {
  const [selectedSection, setSelectedSection] = useState(null);
  const [revisionRequest, setRevisionRequest] = useState('');
  const queryClient = useQueryClient();

  const generateSectionMutation = useMutation({
    mutationFn: async (section) => {
      const prompt = `Generate detailed content for website section.

Section: ${section.name} - ${section.sections.join(', ')}
Business: ${websiteIntake.company_name}
Style: ${customizedTemplate.template.style}
Colors: ${customizedTemplate.customization.color_scheme.primary}, ${customizedTemplate.customization.color_scheme.secondary}

Generate:
1. Section HTML structure
2. Content for each part
3. Visual design details
4. Interactive elements

Return as JSON with content details.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            html_structure: { type: "string" },
            content: { type: "object" },
            design_notes: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
  });

  const requestRevisionMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Revise website section based on feedback.

Original Section: ${selectedSection.name}
Current Content: ${JSON.stringify(generateSectionMutation.data?.content)}

Revision Request: ${revisionRequest}

Generate improved version addressing the feedback.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            html_structure: { type: "string" },
            content: { type: "object" },
            design_notes: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      generateSectionMutation.reset();
      setTimeout(() => {
        generateSectionMutation.mutate(selectedSection);
      }, 100);
      setRevisionRequest('');
      toast.success('Section revised!');
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Preview & Customize Your Website</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pages">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="preview">Preview Section</TabsTrigger>
          </TabsList>

          <TabsContent value="pages" className="space-y-3">
            {customizedTemplate.customization.pages?.map((page) => (
              <Card key={page.name} className="bg-slate-700/30">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-white">{page.name}</h4>
                      <p className="text-xs text-slate-400">{page.sections.join(', ')}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedSection(page);
                        generateSectionMutation.mutate(page);
                      }}
                      disabled={generateSectionMutation.isPending}
                    >
                      {generateSectionMutation.isPending && selectedSection?.name === page.name ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {page.modules?.map((module, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {module}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="preview">
            {generateSectionMutation.data ? (
              <div className="space-y-4">
                <Card className="bg-slate-700/30">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-white mb-2">{selectedSection.name}</h4>
                    <div className="bg-white p-4 rounded text-slate-900 mb-3">
                      <pre className="whitespace-pre-wrap text-xs">
                        {generateSectionMutation.data.html_structure}
                      </pre>
                    </div>
                    <div className="space-y-2">
                      {generateSectionMutation.data.design_notes?.map((note, idx) => (
                        <p key={idx} className="text-sm text-slate-300">• {note}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-600/10 border-blue-500/30">
                  <CardContent className="pt-4">
                    <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Request Revision
                    </h5>
                    <Textarea
                      placeholder="What would you like to change? (e.g., Make it more professional, add testimonials section, change the tone...)"
                      value={revisionRequest}
                      onChange={(e) => setRevisionRequest(e.target.value)}
                      rows={3}
                      className="mb-2"
                    />
                    <Button
                      onClick={() => requestRevisionMutation.mutate()}
                      disabled={requestRevisionMutation.isPending || !revisionRequest}
                      className="w-full"
                      size="sm"
                    >
                      {requestRevisionMutation.isPending ? (
                        <><Loader2 className="w-3 h-3 animate-spin mr-2" /> Revising...</>
                      ) : (
                        'Apply Revision'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                <p>Select a page to generate and preview its sections</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}