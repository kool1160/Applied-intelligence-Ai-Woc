'use client';

import { useMemo, useRef, useState } from 'react';

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
  category: string;
  priority: string;
  problemSummary: string;
  requestedAction: string;
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
  issueType: 'Incorrect Time',
  category: '',
  priority: 'Medium',
  problemSummary: '',
  requestedAction: '',
};

const confirmationLabels = [
  'I confirm the work order number is correct.',
  'I confirm the part number is correct.',
  'I confirm the operation/process is correct.',
  'I confirm the issue and requested correction are accurate.',
  'I confirm the email draft is ready to send.',
];

const workflow = [
  ['📷', 'Capture Router', 'Snap or upload work order.'],
  ['📋', 'Extract + Confirm', 'Pull WO, part, process, and rate into clean fields.'],
  ['🗂', 'Build Correction', 'Generate report and Engineering email draft.'],
  ['➤', 'Confirm + Send', 'Draft first. Confirm accuracy. Then send.'],
];

const navItems = [
  ['⌂', 'Home', '#home'],
  ['📷', 'Capture', '#capture'],
  ['🗂', 'Drafts', '#drafts'],
  ['◷', 'History', '#history'],
  ['⚙', 'More', '#more'],
];

const issueOptions = [
  'Incorrect Time',
  'Missing Information',
  'Missing Operation',
  'Missing Fixture Callout',
  'Wrong Routing',
  'Missing Setup Time',
  'Missing Grind / Finish Time',
  'Other',
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

function extractRouterData(source: string, existing: WocData): WocData {
  const text = source.replace(/\r/g, '\n');
  const lines = text.split('\n').map(cleanLine).filter(Boolean);
  const joined = lines.join('\n');

  const workOrder = firstMatch(joined, [
    /(?:work\s*order|workorder|wo|w\/o)\s*(?:number|no\.?|#|:)?\s*[:#-]?\s*([0-9]{4,8}[-\s]?[0-9]{2,4})/i,
    /\b([0-9]{5,6}-[0-9]{3})\b/,
  ]).replace(/\s+/g, '');

  const partNumber = firstMatch(joined, [
    /(?:part\s*(?:number|no\.?|#)|item\s*(?:number|no\.?|#))\s*[:#-]?\s*([A-Z0-9][A-Z0-9._/-]{3,})/i,
    /\b([A-Z]{2,5}-[A-Z0-9._/-]{3,})\b/,
  ]);

  const revision = firstMatch(joined, [
    /(?:rev(?:ision)?\.?)\s*[:#-]?\s*([A-Z0-9]{1,4})\b/i,
  ]);

  const customer = firstMatch(joined, [
    /(?:customer|cust\.?)\s*[:#-]?\s*([A-Z0-9][A-Z0-9 .&/-]{2,})/i,
  ]);

  const quantity = firstMatch(joined, [
    /(?:quantity|qty)\s*[:#-]?\s*([0-9,]+\s*(?:ea|pcs?|pieces?)?)/i,
  ]);

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

export default function Home() {
  const takePhotoInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<WocData>(blank);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [routerText, setRouterText] = useState('');
  const [showDraft, setShowDraft] = useState(false);
  const [checks, setChecks] = useState<boolean[]>(Array(5).fill(false));
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SubmissionRecord[]>([]);
  const [nextWocId, setNextWocId] = useState(1);

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
      issueType: 'Incorrect Time',
      category: 'Welding',
      priority: 'High',
      problemSummary: 'The current listed welding rate of 33 parts per hour is not obtainable or sustainable under actual production conditions.',
      requestedAction: 'Please review and update the welding runtime/rate from 33 parts per hour to a sustainable baseline of 12.5 parts per hour, or establish the correct Engineering-approved welding time.',
    });
    setShowDraft(false);
    setChecks(Array(5).fill(false));
    setStatus('Sample welding time issue loaded.');
  };

  const extractData = () => {
    if (!routerText.trim()) {
      setStatus('Capture or upload the work order, then paste copied/OCR router text here for auto-fill. Manual entry still works.');
      return;
    }

    setData((current) => extractRouterData(routerText, current));
    setChecks(Array(5).fill(false));
    setStatus('Router text extracted. Verify every field before generating the draft.');
  };

  const applyWeldingTimeTemplate = () => {
    const currentRate = data.currentListedRate || '33 parts per hour';
    const baseline = data.observedBaseline || '12.5 parts per hour';

    setData((current) => ({
      ...current,
      department: current.department || 'Welding',
      process: current.process || 'WELDING',
      currentListedRate: current.currentListedRate || currentRate,
      observedBaseline: current.observedBaseline || baseline,
      issueType: 'Incorrect Time',
      category: current.category || 'Welding',
      priority: 'High',
      problemSummary: `The current listed welding rate of ${currentRate} is not obtainable or sustainable under actual production conditions. A more balanced observed baseline is ${baseline}.`,
      requestedAction: `Please review and update the welding runtime/rate from ${currentRate} to a sustainable baseline of ${baseline}, or establish the correct Engineering-approved welding time.`,
    }));
    setShowDraft(false);
    setChecks(Array(5).fill(false));
    setStatus('Welding time correction template applied.');
  };

  const today = new Date().toLocaleDateString();

  const report = useMemo(() => {
    return `ENGINEERING WORK ORDER CORRECTION REPORT

Title:
${data.workOrder || '[WO REQUIRED]'} / ${data.partNumber || '[PART REQUIRED]'} – ${data.issueType} Correction Request

Correction Type:
${data.issueType}

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
    return `[AI-WOC][${category}] WO ${data.workOrder || 'TBD'} | ${data.partNumber || 'PART TBD'} | ${data.issueType}`;
  }, [data.category, data.issueType, data.partNumber, data.workOrder]);

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
      setImageUrl(URL.createObjectURL(file));
      return;
    }

    setImageUrl('');
  };
  const readyToDraft = Boolean(data.workOrder && data.partNumber && data.operation && data.process && data.category && data.problemSummary && data.requestedAction);

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setStatus('Copied.');
  };

  const generateDraft = () => {
    setShowDraft(true);
    setChecks(Array(5).fill(false));
    setStatus(readyToDraft ? 'Draft generated. Confirm every checkbox before sending.' : 'Draft generated with missing fields. Fill bracketed items before confirming.');
  };

  const sendEmail = async () => {
    if (!readyToDraft) {
      setStatus('Core fields are missing. Fill all required fields before sending.');
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
        issueType: data.issueType,
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

      <section className="hero-card glow-card">
        <div className="hero-copy">
          <p className="eyebrow">Standardize to Optimize</p>
          <h2>Fix bad router data before it becomes waste.</h2>
          <p>Snap the work order, confirm the WO, part, process, and issue, then generate a controlled Engineering correction request.</p>
        </div>
        <div className="hero-emblem" aria-hidden="true">
          <div className="shield">✓</div>
          <div className="rings" />
        </div>
      </section>

      <section className="stats-grid" aria-label="AI-WOC stats">
        <article className="stat-card glow-card"><div className="stat-icon glass-icon-tile">🗂</div><div><span>Draft Requests</span><strong>{showDraft ? '1' : '0'}</strong><small>Current session</small></div></article>
        <article className="stat-card glow-card"><div className="stat-icon glass-icon-tile active">➤</div><div><span>Ready to Send</span><strong>{allConfirmed ? '1' : '0'}</strong><small>Confirmed gate</small></div></article>
        <article className="stat-card glow-card"><div className="stat-icon glass-icon-tile">◷</div><div><span>Sent Today</span><strong>{history.length}</strong><small>Session count</small></div></article>
        <article className="stat-card glow-card"><div className="stat-icon glass-icon-tile">ID</div><div><span>Mode</span><strong>WOC</strong><small>Correction flow</small></div></article>
      </section>

      <section className="workflow-card compact-card glow-card">
        <div className="section-title">
          <span />
          <h2>Correction Workflow</h2>
        </div>
        {workflow.map(([step, title, subtitle]) => (
          <div className="workflow-row" key={title}>
            <div className="step-box glass-icon-tile">{step}</div>
            <div>
              <h3>{title}</h3>
              <p>{subtitle}</p>
            </div>
            <b>›</b>
          </div>
        ))}
      </section>

      <section className="panel glow-card capture-panel" id="capture">
        <div className="panel-heading">
          <p>Step 1</p>
          <h2>Capture Work Order</h2>
        </div>
        <p className="mini-note">Use the camera/upload for evidence. For this MVP, paste copied router/OCR text below to auto-fill fields, then verify manually before sending.</p>
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
        {!imageUrl && selectedFileName ? <p className="mini-note">Selected file: {selectedFileName}</p> : null}
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
            Extract Data
          </button>
          <button type="button" onClick={loadSample}>Load Sample</button>
        </div>
      </section>

      <section className="panel glow-card" id="data">
        <div className="panel-heading">
          <p>Step 2</p>
          <h2>Confirm Data</h2>
        </div>
        <div className="field-grid">
          {dataFields.map(([field, label]) => (
            <label key={field}>
              {label}
              <input value={data[field]} onChange={(event) => setField(field, event.target.value)} />
            </label>
          ))}
        </div>
      </section>

      <section className="panel glow-card" id="issue">
        <div className="panel-heading">
          <p>Step 3</p>
          <h2>State Issue</h2>
        </div>
        <div className="template-card">
          <strong>Fast template</strong>
          <p>Use this for the current welding time issue: listed at 33/hour, observed balanced baseline at 12.5/hour.</p>
          <button type="button" className="secondary" onClick={applyWeldingTimeTemplate}>Apply Welding Time Issue</button>
        </div>
        <label>
          Issue Type
          <select value={data.issueType} onChange={(event) => setField('issueType', event.target.value)}>
            {issueOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
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

      <section className="panel glow-card draft-panel" id="drafts">
        <div className="panel-heading">
          <p>Step 4</p>
          <h2>{showDraft ? 'Draft. Confirm. Send.' : 'Drafts'}</h2>
        </div>
        {showDraft ? (
          <>
            <div className={readyToDraft ? 'gate good' : 'gate warn'}>
              {readyToDraft ? 'Core fields complete. Confirm accuracy before sending.' : 'Some core fields are missing. Fill any bracketed items before confirming.'}
            </div>
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
          </>
        ) : (
          <div className="empty-state">
            <strong>No active draft yet.</strong>
            <p>Complete the issue fields and generate the correction report to review the email draft here.</p>
            <a href="#issue">Build Correction</a>
          </div>
        )}
      </section>

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

      <section className="panel glow-card compact-info" id="more">
        <div className="panel-heading">
          <p>System</p>
          <h2>REFAB Connect</h2>
        </div>
        <p>Work Order Correction powered by Applied Intelligence Framework. Draft first. Confirm accuracy. Then send.</p>
        <p className="mini-note">Default Engineering recipient: {DEFAULT_TO_EMAIL}</p>
      </section>

      <nav className="bottom-nav" aria-label="AI-WOC navigation">
        {navItems.map(([icon, item, target], index) => (
          <a className={index === 0 ? 'active' : ''} href={target} key={item}>
            <span className={`nav-icon glass-icon-tile ${index === 0 ? 'active' : ''}`}>{icon}</span>
            <span>{item}</span>
          </a>
        ))}
      </nav>

      {status ? <p className="status">{status}</p> : null}
    </main>
  );
}
