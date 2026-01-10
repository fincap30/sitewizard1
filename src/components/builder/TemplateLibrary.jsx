import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle, Eye } from "lucide-react";

const TEMPLATE_LIBRARY = {
  tech: [
    {
      id: 'saas-modern',
      name: 'SaaS Modern',
      industry: 'Technology',
      description: 'Clean, modern design for software and cloud services',
      colorScheme: { primary: '#0066FF', secondary: '#F0F4FF', accent: '#00D9FF' },
      typography: { headings: 'Inter', body: 'Inter' },
      sections: ['Hero with CTA', 'Features Grid', 'Pricing Table', 'Integration Logos', 'Testimonials', 'FAQ', 'Footer CTA'],
      bestPractices: ['Clear value proposition', 'Social proof', 'Prominent CTA', 'Mobile optimized']
    },
    {
      id: 'startup-bold',
      name: 'Startup Bold',
      industry: 'Technology',
      description: 'Bold, eye-catching design for tech startups',
      colorScheme: { primary: '#FF6B35', secondary: '#FFF3E0', accent: '#004E89' },
      typography: { headings: 'Poppins', body: 'Open Sans' },
      sections: ['Hero with Video', 'Problem/Solution', 'Product Demo', 'Investor Traction', 'Testimonials', 'News Coverage', 'Contact'],
      bestPractices: ['Narrative storytelling', 'Visual demos', 'Trust indicators', 'Clear differentiation']
    },
    {
      id: 'agency-professional',
      name: 'Agency Professional',
      industry: 'Technology',
      description: 'Professional agency portfolio and case studies',
      colorScheme: { primary: '#1A1A1A', secondary: '#F5F5F5', accent: '#FF6B9D' },
      typography: { headings: 'Playfair Display', body: 'Lato' },
      sections: ['Hero Portfolio', 'Services Overview', 'Case Studies', 'Team', 'Process', 'Testimonials', 'Blog Feed', 'Contact'],
      bestPractices: ['Showcase work', 'Client success stories', 'Process transparency', 'Strong CTA']
    }
  ],
  ecommerce: [
    {
      id: 'fashion-luxury',
      name: 'Fashion Luxury',
      industry: 'E-Commerce',
      description: 'Elegant design for high-end fashion and lifestyle brands',
      colorScheme: { primary: '#000000', secondary: '#F5E6D3', accent: '#D4AF37' },
      typography: { headings: 'Didot', body: 'Quicksand' },
      sections: ['Hero Image', 'New Collection', 'Product Grid', 'Style Guide', 'Testimonials', 'Newsletter', 'Footer'],
      bestPractices: ['High-quality imagery', 'Minimalist layout', 'Seasonal updates', 'Luxury positioning']
    },
    {
      id: 'shop-vibrant',
      name: 'Shop Vibrant',
      industry: 'E-Commerce',
      description: 'Vibrant, energetic design for products and retail',
      colorScheme: { primary: '#FF1493', secondary: '#FFF0F5', accent: '#00CED1' },
      typography: { headings: 'Bebas Neue', body: 'Nunito' },
      sections: ['Hero Sale', 'Product Carousel', 'Categories', 'Customer Reviews', 'Gift Guide', 'Social Proof', 'Checkout CTA'],
      bestPractices: ['Product focus', 'Urgency elements', 'Easy navigation', 'Trust badges']
    },
    {
      id: 'marketplace-clean',
      name: 'Marketplace Clean',
      industry: 'E-Commerce',
      description: 'Clean marketplace design supporting multiple vendors',
      colorScheme: { primary: '#2563EB', secondary: '#F0F9FF', accent: '#10B981' },
      typography: { headings: 'Roboto', body: 'Roboto' },
      sections: ['Search Hero', 'Categories', 'Trending Products', 'Vendor Showcase', 'Reviews', 'How It Works', 'Seller CTA'],
      bestPractices: ['Search optimization', 'Trust system', 'Vendor branding', 'Transaction clarity']
    }
  ],
  services: [
    {
      id: 'consulting-corporate',
      name: 'Consulting Corporate',
      industry: 'Professional Services',
      description: 'Corporate professional design for consulting firms',
      colorScheme: { primary: '#003366', secondary: '#E8F0F7', accent: '#FF6600' },
      typography: { headings: 'Georgia', body: 'Trebuchet MS' },
      sections: ['Executive Hero', 'Services Matrix', 'Industries Served', 'Case Studies', 'Team', 'Credentials', 'Contact'],
      bestPractices: ['Authority positioning', 'Industry expertise', 'ROI focus', 'Thought leadership']
    },
    {
      id: 'health-wellness',
      name: 'Health & Wellness',
      industry: 'Professional Services',
      description: 'Calming design for healthcare and wellness services',
      colorScheme: { primary: '#2D5F4F', secondary: '#F0F4F3', accent: '#6BCF7F' },
      typography: { headings: 'Raleway', body: 'Work Sans' },
      sections: ['Welcome Hero', 'Services', 'About Practitioner', 'Testimonials', 'Booking CTA', 'FAQ', 'Contact'],
      bestPractices: ['Trust and safety', 'Credentials display', 'Booking integration', 'Patient testimonials']
    },
    {
      id: 'legal-formal',
      name: 'Legal Formal',
      industry: 'Professional Services',
      description: 'Formal, trustworthy design for law firms',
      colorScheme: { primary: '#1F3A5F', secondary: '#F8F9FA', accent: '#C41E3A' },
      typography: { headings: 'Merriweather', body: 'Source Sans Pro' },
      sections: ['Hero', 'Practice Areas', 'Attorney Profiles', 'Success Stories', 'Why Choose Us', 'Contact Form', 'Footer'],
      bestPractices: ['Professionalism', 'Expertise showcase', 'Accessibility', 'Clear contact']
    }
  ],
  creative: [
    {
      id: 'portfolio-artistic',
      name: 'Portfolio Artistic',
      industry: 'Creative',
      description: 'Artistic portfolio for designers, photographers, artists',
      colorScheme: { primary: '#2D2D2D', secondary: '#FFFFFF', accent: '#E8127F' },
      typography: { headings: 'Abril Fatface', body: 'Lora' },
      sections: ['Hero Image', 'Gallery Grid', 'About', 'Services', 'Latest Work', 'Contact CTA', 'Social Links'],
      bestPractices: ['Showcase work', 'Visual hierarchy', 'Speed', 'Simple navigation']
    },
    {
      id: 'blog-lifestyle',
      name: 'Blog Lifestyle',
      industry: 'Creative',
      description: 'Lifestyle and blog content design',
      colorScheme: { primary: '#D4A574', secondary: '#FFF8F3', accent: '#364F5C' },
      typography: { headings: 'Playfair Display', body: 'Lato' },
      sections: ['Featured Post', 'Post Grid', 'Categories', 'Author Bio', 'Subscribe', 'Archives', 'Footer'],
      bestPractices: ['Content readability', 'Category organization', 'Email capture', 'Social sharing']
    },
    {
      id: 'events-modern',
      name: 'Events Modern',
      industry: 'Creative',
      description: 'Modern design for events and conferences',
      colorScheme: { primary: '#6F00FF', secondary: '#F3EFFF', accent: '#00D9FF' },
      typography: { headings: 'Orbitron', body: 'Roboto' },
      sections: ['Event Hero', 'Speakers', 'Schedule', 'Sponsorship', 'Tickets', 'Testimonials', 'Contact'],
      bestPractices: ['Event details clarity', 'Speaker highlights', 'Ticket CTA', 'Countdown timer']
    }
  ],
  local: [
    {
      id: 'restaurant-cozy',
      name: 'Restaurant Cozy',
      industry: 'Local Business',
      description: 'Warm design for restaurants and food businesses',
      colorScheme: { primary: '#8B4513', secondary: '#FFF8F0', accent: '#FFD700' },
      typography: { headings: 'Abril Fatface', body: 'Open Sans' },
      sections: ['Hero Image', 'Menu Highlight', 'Full Menu', 'Hours & Location', 'Reservations', 'Reviews', 'Contact'],
      bestPractices: ['High-quality food photos', 'Menu accessibility', 'Reservation CTA', 'Location map']
    },
    {
      id: 'salon-beauty',
      name: 'Salon Beauty',
      industry: 'Local Business',
      description: 'Stylish design for beauty and salon services',
      colorScheme: { primary: '#D946A6', secondary: '#FDF2F8', accent: '#F59E0B' },
      typography: { headings: 'Poppins', body: 'Inter' },
      sections: ['Hero Hero', 'Services Gallery', 'Team Stylists', 'Before/After', 'Booking CTA', 'Testimonials', 'Contact'],
      bestPractices: ['Visual before/after', 'Team trust', 'Booking integration', 'Review display']
    },
    {
      id: 'realestate-premium',
      name: 'Real Estate Premium',
      industry: 'Local Business',
      description: 'Premium design for real estate agents and agencies',
      colorScheme: { primary: '#1F3A3F', secondary: '#F5F5F5', accent: '#E8A87C' },
      typography: { headings: 'Merriweather', body: 'Open Sans' },
      sections: ['Featured Listings', 'Property Search', 'Our Team', 'Market Stats', 'Testimonials', 'Blog', 'Contact'],
      bestPractices: ['Property showcase', 'Search functionality', 'Virtual tours', 'Contact forms']
    }
  ]
};

export default function TemplateLibrary({ websiteIntake, onTemplateSelected }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const industries = Object.keys(TEMPLATE_LIBRARY);

  const handleSelectTemplate = async (template) => {
    setSelectedTemplate(template);
    
    // Customize template with business info
    const customization = {
      ...template,
      customized_for: websiteIntake.company_name,
      color_scheme: template.colorScheme,
      typography: template.typography
    };

    onTemplateSelected(customization);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Professional Template Library</h2>
        <p className="text-slate-300">Choose from industry-specific templates designed with best practices</p>
      </div>

      <Tabs defaultValue={industries[0]} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {industries.map(industry => (
            <TabsTrigger key={industry} value={industry} className="capitalize">
              {industry === 'tech' ? '💻' : industry === 'ecommerce' ? '🛍️' : industry === 'services' ? '🏢' : industry === 'creative' ? '🎨' : '📍'} {industry}
            </TabsTrigger>
          ))}
        </TabsList>

        {industries.map(industry => (
          <TabsContent key={industry} value={industry} className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEMPLATE_LIBRARY[industry].map(template => (
                <Card 
                  key={template.id}
                  className={`border-2 cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id 
                      ? 'border-blue-500 bg-slate-800/80' 
                      : 'border-slate-700/50 hover:border-blue-500/50 bg-slate-800/50'
                  }`}
                  onClick={() => setPreviewTemplate(template)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">{template.industry}</CardDescription>
                      </div>
                      {selectedTemplate?.id === template.id && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                    <p className="text-sm text-slate-300 mt-2">{template.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Color Preview */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-400">Color Scheme:</p>
                      <div className="flex gap-2">
                        <div 
                          className="h-8 w-8 rounded-md border border-slate-600" 
                          style={{ backgroundColor: template.colorScheme.primary }}
                          title="Primary"
                        />
                        <div 
                          className="h-8 w-8 rounded-md border border-slate-600" 
                          style={{ backgroundColor: template.colorScheme.secondary }}
                          title="Secondary"
                        />
                        <div 
                          className="h-8 w-8 rounded-md border border-slate-600" 
                          style={{ backgroundColor: template.colorScheme.accent }}
                          title="Accent"
                        />
                      </div>
                    </div>

                    {/* Typography */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-400">Typography:</p>
                      <p className="text-xs text-slate-300">Headings: {template.typography.headings}</p>
                      <p className="text-xs text-slate-300">Body: {template.typography.body}</p>
                    </div>

                    {/* Sections */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-400">Included Sections:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.sections.map((section, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Best Practices */}
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <p className="text-xs font-medium text-slate-300 mb-2">Best Practices:</p>
                      <ul className="space-y-1">
                        {template.bestPractices.map((practice, idx) => (
                          <li key={idx} className="text-xs text-slate-400">• {practice}</li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTemplate(template);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {selectedTemplate?.id === template.id ? 'Selected ✓' : 'Select Template'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Template Preview */}
      {previewTemplate && (
        <Card className="border-2 border-blue-500/50 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {previewTemplate.name} Preview
              <Button 
                onClick={() => setPreviewTemplate(null)}
                variant="ghost"
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-white mb-2">Design Elements</h4>
                <div className="space-y-3">
                  <div className="bg-slate-700/30 rounded-lg p-4" style={{ backgroundColor: previewTemplate.colorScheme.primary, opacity: 0.3 }}>
                    <p className="text-white font-bold">Primary Color Sample</p>
                    <p className="text-sm text-slate-300">Used for: Headlines, CTAs, Focus elements</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4" style={{ backgroundColor: previewTemplate.colorScheme.secondary }}>
                    <p className="text-sm font-semibold text-slate-700">Secondary Color Sample</p>
                    <p className="text-xs text-slate-600">Used for: Background, Sections</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Page Structure</h4>
                <div className="space-y-2">
                  {previewTemplate.sections.map((section, idx) => (
                    <div key={idx} className="bg-slate-700/30 rounded px-3 py-2 text-sm text-slate-300">
                      <span className="text-blue-400 mr-2">{idx + 1}.</span>{section}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}