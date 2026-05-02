# Prototype Carryover Audit (AI-WOC)

## 1. Prototype behavior that must be preserved
- Capture flow supports **Take Photo** and **Upload File/Picture**, with image preview/evidence handling and status messaging.
- Extraction flow supports:
  - **AI Vision extraction** of header fields (WO, part, rev, customer, quantity) via `/api/extract-vision`.
  - **Basic OCR fallback** (Tesseract) when Vision is unavailable/insufficient.
  - **Paste Router/OCR text** parsing fallback.
- Parsed/extracted fields are mapped into state and remain **user-editable** on confirm/build screens.
- Confirm-to-draft flow preserves:
  - Report generation.
  - Email draft generation.
  - Required confirmation checks before send.
- Send flow preserves copy/send behavior and session submission history behavior.
- Helper parsing/normalization logic for work-order data must be preserved before any refactor.

## 2. Structured app missing behavior
> Direct GitHub repo-to-repo diff could not be completed in this environment (GitHub clone blocked with HTTP 403), so this is the required carryover checklist for structured parity.

Potential/likely missing or regressed carryover points to verify and restore:
- Full fallback chain parity: **Vision → OCR → text parse → manual confirm edit**.
- Exact mapping parity for `partNumber`/`cadDrawing`, `quantity`, `revision`, `customer`, `workOrder`.
- Confirm screen prefill parity and field editability parity.
- Confirmation gate parity before send (all checks + required fields).
- Report/email template parity and send payload parity.
- Submission history/session record parity if previously working.

## 3. Exact prototype files/functions inspected
Because remote prototype repo clone was blocked, inspection used currently available AI-WOC implementation as donor-reference in workspace.

- `app/page.tsx`
  - Helpers: `firstMatch`, `cleanLine`, `normalizeWorkOrder`, `normalizeQuantityCandidate`, `extractRouterData`, `prepareImageForVision`
  - Capture/extract: `onWorkOrderFileSelected`, `extractWithVision`, `extractTextFromPhoto`, `extractData`, `loadTesseractScript`
  - Confirm/edit flow: `setField`, data form rendering, `applyCorrectionType`
  - Draft/send flow: `report`, `emailSubject`, `emailBody`, `emailDraft`, `generateDraft`, `sendEmail`
  - Gates/history: `readyToDraft`, confirmation checks, `history` append logic
- `app/api/extract-vision/route.ts`
  - `visionPrompt`, `safeErrorMessage`, `extractResponseText`, `sanitizeResult`, `POST`
- `app/api/send/route.ts`
  - `POST` send validation and Resend dispatch

## 4. Exact structured files/functions inspected
Because remote structured repo clone was blocked, no direct inspection of `kool1160/refab-connect-ai-woc` files was possible in this environment.

Action required in next implementation PR prep:
- Open and enumerate structured equivalents of:
  - capture UI handlers
  - extraction handlers (Vision/OCR/text)
  - parser helpers
  - confirm field bindings
  - draft generators
  - send gate logic
  - submission history logic
  - `/api/extract-vision` and `/api/send` routes
- Perform side-by-side function-level parity matrix against donor functions listed in section 3.

## 5. Extraction-to-confirm mapping plan
1. **Lock donor behavior**
   - Treat donor extraction/mapping helpers as source of truth first; no redesign.
2. **Recreate fallback chain in structured app**
   - Keep ordering: image select → Vision extract → OCR fallback → text parse fallback → manual edit.
3. **Preserve state mapping rules exactly**
   - Maintain non-destructive updates (`new value || existing value`) for key fields.
   - Preserve normalization for WO and quantity filtering.
4. **Preserve confirm prefill + editability**
   - All extracted fields must prefill and remain editable before draft/send.
5. **Preserve draft outputs + gates**
   - Keep report/email generation templates and all required confirmation checks before send enablement.
6. **Preserve submission behavior**
   - Keep session history append/id increment behavior if already present.
7. **Only after parity**
   - Refactor internals (module split/tests) without altering output behavior.

## 6. Recommended PR sequence
1. **PR-1: Carryover restore (behavior parity only)**
   - Restore extraction→confirm→draft→confirm→send flow to donor behavior.
2. **PR-2: Parity tests**
   - Add regression tests for parser mapping + send gates.
3. **PR-3: Internal cleanup**
   - Refactor structure only (no behavior/output changes).

## 7. Next required PR ticket
**Title:** Restore donor extraction-to-confirm-to-draft flow parity in structured AI-WOC

**Scope (must include):**
- Reinstate donor fallback chain (Vision/OCR/text/manual).
- Reinstate donor field mapping and normalization helpers.
- Reinstate confirm prefill/edit behavior.
- Reinstate report/email draft generators.
- Reinstate confirmation gates before send.
- Reinstate submission history behavior (if previously working).

**Out of scope (must not include):**
- Dashboards, DB logic, barcode logic, ERP updates, new agents, UI redesign.

**Acceptance criteria:**
- Structured app matches donor behavior for extraction-to-confirm-to-draft flow.
- Send remains disabled until required confirmations are complete.
- No net-new features; parity first.
