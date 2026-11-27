import React, { useEffect, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { knowledgeBaseService } from '../../services/knowledgeBaseService';

const ACCEPT = '.pdf,.doc,.docx,.txt,.md,.csv,.json,.log,.png,.jpg,.jpeg,.webp';
const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Lets ICT officers upload documents, guides, screenshots or raw data to the knowledge base.
 * Officers' uploads go to the admin review queue; administrators' uploads publish directly.
 */
export const KnowledgeUploadDialog = ({ categories = [], isAdmin, onClose, onUploaded }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0] || 'General Requests');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const onKeyDown = event => { if (event.key === 'Escape' && !isUploading) onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isUploading, onClose]);

  const fileError = file && file.size > MAX_BYTES ? 'File is larger than 15 MB' : null;

  const handleSubmit = async event => {
    event.preventDefault();
    if (!file || fileError || isUploading) return;
    setIsUploading(true);
    try {
      const result = await knowledgeBaseService.uploadMaterial(file, {
        title: title.trim() || undefined,
        category,
        tags: tags.trim() || undefined
      });
      if (!result.success) throw new Error(result.message || 'Upload failed');
      toast.success(isAdmin ? 'Document published to the knowledge base' : 'Document submitted for administrator review');
      onUploaded?.(result.article);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const fieldClass = 'w-full p-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-[#990024] focus:bg-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="kb-upload-title">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-zinc-100 p-5">
          <div>
            <h2 id="kb-upload-title" className="text-sm font-bold text-zinc-900">Upload to the knowledge base</h2>
            <p className="text-[11px] text-zinc-500">
              Documents, guides, screenshots or raw data (PDF, Word, text, CSV/JSON, images; max 15 MB).
              {isAdmin ? ' Your upload is published immediately.' : ' It is reviewed by an administrator before it becomes visible.'}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={isUploading} className="text-zinc-400 hover:text-zinc-700" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label htmlFor="kb-upload-file" className="mb-1 block text-xs font-semibold text-zinc-700">File <span className="text-rose-600">*</span></label>
            <input id="kb-upload-file" type="file" accept={ACCEPT} onChange={event => setFile(event.target.files?.[0] || null)} className="block w-full text-xs" />
            {fileError && <p className="mt-1 text-[11px] text-rose-600">{fileError}</p>}
          </div>
          <div>
            <label htmlFor="kb-upload-title-input" className="mb-1 block text-xs font-semibold text-zinc-700">Title</label>
            <input id="kb-upload-title-input" value={title} onChange={event => setTitle(event.target.value)} className={fieldClass}
              placeholder="Defaults to the file name" maxLength={180} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="kb-upload-category" className="mb-1 block text-xs font-semibold text-zinc-700">Category</label>
              <select id="kb-upload-category" value={category} onChange={event => setCategory(event.target.value)} className={fieldClass}>
                {categories.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="kb-upload-tags" className="mb-1 block text-xs font-semibold text-zinc-700">Tags</label>
              <input id="kb-upload-tags" value={tags} onChange={event => setTags(event.target.value)} className={fieldClass} placeholder="printer, driver" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-100 p-4">
          <button type="button" onClick={onClose} disabled={isUploading} className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">Cancel</button>
          <button type="submit" disabled={!file || Boolean(fileError) || isUploading}
            className="flex items-center gap-1.5 rounded-lg bg-[#990024] px-4 py-2 text-xs font-semibold text-white hover:bg-[#80001e] disabled:opacity-50">
            <Upload className="h-3.5 w-3.5" />
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>
    </div>
  );
};
