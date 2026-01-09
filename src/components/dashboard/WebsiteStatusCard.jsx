import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Clock, Sparkles, Eye, ExternalLink, Loader2 } from "lucide-react";

export default function WebsiteStatusCard({ websiteIntake, subscription, packageData, expanded = false }) {
  const getStatusConfig = () => {
    if (!websiteIntake) {
      return {
        color: 'bg-slate-100 text-slate-800',
        icon: Clock,
        title: 'Not Started',
        description: 'Start by completing the website intake form',
        action: { label: 'Start Intake Form', href: '/WebsiteIntakeForm' }
      };
    }

    switch (websiteIntake.website_status) {
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
          title: 'Intake Submitted',
          description: 'Our AI is analyzing your information',
          action: null
        };
      case 'generating':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: Sparkles,
          title: 'AI Generating',
          description: 'Creating your website structure and design',
          action: null
        };
      case 'review':
        return {
          color: 'bg-purple-100 text-purple-800',
          icon: Eye,
          title: 'Ready for Review',
          description: 'Your website preview is ready. Please review and approve.',
          action: { label: 'Review Website', href: `/WebsiteIntakeForm?intake=${websiteIntake.id}` }
        };
      case 'approved':
        return {
          color: 'bg-orange-100 text-orange-800',
          icon: Loader2,
          title: 'Building',
          description: 'Our team is building your website. Estimated completion: 30 days',
          action: null
        };
      case 'live':
        return {
          color: 'bg-green-100 text-green-800',
          icon: Globe,
          title: 'Live',
          description: 'Your website is live and accessible',
          action: websiteIntake.live_url ? { 
            label: 'View Website', 
            href: websiteIntake.live_url,
            external: true 
          } : null
        };
      default:
        return {
          color: 'bg-slate-100 text-slate-800',
          icon: Clock,
          title: 'Unknown Status',
          description: 'Contact support for assistance',
          action: null
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" />
          Website Status
        </CardTitle>
        <CardDescription>Track your website's progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${statusConfig.color.replace('text-', 'bg-').replace('800', '200')}`}>
            <StatusIcon className={`w-6 h-6 ${statusConfig.color} ${websiteIntake?.website_status === 'approved' ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex-1">
            <Badge className={statusConfig.color}>{statusConfig.title}</Badge>
            <p className="text-sm text-slate-300 mt-1">{statusConfig.description}</p>
          </div>
        </div>

        {websiteIntake && expanded && (
          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-700">
            <div>
              <span className="text-sm text-slate-400">Company</span>
              <p className="text-white font-medium">{websiteIntake.company_name}</p>
            </div>
            <div>
              <span className="text-sm text-slate-400">Style</span>
              <p className="text-white font-medium capitalize">{websiteIntake.style_preference}</p>
            </div>
            <div>
              <span className="text-sm text-slate-400">Goals</span>
              <p className="text-white font-medium">
                {websiteIntake.business_goals?.length || 0} selected
              </p>
            </div>
            <div>
              <span className="text-sm text-slate-400">Pages Limit</span>
              <p className="text-white font-medium">{packageData?.pages_limit || 'N/A'} pages</p>
            </div>
          </div>
        )}

        {statusConfig.action && (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              if (statusConfig.action.external) {
                window.open(statusConfig.action.href, '_blank');
              } else {
                window.location.href = statusConfig.action.href;
              }
            }}
          >
            {statusConfig.action.label}
            {statusConfig.action.external && <ExternalLink className="w-4 h-4 ml-2" />}
          </Button>
        )}

        {websiteIntake?.website_status === 'approved' && (
          <Alert className="bg-blue-600/10 border-blue-500/30">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <AlertDescription className="text-blue-300">
              Building in progress. We'll notify you when your website is ready!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}