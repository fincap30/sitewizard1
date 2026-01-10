import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Globe, Clock, CheckCircle, AlertCircle, CreditCard, TrendingUp, FileText, Zap } from "lucide-react";
import { toast } from "sonner";
import SubscriptionDetails from "../components/dashboard/SubscriptionDetails";
import WebsiteStatusCard from "../components/dashboard/WebsiteStatusCard";
import RevisionRequestForm from "../components/dashboard/RevisionRequestForm";
import RevisionRequestList from "../components/dashboard/RevisionRequestList";
import ClientAnalytics from "../components/dashboard/ClientAnalytics";
import ProjectMilestones from "../components/collaboration/ProjectMilestones";
import WebsiteAudit from "../components/dashboard/WebsiteAudit";
import ProjectInsights from "../components/dashboard/ProjectInsights";
import PredictiveAnalytics from "../components/analytics/PredictiveAnalytics";
import CollaborationHub from "../components/collaboration/CollaborationHub";
import AIChatbot from "../components/shared/AIChatbot";
import MarketingDashboard from "../components/marketing/MarketingDashboard";

export default function ClientDashboard() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  const { data: subscription, isLoading: loadingSub } = useQuery({
    queryKey: ['my-subscription', user?.email],
    queryFn: async () => {
      const subs = await base44.entities.ClientSubscription.filter({ client_email: user.email });
      return subs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    },
    enabled: !!user,
  });

  const { data: packageData } = useQuery({
    queryKey: ['package', subscription?.package_id],
    queryFn: () => base44.entities.Package.filter({ id: subscription.package_id }).then(p => p[0]),
    enabled: !!subscription?.package_id,
  });

  const { data: websiteIntake } = useQuery({
    queryKey: ['my-website', user?.email],
    queryFn: async () => {
      const intakes = await base44.entities.WebsiteIntake.filter({ client_email: user.email });
      return intakes.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    },
    enabled: !!user,
  });

  const { data: revisions = [] } = useQuery({
    queryKey: ['my-revisions', user?.email],
    queryFn: () => base44.entities.ModificationRequest.filter({ client_email: user.email }),
    enabled: !!user,
  });

  const { data: allPackages = [] } = useQuery({
    queryKey: ['all-packages'],
    queryFn: () => base44.entities.Package.list('display_order'),
  });

  const getTrialDaysRemaining = () => {
    if (!subscription?.trial_ends) return 0;
    const now = new Date();
    const trialEnd = new Date(subscription.trial_ends);
    const diffTime = trialEnd - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getStatusInfo = () => {
    if (!websiteIntake) return { icon: Clock, color: 'text-slate-400', text: 'Not Started', bgColor: 'bg-slate-100' };
    
    switch (websiteIntake.website_status) {
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', text: 'Intake Submitted', bgColor: 'bg-yellow-100' };
      case 'generating':
        return { icon: Zap, color: 'text-blue-600', text: 'AI Generating', bgColor: 'bg-blue-100' };
      case 'review':
        return { icon: FileText, color: 'text-purple-600', text: 'Awaiting Your Review', bgColor: 'bg-purple-100' };
      case 'approved':
        return { icon: TrendingUp, color: 'text-orange-600', text: 'Building Website', bgColor: 'bg-orange-100' };
      case 'live':
        return { icon: CheckCircle, color: 'text-green-600', text: 'Live', bgColor: 'bg-green-100' };
      default:
        return { icon: Clock, color: 'text-slate-400', text: 'Unknown', bgColor: 'bg-slate-100' };
    }
  };

  if (!user || loadingSub) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent px-4">
        <Card className="max-w-md border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>You don't have an active subscription yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/Pricing'} className="w-full">
              View Pricing Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const trialDays = getTrialDaysRemaining();
  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user.full_name || user.email}
          </h1>
          <p className="text-slate-300">Manage your website and subscription</p>
        </div>

        {/* Trial Alert */}
        {subscription.status === 'trial' && (
          <Alert className="mb-6 bg-blue-600/10 border-blue-500/30">
            <Clock className="w-4 h-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              <strong>{trialDays} days remaining</strong> in your free trial. 
              {trialDays < 3 && ' Your card will be charged after the trial ends unless you cancel.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Key Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{packageData?.name}</div>
              <p className="text-sm text-slate-400">${packageData?.price}/month</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Website Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
                <span className="text-lg font-semibold text-white">{statusInfo.text}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Revision Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{revisions.length}</div>
              <p className="text-sm text-slate-400">
                {revisions.filter(r => r.status === 'pending').length} pending
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={
                subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                subscription.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }>
                {subscription.status}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-9 lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="website">Website</TabsTrigger>
            <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="predictive">Forecasts</TabsTrigger>
            <TabsTrigger value="audit">Website Audit</TabsTrigger>
            <TabsTrigger value="revisions">Revisions</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <WebsiteStatusCard 
              websiteIntake={websiteIntake}
              subscription={subscription}
              packageData={packageData}
            />
            
            <div className="space-y-6">
              <ProjectInsights websiteIntakeId={websiteIntake?.id} />

              <ProjectMilestones websiteIntakeId={websiteIntake?.id} />

              <div className="grid lg:grid-cols-2 gap-6">
                <SubscriptionDetails 
                  subscription={subscription}
                  packageData={packageData}
                  allPackages={allPackages}
                />

                <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Recent Revisions</CardTitle>
                    <CardDescription>Your latest modification requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {revisions.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">No revision requests yet</p>
                    ) : (
                      <div className="space-y-3">
                        {revisions.slice(0, 3).map(rev => (
                          <div key={rev.id} className="flex items-start justify-between p-3 bg-slate-700/30 rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white capitalize">{rev.request_type?.replace(/_/g, ' ')}</p>
                              <p className="text-xs text-slate-400 mt-1">{new Date(rev.created_date).toLocaleDateString()}</p>
                            </div>
                            <Badge className={
                              rev.status === 'completed' ? 'bg-green-100 text-green-800' :
                              rev.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {rev.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Website Tab */}
          <TabsContent value="website">
            <WebsiteStatusCard 
              websiteIntake={websiteIntake}
              subscription={subscription}
              packageData={packageData}
              expanded
            />
          </TabsContent>

          {/* Collaboration Tab */}
          <TabsContent value="collaboration">
            <CollaborationHub 
              websiteIntakeId={websiteIntake?.id}
              userEmail={user.email}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            {websiteIntake?.website_status === 'live' ? (
              <ClientAnalytics websiteIntakeId={websiteIntake.id} />
            ) : (
              <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-300 mb-2">Analytics will be available once your website is live</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Marketing Tab */}
          <TabsContent value="marketing">
            {websiteIntake ? (
              <MarketingDashboard websiteIntakeId={websiteIntake.id} />
            ) : (
              <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-300 mb-2">Marketing tools will be available once your website is set up</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Predictive Analytics Tab */}
          <TabsContent value="predictive">
            <PredictiveAnalytics websiteIntakeId={websiteIntake?.id} />
          </TabsContent>

          {/* Website Audit Tab */}
          <TabsContent value="audit">
            <WebsiteAudit websiteIntake={websiteIntake} />
          </TabsContent>

          {/* Revisions Tab */}
          <TabsContent value="revisions" className="space-y-6">
            {websiteIntake?.website_status === 'live' && (
              <RevisionRequestForm 
                websiteIntake={websiteIntake}
                userEmail={user.email}
              />
            )}
            <RevisionRequestList revisions={revisions} />
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <SubscriptionDetails 
              subscription={subscription}
              packageData={packageData}
              allPackages={allPackages}
              expanded
            />
          </TabsContent>
        </Tabs>
      </div>

      <AIChatbot websiteIntake={websiteIntake} context="dashboard" />
    </div>
  );
}