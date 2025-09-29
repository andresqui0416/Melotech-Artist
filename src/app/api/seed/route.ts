import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST() {
  const email = process.env.ADMIN_EMAIL || "admin@yourlabel.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.deleteMany({});
  // Create admin user
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        name: "Admin",
        passwordHash,
        role: "ADMIN",
      },
    });
  }

  // Create test artists and submissions
  const testArtists = [
    {
      name: "Alex Chen",
      email: "alex.chen@email.com",
      phone: "+1 (555) 123-4567",
      instagram: "https://instagram.com/alexchenmusic",
      soundcloud: "https://soundcloud.com/alexchen",
      spotify: "https://open.spotify.com/artist/alexchen",
      bio: "Electronic music producer from Los Angeles, specializing in ambient and experimental sounds.",
      tracks: [
        {
          title: "Midnight Pulse",
          genre: "Electronic",
          bpm: 128,
          key: "C minor",
          description: "A dark, pulsing electronic track with atmospheric elements.",
        },
        {
          title: "Digital Dreams",
          genre: "Electronic",
          bpm: 140,
          key: "F major",
          description: "Uplifting electronic anthem with dreamy synthesizers.",
        },
      ],
    },
    {
      name: "Sarah Rodriguez",
      email: "sarah.music@email.com",
      phone: "+1 (555) 987-6543",
      instagram: "https://instagram.com/sarahrodriguezmusic",
      soundcloud: "https://soundcloud.com/sarahrodriguez",
      spotify: "https://open.spotify.com/artist/sarahrodriguez",
      bio: "Hip-hop artist and producer from New York, known for her powerful lyrics and innovative beats.",
      tracks: [
        {
          title: "City Lights",
          genre: "Hip-Hop",
          bpm: 95,
          key: "G minor",
          description: "Urban anthem capturing the energy of city life at night.",
        },
      ],
    },
  ];

  // Clear existing test data first
  await prisma.track.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.artist.deleteMany({
    where: {
      email: {
        in: testArtists.map(a => a.email)
      }
    }
  });

  // Create default email templates
  const emailTemplates = [
    {
      key: "submission-received",
      subject: "Your Music Demo Submission Has Been Received",
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Thank You for Your Submission!</h2>
          <p>Dear {{artistName}},</p>
          <p>We have successfully received your music demo submission. Your submission is now <strong style="color: #f59e0b;">PENDING</strong> and awaiting review by our A&R team.</p>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #f59e0b; margin-top: 0;">Current Status: PENDING</h3>
            <p style="margin-bottom: 0;">Your submission is in our queue and will be reviewed within 5-7 business days.</p>
          </div>
          
          <p><strong>Submission Details:</strong></p>
          <ul>
            <li>Number of tracks: {{trackCount}}</li>
            <li>Submission ID: {{submissionId}}</li>
            <li>Submitted on: {{submissionDate}}</li>
            <li>Current status: <strong>PENDING</strong> (Awaiting review)</li>
          </ul>
          
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Our A&R team will review your tracks</li>
            <li>You'll receive an email when the review begins (status: IN_REVIEW)</li>
            <li>We'll provide detailed feedback once the review is complete</li>
          </ul>
          
          <p>We appreciate your interest in working with us and look forward to reviewing your music!</p>
          <p>Best regards,<br>The A&R Team</p>
        </div>
      `
    },
    {
      key: "submission-in-review",
      subject: "Your Music Demo is Under Review",
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #f59e0b;">Your Submission is Being Reviewed</h2>
          <p>Dear {{artistName}},</p>
          <p>Your music demo submission (ID: {{submissionId}}) is currently under review by our A&R team.</p>
          <p>We are carefully listening to your tracks and will provide you with detailed feedback once the review process is complete.</p>
          <p><strong>Review Process:</strong></p>
          <ul>
            <li>Our A&R team is currently reviewing your tracks</li>
            <li>We evaluate production quality, originality, and market potential</li>
            <li>Review typically takes 3-5 business days</li>
            <li>You'll receive detailed feedback regardless of the outcome</li>
          </ul>
          <p>Thank you for your patience!</p>
          <p>Best regards,<br>The A&R Team</p>
        </div>
      `
    },
    {
      key: "submission-approved",
      subject: "Congratulations! Your Music Demo Has Been Approved",
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981;">🎉 Congratulations!</h2>
          <p>Dear {{artistName}},</p>
          <p>We are excited to inform you that your music demo submission (ID: {{submissionId}}) has been approved by our A&R team!</p>
          <p>Your tracks show great potential and we would love to discuss potential collaboration opportunities with you.</p>
          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>Our team will contact you within 2-3 business days</li>
            <li>We'll schedule a call to discuss your music and our vision</li>
            <li>We'll explore potential partnership opportunities</li>
          </ul>
          <p>Congratulations again on this achievement!</p>
          <p>Best regards,<br>The A&R Team</p>
        </div>
      `
    },
    {
      key: "submission-rejected",
      subject: "Thank You for Your Music Demo Submission",
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ef4444;">Thank You for Your Submission</h2>
          <p>Dear {{artistName}},</p>
          <p>Thank you for submitting your music demo (ID: {{submissionId}}) to us. After careful consideration, we have decided not to move forward with your submission at this time.</p>
          <p>This decision is not a reflection of your talent or potential. The music industry is highly competitive, and we receive many submissions that don't align with our current needs.</p>
          <p><strong>Feedback:</strong><br>{{feedback}}</p>
          <p>We encourage you to continue creating music and consider submitting again in the future as your sound evolves.</p>
          <p>Best of luck with your musical journey!</p>
          <p>Best regards,<br>The A&R Team</p>
        </div>
      `
    }
  ];

  // Clear existing email templates and create new ones
  await prisma.emailTemplate.deleteMany({});
  
  for (const template of emailTemplates) {
    await prisma.emailTemplate.create({
      data: template
    });
  }
  
  console.log("Created default email templates");

  for (const artistData of testArtists) {
    try {
      console.log(`Creating artist: ${artistData.name}`);
      const artist = await prisma.artist.create({
        data: {
          name: artistData.name,
          email: artistData.email,
          phone: artistData.phone,
          instagram: artistData.instagram,
          soundcloud: artistData.soundcloud,
          spotify: artistData.spotify,
          bio: artistData.bio,
        },
      });

      console.log(`Created artist with ID: ${artist.id}`);

      // Create submission for this artist
      console.log(`Creating submission for artist: ${artistData.name}`);
      await prisma.submission.create({
        data: {
          artistId: artist.id,
          status: "PENDING",
          tracks: {
              create: artistData.tracks.map(track => ({
                title: track.title,
                genre: track.genre,
                bpm: track.bpm,
                musicalKey: track.key,
                description: track.description,
                originalUrl: `/uploads/${track.title.toLowerCase().replace(/\s+/g, '-')}.mp3`,
              })),
          },
        },
      });
      console.log(`Created submission for artist: ${artistData.name}`);
    } catch (error) {
      console.error(`Error creating artist ${artistData.name}:`, error);
    }
  }
  await prisma.review.deleteMany({});
  await prisma.artist.deleteMany({});
  return NextResponse.json({ ok: true, message: "Test data seeded successfully" });
}


