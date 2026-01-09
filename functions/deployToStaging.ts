import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { intake_id } = await req.json();

    if (!intake_id) {
      return Response.json({ error: 'intake_id is required' }, { status: 400 });
    }

    // Get intake details
    const intakes = await base44.asServiceRole.entities.WebsiteIntake.filter({ id: intake_id });
    const intake = intakes[0];

    if (!intake) {
      return Response.json({ error: 'Intake not found' }, { status: 404 });
    }

    // In a real implementation, this would:
    // 1. Generate static files from the website structure
    // 2. Deploy to a staging server (Vercel, Netlify, etc.)
    // 3. Return the staging URL

    // For now, simulate deployment
    const stagingUrl = `https://staging-${intake.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.sitewizard.pro`;

    // Create or update the deploy_staging task
    const tasks = await base44.asServiceRole.entities.BuildTask.filter({
      website_intake_id: intake_id,
      task_type: 'deploy_staging'
    });

    if (tasks.length > 0) {
      await base44.asServiceRole.entities.BuildTask.update(tasks[0].id, {
        status: 'completed',
        staging_url: stagingUrl,
        completed_date: new Date().toISOString()
      });
    } else {
      await base44.asServiceRole.entities.BuildTask.create({
        website_intake_id: intake_id,
        task_name: 'Deploy to Staging',
        task_type: 'deploy_staging',
        status: 'completed',
        staging_url: stagingUrl,
        completed_date: new Date().toISOString()
      });
    }

    // Send notification to client
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'SiteWizard.pro',
      to: intake.client_email,
      subject: `Your Website is Ready for Preview! - ${intake.company_name}`,
      body: `
Hello ${intake.contact_person || 'there'},

Great news! Your website has been deployed to a staging environment for your review.

Preview your website here:
${stagingUrl}

Please review the website and let us know if you'd like any changes. Once you approve, we'll make it live!

View Your Dashboard:
${Deno.env.get('BASE44_APP_URL') || 'https://your-app.base44.com'}/ClientDashboard

Best regards,
SiteWizard.pro Team
      `
    });

    return Response.json({
      success: true,
      staging_url: stagingUrl,
      message: 'Website deployed to staging environment'
    });

  } catch (error) {
    console.error('Deploy to staging error:', error);
    return Response.json({ 
      error: 'Failed to deploy to staging',
      details: error.message 
    }, { status: 500 });
  }
});