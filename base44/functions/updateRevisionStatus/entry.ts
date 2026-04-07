import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { revision_id, status, admin_response } = await req.json();

    if (!revision_id || !status) {
      return Response.json({ error: 'revision_id and status are required' }, { status: 400 });
    }

    // Get revision details
    const revisions = await base44.asServiceRole.entities.ModificationRequest.filter({ id: revision_id });
    const revision = revisions[0];

    if (!revision) {
      return Response.json({ error: 'Revision not found' }, { status: 404 });
    }

    // Update revision
    const updateData = {
      status: status,
      admin_response: admin_response || revision.admin_response
    };

    if (status === 'completed') {
      updateData.completed_date = new Date().toISOString();
    }

    await base44.asServiceRole.entities.ModificationRequest.update(revision_id, updateData);

    // Send notification to client
    const statusMessages = {
      'in_progress': 'is now being worked on',
      'completed': 'has been completed',
      'rejected': 'has been reviewed'
    };

    if (statusMessages[status]) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'SiteWizard.pro',
        to: revision.client_email,
        subject: `Revision Request Update - ${revision.request_type?.replace(/_/g, ' ')}`,
        body: `
Hello,

Your revision request ${statusMessages[status]}.

Request Type: ${revision.request_type?.replace(/_/g, ' ')}
Status: ${status}

${admin_response ? `Admin Response:\n${admin_response}\n\n` : ''}

Original Request:
${revision.description}

View Details:
${Deno.env.get('BASE44_APP_URL') || 'https://your-app.base44.com'}/ClientDashboard

Best regards,
SiteWizard.pro Team
        `
      });
    }

    return Response.json({
      success: true,
      message: 'Revision status updated and client notified'
    });

  } catch (error) {
    console.error('Update revision status error:', error);
    return Response.json({ 
      error: 'Failed to update revision status',
      details: error.message 
    }, { status: 500 });
  }
});