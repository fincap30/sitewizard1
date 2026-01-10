import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AIContentGenerator from "../components/editor/AIContentGenerator";
import AICustomizer from "../components/editor/AICustomizer";
import AIMarketingTools from "../components/marketing/AIMarketingTools";
import MediaLibrary from "../components/editor/MediaLibrary";
import VisualEditor from "../components/editor/VisualEditor";
import CustomCodeEditor from "../components/editor/CustomCodeEditor";
import CommentingSystem from "../components/collaboration/CommentingSystem";
import VersionHistory from "../components/editor/VersionHistory";
import AIFeedbackAnalyzer from "../components/collaboration/AIFeedbackAnalyzer";
import AIChatbot from "../components/shared/AIChatbot";

export default function WebsiteEditor() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: websiteIntake } = useQuery({
    queryKey: ['my-website', user?.email],
    queryFn: async () => {
      const intakes = await base44.entities.WebsiteIntake.filter({ client_email: user.email });
      return intakes.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    },
    enabled: !!user,
  });

  const updateWebsiteMutation = useMutation({
    mutationFn: async (newStructure) => {
      await base44.entities.WebsiteIntake.update(websiteIntake.id, {
        preview_url: JSON.stringify(newStructure)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-website'] });
    },
  });

  if (!user || !websiteIntake) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const websiteStructure = websiteIntake.preview_url ? JSON.parse(websiteIntake.preview_url) : null;

  return (
    <div className="min-h-screen bg-transparent py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6">
          <Button variant="outline" onClick={() => window.location.href = '/ClientDashboard'}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">{websiteIntake.company_name} - Website Editor</h1>
        <p className="text-slate-300 mb-8">Edit your website content, add images, and generate AI content</p>

        <Tabs defaultValue="editor" className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 lg:w-auto">
            <TabsTrigger value="editor">Visual Editor</TabsTrigger>
            <TabsTrigger value="ai-customize">AI Customize</TabsTrigger>
            <TabsTrigger value="ai-content">AI Content</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="code">Custom Code</TabsTrigger>
          </TabsList>

          <TabsContent value="editor">
            {websiteStructure ? (
              <VisualEditor
                websiteStructure={websiteStructure}
                onSave={(newStructure) => updateWebsiteMutation.mutate(newStructure)}
              />
            ) : (
              <div className="text-center py-12 text-slate-400">
                Website structure not available yet
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai-customize">
            <AICustomizer
              websiteIntake={websiteIntake}
              currentStructure={websiteStructure}
              onApplyChanges={(changes) => {
                // Handle applying AI suggestions
                toast.success(`Applied ${changes.type} changes!`);
              }}
            />
          </TabsContent>

          <TabsContent value="ai-content">
            <AIContentGenerator websiteIntake={websiteIntake} />
          </TabsContent>

          <TabsContent value="marketing">
            <AIMarketingTools websiteIntake={websiteIntake} />
          </TabsContent>

          <TabsContent value="media">
            <MediaLibrary
              websiteIntakeId={websiteIntake.id}
              clientEmail={user.email}
            />
          </TabsContent>

          <TabsContent value="feedback">
            <CommentingSystem
              websiteIntakeId={websiteIntake.id}
              userEmail={user.email}
              userName={user.full_name}
              pageReference="editor-view"
              sectionReference="general"
            />
          </TabsContent>

          <TabsContent value="versions">
            <VersionHistory
              websiteIntakeId={websiteIntake.id}
              currentStructure={websiteStructure}
              onRestore={(restoredStructure) => {
                setWebsiteStructure(restoredStructure);
              }}
            />
          </TabsContent>

          <TabsContent value="ai-analysis">
            <AIFeedbackAnalyzer websiteIntakeId={websiteIntake.id} />
          </TabsContent>

          <TabsContent value="code">
            <CustomCodeEditor
              websiteIntakeId={websiteIntake.id}
              currentCustomCode={websiteStructure?.custom_code}
            />
          </TabsContent>
        </Tabs>
      </div>

      <AIChatbot websiteIntake={websiteIntake} context="editor" />
    </div>
  );
}