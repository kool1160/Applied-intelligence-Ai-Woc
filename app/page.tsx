'use client';

import { useMemo, useState } from 'react';

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
  priority: string;
  problemSummary: string;
  requestedAction: string;
};

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
  ['1', 'Capture Router', 'Snap or upload work order.', '#capture'],
  ['2', 'Confirm Data', 'Verify WO, part, process, and issue.', '#data'],
  ['3', 'Build Correction', 'Generate report and email draft.', '#issue'],
  ['4', 'Send Request', 'Draft first. Confirm. Then send.', '#drafts'],
];

const navItems = [
  ['⌂', 'Home', '#home'],
  ['▣', 'Capture', '#capture'],
  ['▤', 'Drafts', '#drafts'],
  ['◷', 'History', '#history'],
  ['•••', 'More', '#more'],
];

export default function Home() {
  const [data, setData] = useState<WocData>(blank);
  const [imageUrl, setImageUrl] = useState('');
  const [showDraft, setShowDraft] = useState(false);
  const [checks, setChecks] = useState<boolean[]>(Array(5).fill(false));
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  const setField = (field: keyof WocData, value: string) => {
    setData((current) => ({ ...current, [field]: value }));
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
      priority: 'High',
      problemSummary: 'The current listed welding rate of 33 parts per hour is not obtainable or sustainable under actual production conditions.',
      requestedAction: 'Please review and update the welding runtime/rate from 33 parts per hour to a sustainable baseline of 12.5 parts per hour, or establish the correct Engineering-approved welding time.',
    });
  };

  const today = new Date().toLocaleDateString();

  const report = useMemo(() => {
    return `ENGINEERING WORK ORDER CORRECTION REPORT\n\nTitle:\n${data.workOrder} / ${data.partNumber} – ${data.issueType} Correction Request\n\nCorrection Type:\n${data.issueType}\n\nPriority:\n${data.priority}\n\nPart / Work Order Information:\nWork Order Number:\n${data.workOrder}\n\nPart Number:\n${data.partNumber}\n\nRevision:\n${data.revision}\n\nCustomer:\n${data.customer}\n\nQuantity:\n${data.quantity}\n\nDepartment:\n${data.department}\n\nOperation / Router Step:\n${data.operation}\n\nProcess:\n${data.process}\n\nCurrent Work Order Condition:\n${data.currentListedRate}\n\nObserved Problem:\n${data.problemSummary}\n\nCorrected / Requested Information:\n${data.requestedAction}\n\nTime Correction Details:\nCurrent Listed Rate:\n${data.currentListedRate}\n\nObserved Sustainable Baseline:\n${data.observedBaseline}\n\nRecommended Engineering Baseline:\n${data.observedBaseline}, pending Engineering review\n\nReason for Correction:\nThe current listed rate creates an unrealistic production expectation. Based on shop-floor observation, the observed sustainable baseline is more balanced and realistic for this operation.\n\nEvidence / Basis for Correction:\nThe work order router identifies the affected operation. Shop-floor review identified the current listed rate or information as inaccurate, missing, or not sustainable.\n\nRisk if Not Corrected:\nIf the work order information is not corrected, scheduling, labor planning, costing, and production expectations may continue to be based on inaccurate data.\n\nRequested Engineering Action:\n${data.requestedAction}\n\nSubmitted By:\nChris\n\nDate:\n${today}`;
  }, [data, today]);

  const emailDraft = useMemo(() => {
    return `Subject:\nWork Order Correction Request – ${data.workOrder} / ${data.partNumber} – ${data.issueType}\n\nBody:\nEngineering Team,\n\nPlease review the work order correction request for the following:\n\nWork Order:\n${data.workOrder}\n\nPart Number:\n${data.partNumber}\n\nRevision:\n${data.revision}\n\nCustomer:\n${data.customer}\n\nOperation:\n${data.operation} – ${data.process}\n\nIssue Summary:\n${data.problemSummary}\n\nCurrent Listed Condition:\n${data.currentListedRate}\n\nObserved Sustainable Baseline / Corrected Information:\n${data.observedBaseline}\n\nRequested Correction:\n${data.requestedAction}\n\nReason for Request:\nThe current work order information creates an inaccurate production expectation and may affect scheduling, labor planning, costing, or production flow if left unchanged.\n\nPriority:\n${data.priority}\n\nThank you,\n\nChris`;
  }, [data]);

  const allConfirmed = checks.every(Boolean);

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setStatus('Copied.');
  };

  const sendEmail = async () => {
    setSending(true);
    setStatus('');
    const subject = `Work Order Correction Request – ${data.workOrder} / ${data.partNumber} – ${data.issueType}`;
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, emailBody: emailDraft, reportBody: report }),
    });
    const result = await res.json();
    setStatus(result.error || 'Email sent successfully.');
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
          <p>Capture WO, part, process, issue, and Engineering correction request in one controlled flow.</p>
        </div>
        <div className="hero-emblem" aria-hidden="true">
          <div className="shield">✓</div>
          <div className="rings" />
        </div>
      </section>

      <section className="stats-grid" aria-label="AI-WOC stats">
        <article className="stat-card glow-card"><div className="stat-icon">▤</div><div><span>Draft Requests</span><strong>{showDraft ? '1' : '0'}</strong><small>Current session</small></div></article>
        <article className="stat-card glow-card"><div className="stat-icon">➤</div><div><span>Ready to Send</span><strong>{allConfirmed ? '1' : '0'}</strong><small>Confirmed gate</small></div></article>
        <article className="stat-card glow-card"><div className="stat-icon">▥</div><div><span>Sent Today</span><strong>0</strong><small>Live count</small></div></article>
        <article className="stat-card glow-card"><div className="stat-icon">⚙</div><div><span>Mode</span><strong>WOC</strong><small>Correction flow</small></div></article>
      </section>

      <section className="workflow-card compact-card glow-card">
        <div className="section-title">
          <span />
          <h2>Correction Workflow</h2>
        </div>
        {workflow.map(([step, title, subtitle, target]) => (
          <a className="workflow-row" href={target} key={title}>
            <div className="step-box">{step}</div>
            <div>
              <h3>{title}</h3>
              <p>{subtitle}</p>
            </div>
            <b>›</b>
          </a>
        ))}
      </section>

      <section className="panel glow-card capture-panel" id="capture">
        <div className="panel-heading">
          <p>Step 1</p>
          <h2>Capture Work Order</h2>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) setImageUrl(URL.createObjectURL(file));
          }}
        />
        {imageUrl ? <img className="preview" src={imageUrl} alt="Uploaded work order preview" /> : null}
        <div className="button-row">
          <button type="button" className="secondary" onClick={() => setStatus('OCR placeholder for MVP. Use manual entry after capturing the image.')}>
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
          {(
            [
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
            ] as [keyof WocData, string][]
          ).map(([field, label]) => (
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
        <label>
          Issue Type
          <select value={data.issueType} onChange={(event) => setField('issueType', event.target.value)}>
            {['Incorrect Time', 'Missing Information', 'Missing Operation', 'Missing Fixture Callout', 'Wrong Routing', 'Missing Setup Time', 'Missing Grind / Finish Time', 'Other'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Priority
          <select value={data.priority} onChange={(event) => setField('priority', event.target.value)}>
            {['Low', 'Medium', 'High', 'Critical'].map((item) => <option key={item}>{item}</option>)}
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
        <button type="button" onClick={() => setShowDraft(true)}>Generate Report + Email Draft</button>
      </section>

      <section className="panel glow-card draft-panel" id="drafts">
        <div className="panel-heading">
          <p>Step 4</p>
          <h2>{showDraft ? 'Draft. Confirm. Send.' : 'Drafts'}</h2>
        </div>
        {showDraft ? (
          <>
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
            <button type="button" disabled={!allConfirmed || sending} onClick={sendEmail}>{sending ? 'Sending...' : 'Send Email'}</button>
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
        <p>Sent requests will appear here after email delivery is connected and tracking is added.</p>
      </section>

      <section className="panel glow-card compact-info" id="more">
        <div className="panel-heading">
          <p>System</p>
          <h2>REFAB Connect</h2>
        </div>
        <p>Work Order Correction powered by Applied Intelligence Framework. Draft first. Confirm accuracy. Then send.</p>
      </section>

      <nav className="bottom-nav" aria-label="AI-WOC navigation">
        {navItems.map(([icon, item, target], index) => (
          <a className={index === 0 ? 'active' : ''} href={target} key={item}>
            <span className="nav-icon">{icon}</span>
            <span>{item}</span>
          </a>
        ))}
      </nav>

      {status ? <p className="status">{status}</p> : null}
    </main>
  );
}
