
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = "nodejs";
export const maxDuration = 30; // Increase timeout for database queries

export async function GET(request: NextRequest) {
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const { prisma } = await import('@/lib/prisma');

    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      console.log('[History API] Database connection test passed');
    } catch (dbError) {
      console.error('[History API] Database connection test failed:', dbError);
      return NextResponse.json({ error: 'Database connection failed', data: [] }, { status: 500 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[History API] Clerk userId from auth:', userId);

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });
      console.log('[History API] prisma.user.findUnique result:', user ? { id: user.id, clerkId: user.clerkId } : null);
    } catch (dbError) {
      console.error("Database error finding user:", dbError);
      return NextResponse.json({ error: 'Database error', data: [] }, { status: 200 });
    }

    if (!user) {
      return NextResponse.json([]);
    }

    let runs;
    try {
      runs = await prisma.workflowRun.findMany({
        where: { userId: user.id },
        include: {
          nodes: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10, // Reduced from 50 to prevent large responses
      });
      console.log('[History API] fetched runs count for user', user.id, ':', runs.length);
    } catch (dbError) {
      console.error("Database error fetching history:", dbError);
      return NextResponse.json({ error: 'Database error', data: [] }, { status: 200 });
    }

    return NextResponse.json(runs);
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json({ error: 'Internal server error', data: [] }, { status: 500 });
  }
}
