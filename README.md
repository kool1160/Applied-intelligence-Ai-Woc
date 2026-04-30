# Applied Intelligence AI-WOC

AI-WOC is the Applied Intelligence Work Order Correction Agent.

Purpose: create a lightweight mobile-first app for work order correction reports and Engineering email drafts.

Core workflow: Snap -> Extract -> Confirm -> Issue -> Generate Draft -> Confirm -> Send.

Default recipient: Christophertroyhilton@gmail.com

Hard rule: generate a draft first, require confirmation, then enable send.

MVP stack: Next.js, TypeScript, local state, server-side email route.

Boundaries: AI-WOC is not AI-CIS. Do not create Lean Incident Reports, ROI reports, or case studies.

## Local setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in the local values in `.env.local`.

Do not commit `.env.local` or any real API keys.

## Environment variables

```env
RESEND_API_KEY=
AI_WOC_FROM_EMAIL=
AI_WOC_DEFAULT_TO_EMAIL=Christophertroyhilton@gmail.com
OPENAI_API_KEY=your_openai_api_key_here
```

`RESEND_API_KEY` is used only by the server-side send route.

`OPENAI_API_KEY` is used only by the server-side `/api/extract-vision` route for AI Vision header extraction.

`AI_WOC_FROM_EMAIL` must be a sender address approved by the email provider.

`AI_WOC_DEFAULT_TO_EMAIL` is the default Engineering correction request recipient.

## Run the app

```bash
npm run dev
```

Build check:

```bash
npm run build
```

## Confirmation-before-send workflow

AI-WOC must not send automatically.

The app generates two outputs first:

1. Engineering Work Order Correction Report
2. Engineering email draft

The Send Email button remains disabled until the user confirms:

- Work order number is correct
- Part number is correct
- Operation/process is correct
- Issue and requested correction are accurate
- Email draft is ready to send

## API route

`POST /api/send`

Expected JSON body:

```json
{
  "subject": "Work Order Correction Request",
  "emailBody": "Email draft body",
  "reportBody": "Engineering Work Order Correction Report"
}
```

The route appends the report below the email draft and sends the message using Resend from the server side.
