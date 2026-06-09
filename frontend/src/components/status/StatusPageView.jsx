import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, Plus, RadioTower, Send } from 'lucide-react';
import { statusIssueService } from '../../services/statusIssueService';
import { authService } from '../../services/authService';

const STATUS_OPTIONS = ['Investigating', 'In Progress', 'Monitoring', 'Resolved'];
const SEVERITY_OPTIONS = ['Informational', 'Minor', 'Major', 'Critical'];

export const StatusPageView = () => {
  const [issues, setIssues] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [updateDrafts, setUpdateDrafts] = useState({});
  const [draft, setDraft] = useState({
    title: '',
    description: '',
    status: 'Investigating',
    severity: 'Informational',
    systems: '',
    isPublic: true
  });

  const currentUser = authService.getCurrentUser();
  const canManage = ['admin', 'staff'].includes(currentUser?.role);

  const loadIssues = async () => {
    try {
      const response = await statusIssueService.getAll();
      if (response.success) setIssues(response.issues || []);
    } catch (error) {
      console.error('Failed to load status issues:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadIssues, 0);
    return () => clearTimeout(timer);
  }, []);

  const activeIssues = useMemo(
    () => issues.filter(issue => !['Completed', 'Resolved'].includes(issue.status)),
    [issues]
  );

  const createIssue = async (event) => {
    event.preventDefault();
    const response = await statusIssueService.create(draft);
    if (response.success) {
      setIssues(prev => [response.issue, ...prev]);
      setShowCreate(false);
      setDraft({ title: '', description: '', status: 'Investigating', severity: 'Informational', systems: '', isPublic: true });
    }
  };

  const addUpdate = async (issue) => {
    const draftUpdate = updateDrafts[issue.id];
    if (!draftUpdate?.message?.trim()) return;
    const response = await statusIssueService.addUpdate(issue.id, draftUpdate);
    if (response.success) {
      setUpdateDrafts(prev => ({ ...prev, [issue.id]: { message: '', status: issue.status, isPublic: true } }));
      await loadIssues();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${activeIssues.length ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
              {activeIssues.length ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {activeIssues.length ? `${activeIssues.length} Active Issue${activeIssues.length > 1 ? 's' : ''}` : 'All Systems Operational'}
              </h2>
              <p className="text-gray-600">Shared visibility for outages, degraded services, and major incidents.</p>
            </div>
          </div>
          {canManage && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-3 bg-[#911414] text-white rounded-lg hover:bg-[#ac0807] flex items-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              New Issue
            </button>
          )}
        </div>
      </div>

      {showCreate && (
        <form onSubmit={createIssue} className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Create Status Issue</h3>
          <input
            required
            value={draft.title}
            onChange={(e) => setDraft(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Issue title"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
          />
          <textarea
            required
            value={draft.description}
            onChange={(e) => setDraft(prev => ({ ...prev, description: e.target.value }))}
            placeholder="What is affected, who is affected, and what should users do?"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={draft.status} onChange={(e) => setDraft(prev => ({ ...prev, status: e.target.value }))} className="px-4 py-3 border border-gray-300 rounded-lg">
              {STATUS_OPTIONS.map(option => <option key={option}>{option}</option>)}
            </select>
            <select value={draft.severity} onChange={(e) => setDraft(prev => ({ ...prev, severity: e.target.value }))} className="px-4 py-3 border border-gray-300 rounded-lg">
              {SEVERITY_OPTIONS.map(option => <option key={option}>{option}</option>)}
            </select>
            <input
              value={draft.systems}
              onChange={(e) => setDraft(prev => ({ ...prev, systems: e.target.value }))}
              placeholder="Affected systems"
              className="px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-[#911414] text-white rounded-lg">Publish</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {issues.map(issue => {
          const issueUpdate = updateDrafts[issue.id] || { message: '', status: issue.status, isPublic: true };
          return (
            <div key={issue.id} className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {issue.status}
                    </span>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-semibold">{issue.severity}</span>
                    {issue.systems && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{issue.systems}</span>}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{issue.title}</h3>
                  <p className="text-gray-700 mt-2 whitespace-pre-wrap">{issue.description}</p>
                </div>
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  Started {new Date(issue.startedAt).toLocaleString()}
                </div>
              </div>

              <div className="mt-5 border-t pt-4 space-y-3">
                {(issue.updates || []).map(update => (
                  <div key={update.id} className="flex gap-3">
                    <RadioTower className="w-4 h-4 text-[#911414] mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{update.message}</p>
                      <p className="text-xs text-gray-500">{new Date(update.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              {canManage && (
                <div className="mt-5 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <textarea
                    value={issueUpdate.message}
                    onChange={(e) => setUpdateDrafts(prev => ({ ...prev, [issue.id]: { ...issueUpdate, message: e.target.value } }))}
                    placeholder="Post an update..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <div className="flex justify-end gap-3 mt-3">
                    <select
                      value={issueUpdate.status}
                      onChange={(e) => setUpdateDrafts(prev => ({ ...prev, [issue.id]: { ...issueUpdate, status: e.target.value } }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {STATUS_OPTIONS.map(option => <option key={option}>{option}</option>)}
                    </select>
                    <button onClick={() => addUpdate(issue)} className="px-4 py-2 bg-[#911414] text-white rounded-lg flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Post Update
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
