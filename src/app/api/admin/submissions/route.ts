import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { broadcastEvent } from "@/app/api/events/route";
import { sendNewSubmissionEmail } from "@/lib/email-templates";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { artist: { name: { contains: search, mode: 'insensitive' } } },
        { artist: { email: { contains: search, mode: 'insensitive' } } },
        { tracks: { some: { title: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          artist: true,
          tracks: true,
          reviews: {
            include: {
              reviewer: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.submission.count({ where }),
    ]);

    return NextResponse.json({
      submissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

// Public endpoint for artist submissions
const submissionSchema = z.object({
  artist: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    instagram: z.string().optional(),
    soundcloud: z.string().optional(),
    spotify: z.string().optional(),
    bio: z.string().optional(),
  }),
  tracks: z.array(
    z.object({
      title: z.string().min(1),
      genre: z.string().optional(),
      bpm: z.number().optional(),
      key: z.string().optional(),
      description: z.string().optional(),
      s3Key: z.string().optional(),
      fileName: z.string().optional(),
    })
  ).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = submissionSchema.parse(body);

    // Upsert artist by email
    let artist = await prisma.artist.findUnique({ where: { email: data.artist.email } });
    if (!artist) {
      artist = await prisma.artist.create({
        data: {
          name: data.artist.name,
          email: data.artist.email,
          phone: data.artist.phone || null,
          instagram: data.artist.instagram || null,
          soundcloud: data.artist.soundcloud || null,
          spotify: data.artist.spotify || null,
          bio: data.artist.bio || null,
        },
      });
    } else {
      artist = await prisma.artist.update({
        where: { id: artist.id },
        data: {
          name: data.artist.name,
          phone: data.artist.phone || null,
          instagram: data.artist.instagram || null,
          soundcloud: data.artist.soundcloud || null,
          spotify: data.artist.spotify || null,
          bio: data.artist.bio || null,
        },
      });
    }

    const submission = await prisma.submission.create({
      data: {
        artistId: artist.id,
        status: "PENDING",
        tracks: {
          create: data.tracks.map(t => ({
            title: t.title,
            genre: t.genre || null,
            bpm: t.bpm || null,
            musicalKey: t.key || null,
            description: t.description || null,
            originalUrl: t.s3Key
              ? `https://${process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${t.s3Key}`
              : `/uploads/${t.fileName || t.title}.mp3`,
          })),
        },
      },
      include: {
        artist: true,
        tracks: true,
        reviews: {
          include: { reviewer: { select: { name: true } } },
        },
      },
    });

          // Emit realtime event to admin dashboards via SSE (do this first)
          try {
            console.log('Broadcasting new submission via SSE:', submission.id);
            broadcastEvent({
              type: 'new-submission',
              data: submission
            });
            console.log('Successfully broadcasted new submission via SSE');
          } catch (e) {
            console.error('Failed to broadcast realtime event via SSE:', e);
          }

          // Send email notification to artist (non-blocking)
          sendNewSubmissionEmail(
            submission.artist.email,
            submission.artist.name,
            submission.id,
            submission.tracks.length
          ).then(() => {
            console.log('New submission email sent to:', submission.artist.email);
          }).catch((error) => {
            console.error('Failed to send new submission email:', error);
          });

          return NextResponse.json({ success: true, submissionId: submission.id });
  } catch (error) {
    console.error('Submission error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid submission data', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
  }
}
