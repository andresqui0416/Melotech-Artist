import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

export interface EmailData {
  to: string;
  templateId?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  variables?: Record<string, string>;
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured, skipping email send');
      return false;
    }

    const msg = {
      to: emailData.to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourlabel.com',
      subject: emailData.subject || 'Music Demo Submission',
      text: emailData.textContent || 'Thank you for your submission.',
      html: emailData.htmlContent || '<p>Thank you for your submission.</p>',
    };

    await sgMail.send(msg);
    console.log('Email sent successfully to:', emailData.to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendConfirmationEmail(
  artistEmail: string, 
  artistName: string, 
  submissionId: string
): Promise<boolean> {
  const subject = 'Demo Submission Received - Thank You!';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Hello ${artistName}!</h2>
      
      <p>Thank you for submitting your music demo to our label. We've received your submission and our A&R team will review it carefully.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333;">Submission Details</h3>
        <p><strong>Submission ID:</strong> ${submissionId}</p>
        <p><strong>Status:</strong> Pending Review</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      
      <p>We typically review submissions within 2-4 weeks. You'll receive an email update once our team has reviewed your music.</p>
      
      <p>If you have any questions, please don't hesitate to reach out to us.</p>
      
      <p>Best regards,<br>
      The A&R Team</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #666;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  `;

  const textContent = `
    Hello ${artistName}!
    
    Thank you for submitting your music demo to our label. We've received your submission and our A&R team will review it carefully.
    
    Submission Details:
    - Submission ID: ${submissionId}
    - Status: Pending Review
    - Submitted: ${new Date().toLocaleDateString()}
    
    We typically review submissions within 2-4 weeks. You'll receive an email update once our team has reviewed your music.
    
    If you have any questions, please don't hesitate to reach out to us.
    
    Best regards,
    The A&R Team
  `;

  return sendEmail({
    to: artistEmail,
    subject,
    htmlContent,
    textContent,
  });
}

export async function sendStatusUpdateEmail(
  artistEmail: string,
  artistName: string,
  submissionId: string,
  status: string,
  feedback?: string
): Promise<boolean> {
  const statusMessages = {
    'IN_REVIEW': 'Your submission is now being reviewed by our A&R team.',
    'APPROVED': 'Congratulations! Your submission has been approved.',
    'REJECTED': 'Thank you for your submission, but unfortunately it doesn\'t fit our current needs.',
  };

  const statusMessage = statusMessages[status as keyof typeof statusMessages] || 'Your submission status has been updated.';

  const subject = `Demo Submission Update - ${status.replace('_', ' ')}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Hello ${artistName}!</h2>
      
      <p>We have an update regarding your music demo submission.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333;">Submission Update</h3>
        <p><strong>Submission ID:</strong> ${submissionId}</p>
        <p><strong>New Status:</strong> ${status.replace('_', ' ')}</p>
        <p><strong>Updated:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      
      <p>${statusMessage}</p>
      
      ${feedback ? `
        <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #333;">Feedback from our team:</h4>
          <p style="margin-bottom: 0;">${feedback}</p>
        </div>
      ` : ''}
      
      <p>Thank you for your interest in our label.</p>
      
      <p>Best regards,<br>
      The A&R Team</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #666;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  `;

  const textContent = `
    Hello ${artistName}!
    
    We have an update regarding your music demo submission.
    
    Submission Update:
    - Submission ID: ${submissionId}
    - New Status: ${status.replace('_', ' ')}
    - Updated: ${new Date().toLocaleDateString()}
    
    ${statusMessage}
    
    ${feedback ? `Feedback from our team: ${feedback}` : ''}
    
    Thank you for your interest in our label.
    
    Best regards,
    The A&R Team
  `;

  return sendEmail({
    to: artistEmail,
    subject,
    htmlContent,
    textContent,
  });
}

