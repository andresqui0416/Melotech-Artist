import sgMail from '@sendgrid/mail';
import { prisma } from './prisma';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Helper function to replace template variables
function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

// Send email using database template
export async function sendTemplateEmail(
  templateKey: string,
  artistEmail: string,
  variables: Record<string, string>
): Promise<boolean> {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { key: templateKey }
    });

    if (!template) {
      console.error(`Email template not found: ${templateKey}`);
      return false;
    }

    const processedSubject = replaceTemplateVariables(template.subject, variables);
    const processedHtmlBody = replaceTemplateVariables(template.htmlBody, variables);

    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured, skipping email send');
      return false;
    }

    const msg = {
      to: artistEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourlabel.com',
      subject: processedSubject,
      html: processedHtmlBody,
    };

    await sgMail.send(msg);
    console.log('Template email sent successfully to:', artistEmail);
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error sending template email:', message);
    return false;
  }
}

// Send email when new submission is received
export async function sendNewSubmissionEmail(
  artistEmail: string,
  artistName: string,
  submissionId: string,
  trackCount: number
): Promise<boolean> {
  const variables = {
    artistName,
    submissionId,
    trackCount: trackCount.toString(),
    submissionDate: new Date().toLocaleDateString(),
    currentStatus: 'PENDING'
  };

  return sendTemplateEmail('submission-received', artistEmail, variables);
}

// Send email when submission status changes
export async function sendStatusChangeEmail(
  artistEmail: string,
  artistName: string,
  submissionId: string,
  status: string,
  feedback?: string
): Promise<boolean> {
  let templateKey = '';
  
  switch (status) {
    case 'IN_REVIEW':
      templateKey = 'submission-in-review'; // This template is for "under review"
      break;
    case 'APPROVED':
      templateKey = 'submission-approved';
      break;
    case 'REJECTED':
      templateKey = 'submission-rejected';
      break;
    default:
      // For PENDING status, don't send email (submission just arrived)
      return true;
  }

  const variables = {
    artistName,
    submissionId,
    feedback: feedback || 'No specific feedback provided at this time.'
  };

  return sendTemplateEmail(templateKey, artistEmail, variables);
}
