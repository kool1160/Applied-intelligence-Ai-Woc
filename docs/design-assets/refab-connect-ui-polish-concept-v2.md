# REFAB Connect / AI-WOC UI Polish Concept V2

Owner: Christopher Hilton / Applied Intelligence  
Project: REFAB Connect / AI-WOC  
Lane: UI / Icon Polish Only  
Status: Prepared ahead for future implementation  

---

## 1. Purpose

This document captures the approved visual direction for a future UI polish pass.

The goal is to make AI-WOC feel more premium, mobile-native, and focused without changing the workflow or app behavior.

Core rule:

> Polish the interface. Preserve the machine.

---

## 2. Non-Negotiable Guardrails

Stay in the UI/icon polish lane only.

Do **not** add:

- workflow redesign
- new features
- dashboards
- database/storage
- barcode scanning
- ERP updates
- AI-CIS logic
- LIR logic
- ROI logic
- case study logic
- new agents
- extra bottom nav items

Preserve:

- current beta flow
- current app behavior
- AI Vision extraction
- Basic OCR fallback
- uploaded image preview
- Quick Entry/header fields
- focused task views
- simplified correction type flow
- Generate Draft
- confirmation checkboxes
- Send Email
- History
- Start New Correction / Clear Form
- server-side `OPENAI_API_KEY` behavior

---

## 3. Approved Design Direction

The approved concept direction is:

> Dark. Focused. Fast.  
> Standardize to Optimize.

The UI should feel:

- premium
- compact
- mobile-first
- industrial
- dark glass / chrome
- REFAB red + black + silver
- guided
- practical for shop-floor use

It should **not** feel:

- bloated
- ERP-like
- white-button heavy
- generic SaaS
- decorative for no reason
- one long scrolling website

---

## 4. Main Concept Changes

### A. Header / Top Card

Current issue:

- Header can crowd iPhone safe area / Dynamic Island.
- Header is visually strong but needs tighter mobile scaling.

Future polish:

- Keep REFAB Connect logo tile on the left.
- Keep `Work Order Correction` large and bold.
- Keep `Powered by Applied Intelligence Framework` in red.
- Keep `AI-WOC SYSTEM` with green status dot.
- Add better safe-area top spacing.
- Scale headline down slightly on narrow iPhones.

Do not change the header meaning or structure.

---

### B. Home Composition

Current issue:

- Home is close, but can feel slightly oversized on phone.

Future polish:

- Keep the hero statement:

```text
Fix bad router data before it becomes waste.
```

- Tighten hero card padding.
- Keep stats cards below.
- Keep the workflow section visible and obvious.
- Avoid making the home page feel like a website landing page.

Goal:

> A welder opens the app and instantly knows where to tap.

---

### C. Workflow Cards

Use the concept style:

```text
[glass icon]  Capture Router       >
              Snap or upload work order.

[glass icon]  Extract + Confirm    >
              Pull WO, part, process, and rate into clean fields.

[glass icon]  Build Correction     >
              Generate report and Engineering email draft.

[glass icon]  Confirm + Send       >
              Draft first. Confirm accuracy. Then send.
```

Rules:

- Left-align text.
- Keep rows compact.
- Keep chevron on the right.
- Do not center workflow row text.
- Use workflow icons only here and on major task actions.
- Do not add extra steps.

---

### D. Bottom Dock

Bottom nav stays five items:

```text
Home
Capture
Drafts
History
More
```

Future polish:

- Dock should be compact dark glass.
- Inactive items should be dark, not white.
- Active item should be red glass.
- Keep labels readable.
- Keep icons around 28px–34px visual footprint.
- Keep active dot.

Do not add Build Correction to the dock.

---

### E. Icon Lane

Use the prepared icon source path:

```text
public/assets/icons/refab-connect-glass/
```

Required icons:

```text
home.png
capture.png
drafts.png
history.png
more.png
work-order.png
ai-vision.png
correction.png
send.png
```

Use icons for:

- bottom nav
- workflow cards
- major task actions
- capture / AI Vision / correction / send states

Avoid icons for:

- every field
- every small label
- dense form rows
- decorative filler

---

## 5. Screen Concepts

### Home — Concept

Intent:

- Clear app identity.
- Clear value statement.
- Clear current status cards.
- Clear correction workflow.

Structure:

```text
Top Card
Hero Card
Stats Cards
Correction Workflow
Bottom Dock
```

Acceptance check:

- User can identify Capture Router within 2 seconds.
- Bottom dock does not cover critical content.
- Header does not sit under iPhone chrome.

---

### Capture — Concept

Intent:

- Guide user through header photo capture.
- Avoid dense form feel.
- Keep AI Vision and OCR obvious.

Structure:

```text
Step Header
Short instruction
Beta guidance / checklist
Take Photo
Upload File / Picture
Extract With AI Vision
Basic OCR Fallback
Quick Entry
Bottom Dock
```

Future polish:

- Make Take Photo and Upload File feel like major action cards.
- Keep AI Vision visually recommended when image is available.
- Keep OCR fallback secondary.
- Do not remove manual entry.

---

### Build Correction — Concept

Intent:

- Focused issue entry.
- No ERP-style complexity.

Structure:

```text
Build Correction
Correction Type
Operation / Process
What is Incorrect?
Correct Value
Notes Optional
Generate Draft
```

Rules:

- Keep correction types simple.
- Do not add long dropdowns.
- Generate Draft remains the primary action.

---

### Drafts — Concept

Intent:

- Empty state should feel intentional, not unfinished.

Structure when empty:

```text
Drafts
No active drafts
Complete issue fields and generate correction report...
Build Correction button
```

Structure when draft exists:

```text
Email Draft
Report Preview
Confirmation Checklist
Send Email
Copy Buttons
```

Rules:

- Draft first.
- Confirm accuracy.
- Then send.

---

### History — Concept

Intent:

- Simple record of sent requests.
- No dashboard.

Rules:

- Keep History minimal.
- Do not add analytics or reporting.
- No dashboard scope.

---

### More — Concept

Intent:

- Basic app/system info.
- Default Engineering recipient.
- No feature creep.

Rules:

- Keep it informational.
- Do not turn More into settings/dashboard/admin.

---

## 6. Future React Implementation Notes

When Chris approves icon swapping, use this mapping:

```ts
const navIconMap: Record<TaskView, string> = {
  Home: '/assets/icons/refab-connect-glass/home.png',
  Capture: '/assets/icons/refab-connect-glass/capture.png',
  Drafts: '/assets/icons/refab-connect-glass/drafts.png',
  History: '/assets/icons/refab-connect-glass/history.png',
  More: '/assets/icons/refab-connect-glass/more.png',
  'Build Correction': '/assets/icons/refab-connect-glass/correction.png',
};

const workflowIconMap: Record<string, string> = {
  'Capture Router': '/assets/icons/refab-connect-glass/work-order.png',
  'Extract + Confirm': '/assets/icons/refab-connect-glass/ai-vision.png',
  'Build Correction': '/assets/icons/refab-connect-glass/correction.png',
  'Confirm + Send': '/assets/icons/refab-connect-glass/send.png',
};
```

If `TaskView` includes `Build Correction`, do not use it as a bottom-nav item. The mapping can exist for internal workflow use only.

Example nav image:

```tsx
<img
  className="nav-icon-img"
  src={navIconMap[label]}
  alt=""
  aria-hidden="true"
/>
```

Example workflow image:

```tsx
<img
  className="workflow-icon-img"
  src={workflowIconMap[title]}
  alt=""
  aria-hidden="true"
/>
```

---

## 7. Future CSS Starter

Use only after assets are in place and icon swap is approved.

```css
.nav-icon-img {
  width: 30px;
  height: 30px;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.12));
}

.workflow-icon-img {
  width: 54px;
  height: 54px;
  object-fit: contain;
  display: block;
}

.workflow-row > div {
  text-align: left;
}

.workflow-row h3,
.workflow-row p {
  text-align: left;
}
```

---

## 8. Implementation Phases

### Phase 1 — CSS polish only

Already started in PR #64.

Scope:

- top safe-area
- compact dark dock states
- workflow row readability
- mobile card tightening

No behavior changes.

---

### Phase 2 — Asset storage

Add final icon assets to:

```text
public/assets/icons/refab-connect-glass/
```

Add archive to:

```text
docs/design-assets/icon-packs/refab-connect-glass-icons.zip
```

Do not swap production icons yet.

---

### Phase 3 — Icon swap

Only after approval:

- replace emoji/icon placeholders with PNG images
- keep labels
- keep five bottom nav items
- keep workflow rows unchanged structurally

---

### Phase 4 — Final mobile pass

Check on:

- iPhone Safari
- iPhone PWA/home screen mode
- iPad Safari
- desktop preview

Acceptance checks:

- header does not overlap Dynamic Island/browser chrome
- dock stays compact
- inactive dock states are dark glass
- active dock state is red glass
- workflow cards are readable
- Capture flow is obvious
- Drafts empty state feels intentional
- app behavior unchanged

---

## 9. Final Approval Standard

The finished UI should feel like:

> A premium shop-floor correction tool built from the floor up.

It should make the user feel:

- guided
- confident
- fast
- protected from mistakes

It should not make the user feel:

- buried in forms
- lost in ERP options
- forced into a dashboard
- unsure what to tap next

---

## 10. Core Principle

> Standardize to Optimize.  
> Make the correct action obvious.  
> Make the wrong action hard to do.
