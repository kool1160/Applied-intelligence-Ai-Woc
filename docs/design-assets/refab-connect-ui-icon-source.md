# REFAB Connect / AI-WOC UI + Icon Source

Owner: Christopher Hilton / Applied Intelligence  
Project: REFAB Connect / AI-WOC  
Purpose: Single source file for UI polish, icon usage, asset storage, and implementation guardrails.

---

## 1. Operating Intent

AI-WOC is a lightweight work-order correction app for shop-floor use.

It should feel like a fast mobile task tool, not a crowded ERP form.

Core UX principle:

> Fast, simple, guided, and hard to mess up.

Primary workflow:

```text
Home
→ Capture
→ AI Vision / Verify Header
→ Continue to Build Correction
→ Correction Type / Issue Fields
→ Generate Draft
→ Drafts
→ Confirm + Send
→ Start New Correction
```

---

## 2. Current UI Direction

The app should use the newer REFAB Connect / Applied Intelligence visual direction:

- dark premium shell
- mobile-first layout
- compact iPhone/PWA spacing
- glass / translucent chrome mainly for navigation, app header, and key UI elements
- red, black, silver/gray REFAB brand influence
- clean rounded cards
- compact bottom dock
- minimal clutter
- focused task views instead of one long page

Design rule:

> The app should feel like a focused mobile task flow, not one long scrolling website.

---

## 3. Current UI Problems To Fix / Avoid

From current screenshots, prioritize these polish items:

1. **Header safe area**  
   Top card can sit too close to the iPhone Dynamic Island/browser UI. Keep enough safe-area top padding.

2. **Bottom dock contrast**  
   Inactive dock items were reading too white/bright. Keep inactive states dark glass and active states red-glass.

3. **Workflow row readability**  
   Workflow rows should read left-to-right quickly. Avoid centered paragraph text in workflow rows.

4. **Dock size**  
   Dock should stay compact and premium. It should not steal screen space.

5. **Icon overuse**  
   Icons support workflow. They should not decorate every field.

6. **ERP creep**  
   Do not reintroduce long dropdown lists or crowded all-in-one forms.

---

## 4. Navigation Model

Bottom nav must stay at five items:

```text
Home
Capture
Drafts
History
More
```

Do **not** add Build Correction as a bottom-nav item.

Build Correction is an internal workflow step reached from:

- Home workflow card
- Capture view: Continue to Build Correction
- Drafts empty state: Build Correction button

---

## 5. Icon Asset Storage

Store new icon assets here:

```text
public/assets/icons/refab-connect-glass/
```

Recommended source/archive location:

```text
docs/design-assets/icon-packs/refab-connect-glass-icons.zip
```

Recommended structure:

```text
public/
  assets/
    icons/
      refab-connect-glass/
        home.png
        capture.png
        drafts.png
        history.png
        more.png
        work-order.png
        ai-vision.png
        correction.png
        send.png
        icon-manifest.json
        1024/
          home.png
          capture.png
          drafts.png
          history.png
          more.png
          work-order.png
          ai-vision.png
          correction.png
          send.png

docs/
  design-assets/
    icon-packs/
      refab-connect-glass-icons.zip
```

---

## 6. Required Icon Names + Uses

| File | Use |
|---|---|
| `home.png` | Bottom nav Home |
| `capture.png` | Bottom nav Capture |
| `drafts.png` | Bottom nav Drafts |
| `history.png` | Bottom nav History |
| `more.png` | Bottom nav More |
| `work-order.png` | Capture router / work order workflow state |
| `ai-vision.png` | Extract + Confirm / AI Vision state |
| `correction.png` | Build Correction workflow state |
| `send.png` | Confirm + Send / Ready to Send state |

Preferred bottom-nav visual footprint:

```text
28px–34px
```

Labels must stay readable and must not wrap.

---

## 7. Icon Usage Rules

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

Icon style direction:

- premium glass
- simple shapes
- recognizable at small size
- works on dark background
- consistent sizing
- restrained glow
- no visual clutter
- no overly complex details that disappear at mobile size

---

## 8. Suggested React Mapping

Use this when replacing emoji icons with image assets after approval.

```ts
const navIconMap: Record<string, string> = {
  Home: '/assets/icons/refab-connect-glass/home.png',
  Capture: '/assets/icons/refab-connect-glass/capture.png',
  Drafts: '/assets/icons/refab-connect-glass/drafts.png',
  History: '/assets/icons/refab-connect-glass/history.png',
  More: '/assets/icons/refab-connect-glass/more.png',
};

const workflowIconMap: Record<string, string> = {
  'Capture Router': '/assets/icons/refab-connect-glass/work-order.png',
  'Extract + Confirm': '/assets/icons/refab-connect-glass/ai-vision.png',
  'Build Correction': '/assets/icons/refab-connect-glass/correction.png',
  'Confirm + Send': '/assets/icons/refab-connect-glass/send.png',
};
```

Example nav render:

```tsx
<img
  className="nav-icon-img"
  src={navIconMap[label]}
  alt=""
  aria-hidden="true"
/>
```

Example workflow render:

```tsx
<img
  className="workflow-icon-img"
  src={workflowIconMap[title]}
  alt=""
  aria-hidden="true"
/>
```

Do not use these images as semantic content. Labels already provide the meaning.

---

## 9. Suggested CSS

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

.bottom-nav button,
.bottom-nav a {
  color: rgba(238, 242, 247, 0.74);
}

.bottom-nav button.active,
.bottom-nav a.active,
.bottom-nav .active {
  color: #ff6268;
}
```

Keep icon containers compact. Do not enlarge the dock to fit the artwork.

---

## 10. Current Working Features To Preserve

Do not break these while changing UI/icons:

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
- Vercel environment variable usage
- server-side `OPENAI_API_KEY` only

---

## 11. Correction Type Scope

Keep correction entry simple.

Correction Type options:

- Incorrect Time / Rate
- Missing Grind / Finish Operation
- Missing Weld Operation
- Missing Fixture / Work Instruction
- Wrong / Missing Router Step
- Other

Do not reintroduce a long ERP-style list of options.

Core principle:

> Pick correction type, enter one or two values, review, send.

---

## 12. AI Vision Behavior

AI Vision is used to read the router/header photo.

Important extracted fields:

- Work Order
- Part Number
- Revision
- Customer
- Quantity

Best photo:

```text
Close, clear shot of the printed header.
```

Core rule:

> Header photo = extraction. Full router photo = evidence/reference.

---

## 13. Do Not Add During UI/Icon Work

Do not add:

- database/storage
- dashboard
- barcode scanning
- ERP updates
- AI-CIS logic
- LIR logic
- ROI logic
- case study logic
- new workflow agents
- extra app sections unless explicitly requested

Focus on polishing the existing flow.

---

## 14. UI Polish Priority Order

1. Preserve focused task view flow
2. Keep bottom dock compact
3. Make Capture → Build Correction → Drafts obvious
4. Make icons consistent and premium
5. Reduce field clutter
6. Improve one-page email output
7. Only then consider deeper visual/icon swaps

---

## 15. Implementation Rule

Do not auto-replace production icons unless Chris approves the swap.

Safe first step:

```text
Add assets → add source file → add CSS support → preview → approve → swap icons
```

---

## 16. Core Principle

> Standardize to Optimize.  
> Make the correct action obvious.  
> Make the wrong action hard to do.
