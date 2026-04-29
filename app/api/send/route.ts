import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { subject, emailBody, reportBody } = await req.json();

    if (!subject || !emailBody || !reportBody) {
      return NextResponse.json({ error: 'subject, emailBody, and reportBody are required.' }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Email provider is not configured yet. The draft and report were generated successfully.',
    }, { status: 501 });
  } catch {
    return NextResponse.json({ error: 'Failed to process send request.' }, { status: 500 });
  }
}
