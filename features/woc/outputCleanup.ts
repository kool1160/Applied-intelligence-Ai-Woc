const MISSING_REQUIRED_TEXT = 'Missing required field — complete before sending.';

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

export const MISSING_REQUIRED_MARKERS = [
  '[PROBLEM SUMMARY REQUIRED]',
  '[REQUESTED ENGINEERING ACTION REQUIRED]',
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
    .replace(/\[WO REQUIRED\]/g, MISSING_REQUIRED_TEXT)
    .replace(/\[PART REQUIRED\]/g, MISSING_REQUIRED_TEXT)
    .replace(/\[CATEGORY REQUIRED\]/g, MISSING_REQUIRED_TEXT)
    .replace(/\[PROBLEM SUMMARY REQUIRED\]/g, MISSING_REQUIRED_TEXT)
    .replace(/\[REQUESTED ENGINEERING ACTION REQUIRED\]/g, MISSING_REQUIRED_TEXT);
}

function normalizeWhitespace(text: string) {
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function cleanAiwocOutput(text: string) {
  return normalizeWhitespace(cleanRequiredIdentifierPlaceholders(cleanOptionalBlocks(text)));
}

export function hasMissingRequiredAiwocFields(subject: string, emailBody: string) {
  if (subject.includes('[CATEGORY REQUIRED]') || subject.includes('CATEGORY TBD')) return true;
  if (MISSING_REQUIRED_MARKERS.some((marker) => emailBody.includes(marker))) return true;

  const workOrderMissing = emailBody.includes('[VERIFY WORK ORDER]') || subject.includes('WO TBD');
  const partNumberMissing = emailBody.includes('[VERIFY PART NUMBER]') || subject.includes('PART TBD');
  return workOrderMissing && partNumberMissing;
}
