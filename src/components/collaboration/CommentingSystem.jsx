import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function CommentingSystem({ websiteIntakeId, userEmail, userName, pageReference, sectionReference }) {
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('feedback');
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', websiteIntakeId, pageReference, sectionReference],
    queryFn: () => base44.entities.WebsiteComment.filter({
      website_intake_id: websiteIntakeId,
      page_reference: pageReference,
      section_reference: sectionReference
    }),
    enabled: !!websiteIntakeId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentData) => {
      await base44.entities.WebsiteComment.create(commentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      setNewComment('');
      toast.success('Comment added!');
    },
  });

  const resolveCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      await base44.entities.WebsiteComment.update(commentId, { status: 'resolved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.success('Comment resolved!');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    addCommentMutation.mutate({
      website_intake_id: websiteIntakeId,
      user_email: userEmail,
      user_name: userName,
      page_reference: pageReference,
      section_reference: sectionReference,
      comment_text: newComment,
      comment_type: commentType,
      status: 'open'
    });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'change_request': return 'bg-red-100 text-red-800';
      case 'approval': return 'bg-green-100 text-green-800';
      case 'question': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="w-4 h-4 text-blue-400" />
          Comments & Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            className="w-full border rounded-md px-3 py-2 text-sm bg-slate-700 text-white"
            value={commentType}
            onChange={(e) => setCommentType(e.target.value)}
          >
            <option value="feedback">Feedback</option>
            <option value="question">Question</option>
            <option value="change_request">Change Request</option>
            <option value="approval">Approval</option>
          </select>
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add your comment or feedback..."
            rows={3}
            className="text-sm"
          />
          <Button type="submit" size="sm" disabled={addCommentMutation.isPending} className="w-full">
            <Send className="w-3 h-3 mr-2" />
            Post Comment
          </Button>
        </form>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-xs text-center text-slate-400 py-4">No comments yet</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="p-3 bg-slate-700/30 rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{comment.user_name}</span>
                      <Badge className={getTypeColor(comment.comment_type)} className="text-xs">
                        {comment.comment_type}
                      </Badge>
                      {comment.status === 'resolved' && (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-slate-300">{comment.comment_text}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(comment.created_date).toLocaleDateString()} at {new Date(comment.created_date).toLocaleTimeString()}
                    </p>
                  </div>
                  {comment.status === 'open' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => resolveCommentMutation.mutate(comment.id)}
                      className="text-xs"
                    >
                      Resolve
                    </Button>
                  )}
                </div>
                {comment.admin_response && (
                  <div className="ml-4 p-2 bg-blue-600/10 border-l-2 border-blue-500 rounded">
                    <p className="text-xs text-blue-300">{comment.admin_response}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}