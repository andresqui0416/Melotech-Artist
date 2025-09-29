import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendStatusChangeEmail } from "@/lib/email-templates";
import { broadcastEvent } from "@/app/api/events/route";
import { z } from "zod";

const updateSubmissionSchema = z.object({
  status: z.enum(["PENDING", "IN_REVIEW", "APPROVED", "REJECTED"]),
  notesForTeam: z.string().optional(),
});

const createReviewSchema = z.object({
  score: z.number().min(1).max(10),
  internalNotes: z.string().optional(),
  feedbackForArtist: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateSubmissionSchema.parse(body);

    const submission = await prisma.submission.update({
      where: { id },
      data: {
        status: validatedData.status,
        notesForTeam: validatedData.notesForTeam,
      },
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
    });

    // Send status update email to artist
    try {
      await sendStatusChangeEmail(
        submission.artist.email,
        submission.artist.name,
        submission.id,
        validatedData.status,
        validatedData.notesForTeam
      );
    } catch (error) {
      console.error('Failed to send status update email:', error);
      // Don't fail the update if email fails
    }

    // Emit real-time event for submission update
    try {
      broadcastEvent({
        type: 'submission-updated',
        data: submission
      });
    } catch (error) {
      console.error('Failed to emit submission update event:', error);
      // Don't fail the update if event emission fails
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error updating submission:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);


    const review = await prisma.review.create({
      data: {
        submissionId: id,
        reviewerId: (session.user as any).id,
        score: validatedData.score,
        internalNotes: validatedData.internalNotes,
        feedbackForArtist: validatedData.feedbackForArtist,
      },
      include: {
        reviewer: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
