const OPTIONAL_PLACEHOLDER_LINES = [
  '[N/A]',
  '[VERIFY OPERATION]',
  '[VERIFY PROCESS]',
  '[VERIFY DEPARTMENT]',
  '[CURRENT CONDITION REQUIRED]',
  '[ENGINEERING REVIEW REQUIRED]',
];

const REQUIRED_PLACEHOLDER_MARKERS = [
  '[WO REQUIRED]',
  '[PART REQUIRED]',
  '[CATEGORY REQUIRED]',
  '[PROBLEM SUMMARY REQUIRED]',
  '[REQUESTED ENGINEERING ACTION REQUIRED]',
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanPlaceholderLine(line: string) {
  let cleaned = line;

  for (const placeholder of OPTIONAL_PLACEHOLDER_LINES) {
    const escaped = escapeRegExp(placeholder);

    cleaned = cleaned
      .replace(new RegExp(`\\s*[–—-]\\s*${escaped}`, 'g'), '')
      .replace(new RegExp(`${escaped}\\s*[–—-]\\s*`, 'g'), '')
      .replace(new RegExp(escaped, 'g'), '')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  return cleaned;
}

function lineHasOnlyOptionalPlaceholder(line: string) {
  const normalized = line.trim();
  return OPTIONAL_PLACEHOLDER_LINES.includes(normalized);
}

function previousMeaningfulLineIsLabel(lines: string[], index: number) {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const previous = lines[cursor]?.trim() ?? '';
    if (!previous) continue;
    return previous.endsWith(':');
  }

  return false;
}

function collapseExcessBlankLines(text: string) {
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function cleanAiwocOutput(text: string) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const cleanedLines: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (lineHasOnlyOptionalPlaceholder(line)) {
      if (previousMeaningfulLineIsLabel(cleanedLines, cleanedLines.length)) {
        const previous = cleanedLines.pop();
        if (previous && previous.trim()) {
          const spacer = cleanedLines[cleanedLines.length - 1];
          if (spacer === '') cleanedLines.pop();
        }
      }
      continue;
    }

    const cleanedLine = cleanPlaceholderLine(line);
    if (!cleanedLine && line.trim()) continue;

    cleanedLines.push(cleanedLine);
  }

  return collapseExcessBlankLines(cleanedLines.join('\n'));
}

export function hasMissingRequiredAiwocFields(text: string) {
  return REQUIRED_PLACEHOLDER_MARKERS.some((marker) => text.includes(marker));
}
