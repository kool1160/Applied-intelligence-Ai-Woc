import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const { subject, emailBody, reportBody } = await req.json();

    if (typeof subject !== 'string' || typeof emailBody !== 'string' || typeof reportBody !== 'string') {
      return NextResponse.json(
        { error: 'subject, emailBody, and reportBody are required.' },
        { status: 400 }
      );
    }

    const trimmedSubject = subject.trim();
    const trimmedEmailBody = emailBody.trim();
    const trimmedReportBody = reportBody.trim();

    if (!trimmedSubject || !trimmedEmailBody || !trimmedReportBody) {
      return NextResponse.json(
        { error: 'subject, emailBody, and reportBody are required.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.AI_WOC_FROM_EMAIL;
    const to = process.env.AI_WOC_DEFAULT_TO_EMAIL;

    if (!apiKey || !from || !to) {
      return NextResponse.json(
        { error: 'Server email configuration is missing.' },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const fullBody = `${trimmedEmailBody}\n\n--------------------\nENGINEERING WORK ORDER CORRECTION REPORT\n--------------------\n\n${trimmedReportBody}`;

    const sent = await resend.emails.send({
      from,
      to,
      subject: trimmedSubject,
      text: fullBody,
    });

    if (sent.error) {
      return NextResponse.json(
        { error: 'Email provider rejected the request.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, id: sent.data?.id ?? null });
  } catch {
    return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
  }
}
