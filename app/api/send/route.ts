import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const MISSING_REQUIRED_MARKERS = [
  '[PROBLEM SUMMARY REQUIRED]',
  '[REQUESTED ENGINEERING ACTION REQUIRED]',
];

const OPTIONAL_BLOCK_FIELDS = [
  'Revision',
  'Customer',
  'Quantity',
  'Department',
  'Operation / Router Step',
  'Process',
  'Current Work Order Condition',
  'Current Listed Rate',
  'Observed Sustainable Baseline',
  'Recommended Engineering Baseline',
  'Current Listed Condition',
  'Observed Sustainable Baseline / Corrected Information',
];

const OPTIONAL_PLACEHOLDERS = [
  '[N/A]',
  '[VERIFY OPERATION]',
  '[VERIFY PROCESS]',
  '[VERIFY DEPARTMENT]',
  '[CURRENT CONDITION REQUIRED]',
  '[ENGINEERING REVIEW REQUIRED]',
];

function escapeRegExp(value: string) {
  return value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function cleanOptionalBlocks(text: string) {
  let output = text;
  const placeholderPattern = OPTIONAL_PLACEHOLDERS.map(escapeRegExp).join('|');

  for (const field of OPTIONAL_BLOCK_FIELDS) {
    const pattern = new RegExp(`\\n?${escapeRegExp(field)}:\\n(?:${placeholderPattern})\\n`, 'g');
    output = output.replace(pattern, '\n');
  }

  return output
    .replace(/Operation:\n\[VERIFY OPERATION\] – \[VERIFY PROCESS\]\n/g, '')
    .replace(/Operation:\n([^\n]+) – \[VERIFY PROCESS\]\n/g, 'Operation:\n$1\n')
    .replace(/Operation:\n\[VERIFY OPERATION\] – ([^\n]+)\n/g, 'Process:\n$1\n')
    .replace(/Current Listed Condition:\n\[CURRENT CONDITION REQUIRED\]\n/g, '')
    .replace(/Observed Sustainable Baseline \/ Corrected Information:\n\[N\/A\]\n/g, '');
}

function cleanRequiredIdentifierPlaceholders(text: string) {
  return text
    .replace(/\[VERIFY WORK ORDER\]/g, 'Not provided')
    .replace(/\[VERIFY PART NUMBER\]/g, 'Not provided')
    .replace(/\[WO REQUIRED\]/g, 'Missing required field — complete before sending.')
    .replace(/\[PART REQUIRED\]/g, 'Missing required field — complete before sending.')
    .replace(/\[CATEGORY REQUIRED\]/g, 'Missing required field — complete before sending.')
    .replace(/\[PROBLEM SUMMARY REQUIRED\]/g, 'Missing required field — complete before sending.')
    .replace(/\[REQUESTED ENGINEERING ACTION REQUIRED\]/g, 'Missing required field — complete before sending.');
}

function normalizeWhitespace(text: string) {
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanAiwocOutput(text: string) {
  return normalizeWhitespace(cleanRequiredIdentifierPlaceholders(cleanOptionalBlocks(text)));
}

function hasMissingRequiredFields(subject: string, emailBody: string) {
  if (subject.includes('[CATEGORY REQUIRED]') || subject.includes('CATEGORY TBD')) return true;
  if (MISSING_REQUIRED_MARKERS.some((marker) => emailBody.includes(marker))) return true;

  const workOrderMissing = emailBody.includes('[VERIFY WORK ORDER]') || subject.includes('WO TBD');
  const partNumberMissing = emailBody.includes('[VERIFY PART NUMBER]') || subject.includes('PART TBD');
  return workOrderMissing && partNumberMissing;
}

export async function POST(req: Request) {
  try {
    const { subject, emailBody } = await req.json();

    if (typeof subject !== 'string' || typeof emailBody !== 'string') {
      return NextResponse.json(
        { error: 'subject and emailBody are required.' },
        { status: 400 }
      );
    }

    const trimmedSubject = subject.trim();
    const rawEmailBody = emailBody.trim();

    if (!trimmedSubject || !rawEmailBody) {
      return NextResponse.json(
        { error: 'subject and emailBody are required.' },
        { status: 400 }
      );
    }

    if (hasMissingRequiredFields(trimmedSubject, rawEmailBody)) {
      return NextResponse.json(
        { error: 'Required correction fields are missing. Complete the request and confirmation checks before sending.' },
        { status: 400 }
      );
    }

    const trimmedEmailBody = cleanAiwocOutput(rawEmailBody);

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
