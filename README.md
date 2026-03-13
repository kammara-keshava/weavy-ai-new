# Weavy AI Workflow Builder

A pixel-perfect UI/UX clone of workflow builder, focused exclusively on LLM (Large Language Model) workflows.

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** (strict mode)
- **React Flow** for visual workflow canvas
- **Clerk** for authentication
- **PostgreSQL** with Prisma ORM
- **Trigger.dev** for node execution
- **Google Gemini API** for LLM execution
- **Transloadit** for file uploads
- **FFmpeg** for image/video processing
- **Tailwind CSS** for styling
- **Zustand** for state management

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

## Environment Variables

Required environment variables for production:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication public key
- `CLERK_SECRET_KEY` - Clerk authentication secret key
- `DATABASE_URL` - PostgreSQL connection string (Supabase)
- `TRIGGER_SECRET_KEY` - Trigger.dev secret key
- `TRIGGER_API_URL` - Trigger.dev API URL
- `TRIGGER_PROJECT_ID` - Trigger.dev project ID
- `GOOGLE_AI_API_KEY` - Google Gemini API key
- `TRANSLOADIT_KEY` - Transloadit API key
- `TRANSLOADIT_SECRET` - Transloadit secret key

## Deployment to Vercel

1. Push your code to GitHub

2. Import project to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. Configure environment variables:
   - Add all environment variables from `.env.local` to Vercel project settings
   - Go to Project Settings > Environment Variables
   - Add each variable for Production, Preview, and Development environments

4. Deploy:
   - Vercel will automatically build and deploy
   - The build command is: `npm run build`
   - The output directory is: `.next`

5. Database setup:
   - Ensure your Supabase database is accessible from Vercel
   - Run migrations if needed: `npx prisma db push`

## Production Checklist

- ✅ All ESLint warnings resolved
- ✅ TypeScript compilation successful
- ✅ Production build successful
- ✅ Prisma client generated
- ✅ Environment variables configured
- ✅ Database connection tested
- ✅ Middleware configured for authentication

## Notes

- The project uses Supabase PostgreSQL as the database
- Clerk handles authentication and user management
- Trigger.dev manages workflow execution
- FFmpeg processes video frames (ensure it's available in production)
- Transloadit handles file uploads and processing
