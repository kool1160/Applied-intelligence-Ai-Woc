(function () {
  const OPTIONAL_PLACEHOLDERS = [
    '\\[N/A\\]',
    '\\[VERIFY OPERATION\\]',
    '\\[VERIFY PROCESS\\]',
    '\\[VERIFY DEPARTMENT\\]',
    '\\[CURRENT CONDITION REQUIRED\\]',
    '\\[ENGINEERING REVIEW REQUIRED\\]',
  ].join('|');

  const MISSING_REQUIRED_TEXT = 'Missing required field — complete before sending.';

  function cleanOptionalBlocks(text) {
    let output = text;

    output = output.replace(
      new RegExp('\\n?(Revision|Customer|Quantity|Department|Operation \\/ Router Step|Process|Current Work Order Condition|Current Listed Rate|Observed Sustainable Baseline|Recommended Engineering Baseline):\\n(?:' + OPTIONAL_PLACEHOLDERS + ')\\n', 'g'),
      '\n',
    );

    output = output
      .replace(/Operation:\n\[VERIFY OPERATION\] – \[VERIFY PROCESS\]\n/g, '')
      .replace(/Operation:\n([^\n]+) – \[VERIFY PROCESS\]\n/g, 'Operation:\n$1\n')
      .replace(/Operation:\n\[VERIFY OPERATION\] – ([^\n]+)\n/g, 'Process:\n$1\n')
      .replace(/Current Listed Condition:\n\[CURRENT CONDITION REQUIRED\]\n/g, '')
      .replace(/Observed Sustainable Baseline \/ Corrected Information:\n\[N\/A\]\n/g, '');

    return output;
  }

  function cleanRequiredPlaceholders(text) {
    return text
      .replace(/\[WO REQUIRED\]/g, MISSING_REQUIRED_TEXT)
      .replace(/\[PART REQUIRED\]/g, MISSING_REQUIRED_TEXT)
      .replace(/\[CATEGORY REQUIRED\]/g, MISSING_REQUIRED_TEXT)
      .replace(/\[PROBLEM SUMMARY REQUIRED\]/g, MISSING_REQUIRED_TEXT)
      .replace(/\[REQUESTED ENGINEERING ACTION REQUIRED\]/g, MISSING_REQUIRED_TEXT)
      .replace(/\[VERIFY WORK ORDER\]/g, 'Not provided')
      .replace(/\[VERIFY PART NUMBER\]/g, 'Not provided');
  }

  function normalizeWhitespace(text) {
    return text
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function cleanAiwocOutput(text) {
    if (typeof text !== 'string' || !text.includes('[')) return text;
    return normalizeWhitespace(cleanRequiredPlaceholders(cleanOptionalBlocks(text)));
  }

  window.cleanAiwocOutput = cleanAiwocOutput;

  function cleanPreviews() {
    document.querySelectorAll('pre').forEach((node) => {
      const currentText = node.textContent || '';
      const cleanedText = cleanAiwocOutput(currentText);
      if (cleanedText !== currentText) {
        node.textContent = cleanedText;
      }
    });
  }

  const originalWriteText = navigator.clipboard && navigator.clipboard.writeText
    ? navigator.clipboard.writeText.bind(navigator.clipboard)
    : null;

  if (originalWriteText) {
    navigator.clipboard.writeText = function writeCleanAiwocText(text) {
      return originalWriteText(cleanAiwocOutput(text));
    };
  }

  const originalFetch = window.fetch ? window.fetch.bind(window) : null;
  if (originalFetch) {
    window.fetch = function cleanAiwocSendPayload(input, init) {
      const url = typeof input === 'string' ? input : input && input.url;
      if (url === '/api/send' && init && typeof init.body === 'string') {
        try {
          const payload = JSON.parse(init.body);
          if (typeof payload.emailBody === 'string') {
            payload.emailBody = cleanAiwocOutput(payload.emailBody);
            init = { ...init, body: JSON.stringify(payload) };
          }
        } catch {
          // Keep original request unchanged when body is not JSON.
        }
      }

      return originalFetch(input, init);
    };
  }

  cleanPreviews();
  new MutationObserver(cleanPreviews).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}());
