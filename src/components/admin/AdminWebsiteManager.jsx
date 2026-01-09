import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Globe, Clock, Sparkles, Eye, Rocket, CheckCircle, Settings } from "lucide-react";
import { toast } from "sonner";
import BuildTaskManager from "./BuildTaskManager";

export default function AdminWebsiteManager({ websites }) {
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [showTasks, setShowTasks] = useState(null);
  const [liveUrl, setLiveUrl] = useState('');
  const queryClient = useQueryClient();

  const markLiveMutation = useMutation({
    mutationFn: async ({ intake_id, live_url }) => {
      await base44.functions.invoke('markWebsiteLive', { intake_id, live_url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-websites'] });
      setSelectedWebsite(null);
      setLiveUrl('');
      toast.success('Website marked as live and client notified!');
    },
  });

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' };
      case 'generating':
        return { color: 'bg-blue-100 text-blue-800', icon: Sparkles, label: 'Generating' };
      case 'review':
        return { color: 'bg-purple-100 text-purple-800', icon: Eye, label: 'Review' };
      case 'approved':
        return { color: 'bg-orange-100 text-orange-800', icon: Rocket, label: 'Approved - Build' };
      case 'live':
        return { color: 'bg-green-100 text-green-800', icon: Globe, label: 'Live' };
      default:
        return { color: 'bg-slate-100 text-slate-800', icon: Clock, label: status };
    }
  };

  const sortedWebsites = [...websites].sort((a, b) => {
    const statusOrder = { approved: 0, review: 1, generating: 2, pending: 3, live: 4 };
    return (statusOrder[a.website_status] || 99) - (statusOrder[b.website_status] || 99);
  });

  return (
    <>
      <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            Website Build Management
          </CardTitle>
          <CardDescription>Monitor and manage all client websites</CardDescription>
        </CardHeader>
        <CardContent>
          {websites.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No websites yet
            </div>
          ) : (
            <div className="space-y-3">
              {sortedWebsites.map(website => {
                const statusConfig = getStatusConfig(website.website_status);
                const StatusIcon = statusConfig.icon;

                return (
                  <Card key={website.id} className="border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <StatusIcon className={`w-5 h-5 ${statusConfig.color.includes('text-') ? statusConfig.color.split(' ')[1] : 'text-slate-400'}`} />
                            <h3 className="text-lg font-semibold text-white">{website.company_name}</h3>
                            <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                          </div>
                          <div className="grid md:grid-cols-2 gap-2 text-sm">
                            <p className="text-slate-400">
                              <strong className="text-slate-300">Client:</strong> {website.client_email}
                            </p>
                            <p className="text-slate-400">
                              <strong className="text-slate-300">Style:</strong> {website.style_preference}
                            </p>
                            <p className="text-slate-400">
                              <strong className="text-slate-300">Goals:</strong> {website.business_goals?.length || 0} selected
                            </p>
                            <p className="text-slate-400">
                              <strong className="text-slate-300">Submitted:</strong> {new Date(website.created_date).toLocaleDateString()}
                            </p>
                          </div>
                          {website.live_url && (
                            <a 
                              href={website.live_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-flex items-center gap-1"
                            >
                              <Globe className="w-3 h-3" />
                              {website.live_url}
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {(website.website_status === 'approved' || website.website_status === 'live') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowTasks(website)}
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              Tasks
                            </Button>
                          )}
                          {website.website_status === 'approved' && !website.live_url && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedWebsite(website)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Live
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mark Live Dialog */}
      <Dialog open={!!selectedWebsite} onOpenChange={() => setSelectedWebsite(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Website as Live</DialogTitle>
          </DialogHeader>
          
          {selectedWebsite && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm font-medium mb-1">Company</p>
                <p className="text-lg font-semibold">{selectedWebsite.company_name}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Client</p>
                <p>{selectedWebsite.client_email}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Live Website URL *</p>
                <Input
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="https://client-website.com"
                  type="url"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedWebsite(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!liveUrl) {
                  toast.error('Please enter the live URL');
                  return;
                }
                markLiveMutation.mutate({
                  intake_id: selectedWebsite.id,
                  live_url: liveUrl
                });
              }}
              disabled={markLiveMutation.isPending}
            >
              {markLiveMutation.isPending ? 'Updating...' : 'Mark Live & Notify Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Build Tasks Dialog */}
      <Dialog open={!!showTasks} onOpenChange={() => setShowTasks(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{showTasks?.company_name} - Build Tasks</DialogTitle>
          </DialogHeader>
          {showTasks && <BuildTaskManager websiteIntakeId={showTasks.id} />}
        </DialogContent>
      </Dialog>
    </>
  );
}