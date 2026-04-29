import { NextResponse } from 'next/server';
import { Resend } from 'resend';

function sectionValue(source: string, label: string) {
  const pattern = new RegExp(`${label}:\\s*\\n?([\\s\\S]*?)(?=\\n\\n[A-Z][A-Za-z /]+:|\\n\\n[A-Z][A-Za-z /]+ \\/ [A-Za-z /]+:|$)`, 'i');
  const match = source.match(pattern);
  return match?.[1]?.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim() || '';
}

function compactValue(value: string, fallback = 'Not provided') {
  const cleaned = value.replace(/^\[(.*)\]$/, '$1').trim();
  return cleaned || fallback;
}

function buildOnePageEmail(subject: string, emailBody: string, reportBody: string) {
  const combined = `${emailBody}\n\n${reportBody}`;

  const workOrder = compactValue(sectionValue(combined, 'Work Order') || sectionValue(combined, 'Work Order Number'));
  const partNumber = compactValue(sectionValue(combined, 'Part Number'));
  const revision = compactValue(sectionValue(combined, 'Revision'), 'N/A');
  const customer = compactValue(sectionValue(combined, 'Customer'), 'N/A');
  const quantity = compactValue(sectionValue(combined, 'Quantity'), 'N/A');
  const department = compactValue(sectionValue(combined, 'Department'), 'N/A');
  const operation = compactValue(sectionValue(combined, 'Operation') || sectionValue(combined, 'Operation / Router Step'));
  const process = compactValue(sectionValue(combined, 'Process'), 'N/A');
  const issue = compactValue(sectionValue(combined, 'Issue Summary') || sectionValue(combined, 'Observed Problem'));
  const current = compactValue(sectionValue(combined, 'Current Listed Condition') || sectionValue(combined, 'Current Listed Rate') || sectionValue(combined, 'Current Work Order Condition'));
  const observed = compactValue(sectionValue(combined, 'Observed Sustainable Baseline / Corrected Information') || sectionValue(combined, 'Observed Sustainable Baseline'), 'N/A');
  const requested = compactValue(sectionValue(combined, 'Requested Correction') || sectionValue(combined, 'Requested Engineering Action'));
  const priority = compactValue(sectionValue(combined, 'Priority'), 'N/A');
  const date = compactValue(sectionValue(combined, 'Date'), new Date().toLocaleDateString('en-US'));

  return `Engineering Team,

WORK ORDER CORRECTION REQUEST

WO: ${workOrder}
Part: ${partNumber}
Rev: ${revision} | Customer: ${customer} | Qty: ${quantity}
Dept/Operation: ${department} / ${operation}
Process: ${process}
Priority: ${priority}

Issue:
${issue}

Current Listed Condition:
${current}

Observed / Corrected Information:
${observed}

Requested Engineering Action:
${requested}

Reason:
The current router/work order information may create inaccurate scheduling, labor planning, costing, or production expectations if left unchanged.

Submitted by: Chris
Date: ${date}

Subject reference: ${subject}`;
}

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
    const onePageBody = buildOnePageEmail(trimmedSubject, trimmedEmailBody, trimmedReportBody);

    const sent = await resend.emails.send({
      from,
      to,
      subject: trimmedSubject,
      text: onePageBody,
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
