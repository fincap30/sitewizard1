import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, FileText, TrendingUp, Zap, MessageSquare, Globe, Search } from "lucide-react";
import AdminRevisionManager from "../components/admin/AdminRevisionManager";
import AdminWebsiteManager from "../components/admin/AdminWebsiteManager";
import AdminAnalyticsDashboard from "../components/admin/AdminAnalyticsDashboard";
import AdminSEOTools from "../components/admin/AdminSEOTools";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user.role !== 'admin') {
        window.location.href = '/';
      }
      setUser(user);
    }).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ['all-projects'],
    queryFn: () => base44.entities.Project.list('-created_date'),
    enabled: !!user,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['all-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date'),
    enabled: !!user,
  });

  const { data: modifications = [] } = useQuery({
    queryKey: ['all-modifications'],
    queryFn: () => base44.entities.ModificationRequest.list('-created_date'),
    enabled: !!user,
  });

  const { data: websites = [] } = useQuery({
    queryKey: ['all-websites'],
    queryFn: () => base44.entities.WebsiteIntake.list('-created_date'),
    enabled: !!user,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['all-subscriptions'],
    queryFn: () => base44.entities.ClientSubscription.list('-created_date'),
    enabled: !!user,
  });

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'in_progress').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    totalLeads: leads.length,
    facebookLeads: leads.filter(l => l.source === 'facebook').length,
    conversionRate: leads.length > 0 ? ((projects.length / leads.length) * 100).toFixed(1) : 0,
    pendingRevisions: modifications.filter(m => m.status === 'pending').length,
    activeWebsites: websites.filter(w => w.website_status === 'live').length,
    activeSubscriptions: subscriptions.filter(s => s.status === 'active' || s.status === 'trial').length
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-300">Manage projects, leads, websites, and client requests</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-white">{stats.activeSubscriptions}</div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Live Websites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-white">{stats.activeWebsites}</div>
                <Globe className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Pending Revisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-white">{stats.pendingRevisions}</div>
                <MessageSquare className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-white">{stats.totalProjects}</div>
                <FileText className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="websites" className="space-y-4">
          <TabsList>
            <TabsTrigger value="websites">Websites ({websites.length})</TabsTrigger>
            <TabsTrigger value="revisions">Revisions ({modifications.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="seo">SEO Tools</TabsTrigger>
            <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
            <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="websites">
            <AdminWebsiteManager websites={websites} />
          </TabsContent>

          <TabsContent value="revisions">
            <AdminRevisionManager revisions={modifications} />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="seo">
            <AdminSEOTools />
          </TabsContent>

          <TabsContent value="projects">
            <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>All Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-400">
                  Project management interface - showing {projects.length} projects
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads">
            <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>All Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-400">
                  Lead management interface - showing {leads.length} leads
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}