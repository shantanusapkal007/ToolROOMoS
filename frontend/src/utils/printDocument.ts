/**
 * Utility for printing clean, isolated documents without browser application chrome,
 * sidebars, navigation headers, or viewport overflow clipping.
 */
export interface PrintDocumentOptions {
  orientation?: 'landscape' | 'portrait';
  title?: string;
  margin?: string;
}

export function printIsolatedElement(elementId: string, options: PrintDocumentOptions = {}) {
  const {
    orientation = 'landscape',
    title = 'Document',
    margin = '6mm 8mm',
  } = options;

  if (typeof window === 'undefined') return;

  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  // Create isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Clone document element and remove UI controls
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.hide-on-print, [data-no-print="true"]').forEach((el) => el.remove());

  // Collect all styles from parent head
  const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('\n');

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        ${headStyles}
        <style>
          @page {
            size: A4 ${orientation};
            margin: ${margin};
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            background: #ffffff !important;
            color: #101114 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          }
          #${elementId}, .printable-sheet {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          .hide-on-print, [data-no-print="true"] {
            display: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; margin: 0 auto; background: #ffffff;">
          ${clone.outerHTML}
        </div>
      </body>
    </html>
  `);
  doc.close();

  const iframeWindow = iframe.contentWindow;
  const triggerPrint = () => {
    try {
      iframeWindow?.focus();
      iframeWindow?.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  };

  // Wait for all images in the document to load
  const images = doc.querySelectorAll('img');
  if (images.length === 0) {
    setTimeout(triggerPrint, 200);
  } else {
    let loaded = 0;
    const total = images.length;
    let triggered = false;
    const onDone = () => {
      if (triggered) return;
      loaded++;
      if (loaded >= total) {
        triggered = true;
        setTimeout(triggerPrint, 150);
      }
    };
    images.forEach((img) => {
      if (img.complete) {
        onDone();
      } else {
        img.onload = onDone;
        img.onerror = onDone;
      }
    });
    // Fallback safety timeout if image load events don't fire
    setTimeout(() => {
      if (!triggered) {
        triggered = true;
        triggerPrint();
      }
    }, 700);
  }
}

