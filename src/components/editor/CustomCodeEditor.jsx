import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Code, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function CustomCodeEditor({ websiteIntakeId, currentCustomCode }) {
  const [customCSS, setCustomCSS] = useState(currentCustomCode?.css || '');
  const [customJS, setCustomJS] = useState(currentCustomCode?.js || '');
  const queryClient = useQueryClient();

  const saveCustomCodeMutation = useMutation({
    mutationFn: async () => {
      const intakes = await base44.entities.WebsiteIntake.filter({ id: websiteIntakeId });
      const intake = intakes[0];
      
      const structure = intake.preview_url ? JSON.parse(intake.preview_url) : {};
      structure.custom_code = {
        css: customCSS,
        js: customJS
      };

      await base44.entities.WebsiteIntake.update(websiteIntakeId, {
        preview_url: JSON.stringify(structure)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-website'] });
      toast.success('Custom code saved!');
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5 text-green-400" />
          Custom Code Editor
        </CardTitle>
        <CardDescription>Add custom CSS and JavaScript to personalize your website</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 bg-yellow-600/10 border-yellow-500/30">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <AlertDescription className="text-yellow-300">
            Advanced feature: Only use if you're familiar with CSS/JavaScript. Incorrect code may affect your website.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="css">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="css">Custom CSS</TabsTrigger>
            <TabsTrigger value="js">Custom JavaScript</TabsTrigger>
          </TabsList>

          <TabsContent value="css" className="space-y-3">
            <div>
              <p className="text-sm text-slate-400 mb-2">
                Add custom CSS to style your website. Example:
              </p>
              <pre className="text-xs bg-slate-900 p-3 rounded text-slate-300 mb-3">
{`.my-custom-class {
  color: #your-color;
  font-size: 18px;
}`}
              </pre>
              <Textarea
                value={customCSS}
                onChange={(e) => setCustomCSS(e.target.value)}
                placeholder="/* Add your custom CSS here */"
                rows={15}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>

          <TabsContent value="js" className="space-y-3">
            <div>
              <p className="text-sm text-slate-400 mb-2">
                Add custom JavaScript. Example:
              </p>
              <pre className="text-xs bg-slate-900 p-3 rounded text-slate-300 mb-3">
{`// Add custom behavior
document.addEventListener('DOMContentLoaded', function() {
  console.log('Custom JS loaded');
});`}
              </pre>
              <Textarea
                value={customJS}
                onChange={(e) => setCustomJS(e.target.value)}
                placeholder="// Add your custom JavaScript here"
                rows={15}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>
        </Tabs>

        <Button
          onClick={() => saveCustomCodeMutation.mutate()}
          disabled={saveCustomCodeMutation.isPending}
          className="w-full mt-4 bg-green-600 hover:bg-green-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveCustomCodeMutation.isPending ? 'Saving...' : 'Save Custom Code'}
        </Button>
      </CardContent>
    </Card>
  );
}