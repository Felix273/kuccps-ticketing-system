import React, { useEffect, useState } from 'react';
import { Download, FileText, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

const PREVIEW_HEIGHT = 'h-[60vh]';

function parseCsv(text, maxRows = 200) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length && rows.length < maxRows; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if ((cell || row.length) && rows.length < maxRows) rows.push([...row, cell]);
  return rows;
}

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Shows an uploaded knowledge-base file inside the app: PDFs and images inline, text/CSV/JSON
 * as text, Word (.docx) converted to HTML in a sandboxed frame. Files are fetched with the
 * session cookie into a temporary blob URL (the API forbids being framed directly).
 */
export const KnowledgeAttachmentPreview = ({ articleId, attachment }) => {
  const [state, setState] = useState({ status: 'loading' });
  const basePath = `/knowledge-base/articles/${articleId}/attachments/${attachment.storageKey}`;

  useEffect(() => {
    let active = true;
    let objectUrl = null;
    api.rawFetch(`${basePath}/preview`)
      .then(async response => {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          if (!active) return;
          if (!response.ok) setState({ status: 'unsupported', message: data.message });
          else setState({ status: 'ready', kind: data.kind, text: data.text, html: data.html, format: data.format, truncated: data.truncated });
          return;
        }
        const blob = await response.blob();
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ status: 'ready', kind: contentType.startsWith('image/') ? 'image' : 'pdf', url: objectUrl });
      })
      .catch(error => { if (active) setState({ status: 'error', message: error.message }); });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [basePath]);

  const handleDownload = async () => {
    const response = await api.rawFetch(basePath);
    if (!response.ok) return;
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.name || 'document';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  let body;
  if (state.status === 'loading') {
    body = (
      <div className="flex items-center gap-2 p-6 font-mono text-xs text-zinc-500">
        <RefreshCw className="h-4 w-4 animate-spin text-[#990024]" /> Loading preview...
      </div>
    );
  } else if (state.status !== 'ready') {
    body = <p className="p-4 font-mono text-xs text-zinc-500">{state.message || 'Preview unavailable.'} You can still download the file.</p>;
  } else if (state.kind === 'pdf') {
    body = <iframe title={`Preview of ${attachment.name}`} src={state.url} className={`w-full ${PREVIEW_HEIGHT} rounded-b-lg`} />;
  } else if (state.kind === 'image') {
    body = (
      <div className="flex justify-center bg-zinc-50 p-3">
        <img src={state.url} alt={attachment.name} className="max-h-[60vh] max-w-full rounded border border-zinc-200 object-contain" />
      </div>
    );
  } else if (state.kind === 'html') {
    const doc = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#18181b;margin:24px;max-width:860px}img{max-width:100%}table{border-collapse:collapse}td,th{border:1px solid #d4d4d8;padding:4px 8px}</style></head><body>${state.html}</body></html>`;
    // sandbox="" blocks scripts, forms and navigation inside the converted document.
    body = <iframe title={`Preview of ${attachment.name}`} sandbox="" srcDoc={doc} className={`w-full ${PREVIEW_HEIGHT} rounded-b-lg bg-white`} />;
  } else if (state.format === 'csv') {
    const rows = parseCsv(state.text);
    body = (
      <div className={`overflow-auto ${PREVIEW_HEIGHT}`}>
        <table className="min-w-full text-left text-xs">
          <thead className="sticky top-0 bg-zinc-100 font-mono text-[11px]">
            <tr>{(rows[0] || []).map((cell, index) => <th key={index} className="border-b border-zinc-200 px-2 py-1.5">{cell}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex}>{row.map((cell, index) => <td key={index} className="px-2 py-1 align-top">{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
        {(state.truncated || rows.length >= 200) && <p className="p-2 font-mono text-[11px] text-zinc-400">Showing the first rows only. Download for the full file.</p>}
      </div>
    );
  } else {
    let text = state.text;
    if (state.format === 'json') {
      try { text = JSON.stringify(JSON.parse(text), null, 2); } catch { /* show as-is */ }
    }
    body = (
      <pre className={`overflow-auto ${PREVIEW_HEIGHT} whitespace-pre-wrap p-4 font-mono text-xs text-zinc-800`}>
        {text}
        {state.truncated && '\n\n… preview truncated. Download for the full file.'}
      </pre>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2">
        <span className="flex min-w-0 items-center gap-2 font-mono text-xs text-zinc-700">
          <FileText className="h-4 w-4 shrink-0 text-[#990024]" aria-hidden="true" />
          <span className="truncate font-semibold">{attachment.name}</span>
          <span className="text-zinc-400">{formatSize(attachment.size)}</span>
        </span>
        <button type="button" onClick={handleDownload}
          className="flex items-center gap-1 rounded border border-zinc-200 bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-zinc-700 hover:border-[#990024] hover:text-[#990024]">
          <Download className="h-3.5 w-3.5" /> Download
        </button>
      </div>
      {body}
    </div>
  );
};
