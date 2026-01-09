import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CreditCard, Calendar, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function SubscriptionDetails({ subscription, packageData, allPackages, expanded = false }) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const queryClient = useQueryClient();

  const upgradeMutation = useMutation({
    mutationFn: async (newPackageId) => {
      await base44.entities.ClientSubscription.update(subscription.id, {
        package_id: newPackageId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['package'] });
      setShowUpgradeDialog(false);
      toast.success('Subscription upgraded successfully!');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ClientSubscription.update(subscription.id, {
        status: 'cancelled',
        cancellation_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      toast.success('Subscription cancelled. Active until end of billing period.');
    },
  });

  const handleUpgrade = (pkg) => {
    setSelectedPackage(pkg);
    setShowUpgradeDialog(true);
  };

  const upgradePackages = allPackages.filter(pkg => 
    pkg.is_active && pkg.price > (packageData?.price || 0)
  );

  return (
    <>
      <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            Subscription Details
          </CardTitle>
          <CardDescription>Manage your plan and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Plan */}
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Current Plan</span>
              <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                {packageData?.tier}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-white">{packageData?.name}</div>
            <div className="text-lg text-slate-300">${packageData?.price}/month</div>
          </div>

          {/* Status & Dates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Status</span>
              <Badge className={
                subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                subscription.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                subscription.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }>
                {subscription.status}
              </Badge>
            </div>

            {subscription.trial_ends && subscription.status === 'trial' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Trial Ends</span>
                <span className="text-sm text-white">
                  {new Date(subscription.trial_ends).toLocaleDateString()}
                </span>
              </div>
            )}

            {subscription.next_payment_date && subscription.status === 'active' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Next Payment</span>
                <span className="text-sm text-white">
                  {new Date(subscription.next_payment_date).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Payment Method</span>
              <span className="text-sm text-white">
                {subscription.payment_method_added ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    On File
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    Not Added
                  </div>
                )}
              </span>
            </div>
          </div>

          {/* Plan Features */}
          {expanded && packageData && (
            <div className="pt-4 border-t border-slate-700">
              <h4 className="text-sm font-semibold text-white mb-3">Plan Includes:</h4>
              <ul className="space-y-2">
                {packageData.features?.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-700 space-y-2">
            {upgradePackages.length > 0 && subscription.status !== 'cancelled' && (
              <Button 
                onClick={() => setShowUpgradeDialog(true)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            )}
            
            {subscription.status !== 'cancelled' && (
              <Button 
                variant="outline"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel your subscription?')) {
                    cancelMutation.mutate();
                  }
                }}
                disabled={cancelMutation.isPending}
                className="w-full border-slate-600"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
              </Button>
            )}
          </div>

          {subscription.payment_failed && (
            <Alert className="bg-red-600/10 border-red-500/30">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <AlertDescription className="text-red-300">
                Last payment failed. Please update your payment method.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upgrade Your Plan</DialogTitle>
            <DialogDescription>Choose a higher tier to unlock more features</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {upgradePackages.map(pkg => (
              <div
                key={pkg.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPackage?.id === pkg.id 
                    ? 'border-blue-500 bg-blue-600/10' 
                    : 'border-slate-300 hover:border-blue-400'
                }`}
                onClick={() => setSelectedPackage(pkg)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{pkg.name}</h3>
                    <Badge className="mt-1">{pkg.tier}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${pkg.price}</div>
                    <div className="text-sm text-slate-500">/month</div>
                  </div>
                </div>
                <ul className="space-y-1 mt-3">
                  {pkg.features?.slice(0, 5).map((feature, idx) => (
                    <li key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedPackage && upgradeMutation.mutate(selectedPackage.id)}
              disabled={!selectedPackage || upgradeMutation.isPending}
            >
              {upgradeMutation.isPending ? 'Upgrading...' : 'Confirm Upgrade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}