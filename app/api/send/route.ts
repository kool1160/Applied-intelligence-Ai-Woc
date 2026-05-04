import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { cleanAiwocOutput, hasMissingRequiredAiwocFields } from '../../../features/woc/outputCleanup';

export async function POST(req: Request) {
  try {
    const { subject, emailBody, rawEmailBody } = await req.json();

    if (typeof subject !== 'string' || typeof emailBody !== 'string') {
      return NextResponse.json(
        { error: 'subject and emailBody are required.' },
        { status: 400 }
      );
    }

    const trimmedSubject = subject.trim();
    const cleanedBodyInput = emailBody.trim();
    const validationBody = typeof rawEmailBody === 'string' ? rawEmailBody.trim() : cleanedBodyInput;

    if (!trimmedSubject || !cleanedBodyInput || !validationBody) {
      return NextResponse.json(
        { error: 'subject and emailBody are required.' },
        { status: 400 }
      );
    }

    if (hasMissingRequiredAiwocFields(trimmedSubject, validationBody)) {
      return NextResponse.json(
        { error: 'Required correction fields are missing. Complete the request and confirmation checks before sending.' },
        { status: 400 }
      );
    }

    const trimmedEmailBody = cleanAiwocOutput(cleanedBodyInput);

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
    const sent = await resend.emails.send({
      from,
      to,
      subject: trimmedSubject,
      text: trimmedEmailBody,
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
