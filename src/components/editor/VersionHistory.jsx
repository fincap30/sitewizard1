import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { History, RotateCcw, Save, Clock, User } from "lucide-react";
import { toast } from "sonner";

export default function VersionHistory({ websiteIntakeId, currentStructure, onRestore }) {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const queryClient = useQueryClient();

  const { data: versions = [] } = useQuery({
    queryKey: ['versions', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteVersion.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const saveVersionMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      const nextVersion = versions.length > 0 
        ? Math.max(...versions.map(v => v.version_number)) + 1 
        : 1;

      await base44.entities.WebsiteVersion.create({
        website_intake_id: websiteIntakeId,
        version_number: nextVersion,
        structure_data: currentStructure,
        change_description: `Manual save - Version ${nextVersion}`,
        created_by_email: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions'] });
      toast.success('Version saved!');
    },
  });

  const restoreVersionMutation = useMutation({
    mutationFn: async (version) => {
      await base44.entities.WebsiteIntake.update(websiteIntakeId, {
        preview_url: JSON.stringify(version.structure_data)
      });
      return version.structure_data;
    },
    onSuccess: (restoredStructure) => {
      onRestore(restoredStructure);
      setSelectedVersion(null);
      toast.success('Version restored!');
    },
  });

  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              Version History
            </CardTitle>
            <CardDescription>Save and restore previous versions</CardDescription>
          </div>
          <Button
            onClick={() => saveVersionMutation.mutate()}
            disabled={saveVersionMutation.isPending}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Version
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedVersion && (
          <Alert className="bg-yellow-600/10 border-yellow-500/30">
            <AlertDescription className="text-yellow-300 flex items-center justify-between">
              <span>Restore version {selectedVersion.version_number}?</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedVersion(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => restoreVersionMutation.mutate(selectedVersion)}
                  disabled={restoreVersionMutation.isPending}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Restore
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {sortedVersions.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No saved versions yet</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sortedVersions.map(version => (
              <div
                key={version.id}
                className="p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-purple-600">Version {version.version_number}</Badge>
                      {version.version_number === sortedVersions[0].version_number && (
                        <Badge className="bg-green-600">Latest</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{version.change_description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(version.created_date).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {version.created_by_email}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedVersion(version)}
                    disabled={version.version_number === sortedVersions[0].version_number}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Restore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}