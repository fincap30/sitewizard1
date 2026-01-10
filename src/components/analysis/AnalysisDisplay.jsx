import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Star, ArrowRight } from "lucide-react";

export default function AnalysisDisplay({ analysis, formData }) {
  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* Lighthouse Metrics */}
      {analysis.lighthouse_metrics && (
        <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" />
            Performance Metrics (Lighthouse)
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { label: 'Performance', key: 'performance_score', color: 'blue' },
              { label: 'Accessibility', key: 'accessibility_score', color: 'green' },
              { label: 'SEO', key: 'seo_score', color: 'orange' },
              { label: 'Best Practices', key: 'best_practices_score', color: 'purple' }
            ].map((metric) => (
              <div key={metric.key} className="bg-slate-700/30 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400 mb-2">{metric.label}</p>
                <p className="text-3xl font-bold text-blue-400 mb-2">
                  {analysis.lighthouse_metrics[metric.key] || 0}
                </p>
                <div className="w-full bg-slate-600 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full"
                    style={{width: `${analysis.lighthouse_metrics[metric.key] || 0}%`}}
                  />
                </div>
              </div>
            ))}
          </div>
          {analysis.lighthouse_metrics.seo_details?.specific_actions && (
            <div className="bg-slate-800/50 rounded p-3 mt-3">
              <p className="text-sm font-medium text-white mb-2">📊 SEO Improvements</p>
              <ul className="text-xs text-slate-300 space-y-1">
                {analysis.lighthouse_metrics.seo_details.specific_actions.map((action, idx) => (
                  <li key={idx} className="flex gap-2">✓ {action}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Competitive Ranking */}
      <div className="bg-orange-600/10 border border-orange-500/30 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3">Your Competitive Ranking</h3>
        {analysis.competitive_ranking ? (
          <>
            <Badge className="mb-3 bg-orange-600">
              {analysis.competitive_ranking.current_level || 'Assessment pending'}
            </Badge>
            <p className="text-slate-300 mb-3">{analysis.competitive_ranking.ranking_summary || 'Analysis in progress...'}</p>
            <div className="space-y-3">
              {analysis.competitive_ranking?.competitive_strengths && (
                <div>
                  <strong className="text-green-400">Your Strengths:</strong>
                  <ul className="list-disc list-inside mt-1 text-sm text-slate-300">
                    {analysis.competitive_ranking.competitive_strengths.map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.competitive_ranking?.main_weaknesses && (
                <div>
                  <strong className="text-orange-400">Areas to Improve:</strong>
                  <ul className="list-disc list-inside mt-1 text-sm text-slate-300">
                    {analysis.competitive_ranking.main_weaknesses.map((weakness, idx) => (
                      <li key={idx}>{weakness}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.competitive_ranking?.competitive_gaps && (
                <div>
                  <strong className="text-red-400">Competitive Gaps:</strong>
                  <ul className="list-disc list-inside mt-1 text-sm text-slate-300">
                    {analysis.competitive_ranking.competitive_gaps.map((gap, idx) => (
                      <li key={idx}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-slate-400">Analyzing competitive position...</p>
        )}
      </div>

      {/* Opportunities */}
      <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3">Growth Opportunities</h3>
        {analysis.opportunities && analysis.opportunities.length > 0 ? (
          <ul className="space-y-2 text-sm text-slate-300">
            {analysis.opportunities.map((opp, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                <span>{opp}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400">No opportunities found</p>
        )}
      </div>

      {/* Quick Wins */}
      {analysis.quick_wins && analysis.quick_wins.length > 0 && (
        <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Quick Wins You Can Achieve</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            {analysis.quick_wins.map((win, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Star className="w-4 h-4 text-yellow-400 mt-0.5" />
                <span>{win}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendation */}
      {analysis.recommended_package && (
        <div className="bg-purple-600/10 border border-purple-500/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Our Recommendation</h3>
          <Badge className="mb-3 bg-purple-600 text-lg px-4 py-1">
            {analysis.recommended_package}
          </Badge>
          {analysis.recommendation_reason && <p className="text-slate-300 mb-3">{analysis.recommendation_reason}</p>}
          {analysis.alternative_plans && <p className="text-sm text-slate-400 italic">{analysis.alternative_plans}</p>}
        </div>
      )}

      {/* Value Proposition */}
      {analysis.value_proposition && (
        <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">What You Get with SiteWizard.pro</h3>
          <div className="mb-4">
            <p className="text-sm font-medium text-blue-300 mb-2">Included for FREE:</p>
            <ul className="space-y-1 text-sm text-slate-300">
              {analysis.value_proposition.whats_included?.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mb-4">
            <p className="text-sm font-medium text-blue-300 mb-2">AI-Powered Advantages:</p>
            <ul className="space-y-1 text-sm text-slate-300">
              {analysis.value_proposition.ai_benefits?.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Content Strategy */}
      {analysis.content_strategy && (
        <div className="bg-purple-600/10 border border-purple-500/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Your Custom Content Strategy</h3>
          {analysis.content_strategy.target_audience && (
            <div className="mb-4 bg-purple-900/20 rounded-lg p-3">
              <p className="text-sm font-medium text-purple-300 mb-1">Target Audience:</p>
              <p className="text-sm text-slate-300">{analysis.content_strategy.target_audience}</p>
            </div>
          )}
          <div className="space-y-4">
            {analysis.content_strategy.homepage_suggestions && (
              <div>
                <p className="text-sm font-medium text-white mb-2">Homepage Content:</p>
                <ul className="space-y-1 text-sm text-slate-300">
                  {analysis.content_strategy.homepage_suggestions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.content_strategy.blog_topics && (
              <div>
                <p className="text-sm font-medium text-white mb-2">Blog Post Ideas:</p>
                <ul className="space-y-1 text-sm text-slate-300">
                  {analysis.content_strategy.blog_topics.map((topic, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}