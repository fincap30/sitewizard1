import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Zap, CheckCircle, AlertCircle } from "lucide-react";

export default function SEOAnalysisDisplay({ analysis, formData }) {
  if (!analysis) return null;

  const seo = analysis.seo_current_state || {};
  const competitors = analysis.competitor_keywords || {};
  const whyUs = analysis.why_choose_us || {};

  return (
    <div className="space-y-6">
      {/* SEO Current State */}
      <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          Your Current SEO Status
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Current Ranking:</span>
            <Badge className="bg-red-600">{seo.current_ranking || 'Not ranked'}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-slate-300">SEO Score:</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-slate-700 h-2 rounded-full">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{width: `${seo.seo_score || 0}%`}}
                />
              </div>
              <span className="text-white font-bold">{seo.seo_score || 0}/100</span>
            </div>
          </div>

          {seo.technical_issues && seo.technical_issues.length > 0 && (
            <div className="bg-red-900/20 rounded p-3 mt-3">
              <p className="text-sm font-medium text-red-400 mb-2">⚠️ Major Issues:</p>
              <ul className="text-xs text-slate-300 space-y-1">
                {seo.technical_issues.map((issue, idx) => (
                  <li key={idx}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Target Keywords */}
      <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          Keywords You MUST Target
        </h3>
        <div className="flex flex-wrap gap-2">
          {(seo.top_keywords || []).map((keyword, idx) => (
            <Badge key={idx} className="bg-blue-600 text-white">{keyword}</Badge>
          ))}
        </div>
        {seo.missing_keywords && seo.missing_keywords.length > 0 && (
          <div className="mt-3 bg-yellow-900/20 rounded p-3">
            <p className="text-sm font-medium text-yellow-400 mb-2">🎯 High-Value Keywords You're Missing:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {seo.missing_keywords.map((keyword, idx) => (
                <Badge key={idx} variant="outline" className="border-yellow-500 text-yellow-300">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Competitor Analysis */}
      {competitors.competitors && competitors.competitors.length > 0 && (
        <div className="bg-purple-600/10 border border-purple-500/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">What Your Competitors Are Ranking For</h3>
          <div className="space-y-3">
            {competitors.competitors.map((comp, idx) => (
              <div key={idx} className="bg-purple-900/20 rounded p-3">
                <p className="text-sm text-purple-300 font-medium mb-1">{comp.their_url}</p>
                <p className="text-xs text-slate-400 mb-2">Est. traffic: {comp.estimated_monthly_traffic}</p>
                <div className="flex flex-wrap gap-1">
                  {comp.keywords_they_rank_for?.map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-purple-500">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {competitors.keyword_opportunities && competitors.keyword_opportunities.length > 0 && (
            <div className="mt-3 bg-green-900/20 rounded p-3">
              <p className="text-sm font-medium text-green-400 mb-2">✅ Keywords YOU Can Win:</p>
              <ul className="text-xs text-slate-300 space-y-1">
                {competitors.keyword_opportunities.map((opp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Quick Wins */}
      <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-green-400" />
          Quick Wins - What We'll Do For You
        </h3>
        <ul className="space-y-2 text-sm text-slate-300">
          {(analysis.quick_wins || []).map((win, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>{win}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Why Choose Us */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50 rounded-lg p-6">
        <h3 className="font-bold text-white mb-4 text-xl flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-400" />
          Why Choose SiteWizard.pro?
        </h3>
        
        <div className="space-y-4">
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-2xl font-bold text-blue-400 mb-2">🎁 100% FREE Website First</p>
            <p className="text-slate-300">{whyUs.free_website_value || 'See your website built first, pay NOTHING until you approve it'}</p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-xl font-bold text-green-400 mb-2">✅ Zero Risk</p>
            <p className="text-slate-300">{whyUs.risk_free || 'No credit card. No upfront payment. 100% free until you love it.'}</p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-xl font-bold text-purple-400 mb-2">⚡ Lightning Fast</p>
            <p className="text-slate-300">{whyUs.quick_results || 'Most clients see their site live in 7-10 days'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}