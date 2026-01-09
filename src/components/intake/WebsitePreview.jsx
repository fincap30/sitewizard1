import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, FileText, Palette, Sparkles, ThumbsUp, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function WebsitePreview({ intakeId }) {
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [feedback, setFeedback] = useState('');
  const queryClient = useQueryClient();

  const { data: intake, isLoading } = useQuery({
    queryKey: ['intake', intakeId],
    queryFn: () => base44.entities.WebsiteIntake.filter({ id: intakeId }).then(i => i[0]),
    enabled: !!intakeId,
  });

  const approveMutation = useMutation({
    mutationFn: () => base44.entities.WebsiteIntake.update(intakeId, {
      website_status: 'approved',
      confirmed: true
    }),
    onSuccess: () => {
      toast.success('Website approved! Our team will start building it.');
      setTimeout(() => window.location.href = '/ClientDashboard', 2000);
    },
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ModificationRequest.create({
        project_id: intakeId,
        client_email: intake.client_email,
        request_type: 'design_change',
        description: `Initial feedback on generated website:\n${feedback}`,
        priority: 'high',
        status: 'pending'
      });
    },
    onSuccess: () => {
      toast.success('Feedback submitted! We\'ll revise the design.');
      setFeedbackMode(false);
      setFeedback('');
      queryClient.invalidateQueries({ queryKey: ['intake'] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  const websiteData = intake?.preview_url ? JSON.parse(intake.preview_url) : null;

  if (!websiteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-300">Website structure not available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <Badge className="bg-green-600/20 text-green-400 border-green-500/30 mb-4">
            <CheckCircle className="w-4 h-4 mr-1" />
            Website Generated
          </Badge>
          <h1 className="text-4xl font-bold text-white mb-2">Your Website Preview</h1>
          <p className="text-slate-300">Review your AI-generated website structure</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Color Scheme */}
          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-400" />
                Color Scheme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(websiteData.color_scheme || {}).map(([name, color]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-slate-300 capitalize">{name}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-md border-2 border-slate-600"
                      style={{ backgroundColor: color }}
                    />
                    <code className="text-xs text-slate-400">{color}</code>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Key Features */}
          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Key Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {websiteData.key_features?.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pages Structure */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            Website Pages
          </h2>
          {websiteData.pages?.map((page, idx) => (
            <Card key={idx} className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">{page.title}</CardTitle>
                <CardDescription>{page.sections?.length || 0} sections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {page.sections?.map((section, sIdx) => (
                  <div key={sIdx} className="border-l-2 border-blue-500 pl-4">
                    <h4 className="font-semibold text-white mb-1">{section.heading}</h4>
                    <p className="text-sm text-slate-400">{section.content_outline}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        {!feedbackMode ? (
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 text-lg py-6"
            >
              <ThumbsUp className="w-5 h-5 mr-2" />
              {approveMutation.isPending ? 'Approving...' : 'Approve & Build This Website'}
            </Button>
            <Button
              onClick={() => setFeedbackMode(true)}
              variant="outline"
              className="flex-1 text-lg py-6 border-slate-600 hover:border-blue-500"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Request Changes
            </Button>
          </div>
        ) : (
          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>What would you like to change?</CardTitle>
              <CardDescription>Describe any modifications you'd like to see</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="I'd like to change the colors, add more pages, modify the content structure, etc..."
                rows={6}
              />
              <div className="flex gap-3">
                <Button
                  onClick={() => submitFeedbackMutation.mutate()}
                  disabled={!feedback.trim() || submitFeedbackMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                </Button>
                <Button
                  onClick={() => {
                    setFeedbackMode(false);
                    setFeedback('');
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Alert className="mt-6 bg-blue-600/10 border-blue-500/30">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <AlertDescription className="text-blue-300">
            Once approved, our team will build your website within 30 days. You can track progress in your dashboard.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}