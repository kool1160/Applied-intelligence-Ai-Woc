import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const sectionLabels = [
  'Title',
  'Correction Type',
  'Priority',
  'Part / Work Order Information',
  'Work Order Number',
  'Part Number',
  'Revision',
  'Customer',
  'Quantity',
  'Department',
  'Operation / Router Step',
  'Process',
  'Current Work Order Condition',
  'Observed Problem',
  'Corrected / Requested Information',
  'Time Correction Details',
  'Current Listed Rate',
  'Observed Sustainable Baseline',
  'Recommended Engineering Baseline',
  'Reason for Correction',
  'Evidence / Basis for Correction',
  'Risk if Not Corrected',
  'Requested Engineering Action',
  'Submitted By',
  'Date',
];

function sectionValue(source: string, label: string) {
  const lines = source.replace(/\r/g, '').split('\n');
  const normalizedLabels = new Set(sectionLabels.map((item) => `${item}:`.toLowerCase()));
  const target = `${label}:`.toLowerCase();
  const startIndex = lines.findIndex((line) => line.trim().toLowerCase() === target);

  if (startIndex === -1) return '';

  const values: string[] = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();

    if (normalizedLabels.has(trimmed.toLowerCase())) break;
    if (trimmed) values.push(trimmed);
  }

  return values.join(' ').replace(/\s+/g, ' ').trim();
}

function compactValue(value: string, fallback = 'Not provided') {
  const cleaned = value.replace(/^\[(.*)\]$/, '$1').trim();
  return cleaned || fallback;
}

function fromReport(reportBody: string, label: string, fallbackLabel?: string) {
  return sectionValue(reportBody, label) || (fallbackLabel ? sectionValue(reportBody, fallbackLabel) : '');
}

function buildOnePageEmail(subject: string, reportBody: string) {
  const workOrder = compactValue(fromReport(reportBody, 'Work Order Number'));
  const partNumber = compactValue(fromReport(reportBody, 'Part Number'));
  const revision = compactValue(fromReport(reportBody, 'Revision'), 'N/A');
  const customer = compactValue(fromReport(reportBody, 'Customer'), 'N/A');
  const quantity = compactValue(fromReport(reportBody, 'Quantity'), 'N/A');
  const department = compactValue(fromReport(reportBody, 'Department'), 'N/A');
  const operation = compactValue(fromReport(reportBody, 'Operation / Router Step'));
  const process = compactValue(fromReport(reportBody, 'Process'), 'N/A');
  const issue = compactValue(fromReport(reportBody, 'Observed Problem'));
  const current = compactValue(fromReport(reportBody, 'Current Listed Rate', 'Current Work Order Condition'));
  const observed = compactValue(fromReport(reportBody, 'Observed Sustainable Baseline'), 'N/A');
  const requested = compactValue(fromReport(reportBody, 'Requested Engineering Action'));
  const priority = compactValue(fromReport(reportBody, 'Priority'), 'N/A');
  const date = compactValue(fromReport(reportBody, 'Date'), new Date().toLocaleDateString('en-US'));

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
    const onePageBody = buildOnePageEmail(trimmedSubject, trimmedReportBody);

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
