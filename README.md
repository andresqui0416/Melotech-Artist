# Music Demo Submission Platform

A comprehensive platform for music artists to submit demos and for A&R teams to review and manage submissions with real-time updates and advanced admin features.

## Features

### For Artists
- **Multi-track Upload**: Upload multiple audio files with progress tracking and ETA
- **Artist Profile**: Complete profile with social links and bio
- **S3 Integration**: Secure file uploads via presigned URLs with retry functionality
- **Email Confirmation**: Automatic confirmation emails upon submission
- **Upload Progress**: Real-time progress tracking with error handling and retry options

### For Administrators
- **Real-time Dashboard**: Live updates via Server-Sent Events (SSE)
- **Audio Playback**: Inline audio player for track review without leaving the dashboard
- **Review System**: Score submissions (1-10) with internal notes and artist feedback
- **Status Management**: Update submission status with automatic email notifications
- **Email Templates**: Customizable email templates with variable substitution and editor
- **Advanced Pagination**: Server-side pagination with filtering and search
- **Connection Status**: Real-time connection indicator for live updates
- **Admin Navigation**: Sidebar navigation with client-side routing
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom animations
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT strategy
- **File Storage**: AWS S3 with presigned URLs
- **Email**: SendGrid with template system
- **Real-time**: Server-Sent Events (SSE)
- **State Management**: React hooks with custom SSE hook
- **Validation**: Zod schemas for type safety
- **Deployment**: Vercel & Railway ready

## Prerequisites

- Node.js 18+ 
- MySQL database
- AWS S3 bucket
- SendGrid account

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="mysql://username:password@host:port/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="your-bucket-name"
S3_BUCKET="your-bucket-name" # Fallback for compatibility

# SendGrid
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@yourlabel.com"

# Admin (Optional - for seeding)
ADMIN_EMAIL="admin@yourlabel.com"
ADMIN_PASSWORD="admin123"
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Melotech-Artist
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. **Seed the database**
   ```bash
   curl -X POST http://localhost:3000/api/seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Database Schema

### Core Models

- **User**: Admin users for authentication
- **Artist**: Artist information and contact details
- **Submission**: Demo submissions with status tracking
- **Track**: Individual audio tracks within submissions
- **Review**: A&R team reviews with scores and feedback
- **EmailTemplate**: Customizable email templates

### Key Relationships

- Artist → Submissions (one-to-many)
- Submission → Tracks (one-to-many)
- Submission → Reviews (one-to-many)
- User → Reviews (one-to-many)

## API Endpoints

### Public Endpoints
- `POST /api/admin/submissions` - Submit demo (creates submission in database)
- `POST /api/upload/presigned-url` - Get S3 upload URL for file uploads

### Admin Endpoints
- `GET /api/admin/submissions` - List submissions (with pagination/filtering/search)
- `PATCH /api/admin/submissions/[id]` - Update submission status (triggers email)
- `POST /api/admin/submissions/[id]` - Add review to submission
- `GET /api/admin/email-templates` - List email templates
- `POST /api/admin/email-templates` - Create email template
- `PUT /api/admin/email-templates` - Update email template

### Real-time Endpoints
- `GET /api/events` - Server-Sent Events endpoint for real-time updates

### Utility Endpoints
- `POST /api/seed` - Seed database with default data and email templates

## Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set environment variables** in Vercel dashboard

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Railway Deployment

1. **Connect to Railway**
   ```bash
   npm i -g @railway/cli
   railway login
   railway init
   ```

2. **Set environment variables** in Railway dashboard

3. **Deploy**
   ```bash
   railway up
   ```

## Usage

### For Artists

1. Visit `/submit` to access the submission portal
2. Fill in artist information
3. Upload audio tracks (MP3, WAV, M4A, AAC, OGG, FLAC)
4. Submit and receive confirmation email

### For Administrators

1. Login at `/admin/login` (credentials from environment variables)
2. Access dashboard at `/admin/dashboard` with real-time updates
3. Review submissions with inline audio playback
4. Add reviews with scores and feedback
5. Update submission status (triggers email notifications)
6. Manage email templates at `/admin/email-templates`
7. Monitor connection status for real-time updates
8. Use sidebar navigation for seamless page transitions

## File Upload Process

1. **Client requests presigned URL** from `/api/upload/presigned-url`
2. **Server validates file** (type, size) and generates S3 presigned URL
3. **Client uploads directly to S3** with progress tracking and ETA
4. **Background uploads** start immediately on file selection
5. **Submit button waits** for all uploads to complete
6. **Submission API stores S3 URLs** in database with real-time broadcast

## Email System

- **Confirmation emails** sent automatically on submission (PENDING status)
- **Status update emails** sent when admins change submission status
- **Template system** with variable substitution ({{artistName}}, {{submissionId}}, etc.)
- **Default templates** seeded automatically (submission-received, submission-in-review, submission-approved, submission-rejected)
- **Fallback handling** - submission succeeds even if email fails
- **Template editor** in admin panel for customization

## Real-time Features

- **Server-Sent Events (SSE)** for live updates
- **Connection status** indicator in admin dashboard
- **Automatic reconnection** on connection loss
- **Live submission notifications** with slide-in animations
- **Real-time status updates** across all admin sessions

## Security Features

- **Authentication required** for all admin endpoints
- **File type validation** for uploads (MP3, WAV, M4A, AAC, OGG, FLAC)
- **File size limits** (50MB max per file)
- **Presigned URLs** for secure S3 uploads with expiration
- **Input validation** with Zod schemas
- **CORS configuration** for S3 bucket
- **Environment variable protection** (server-side only)
- **JWT-based authentication** with NextAuth.js

## Development

### Database Management
```bash
# View database
npx prisma studio

# Reset database
npx prisma migrate reset

# Generate new migration
npx prisma migrate dev --name migration-name
```

### Testing
```bash
# Run type checking
npm run type-check

# Run linting
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please contact the development team or create an issue in the repository.
