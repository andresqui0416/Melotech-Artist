import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const presignedUrlSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileType, fileSize } = presignedUrlSchema.parse(body);

    // Validate file type (audio files only)
    const allowedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/m4a',
      'audio/aac',
      'audio/ogg',
      'audio/flac',
      'audio/x-flac',
    ];

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Only audio files are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    // Generate unique key for S3
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `submissions/${timestamp}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      ContentLength: fileSize,
      Metadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    return NextResponse.json({
      presignedUrl,
      key,
      fileName,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
