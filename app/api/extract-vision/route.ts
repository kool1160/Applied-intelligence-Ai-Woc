import { NextResponse } from 'next/server';

const MODEL = 'gpt-4.1-mini';

const visionPrompt = `You are reading a manufacturing ERP router header. Extract only visible header fields. Do not guess. If uncertain, leave blank and add the field name to needsReview.

Fields:
Work Order, Description, Due Date, Quantity, UO, Sales Order, Part Number, Rev, Customer Name, Cust Number, Cust PO Number, CAD Drawing.

Normalize:
- Split work order like 042603 002 to 042603-002 when clearly shown as a work order.
- Quantity should include UO if visible, like 500.00 EA.
- Customer should not include date or quantity values.
- CAD Drawing should not overwrite Part Number unless part number is blank.

Return strict JSON with only:
workOrder, partNumber, revision, customer, quantity, salesOrder, customerPo, cadDrawing, confidence, needsReview`;

type VisionResult = {
  workOrder: string;
  partNumber: string;
  revision: string;
  customer: string;
  quantity: string;
  salesOrder: string;
  customerPo: string;
  cadDrawing: string;
  confidence: number;
  needsReview: string[];
};

const emptyResult: VisionResult = {
  workOrder: '',
  partNumber: '',
  revision: '',
  customer: '',
  quantity: '',
  salesOrder: '',
  customerPo: '',
  cadDrawing: '',
  confidence: 0,
  needsReview: [],
};

function safeErrorMessage(error: unknown) {
  if (typeof error === 'string' && error.trim()) {
    return error
      .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted-key]')
      .replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '[redacted-image-data]')
      .trim();
  }
  if (!error || typeof error !== 'object') return 'OpenAI request failed.';
  const candidate = 'message' in error ? error.message : '';
  if (typeof candidate !== 'string' || !candidate.trim()) return 'OpenAI request failed.';

  return candidate
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted-key]')
    .replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '[redacted-image-data]')
    .trim();
}

function extractResponseText(payload: unknown) {
  if (!payload || typeof payload !== 'object') return '';
  const value = payload as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ type?: string; text?: string; value?: string }> }>;
  };

  if (typeof value.output_text === 'string' && value.output_text.trim()) {
    return value.output_text.trim();
  }

  if (!Array.isArray(value.output)) return '';
  for (const item of value.output) {
    if (!item || !Array.isArray(item.content)) continue;
    for (const contentItem of item.content) {
      if (!contentItem || typeof contentItem !== 'object') continue;
      const text = typeof contentItem.text === 'string' ? contentItem.text : '';
      const valueText = typeof contentItem.value === 'string' ? contentItem.value : '';
      if (text.trim()) return text.trim();
      if (valueText.trim()) return valueText.trim();
    }
  }

  return '';
}

function sanitizeResult(raw: unknown): VisionResult {
  const value = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
  const cleanText = (input: unknown) => typeof input === 'string' ? input.trim() : '';
  const confidence = typeof value.confidence === 'number' ? Math.max(0, Math.min(1, value.confidence)) : 0;

  return {
    workOrder: cleanText(value.workOrder),
    partNumber: cleanText(value.partNumber),
    revision: cleanText(value.revision),
    customer: cleanText(value.customer),
    quantity: cleanText(value.quantity),
    salesOrder: cleanText(value.salesOrder),
    customerPo: cleanText(value.customerPo),
    cadDrawing: cleanText(value.cadDrawing),
    confidence,
    needsReview: Array.isArray(value.needsReview)
      ? value.needsReview.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
      : [],
  };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY on server.' }, { status: 500 });
    }

    const formData = await request.formData();
    const image = formData.get('image');

    if (image == null) {
      return NextResponse.json({ error: 'Missing image upload.' }, { status: 400 });
    }

    if (!(image instanceof File)) {
      return NextResponse.json({ error: 'Invalid image payload.' }, { status: 400 });
    }

    if (!image.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Uploaded file must be an image.' }, { status: 400 });
    }

    const bytes = Buffer.from(await image.arrayBuffer());
    const dataUrl = `data:${image.type};base64,${bytes.toString('base64')}`;

    let openAiResponse: Response;
    try {
      openAiResponse = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          input: [
            {
              role: 'user',
              content: [
                { type: 'input_text', text: visionPrompt },
                { type: 'input_image', image_url: dataUrl },
              ],
            },
          ],
          text: {
            format: {
              type: 'json_schema',
              name: 'router_header_extraction',
              schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  workOrder: { type: 'string' },
                  partNumber: { type: 'string' },
                  revision: { type: 'string' },
                  customer: { type: 'string' },
                  quantity: { type: 'string' },
                  salesOrder: { type: 'string' },
                  customerPo: { type: 'string' },
                  cadDrawing: { type: 'string' },
                  confidence: { type: 'number' },
                  needsReview: { type: 'array', items: { type: 'string' } },
                },
                required: ['workOrder', 'partNumber', 'revision', 'customer', 'quantity', 'salesOrder', 'customerPo', 'cadDrawing', 'confidence', 'needsReview'],
              },
              strict: true,
            },
          },
        }),
      });
    } catch (error) {
      return NextResponse.json({ error: `OpenAI request failure: ${safeErrorMessage(error)}` }, { status: 502 });
    }

    if (!openAiResponse.ok) {
      const errText = await openAiResponse.text();
      return NextResponse.json({ error: `OpenAI request failure: ${safeErrorMessage(errText)}` }, { status: 502 });
    }

    const payload = await openAiResponse.json();
    const responseText = extractResponseText(payload);
    if (!responseText) {
      return NextResponse.json({ error: 'OpenAI response did not include extraction text.' }, { status: 502 });
    }

    let raw: unknown = emptyResult;
    try {
      raw = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ error: 'Unable to parse extraction JSON from OpenAI response.' }, { status: 502 });
    }

    return NextResponse.json(sanitizeResult(raw));
  } catch (error) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
  }
}
