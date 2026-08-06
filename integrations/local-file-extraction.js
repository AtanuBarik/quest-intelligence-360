(() => {
  'use strict';

  const scripts = new Map();
  function ensureScript(src, globalName) {
    if (window[globalName]) return Promise.resolve();
    if (scripts.has(src)) return scripts.get(src);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${src}`));
      document.head.appendChild(script);
    });
    scripts.set(src, promise);
    return promise;
  }

  window.__questExtractFile = async file => {
    const extension = (file.name.split('.').pop() || '').toLowerCase();
    if (['txt','md','csv','tsv','json','html','htm','xml'].includes(extension)) return file.text();

    if (['xlsx','xls'].includes(extension)) {
      await ensureScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'XLSX');
      const workbook = XLSX.read(await file.arrayBuffer(), { type:'array' });
      return workbook.SheetNames.map(name => `## ${name}\n${XLSX.utils.sheet_to_csv(workbook.Sheets[name])}`).join('\n\n');
    }

    if (extension === 'docx') {
      await ensureScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js', 'mammoth');
      return (await mammoth.extractRawText({ arrayBuffer:await file.arrayBuffer() })).value;
    }

    if (extension === 'pdf') {
      await ensureScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js', 'pdfjsLib');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({ data:await file.arrayBuffer() }).promise;
      const pages = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        pages.push(`## Page ${pageNumber}\n${content.items.map(item => item.str).join(' ')}`);
      }
      return pages.join('\n\n');
    }

    return '';
  };
})();
