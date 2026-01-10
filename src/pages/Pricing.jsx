import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export default function Pricing() {
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: () => base44.entities.Package.list('display_order'),
  });

  const getTierColor = (tier) => {
    switch (tier) {
      case 'starter': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'growth': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'premium': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-blue-500/30">
            <Zap className="w-4 h-4" />
            Free Website. Paid Growth.
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your Growth Plan
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Start with a free 14-day trial. No upfront cost. Cancel anytime.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {packages.filter(p => p.is_active).map((pkg) => (
            <Card key={pkg.id} className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm hover:border-blue-500/50 transition-all">
              <CardHeader>
                <Badge className={`w-fit ${getTierColor(pkg.tier)} border`}>
                  {pkg.tier}
                </Badge>
                <CardTitle className="text-2xl mt-3">{pkg.name}</CardTitle>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-4xl font-bold text-white">${pkg.price}</span>
                  <span className="text-slate-400">/month</span>
                </div>
                {pkg.setup_cost > 0 && (
                  <p className="text-sm text-slate-400">
                    + ${pkg.setup_cost} setup fee
                  </p>
                )}
                <CardDescription className="text-slate-300">
                  14-day free trial included
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {pkg.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {pkg.products_limit && (
                    <li className="flex items-start gap-2 text-sm text-slate-300">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Up to {pkg.products_limit} products</span>
                    </li>
                  )}
                </ul>
                <Link to={`/StartFreeTrial?package=${pkg.id}`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Section */}
        <div className="text-center mt-16 text-slate-400 text-sm">
          <p>✓ 14-day free trial included</p>
          <p className="mt-2">✓ Setup fee charged after trial ends</p>
          <p className="mt-2">✓ Cancel anytime during trial</p>
        </div>
      </div>
    </div>
  );
}