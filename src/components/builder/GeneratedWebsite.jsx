import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function GeneratedWebsite({ websiteData }) {
  const [formData, setFormData] = React.useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Message sent! We will contact you soon.');
    setFormData({ name: '', email: '', message: '' });
  };

  const renderSection = (section, pageColorScheme) => {
    switch (section.type) {
      case 'hero':
        return (
          <div className="py-20 px-4 text-center" style={{ backgroundColor: pageColorScheme.primary + '20' }}>
            <h1 className="text-5xl font-bold text-white mb-4">{section.heading}</h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">{section.content}</p>
            <Button size="lg" style={{ backgroundColor: pageColorScheme.accent }}>
              {section.cta || 'Get Started'}
            </Button>
          </div>
        );

      case 'features':
        return (
          <div className="py-16 px-4">
            <h2 className="text-3xl font-bold text-white text-center mb-12">{section.heading}</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {websiteData.content.features?.slice(0, 6).map((feature, idx) => (
                <Card key={idx} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6">
                    <CheckCircle className="w-10 h-10 mb-4" style={{ color: pageColorScheme.accent }} />
                    <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-300">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'values':
        return (
          <div className="py-16 px-4 bg-slate-900/50">
            <h2 className="text-3xl font-bold text-white text-center mb-12">{section.heading}</h2>
            <div className="max-w-4xl mx-auto space-y-6">
              {websiteData.content.value_propositions?.map((value, idx) => (
                <Card key={idx} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6">
                    <p className="text-slate-300">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'trust':
        return (
          <div className="py-16 px-4">
            <h2 className="text-3xl font-bold text-white text-center mb-12">{section.heading}</h2>
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
              {websiteData.content.trust_signals?.map((signal, idx) => (
                <Badge key={idx} className="p-4 justify-center text-base" style={{ backgroundColor: pageColorScheme.secondary }}>
                  {signal}
                </Badge>
              ))}
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="py-16 px-4 bg-slate-900/50">
            <h2 className="text-3xl font-bold text-white text-center mb-12">{section.heading}</h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {websiteData.content.faqs?.map((faq, idx) => (
                <Card key={idx} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-white mb-2">{faq.question}</h4>
                    <p className="text-slate-300">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="py-20 px-4 text-center" style={{ backgroundColor: pageColorScheme.accent + '20' }}>
            <h2 className="text-4xl font-bold text-white mb-4">{section.heading}</h2>
            <p className="text-xl text-slate-300 mb-8">{section.content}</p>
            <Button size="lg" style={{ backgroundColor: pageColorScheme.accent }}>
              {section.cta || 'Contact Us'}
            </Button>
          </div>
        );

      case 'contact':
        return (
          <div className="py-16 px-4">
            <h2 className="text-3xl font-bold text-white text-center mb-12">{section.heading}</h2>
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-1 block">Name *</label>
                      <Input
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Your Name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-1 block">Email *</label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-1 block">Message *</label>
                      <Textarea
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        placeholder="Your message..."
                        rows={4}
                      />
                    </div>
                    <Button type="submit" className="w-full" style={{ backgroundColor: pageColorScheme.accent }}>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6 flex items-center gap-3">
                    <Phone className="w-5 h-5" style={{ color: pageColorScheme.accent }} />
                    <div>
                      <p className="text-sm text-slate-400">Phone</p>
                      <p className="text-white">(555) 123-4567</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6 flex items-center gap-3">
                    <Mail className="w-5 h-5" style={{ color: pageColorScheme.accent }} />
                    <div>
                      <p className="text-sm text-slate-400">Email</p>
                      <p className="text-white">contact@example.com</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6 flex items-center gap-3">
                    <MapPin className="w-5 h-5" style={{ color: pageColorScheme.accent }} />
                    <div>
                      <p className="text-sm text-slate-400">Location</p>
                      <p className="text-white">123 Business St, City</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="py-16 px-4">
            <h2 className="text-3xl font-bold text-white text-center mb-8">{section.heading}</h2>
            <p className="text-slate-300 max-w-4xl mx-auto text-center">{section.content}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* SEO Meta Tags (would be in head in real deployment) */}
      <div className="hidden">
        {websiteData.seo.meta_tags?.map((meta, idx) => (
          <div key={idx}>
            <meta name="title" content={meta.title} />
            <meta name="description" content={meta.description} />
          </div>
        ))}
        <meta name="keywords" content={websiteData.seo.keywords?.join(', ')} />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-700 backdrop-blur-lg bg-slate-900/80">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-white">{websiteData.structure.site_name}</h1>
            <div className="hidden md:flex gap-6">
              {websiteData.structure.navigation?.map((item, idx) => (
                <a key={idx} href={item.href} className="text-slate-300 hover:text-white transition-colors">
                  {item.label}
                </a>
              ))}
            </div>
            <Button style={{ backgroundColor: websiteData.structure.color_scheme.accent }}>
              Contact Us
            </Button>
          </div>
        </div>
      </nav>

      {/* Pages Content */}
      {websiteData.structure.pages?.map((page, pageIdx) => (
        <div key={pageIdx} id={page.name.toLowerCase().replace(/\s+/g, '-')}>
          {/* Hero Section */}
          {page.hero && (
            <div className="py-20 px-4 text-center" style={{ backgroundColor: websiteData.structure.color_scheme.primary + '20' }}>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">{page.hero.headline}</h1>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">{page.hero.subheadline}</p>
              <Button size="lg" style={{ backgroundColor: websiteData.structure.color_scheme.accent }}>
                {page.hero.cta}
              </Button>
            </div>
          )}

          {/* Page Sections */}
          {page.sections?.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              {renderSection(section, websiteData.structure.color_scheme)}
            </div>
          ))}
        </div>
      ))}

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 px-4">
        <div className="container mx-auto text-center">
          <h3 className="text-2xl font-bold text-white mb-2">{websiteData.structure.site_name}</h3>
          <p className="text-slate-400 mb-6">{websiteData.structure.tagline}</p>
          <p className="text-sm text-slate-500">© 2026 {websiteData.structure.site_name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}