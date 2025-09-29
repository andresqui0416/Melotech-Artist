import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const emailTemplateSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1),
  subject: z.string().min(1),
  htmlBody: z.string().min(1),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = emailTemplateSchema.parse(body);

    const template = await prisma.emailTemplate.create({
      data: {
        key: validatedData.key,
        subject: validatedData.subject,
        htmlBody: validatedData.htmlBody,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error creating email template:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid template data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create email template" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = emailTemplateSchema.parse(body);

    if (!validatedData.id) {
      return NextResponse.json(
        { error: "Template ID is required for updates" },
        { status: 400 }
      );
    }

    const template = await prisma.emailTemplate.update({
      where: { id: validatedData.id },
      data: {
        key: validatedData.key,
        subject: validatedData.subject,
        htmlBody: validatedData.htmlBody,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error updating email template:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid template data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update email template" },
      { status: 500 }
    );
  }
}
