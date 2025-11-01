import { NextRequest, NextResponse } from 'next/server';
import seedCourses from '@/lib/seedData';

export async function POST(request: NextRequest) {
  try {
    await seedCourses();
    return NextResponse.json({ success: true, message: 'Seed data created successfully' });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed data' },
      { status: 500 }
    );
  }
}

