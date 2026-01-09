import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Image as ImageIcon, Loader2, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

export default function MediaLibrary({ websiteIntakeId, clientEmail, onSelectImage }) {
  const [uploading, setUploading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [altText, setAltText] = useState('');
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['media-assets', clientEmail],
    queryFn: () => base44.entities.MediaAsset.filter({ client_email: clientEmail }),
    enabled: !!clientEmail,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.MediaAsset.create({
        client_email: clientEmail,
        website_intake_id: websiteIntakeId,
        file_name: file.name,
        file_url: file_url,
        file_type: file.type.startsWith('image/') ? 'image' : 'other',
        file_size: file.size,
        alt_text: ''
      });

      return file_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      toast.success('Image uploaded successfully!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (assetId) => base44.entities.MediaAsset.delete(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      toast.success('Image deleted');
    },
  });

  const updateAltTextMutation = useMutation({
    mutationFn: ({ assetId, altText }) => 
      base44.entities.MediaAsset.update(assetId, { alt_text: altText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      setSelectedAsset(null);
      toast.success('Alt text updated');
    },
  });

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    for (const file of files) {
      await uploadMutation.mutateAsync(file);
    }
    setUploading(false);
  };

  return (
    <>
      <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-400" />
            Media Library
          </CardTitle>
          <CardDescription>Upload and manage your website images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button
              onClick={() => document.getElementById('media-upload').click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              {uploading ? 'Uploading...' : 'Upload Images'}
            </Button>
            <input
              id="media-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : assets.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No images yet. Upload your first image!
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {assets.filter(a => a.file_type === 'image').map((asset) => (
                <div key={asset.id} className="group relative aspect-square rounded-lg overflow-hidden border-2 border-slate-700 hover:border-blue-500 transition-colors">
                  <img
                    src={asset.file_url}
                    alt={asset.alt_text || asset.file_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {onSelectImage && (
                      <Button
                        size="sm"
                        onClick={() => onSelectImage(asset.file_url)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAsset(asset);
                        setAltText(asset.alt_text || '');
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Delete this image?')) {
                          deleteMutation.mutate(asset.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image Details</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              <img
                src={selectedAsset.file_url}
                alt={selectedAsset.file_name}
                className="w-full rounded-lg"
              />
              <div>
                <label className="text-sm font-medium mb-1 block">Alt Text (for SEO & accessibility)</label>
                <Input
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe this image..."
                />
              </div>
              <Button
                onClick={() => updateAltTextMutation.mutate({ assetId: selectedAsset.id, altText })}
                disabled={updateAltTextMutation.isPending}
                className="w-full"
              >
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}