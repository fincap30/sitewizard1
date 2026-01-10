import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Edit2, Plus, Trash2, Save, GripVertical } from "lucide-react";
import { toast } from "sonner";

export default function VisualEditor({ websiteStructure, onSave }) {
  const [editedStructure, setEditedStructure] = useState(websiteStructure);
  const [editingSection, setEditingSection] = useState(null);

  const templates = [
    // Basic Templates
    { id: 'hero', name: 'Hero Section', category: 'basic', content: { heading: 'Welcome to Our Company', content_outline: 'Compelling headline with call-to-action' } },
    { id: 'features', name: 'Features Grid', category: 'basic', content: { heading: 'Our Features', content_outline: 'Showcase 3-4 key features with icons' } },
    { id: 'testimonials', name: 'Testimonials', category: 'basic', content: { heading: 'What Clients Say', content_outline: 'Customer testimonials and reviews' } },
    { id: 'cta', name: 'Call to Action', category: 'basic', content: { heading: 'Ready to Get Started?', content_outline: 'Strong CTA with contact button' } },
    { id: 'team', name: 'Team Section', category: 'basic', content: { heading: 'Meet Our Team', content_outline: 'Team member profiles with photos' } },
    { id: 'pricing', name: 'Pricing Table', category: 'basic', content: { heading: 'Our Pricing', content_outline: 'Pricing tiers and packages' } },
    
    // E-commerce Templates
    { id: 'product-grid', name: 'Product Grid', category: 'ecommerce', content: { heading: 'Our Products', content_outline: 'Display products in grid layout with prices' } },
    { id: 'product-carousel', name: 'Product Carousel', category: 'ecommerce', content: { heading: 'Featured Products', content_outline: 'Sliding carousel of featured products' } },
    { id: 'shopping-cart', name: 'Cart Preview', category: 'ecommerce', content: { heading: 'Your Cart', content_outline: 'Mini cart summary widget' } },
    
    // Service Business Templates
    { id: 'services-list', name: 'Services List', category: 'services', content: { heading: 'Our Services', content_outline: 'Detailed list of services offered' } },
    { id: 'booking-form', name: 'Booking Form', category: 'services', content: { heading: 'Book Appointment', content_outline: 'Service booking form with calendar' } },
    { id: 'process-steps', name: 'Process Steps', category: 'services', content: { heading: 'How It Works', content_outline: '4-step process visualization' } },
    
    // Portfolio Templates
    { id: 'portfolio-grid', name: 'Portfolio Grid', category: 'portfolio', content: { heading: 'Our Work', content_outline: 'Masonry grid of portfolio items' } },
    { id: 'case-study', name: 'Case Study', category: 'portfolio', content: { heading: 'Case Study', content_outline: 'Detailed project case study layout' } },
    
    // Restaurant/Food Templates
    { id: 'menu', name: 'Menu Section', category: 'restaurant', content: { heading: 'Our Menu', content_outline: 'Food menu with categories and prices' } },
    { id: 'reservation', name: 'Reservation Form', category: 'restaurant', content: { heading: 'Reserve Table', content_outline: 'Table reservation form' } },
    
    // General Content
    { id: 'faq', name: 'FAQ Section', category: 'content', content: { heading: 'FAQs', content_outline: 'Frequently asked questions accordion' } },
    { id: 'blog-grid', name: 'Blog Grid', category: 'content', content: { heading: 'Latest Posts', content_outline: 'Blog posts in grid layout' } },
    { id: 'contact-form', name: 'Contact Form', category: 'content', content: { heading: 'Contact Us', content_outline: 'Contact form with fields' } },
    { id: 'gallery', name: 'Image Gallery', category: 'content', content: { heading: 'Gallery', content_outline: 'Photo gallery with lightbox' } },
    { id: 'video-embed', name: 'Video Section', category: 'content', content: { heading: 'Watch Video', content_outline: 'Embedded video player section' } },
    { id: 'stats-counter', name: 'Stats Counter', category: 'content', content: { heading: 'By The Numbers', content_outline: 'Animated statistics counters' } }
  ];

  const handleDragEnd = (result, pageIndex) => {
    if (!result.destination) return;

    const newStructure = { ...editedStructure };
    const sections = Array.from(newStructure.pages[pageIndex].sections);
    const [removed] = sections.splice(result.source.index, 1);
    sections.splice(result.destination.index, 0, removed);
    
    newStructure.pages[pageIndex].sections = sections;
    setEditedStructure(newStructure);
    toast.success('Section reordered!');
  };

  const handleAddSection = (pageIndex, template) => {
    const newStructure = { ...editedStructure };
    newStructure.pages[pageIndex].sections.push(template.content);
    setEditedStructure(newStructure);
    toast.success('Section added!');
  };

  const handleEditSection = (pageIndex, sectionIndex) => {
    setEditingSection({ pageIndex, sectionIndex });
  };

  const handleSaveSection = (pageIndex, sectionIndex, newContent) => {
    const newStructure = { ...editedStructure };
    newStructure.pages[pageIndex].sections[sectionIndex] = newContent;
    setEditedStructure(newStructure);
    setEditingSection(null);
    toast.success('Section updated!');
  };

  const handleDeleteSection = (pageIndex, sectionIndex) => {
    const newStructure = { ...editedStructure };
    newStructure.pages[pageIndex].sections.splice(sectionIndex, 1);
    setEditedStructure(newStructure);
    toast.success('Section deleted');
  };

  const handleSaveAll = () => {
    onSave(editedStructure);
    toast.success('Website structure saved!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Visual Editor</h2>
        <Button onClick={handleSaveAll} className="bg-green-600 hover:bg-green-700">
          <Save className="w-4 h-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="0">
        <TabsList>
          {editedStructure.pages?.map((page, idx) => (
            <TabsTrigger key={idx} value={String(idx)}>
              {page.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {editedStructure.pages?.map((page, pageIndex) => (
          <TabsContent key={pageIndex} value={String(pageIndex)} className="space-y-4">
            {/* Drag and Drop Sections */}
            <DragDropContext onDragEnd={(result) => handleDragEnd(result, pageIndex)}>
              <Droppable droppableId={`page-${pageIndex}`}>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {page.sections?.map((section, sectionIndex) => (
                      <Draggable key={sectionIndex} draggableId={`section-${pageIndex}-${sectionIndex}`} index={sectionIndex}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border-2 bg-slate-800/50 backdrop-blur-sm transition-all ${
                              snapshot.isDragging ? 'border-blue-500 shadow-lg' : 'border-slate-700/50'
                            }`}
                          >
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 flex-1">
                                  <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                    <GripVertical className="w-5 h-5 text-slate-400" />
                                  </div>
                                  <CardTitle className="text-lg">{section.heading}</CardTitle>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditSection(pageIndex, sectionIndex)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteSection(pageIndex, sectionIndex)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {editingSection?.pageIndex === pageIndex && editingSection?.sectionIndex === sectionIndex ? (
                                <div className="space-y-3">
                                  <Input
                                    value={section.heading}
                                    onChange={(e) => {
                                      const newSection = { ...section, heading: e.target.value };
                                      handleSaveSection(pageIndex, sectionIndex, newSection);
                                    }}
                                    placeholder="Section heading"
                                  />
                                  <Textarea
                                    value={section.content_outline}
                                    onChange={(e) => {
                                      const newSection = { ...section, content_outline: e.target.value };
                                      handleSaveSection(pageIndex, sectionIndex, newSection);
                                    }}
                                    rows={4}
                                    placeholder="Section content..."
                                  />
                                </div>
                              ) : (
                                <p className="text-sm text-slate-300">{section.content_outline}</p>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Add Section - Categorized Templates */}
            <Card className="border-2 border-dashed border-slate-600 bg-slate-800/30">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-white mb-3">Add Section Template</h3>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="ecommerce">E-commerce</TabsTrigger>
                    <TabsTrigger value="services">Services</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                  </TabsList>
                  {['basic', 'ecommerce', 'services', 'content'].map(category => (
                    <TabsContent key={category} value={category}>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {templates.filter(t => t.category === category).map(template => (
                          <Button
                            key={template.id}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddSection(pageIndex, template)}
                            className="justify-start"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {template.name}
                          </Button>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}