'use client';

import { useMemo, useRef, useState } from 'react';

declare global {
  interface Window {
    Tesseract?: {
      recognize: (image: File | string, lang?: string) => Promise<{ data: { text: string } }>;
    };
  }
}



type WocData = {
  workOrder: string;
  partNumber: string;
  revision: string;
  customer: string;
  quantity: string;
  department: string;
  operation: string;
  process: string;
  currentListedRate: string;
  observedBaseline: string;
  issueType: string;
  correctionType: string;
  category: string;
  priority: string;
  problemSummary: string;
  requestedAction: string;
  optionalNote: string;
};

type SubmissionRecord = {
  wocId: string;
  dateSubmitted: string;
  submittedBy: string;
  workOrderNumber: string;
  partNumber: string;
  departmentProcess: string;
  issueType: string;
  category: string;
  priority: string;
  requestedAction: string;
  status: string;
  assignedOwner: string;
  engineeringNotes: string;
  erpUpdated: boolean;
  closedDate: string;
};

const DEFAULT_TO_EMAIL = 'Christophertroyhilton@gmail.com';

const blank: WocData = {
  workOrder: '',
  partNumber: '',
  revision: '',
  customer: '',
  quantity: '',
  department: '',
  operation: '',
  process: '',
  currentListedRate: '',
  observedBaseline: '',
  issueType: 'Incorrect Time / Rate',
  correctionType: 'Incorrect Time / Rate',
  category: '',
  priority: 'Medium',
  problemSummary: '',
  requestedAction: '',
  optionalNote: '',
};

const confirmationLabels = [
  'I confirm the work order number is correct.',
  'I confirm the part number is correct.',
  'I confirm the operation/process is correct.',
  'I confirm the issue and requested correction are accurate.',
  'I confirm the email draft is ready to send.',
];

type TaskView = 'Home' | 'Capture' | 'Build Correction' | 'Drafts' | 'History' | 'More';

const workflow: [string, string, string, TaskView][] = [
  ['📷', 'Capture Router', 'Snap or upload work order.', 'Capture'],
  ['📋', 'Extract + Confirm', 'Pull WO, part, process, and rate into clean fields.', 'Capture'],
  ['🗂', 'Build Correction', 'Generate report and Engineering email draft.', 'Build Correction'],
  ['➤', 'Confirm + Send', 'Draft first. Confirm accuracy. Then send.', 'Drafts'],
];

const navItems: [string, TaskView][] = [
  ['⌂', 'Home'],
  ['📷', 'Capture'],
  ['🗂', 'Drafts'],
  ['◷', 'History'],
  ['⚙', 'More'],
];

const correctionTypeOptions = [
  'Incorrect Time / Rate',
  'Missing Grind / Finish Operation',
  'Missing Weld Operation',
  'Missing Fixture / Work Instruction',
  'Wrong / Missing Router Step',
  'Other',
];

const operationProcessOptions = [
  'Welding',
  'Cobot Welding',
  'Grinding / Finish',
  'Laser / Forming',
  'Inspection / Quality',
  'Fixture / Setup',
  'Other',
];

const currentConditionOptions = [
  '0 / missing time',
  'Incorrect rate',
  'Missing operation',
  'Missing setup',
  'Missing fixture callout',
  'Other/manual',
];
const categoryOptions = ['Welding', 'Machining', 'Fixtures', 'Routing', 'Material', 'Hardware', 'Quality', 'Other'];
const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];

const dataFields: [keyof WocData, string][] = [
  ['workOrder', 'Work Order Number'],
  ['partNumber', 'Part Number'],
  ['revision', 'Revision'],
  ['customer', 'Customer'],
  ['quantity', 'Quantity'],
  ['department', 'Department'],
  ['operation', 'Operation / Router Step'],
  ['process', 'Process'],
  ['currentListedRate', 'Current Listed Rate'],
  ['observedBaseline', 'Observed Sustainable Baseline'],
];

function firstMatch(source: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match?.[1]) return match[1].trim().replace(/\s+/g, ' ');
  }

  return '';
}

function cleanLine(value: string) {
  return value.replace(/[|]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeWorkOrder(value: string) {
  const cleaned = value.trim().replace(/\s+/g, ' ');
  const hyphenated = cleaned.match(/^([0-9]{4,8})-([0-9]{2,4})$/);
  if (hyphenated) return `${hyphenated[1]}-${hyphenated[2]}`;

  const split = cleaned.match(/^([0-9]{4,8})\s+([0-9]{2,4})$/);
  if (split) return `${split[1]}-${split[2]}`;

  return cleaned.replace(/\s+/g, '');
}

function normalizeQuantityCandidate(value: string) {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

function extractRouterData(source: string, existing: WocData): WocData {
  const text = source.replace(/\r/g, '\n');
  const lines = text.split('\n').map(cleanLine).filter(Boolean);
  const joined = lines.join('\n');

  const workOrderRaw = firstMatch(joined, [
    /(?:work\s*order|workorder|wo|w\/o)\s*(?:number|no\.?|#|:)?\s*[:#-]?\s*([0-9]{4,8}[-\s]?[0-9]{2,4})/i,
    /\b([0-9]{4,8}\s+[0-9]{2,4})\b/,
    /\b([0-9]{5,6}-[0-9]{3})\b/,
  ]);
  const workOrder = workOrderRaw ? normalizeWorkOrder(workOrderRaw) : '';

  const tableHeaderIndex = lines.findIndex((line) => /part\s*number\s*\/\s*rev\s*\/\s*loc/i.test(line));
  const tableLine = tableHeaderIndex >= 0 ? lines[tableHeaderIndex + 1] ?? '' : '';

  const tablePartNumber = firstMatch(tableLine, [/^\s*([A-Z0-9][A-Z0-9._/-]{2,})\b/i]);
  const tableRevision = firstMatch(tableLine, [/^\s*[A-Z0-9][A-Z0-9._/-]{2,}\s+([A-Z0-9]{1,4})\b/i]);
  const tableCustomer = tableLine
    ? tableLine
      .replace(/^\s*[A-Z0-9][A-Z0-9._/-]{2,}\s+[A-Z0-9]{1,4}\s*/i, '')
      .trim()
    : '';

  const partNumberFromLabel = firstMatch(joined, [
    /(?:part\s*(?:number|no\.?|#)|item\s*(?:number|no\.?|#))\s*[:#-]?\s*([A-Z0-9][A-Z0-9._/-]{3,})/i,
    /\b([A-Z]{2,5}-[A-Z0-9._/-]{3,})\b/,
  ]);
  const partNumberFromCad = firstMatch(joined, [
    /(?:cad\s*drawing)\s*[:#-]?\s*([A-Z0-9][A-Z0-9._/-]{2,})/i,
  ]);
  const partNumber = tablePartNumber || partNumberFromLabel || partNumberFromCad;

  const revision = tableRevision || firstMatch(joined, [
    /(?:rev(?:ision)?\.?)\s*[:#-]?\s*([A-Z0-9]{1,4})\b/i,
  ]);

  const customer = tableCustomer || firstMatch(joined, [
    /(?:customer|cust\.?)\s*[:#-]?\s*([A-Z0-9][A-Z0-9 .&/-]{2,})/i,
  ]);

  const blockedQuantityValues = new Set(
    [workOrder, partNumber, partNumberFromCad]
      .filter(Boolean)
      .map((value) => normalizeQuantityCandidate(value as string)),
  );
  const salesOrderValue = firstMatch(joined, [/(?:sales\s*order)\s*[:#-]?\s*([A-Z0-9._/-]{4,})/i]);
  if (salesOrderValue) blockedQuantityValues.add(normalizeQuantityCandidate(salesOrderValue));

  const quantityCandidates: string[] = [];
  const addQuantityCandidate = (value?: string) => {
    if (!value) return;
    const candidate = normalizeQuantityCandidate(value);
    if (!candidate || blockedQuantityValues.has(candidate)) return;
    if (/^[0-9]{5,7}$/.test(candidate)) return;
    quantityCandidates.push(candidate);
  };

  addQuantityCandidate(firstMatch(joined, [/(?:quantity|qty)\s*[:#-]?\s*([0-9]+\.[0-9]{2}\s*(?:ea|pcs?|pieces?)?)/i]));

  const headerIndex = lines.findIndex((line) => /work\s*order.*due.*quantity.*(?:uo|u\/o|unit|ship\s*quantity)/i.test(line));
  const dataLine = headerIndex >= 0 ? lines[headerIndex + 1] ?? '' : '';
  if (dataLine) {
    const qtyUoMatch = dataLine.match(/\b([0-9]+\.[0-9]{2})\s+([A-Z]{1,4})\b/);
    if (qtyUoMatch) addQuantityCandidate(`${qtyUoMatch[1]} ${qtyUoMatch[2]}`);
    const qtyDecimal = dataLine.match(/\b([0-9]+\.[0-9]{2})\b/);
    if (qtyDecimal) addQuantityCandidate(qtyDecimal[1]);
  }

  addQuantityCandidate(firstMatch(joined, [/(?:quantity|qty)\s*[:#-]?\s*([0-9]+\s*(?:ea|pcs?|pieces?))/i]));
  addQuantityCandidate(firstMatch(joined, [/(?:quantity|qty)\s*[:#-]?\s*([0-9]+)/i]));

  const quantity = quantityCandidates[0] ?? '';

  const operation = firstMatch(joined, [
    /(?:operation|op\.?|router\s*step)\s*[:#-]?\s*([0-9]{3,6}\s*[A-Z0-9 /.-]{0,28})/i,
    /\b([0-9]{4,6}\s+[A-Z]\s+[A-Z0-9]{2,8})\b/i,
  ]);

  const process = firstMatch(joined, [
    /(?:process|department|dept\.?)\s*[:#-]?\s*(welding|weld|wd10|l\s*wd10|fabrication|forming|laser|paint|assembly|machining|grind(?:ing)?)/i,
    /\b(welding|weld|wd10|l\s*wd10)\b/i,
  ]);

  const currentListedRate = firstMatch(joined, [
    /(?:rate|runtime|run\s*time|parts\s*per\s*hour|pcs\s*per\s*hour|per\s*hour)\s*[:#-]?\s*([0-9]+(?:\.[0-9]+)?\s*(?:parts|pcs|pieces|ea)?\s*(?:\/|per)?\s*(?:hr|hour)?)\b/i,
    /\b([0-9]+(?:\.[0-9]+)?\s*(?:parts|pcs|pieces|ea)\s*(?:\/|per)\s*(?:hr|hour))\b/i,
  ]);

  const detectedDepartment = /weld|wd10/i.test(process || operation || joined)
    ? 'Welding'
    : existing.department;

  return {
    ...existing,
    workOrder: workOrder || existing.workOrder,
    partNumber: partNumber || existing.partNumber,
    revision: revision || existing.revision,
    customer: customer || existing.customer,
    quantity: quantity || existing.quantity,
    department: detectedDepartment || existing.department,
    operation: operation || existing.operation,
    process: process ? process.toUpperCase().replace(/\s+/g, ' ') : existing.process,
    currentListedRate: currentListedRate || existing.currentListedRate,
  };
}

async function prepareImageForVision(file: File): Promise<File> {
  let objectUrl = '';
  try {
    objectUrl = URL.createObjectURL(file);
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Unable to load image for vision preparation.'));
      img.src = objectUrl;
    });

    const maxSide = 1600;
    const longestSide = Math.max(image.width, image.height);
    const scale = longestSide > maxSide ? maxSide / longestSide : 1;
    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.85);
    });

    if (!blob) return file;
    return new File([blob], 'vision-header.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

export default function Home() {
  const takePhotoInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<WocData>(blank);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionDebugMessage, setVisionDebugMessage] = useState('');
  const [lastVisionResult, setLastVisionResult] = useState<{
    workOrder: string;
    partNumber: string;
    revision: string;
    customer: string;
    quantity: string;
    needsReview: string[];
  } | null>(null);
  const [routerText, setRouterText] = useState('');
  const [showDraft, setShowDraft] = useState(false);
  const [checks, setChecks] = useState<boolean[]>(Array(5).fill(false));
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SubmissionRecord[]>([]);
  const [nextWocId, setNextWocId] = useState(1);
  const [activeView, setActiveView] = useState<TaskView>('Home');

  const setField = (field: keyof WocData, value: string) => {
    setData((current) => ({ ...current, [field]: value }));
    setChecks(Array(5).fill(false));
  };

  const loadSample = () => {
    setData({
      workOrder: '042631-001',
      partNumber: 'CYM-1750-LH-BU',
      revision: 'B',
      customer: 'ENWORK',
      quantity: '35 EA',
      department: 'Welding',
      operation: '003000 L WD10',
      process: 'WELDING',
      currentListedRate: '33 parts per hour',
      observedBaseline: '12.5 parts per hour',
      issueType: 'Incorrect Time / Rate',
      correctionType: 'Incorrect Time / Rate',
      category: 'Welding',
      priority: 'High',
      problemSummary: 'The current listed welding rate of 33 parts per hour is not obtainable or sustainable under actual production conditions.',
      requestedAction: 'Please review and update the router time/rate from 33 parts per hour to 12.5 parts per hour, or establish the correct Engineering-approved time.',
      optionalNote: '',
    });
    setShowDraft(false);
    setChecks(Array(5).fill(false));
    setStatus('Sample welding time issue loaded.');
  };

  const clearForm = () => {
    setData(blank);
    setImageUrl('');
    setSelectedFileName('');
    setSelectedImageFile(null);
    setRouterText('');
    setShowDraft(false);
    setChecks(Array(5).fill(false));
    setStatus('');
    setVisionDebugMessage('');
    setLastVisionResult(null);
    setActiveView('Capture');
  };

  const extractData = () => {
    if (!routerText.trim()) {
      setStatus('Photo is saved as evidence. To auto-fill fields, paste copied/OCR text here or enter fields manually.');
      return;
    }

    setData((current) => extractRouterData(routerText, current));
    setChecks(Array(5).fill(false));
    setStatus('Router text extracted. Verify every field before generating the draft.');
  };



  const loadTesseractScript = async () => {
    if (window.Tesseract) return;

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-tesseract="true"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load OCR script.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.async = true;
      script.dataset.tesseract = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load OCR script.'));
      document.body.appendChild(script);
    });
  };

  const extractTextFromPhoto = async () => {
    if (!selectedImageFile || ocrLoading) return;

    setOcrLoading(true);
    setStatus('Reading work order photo...');

    try {
      await loadTesseractScript();
      if (!window.Tesseract) throw new Error('OCR runtime unavailable.');

      const result = await window.Tesseract.recognize(selectedImageFile, 'eng');
      const text = result.data.text?.trim() || '';
      setRouterText(text);

      if (text.length < 20) {
        setStatus('Could not read enough text from this photo. Try a clearer photo or enter fields manually.');
        return;
      }

      const extracted = extractRouterData(text, data);
      setData(extracted);
      setChecks(Array(5).fill(false));
      setStatus('Text extracted from photo. Review fields before sending.');
    } catch (_error) {
      setStatus('Could not read enough text from this photo. Try a clearer photo or enter fields manually.');
    } finally {
      setOcrLoading(false);
    }
  };


  const extractWithVision = async () => {
    if (!selectedImageFile || visionLoading) return;

    setVisionLoading(true);
    setVisionDebugMessage('AI Vision started...');
    setLastVisionResult(null);
    setStatus('Extracting header with AI Vision...');

    try {
      setVisionDebugMessage('Preparing image for AI Vision...');
      const imageForVision = await prepareImageForVision(selectedImageFile);
      const formData = new FormData();
      formData.append('image', imageForVision);
      setVisionDebugMessage('Sending image to backend...');

      const response = await fetch('/api/extract-vision', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Vision extraction failed.');
      }

      setData((current) => ({
        ...current,
        workOrder: result.workOrder || current.workOrder,
        partNumber: result.partNumber || current.partNumber || result.cadDrawing || '',
        revision: result.revision || current.revision,
        customer: result.customer || current.customer,
        quantity: result.quantity || current.quantity,
      }));
      setChecks(Array(5).fill(false));
      setLastVisionResult({
        workOrder: result.workOrder || '',
        partNumber: result.partNumber || result.cadDrawing || '',
        revision: result.revision || '',
        customer: result.customer || '',
        quantity: result.quantity || '',
        needsReview: Array.isArray(result.needsReview) ? result.needsReview : [],
      });
      setVisionDebugMessage('AI Vision success. Fields updated.');

      if (Array.isArray(result.needsReview) && result.needsReview.length) {
        setStatus(`AI Vision extracted header. Review: ${result.needsReview.join(', ')}.`);
      } else {
        setStatus('AI Vision extracted header fields. Verify before generating draft.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI Vision extraction failed.';
      const safeMessage = message.replace(/\s+/g, ' ').trim().slice(0, 180);
      setVisionDebugMessage(`AI Vision error: ${safeMessage}`);
      setStatus(`${message} Try Basic OCR Fallback or enter fields manually.`);
    } finally {
      setVisionLoading(false);
    }
  };


  const applyCorrectionType = (typeName: string) => {
    setData((current) => {
      const currentRate = current.currentListedRate || '[CURRENT RATE]';
      const correctRate = current.observedBaseline || '[CORRECT RATE]';
      const process = current.process || '[OPERATION/PROCESS]';
      const optionalNoteSuffix = current.optionalNote.trim() ? ` Note: ${current.optionalNote.trim()}` : '';

      const templateMap: Record<string, Partial<WocData>> = {
        'Incorrect Time / Rate': {
          correctionType: 'Incorrect Time / Rate',
          issueType: 'Incorrect Time / Rate',
          problemSummary: 'The current listed rate is not obtainable or sustainable under actual production conditions.',
          requestedAction: `Please review and update the router time/rate from ${currentRate} to ${correctRate}, or establish the correct Engineering-approved time.`,
        },
        'Missing Grind / Finish Operation': {
          correctionType: 'Missing Grind / Finish Operation',
          issueType: 'Missing Grind / Finish Operation',
          problemSummary: 'The router is missing a required grind/finish operation for this work order/part.',
          requestedAction: `Please add a grind/finish operation to the router with a reviewed production baseline of ${correctRate}, or establish the correct Engineering-approved grind/finish time.${optionalNoteSuffix}`,
        },
        'Missing Weld Operation': {
          correctionType: 'Missing Weld Operation',
          issueType: 'Missing Weld Operation',
          problemSummary: 'The router is missing a required welding operation for this work order/part.',
          requestedAction: `Please add the missing welding operation and establish the correct Engineering-approved welding time.${optionalNoteSuffix}`,
        },
        'Missing Fixture / Work Instruction': {
          correctionType: 'Missing Fixture / Work Instruction',
          issueType: 'Missing Fixture / Work Instruction',
          problemSummary: 'The router does not clearly identify the required fixture, holding method, or work instruction for this operation.',
          requestedAction: `Please add the required fixture, holding method, or work instruction to the router so the job can be set up consistently.${optionalNoteSuffix}`,
        },
        'Wrong / Missing Router Step': {
          correctionType: 'Wrong / Missing Router Step',
          issueType: 'Wrong / Missing Router Step',
          problemSummary: 'The router step appears incorrect, missing, or unclear for the required work content.',
          requestedAction: `Please review and correct the router step for ${process}.${optionalNoteSuffix}`,
        },
      };

      return {
        ...current,
        correctionType: typeName,
        ...(templateMap[typeName] || { issueType: typeName }),
      };
    });
    setShowDraft(false);
    setChecks(Array(5).fill(false));
    setStatus(`${typeName} selected. You can edit any field.`);
  };

  const today = new Date().toLocaleDateString();

  const report = useMemo(() => {
    return `ENGINEERING WORK ORDER CORRECTION REPORT

Title:
${data.workOrder || '[WO REQUIRED]'} / ${data.partNumber || '[PART REQUIRED]'} – ${data.correctionType} Correction Request

Correction Type:
${data.correctionType}

Category:
${data.category || '[CATEGORY REQUIRED]'}

Priority:
${data.priority}

Part / Work Order Information:
Work Order Number:
${data.workOrder || '[VERIFY WORK ORDER]'}

Part Number:
${data.partNumber || '[VERIFY PART NUMBER]'}

Revision:
${data.revision || '[N/A]'}

Customer:
${data.customer || '[N/A]'}

Quantity:
${data.quantity || '[N/A]'}

Department:
${data.department || '[VERIFY DEPARTMENT]'}

Operation / Router Step:
${data.operation || '[VERIFY OPERATION]'}

Process:
${data.process || '[VERIFY PROCESS]'}

Current Work Order Condition:
${data.currentListedRate || '[CURRENT CONDITION REQUIRED]'}

Observed Problem:
${data.problemSummary || '[PROBLEM SUMMARY REQUIRED]'}

Corrected / Requested Information:
${data.requestedAction || '[REQUESTED ENGINEERING ACTION REQUIRED]'}

Time Correction Details:
Current Listed Rate:
${data.currentListedRate || '[N/A]'}

Observed Sustainable Baseline:
${data.observedBaseline || '[N/A]'}

Recommended Engineering Baseline:
${data.observedBaseline || '[ENGINEERING REVIEW REQUIRED]'}

Reason for Correction:
The current work order information creates an inaccurate production expectation. Based on shop-floor observation, the listed information should be reviewed and corrected before it continues driving scheduling, costing, labor planning, or production expectations.

Evidence / Basis for Correction:
The affected work order/router identifies the operation listed above. Shop-floor review identified the current listed rate or information as inaccurate, missing, or not sustainable.

Risk if Not Corrected:
If the work order information is not corrected, scheduling, labor planning, costing, and production expectations may continue to be based on inaccurate data.

Requested Engineering Action:
${data.requestedAction || '[REQUESTED ENGINEERING ACTION REQUIRED]'}

Submitted By:
Chris

Date:
${today}`;
  }, [data, today]);

  const emailSubject = useMemo(() => {
    const category = (data.category || 'CATEGORY TBD').toUpperCase();
    return `[AI-WOC][${category}] WO ${data.workOrder || 'TBD'} | ${data.partNumber || 'PART TBD'} | ${data.correctionType}`;
  }, [data.category, data.correctionType, data.partNumber, data.workOrder]);

  const emailBody = useMemo(() => {
    return `Engineering Team,

Please review the work order correction request below.

Work Order:
${data.workOrder || '[VERIFY WORK ORDER]'}

Part Number:
${data.partNumber || '[VERIFY PART NUMBER]'}

Revision:
${data.revision || '[N/A]'}

Customer:
${data.customer || '[N/A]'}

Operation:
${data.operation || '[VERIFY OPERATION]'} – ${data.process || '[VERIFY PROCESS]'}

Issue Summary:
${data.problemSummary || '[PROBLEM SUMMARY REQUIRED]'}

Current Listed Condition:
${data.currentListedRate || '[CURRENT CONDITION REQUIRED]'}

Observed Sustainable Baseline / Corrected Information:
${data.observedBaseline || '[N/A]'}

Requested Correction:
${data.requestedAction || '[REQUESTED ENGINEERING ACTION REQUIRED]'}

Reason for Request:
The current work order information creates an inaccurate production expectation and may affect scheduling, labor planning, costing, or production flow if left unchanged.

Priority:
${data.priority}

Thank you,

Chris`;
  }, [data]);

  const emailDraft = useMemo(() => {
    return `To:
${DEFAULT_TO_EMAIL}

Subject:
${emailSubject}

Body:
${emailBody}`;
  }, [emailBody, emailSubject]);

  const allConfirmed = checks.every(Boolean);

  const onWorkOrderFileSelected = (file?: File) => {
    if (!file) return;

    setSelectedFileName(file.name);
    if (file.type.startsWith('image/')) {
      setSelectedImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setStatus('Photo is saved as evidence. To auto-fill fields, paste copied/OCR text here or enter fields manually.');
      return;
    }

    setSelectedImageFile(null);
    setImageUrl('');
    setStatus('Attachment added. To auto-fill fields, paste copied/OCR text here or enter fields manually.');
  };
  const hasPartNumber = Boolean(data.partNumber.trim());
  const hasWorkOrder = Boolean(data.workOrder.trim());
  const hasIdentifier = hasPartNumber || hasWorkOrder;
  const readyToDraft = Boolean(
    hasIdentifier
    && data.category.trim()
    && data.priority.trim()
    && data.correctionType.trim()
    && data.problemSummary.trim()
    && data.requestedAction.trim(),
  );

  const readinessWarnings: string[] = [];
  if (!hasIdentifier) readinessWarnings.push('Missing identifier: add Part Number or Work Order Number.');
  if (!hasPartNumber && hasWorkOrder) readinessWarnings.push('Part Number is preferred. A work order may contain multiple parts.');
  if (!hasWorkOrder && hasPartNumber) readinessWarnings.push('Work Order Number is recommended as a helpful backup identifier.');
  if (!data.operation.trim()) readinessWarnings.push('Operation / Router Step is preferred but not required for send.');
  if (!data.process.trim()) readinessWarnings.push('Process is preferred but not required for send.');
  if (!data.revision.trim()) readinessWarnings.push('Revision is preferred but not required for send.');
  if (!data.customer.trim()) readinessWarnings.push('Customer is preferred but not required for send.');
  if (!data.quantity.trim()) readinessWarnings.push('Quantity is preferred but not required for send.');

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setStatus('Copied.');
  };

  const generateDraft = () => {
    setShowDraft(true);
    setChecks(Array(5).fill(false));
    setActiveView('Drafts');
    setStatus(readyToDraft ? 'Draft generated. Confirm every checkbox before sending.' : 'Draft generated with missing fields. Fill bracketed items before confirming.');
  };

  const sendEmail = async () => {
    if (!readyToDraft) {
      setStatus('Required fields are missing. Add Part Number or Work Order Number, plus Category, Priority, Correction Type, Problem Summary, and Requested Engineering Action before sending.');
      return;
    }

    if (!allConfirmed) {
      setStatus('Confirm every checkbox before sending.');
      return;
    }

    setSending(true);
    setStatus('');

    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: emailSubject, emailBody }),
    });

    const result = await res.json();

    if (result.error) {
      setStatus(result.error);
    } else {
      const wocId = `WOC-${String(nextWocId).padStart(4, '0')}`;
      const record: SubmissionRecord = {
        wocId,
        dateSubmitted: new Date().toLocaleString(),
        submittedBy: 'Chris',
        workOrderNumber: data.workOrder || '',
        partNumber: data.partNumber || '',
        departmentProcess: `${data.department || '[N/A]'} / ${data.process || '[N/A]'}`,
        issueType: data.correctionType,
        category: data.category,
        priority: data.priority,
        requestedAction: data.requestedAction,
        status: 'Submitted',
        assignedOwner: 'Engineering Queue',
        engineeringNotes: '',
        erpUpdated: false,
        closedDate: '',
      };
      setHistory((current) => [record, ...current].slice(0, 8));
      setNextWocId((current) => current + 1);
      setStatus('Email sent successfully.');
      setActiveView('Drafts');
    }

    setSending(false);
  };

  return (
    <main className="shell" id="home">
      <section className="top-card glow-card">
        <div className="brand-tile" aria-label="REFAB Connect icon">
          <img src="/apple-touch-icon.png" alt="REFAB Connect" />
        </div>
        <div className="top-copy">
          <h1>Work Order<br />Correction</h1>
          <span>Powered by Applied Intelligence Framework</span>
        </div>
        <div className="system-pill"><span />AI-WOC SYSTEM</div>
      </section>

      {activeView === 'Home' ? (
      <>
      <section className="hero-card glow-card home-system-hero">
        <div className="home-active-badge">SYSTEM ACTIVE</div>
        <img className="home-system-icon" src="/refab-connect-master-1024.png" alt="Refab Connect AI-WOC" />
        <div className="hero-copy home-system-copy">
          <h2>AI-WOC System Active</h2>
          <p>Clear. Guided. Fast.</p>
        </div>
        <button type="button" className="capture-trigger home-start-button" onClick={() => setActiveView('Capture')}>
          <span className="glass-icon-tile active">📷</span>
          <span>
            <strong>Start Capture</strong>
            <small>Begin work order intake.</small>
          </span>
        </button>
      </section>

      <section className="workflow-card compact-card glow-card home-workflow" aria-label="AI-WOC workflow steps">
        <div className="section-title centered">
          <span />
          <h2>Workflow</h2>
        </div>
        {workflow.map(([_step, title], index) => (
          <div className="workflow-row home-workflow-row" key={title}>
            <div className="step-box glass-icon-tile">{index + 1}</div>
            <div>
              <h3>{title}</h3>
            </div>
          </div>
        ))}
      </section>

      </>
      ) : null}

      {activeView === 'Capture' ? (
      <section className="panel glow-card capture-panel" id="capture">
        <div className="panel-heading">
          <p>Step 1</p>
          <h2>Capture Work Order</h2>
        </div>
        <p className="mini-note">Photo is saved as evidence. To auto-fill fields, capture the full printed header (WO, part, revision, customer, quantity) in one clear shot, then run AI Vision or OCR.</p>
        <div className="mini-note" role="note">
          <strong>Header photo guidance (beta):</strong> Use rear camera, fill frame with the printed header, avoid glare/shadows, and keep text horizontal and in focus.
        </div>
        <div className="quick-entry-card">
          <h3>Beta Validation Checklist</h3>
          <p>Before you generate a draft, verify these beta checks to reduce extraction errors:</p>
          <ul className="beta-checklist">
            <li>Header photo includes Work Order, Part Number, Revision, Customer, and Quantity.</li>
            <li>Operation/Process line is visible in the same image or a second support image.</li>
            <li>Extracted fields match printed values before confirmation checkboxes are completed.</li>
          </ul>
        </div>
        <input
          ref={takePhotoInputRef}
          className="capture-input-hidden"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => {
            onWorkOrderFileSelected(event.target.files?.[0]);
          }}
        />
        <input
          ref={uploadInputRef}
          className="capture-input-hidden"
          type="file"
          accept="image/*,application/pdf"
          onChange={(event) => {
            onWorkOrderFileSelected(event.target.files?.[0]);
          }}
        />
        <button type="button" className="capture-trigger" onClick={() => takePhotoInputRef.current?.click()}>
          <span className="glass-icon-tile active">📷</span>
          <span>
            <strong>Take Photo</strong>
            <small>Use rear camera to capture work order.</small>
          </span>
        </button>
        <button type="button" className="capture-trigger" onClick={() => uploadInputRef.current?.click()}>
          <span className="glass-icon-tile">📁</span>
          <span>
            <strong>Upload File / Picture</strong>
            <small>Select image or PDF from Photo Library or Files.</small>
          </span>
        </button>
        {imageUrl ? <img className="preview" src={imageUrl} alt="Uploaded work order preview" /> : null}
        <div className="button-row">
          <button
            type="button"
            className="secondary"
            disabled={!selectedImageFile || visionLoading}
            onClick={extractWithVision}
          >
            {visionLoading ? 'Extracting Vision…' : 'Extract With AI Vision'}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={!selectedImageFile || ocrLoading}
            onClick={extractTextFromPhoto}
          >
            {ocrLoading ? 'Extracting Text…' : 'Basic OCR Fallback'}
          </button>
        </div>
        {visionDebugMessage ? (
          <div className="vision-status-card" role="status" aria-live="polite">
            <p>{visionDebugMessage}</p>
            {lastVisionResult ? (
              <dl>
                <div><dt>Work Order</dt><dd>{lastVisionResult.workOrder || '—'}</dd></div>
                <div><dt>Part Number</dt><dd>{lastVisionResult.partNumber || '—'}</dd></div>
                <div><dt>Revision</dt><dd>{lastVisionResult.revision || '—'}</dd></div>
                <div><dt>Customer</dt><dd>{lastVisionResult.customer || '—'}</dd></div>
                <div><dt>Quantity</dt><dd>{lastVisionResult.quantity || '—'}</dd></div>
                <div><dt>Needs Review</dt><dd>{lastVisionResult.needsReview.length ? lastVisionResult.needsReview.join(', ') : 'None'}</dd></div>
              </dl>
            ) : null}
          </div>
        ) : null}
        {!imageUrl && selectedFileName ? <p className="mini-note">Selected file: {selectedFileName}</p> : null}
        <div className="quick-entry-card">
          <h3>Quick Entry</h3>
          <p>Enter the printed header and issue details while viewing the work order image.</p>
          <div className="quick-entry-grid">
            <label>
              Work Order Number
              <input value={data.workOrder} onChange={(event) => setField('workOrder', event.target.value)} />
            </label>
            <label>
              Part Number
              <input value={data.partNumber} onChange={(event) => setField('partNumber', event.target.value)} />
            </label>
            <label>
              Revision
              <input value={data.revision} onChange={(event) => setField('revision', event.target.value)} />
            </label>
            <label>
              Customer
              <input value={data.customer} onChange={(event) => setField('customer', event.target.value)} />
            </label>
            <label>
              Quantity
              <input value={data.quantity} onChange={(event) => setField('quantity', event.target.value)} />
            </label>
            <label>
              Category
              <select value={data.category} onChange={(event) => setField('category', event.target.value)}>
                <option value="">Select category</option>
                {categoryOptions.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Correction Type
              <select value={data.correctionType} onChange={(event) => applyCorrectionType(event.target.value)}>
                {correctionTypeOptions.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Priority
              <select value={data.priority} onChange={(event) => setField('priority', event.target.value)}>
                {priorityOptions.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="quick-entry-full">
              Problem Summary
              <textarea value={data.problemSummary} onChange={(event) => setField('problemSummary', event.target.value)} />
            </label>
            <label className="quick-entry-full">
              Requested Engineering Action
              <textarea value={data.requestedAction} onChange={(event) => setField('requestedAction', event.target.value)} />
            </label>
          </div>
        </div>
        <label>
          Paste Router / OCR Text
          <textarea
            value={routerText}
            onChange={(event) => setRouterText(event.target.value)}
            placeholder="Paste copied text from the work order here. Example: WO 042631-001, Part CYM-1750-LH-BU, Operation 003000 L WD10, Rate 33 parts per hour..."
          />
        </label>
        <div className="button-row">
          <button type="button" className="secondary" onClick={extractData}>
            Extract From Text
          </button>
          <button type="button" onClick={loadSample}>Load Sample</button>
        </div>
        <div className="button-row">
          <button type="button" onClick={() => setActiveView('Build Correction')}>Continue to Build Correction</button>
        </div>
      </section>
      ) : null}

      {activeView === 'Build Correction' ? (
      <>
      <section className="panel glow-card" id="data">
        <div className="panel-heading">
          <p>Step 2</p>
          <h2>Confirm Data</h2>
        </div>
        <div className="field-grid">
          {dataFields.map(([field, label]) => (
            <label key={field}>
              {label}
              {field === 'operation' || field === 'process' ? (
                <select value={data[field]} onChange={(event) => setField(field, event.target.value)}>
                  <option value="">Select or type manually below</option>
                  {operationProcessOptions.map((item) => <option key={item}>{item}</option>)}
                </select>
              ) : field === 'currentListedRate' ? (
                <>
                  <select value={currentConditionOptions.includes(data.currentListedRate) ? data.currentListedRate : ''} onChange={(event) => setField('currentListedRate', event.target.value)}>
                    <option value="">Current listed condition helper</option>
                    {currentConditionOptions.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <input value={data[field]} onChange={(event) => setField(field, event.target.value)} />
                </>
              ) : (
                <input value={data[field]} onChange={(event) => setField(field, event.target.value)} />
              )}
            </label>
          ))}
        </div>
      </section>

      <section className="panel glow-card" id="issue">
        <div className="panel-heading">
          <p>Step 3</p>
          <h2>State Issue</h2>
        </div>
        <label>
          Correction Type
          <select value={data.correctionType} onChange={(event) => applyCorrectionType(event.target.value)}>
            {correctionTypeOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        {data.correctionType === 'Incorrect Time / Rate' ? (
          <>
            <label>Current Listed Rate<input value={data.currentListedRate} onChange={(event) => setField('currentListedRate', event.target.value)} /></label>
            <label>Correct / Observed Rate<input value={data.observedBaseline} onChange={(event) => setField('observedBaseline', event.target.value)} /></label>
            <label>Operation / Process<select value={data.process} onChange={(event) => setField('process', event.target.value)}><option value="">Select operation / process</option>{operationProcessOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          </>
        ) : null}
        {(data.correctionType === 'Missing Grind / Finish Operation' || data.correctionType === 'Missing Weld Operation') ? (
          <>
            <label>Correct / Observed Rate<input value={data.observedBaseline} onChange={(event) => setField('observedBaseline', event.target.value)} /></label>
            <label>Optional note<textarea value={data.optionalNote} onChange={(event) => setField('optionalNote', event.target.value)} /></label>
          </>
        ) : null}
        {data.correctionType === 'Missing Fixture / Work Instruction' ? <label>Optional note<textarea value={data.optionalNote} onChange={(event) => setField('optionalNote', event.target.value)} /></label> : null}
        {data.correctionType === 'Wrong / Missing Router Step' ? (
          <>
            <label>Operation / Process<select value={data.process} onChange={(event) => setField('process', event.target.value)}><option value="">Select operation / process</option>{operationProcessOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Optional note<textarea value={data.optionalNote} onChange={(event) => setField('optionalNote', event.target.value)} /></label>
          </>
        ) : null}
        <label>
          Category
          <select value={data.category} onChange={(event) => setField('category', event.target.value)}>
            <option value="">Select category</option>
            {categoryOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Priority
          <select value={data.priority} onChange={(event) => setField('priority', event.target.value)}>
            {priorityOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Problem Summary
          <textarea value={data.problemSummary} onChange={(event) => setField('problemSummary', event.target.value)} />
        </label>
        <label>
          Requested Engineering Action
          <textarea value={data.requestedAction} onChange={(event) => setField('requestedAction', event.target.value)} />
        </label>
        <button type="button" onClick={generateDraft}>Generate Report + Email Draft</button>
      </section>
      </>
      ) : null}

      {activeView === 'Drafts' ? (
      <section className="panel glow-card draft-panel" id="drafts">
        <div className="panel-heading">
          <p>Step 4</p>
          <h2>{showDraft ? 'Draft. Confirm. Send.' : 'Drafts'}</h2>
        </div>
        {showDraft ? (
          <>
            <div className={readyToDraft ? 'gate good' : 'gate warn'}>
              {readyToDraft ? 'Required fields complete. Confirm accuracy before sending.' : 'Some required fields are missing. Fill bracketed required items before confirming.'}
            </div>
            {readinessWarnings.length ? (
              <div className="gate warn">
                <strong>Warnings (do not block send if required fields are complete):</strong>
                <ul>
                  {readinessWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
              </div>
            ) : null}
            <h3>Correction Report</h3>
            <pre>{report}</pre>
            <h3>Email Draft</h3>
            <pre>{emailDraft}</pre>
            {confirmationLabels.map((label, index) => (
              <label className="check" key={label}>
                <input type="checkbox" checked={checks[index]} onChange={(event) => setChecks((current) => current.map((value, i) => i === index ? event.target.checked : value))} />
                {label}
              </label>
            ))}
        <div className="button-row">
              <button type="button" className="secondary" onClick={() => copyText(report)}>Copy Report</button>
              <button type="button" className="secondary" onClick={() => copyText(emailDraft)}>Copy Email</button>
            </div>
            <button type="button" disabled={!readyToDraft || !allConfirmed || sending} onClick={sendEmail}>{sending ? 'Sending...' : 'Send Email'}</button>
            <div className="button-row">
              <button type="button" className="secondary" onClick={clearForm}>Start New Correction / Clear Form</button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <strong>No active draft yet.</strong>
            <p>Complete the issue fields and generate the correction report to review the email draft here.</p>
            <button type="button" className="secondary" onClick={() => setActiveView('Build Correction')}>Build Correction</button>
          </div>
        )}
      </section>
      ) : null}

      {activeView === 'History' ? (
      <section className="panel glow-card compact-info" id="history">
        <div className="panel-heading">
          <p>History</p>
          <h2>Submission History</h2>
        </div>
        {history.length ? (
          <ul className="history-list">
            {history.map((item) => (
              <li key={item.wocId}>
                <strong>{item.wocId}</strong> — {item.dateSubmitted} — WO {item.workOrderNumber || 'TBD'} / {item.partNumber || 'TBD'} — {item.category} — {item.status}
              </li>
            ))}
          </ul>
        ) : (
          <p>Sent requests will appear here after email delivery is connected and tracking is added.</p>
        )}
      </section>
      ) : null}

      {activeView === 'More' ? (
      <section className="panel glow-card compact-info" id="more">
        <div className="panel-heading">
          <p>System</p>
          <h2>REFAB Connect</h2>
        </div>
        <p>Work Order Correction powered by Applied Intelligence Framework. Draft first. Confirm accuracy. Then send.</p>
        <p className="mini-note">Default Engineering recipient: {DEFAULT_TO_EMAIL}</p>
      </section>
      ) : null}

      <nav className="bottom-nav" aria-label="AI-WOC navigation">
        {navItems.map(([icon, item]) => (
          <button type="button" className={activeView === item ? 'active' : ''} onClick={() => setActiveView(item)} key={item}>
            <span className={`nav-icon glass-icon-tile ${activeView === item ? 'active' : ''}`}>{icon}</span>
            <span>{item}</span>
          </button>
        ))}
      </nav>

      {status ? <p className="status">{status}</p> : null}
    </main>
  );
}
