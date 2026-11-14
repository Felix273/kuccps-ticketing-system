import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Clock3, RotateCcw, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { operationsService } from '../../services/operationsService';

const TIME_UNITS = [
  ['working_minutes', 'working minutes'],
  ['working_hours', 'working hours'],
  ['working_days', 'working days'],
  ['calendar_minutes', 'calendar minutes'],
  ['calendar_hours', 'calendar hours'],
  ['calendar_days', 'calendar days'],
  ['promptly', 'promptly / immediately'],
  ['specification', 'per approved specification']
];

const QUALITATIVE_UNITS = new Set(['promptly', 'specification']);

function formatTimeline(value, unit) {
  if (value == null) {
    if (unit === 'promptly') return 'Immediately (no numeric response limit)';
    if (unit === 'specification') return 'Per approved specification (no numeric default)';
    return 'Not set';
  }
  const label = TIME_UNITS.find(([key]) => key === unit)?.[1] || unit;
  return `${value} ${label}`;
}

function lastUpdatedLabel(policy) {
  if (!policy.lastUpdatedAt) return 'No update history';
  const date = new Date(policy.lastUpdatedAt);
  const formatted = new Intl.DateTimeFormat(undefined, {
    timeZone: 'Africa/Nairobi',
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
  return `Last updated ${formatted} EAT by ${policy.lastUpdatedBy || 'system'}`;
}

function formatAuditValue(field, value) {
  if (value == null) return 'Not set';
  if (field.endsWith('TargetPercent')) return `${value}%`;
  if (field.endsWith('Unit')) return TIME_UNITS.find(([key]) => key === value)?.[1] || value;
  return String(value);
}

function formatAuditField(field) {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, character => character.toUpperCase());
}

const SlaTimelineSettings = () => {
  const [policies, setPolicies] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const loadPolicies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await operationsService.getSlaTimelines();
      if (!response.success) throw new Error(response.message || 'Failed to load SLA timelines');
      setPolicies(response.policies || []);
      setAudits(response.audits || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load SLA timelines');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  const updatePolicy = (policyKey, changes) => {
    setPolicies(current => current.map(policy =>
      policy.policyKey === policyKey ? { ...policy, ...changes } : policy
    ));
  };

  const setDuration = (policy, field, rawValue) => {
    const value = rawValue === '' ? null : Number(rawValue);
    const unitField = field === 'responseValue' ? 'responseUnit' : 'resolutionUnit';
    const unit = policy[unitField];
    const fallbackUnit = field === 'responseValue' ? 'working_hours' : 'working_days';
    updatePolicy(policy.policyKey, {
      [field]: value,
      ...(value != null && QUALITATIVE_UNITS.has(unit) && { [unitField]: fallbackUnit })
    });
  };

  const setUnit = (policy, field, unit) => {
    const valueField = field === 'responseUnit' ? 'responseValue' : 'resolutionValue';
    updatePolicy(policy.policyKey, {
      [field]: unit,
      ...(QUALITATIVE_UNITS.has(unit) && { [valueField]: null })
    });
  };

  const handleSave = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await operationsService.updateSlaTimelines({
        policies: policies.map(policy => ({
          policyKey: policy.policyKey,
          responseValue: policy.responseValue,
          responseUnit: policy.responseUnit,
          responseTargetPercent: policy.responseTargetPercent,
          resolutionValue: policy.resolutionValue,
          resolutionUnit: policy.resolutionUnit,
          resolutionTargetPercent: policy.resolutionTargetPercent,
          escalationGraceHours: policy.escalationGraceHours
        }))
      });
      if (!response.success) throw new Error(response.message || 'Failed to save SLA timelines');
      toast.success('SLA timelines saved. Existing ticket deadlines are unchanged.');
      await loadPolicies();
    } catch (error) {
      toast.error(error.message || 'Failed to save SLA timelines');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all SLA timelines and escalation grace to the SLA document defaults? Existing ticket deadlines will remain unchanged.')) {
      return;
    }
    setResetting(true);
    try {
      const response = await operationsService.resetSlaTimelines();
      if (!response.success) throw new Error(response.message || 'Failed to reset SLA defaults');
      toast.success('SLA timelines reset to the SLA document defaults.');
      await loadPolicies();
    } catch (error) {
      toast.error(error.message || 'Failed to reset SLA defaults');
    } finally {
      setResetting(false);
    }
  };

  const renderDuration = (policy, field, label) => {
    const unitField = field === 'responseValue' ? 'responseUnit' : 'resolutionUnit';
    const defaultValue = policy[field === 'responseValue' ? 'defaultResponseValue' : 'defaultResolutionValue'];
    const defaultUnit = policy[field === 'responseValue' ? 'defaultResponseUnit' : 'defaultResolutionUnit'];
    const currentUnit = policy[unitField] || (field === 'responseValue' ? 'working_hours' : 'working_days');
    const isQualitative = policy[field] == null && QUALITATIVE_UNITS.has(currentUnit);
    const availableUnits = TIME_UNITS.filter(([unit]) => {
      if (unit === 'promptly') return field === 'responseValue';
      if (unit === 'specification') return policy.category === 'Software Development';
      return true;
    });
    return (
      <div className="min-w-0">
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          {label}
          <span className="ml-1 text-xs font-normal text-zinc-500">
            (SLA default: {formatTimeline(defaultValue, defaultUnit)})
          </span>
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(5rem,0.65fr)_minmax(10rem,1fr)]">
          <input
            type="number"
            min="0.1"
            max="3650"
            step="0.1"
            value={policy[field] ?? ''}
            onChange={event => setDuration(policy, field, event.target.value)}
            aria-label={`${policy.name} ${label}`}
            placeholder={isQualitative ? (currentUnit === 'promptly' ? 'Immediately' : 'Per specification') : 'Enter a value'}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-[#990024] focus:outline-none focus:ring-2 focus:ring-[#990024]/20"
            disabled={saving || resetting}
          />
          <select
            value={currentUnit}
            onChange={event => setUnit(policy, unitField, event.target.value)}
            aria-label={`${policy.name} ${label} unit`}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-[#990024] focus:outline-none focus:ring-2 focus:ring-[#990024]/20"
            disabled={saving || resetting}
          >
            {availableUnits.map(([value, unitLabel]) => (
              <option key={value} value={value}>{unitLabel}</option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Current: {formatTimeline(policy[field], currentUnit)}
        </p>
      </div>
    );
  };

  const renderPolicy = policy => (
    <article key={policy.policyKey} className="rounded-lg border border-slate-200 p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-zinc-900">{policy.name}</h4>
          <p className="mt-1 text-xs text-zinc-500">{lastUpdatedLabel(policy)}</p>
        </div>
      </div>

      {policy.policyKey === 'operational:escalation-grace' ? (
        <div className="max-w-md">
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Post-SLA escalation grace (hours)
            <span className="ml-1 text-xs font-normal text-zinc-500">
              (SLA default: {policy.defaultEscalationGraceHours} hours; operational setting, not an SLA target)
            </span>
          </label>
          <input
            type="number"
            min="1"
            max="8760"
            step="1"
            value={policy.escalationGraceHours ?? ''}
            onChange={event => updatePolicy(policy.policyKey, {
              escalationGraceHours: event.target.value === '' ? null : Number(event.target.value)
            })}
            aria-label="Post-SLA escalation grace hours"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-[#990024] focus:outline-none focus:ring-2 focus:ring-[#990024]/20"
            disabled={saving || resetting}
          />
          <p className="mt-1 text-xs text-zinc-500">
            Current: {policy.escalationGraceHours} hours. Applies to new tickets only.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {renderDuration(policy, 'responseValue', 'Response time')}
          {renderDuration(policy, 'resolutionValue', 'Resolution time')}
          {policy.responseTargetPercent != null && (
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Response compliance target (%)
                <span className="ml-1 text-xs font-normal text-zinc-500">
                  (SLA default: {policy.defaultResponseTargetPercent}%)
                </span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={policy.responseTargetPercent ?? ''}
                onChange={event => updatePolicy(policy.policyKey, {
                  responseTargetPercent: event.target.value === '' ? null : Number(event.target.value)
                })}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-[#990024] focus:outline-none focus:ring-2 focus:ring-[#990024]/20"
                disabled={saving || resetting}
              />
            </div>
          )}
          {policy.resolutionTargetPercent != null && (
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Resolution compliance target (%)
                <span className="ml-1 text-xs font-normal text-zinc-500">
                  (SLA default: {policy.defaultResolutionTargetPercent}%)
                </span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={policy.resolutionTargetPercent ?? ''}
                onChange={event => updatePolicy(policy.policyKey, {
                  resolutionTargetPercent: event.target.value === '' ? null : Number(event.target.value)
                })}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-[#990024] focus:outline-none focus:ring-2 focus:ring-[#990024]/20"
                disabled={saving || resetting}
              />
            </div>
          )}
        </div>
      )}
    </article>
  );

  if (loading) return <div className="py-8 text-center text-sm text-zinc-500">Loading SLA timelines…</div>;

  const categoryPolicies = policies.filter(policy => policy.category && policy.category !== 'Incident/Problem Resolution');
  const incidentPolicies = policies.filter(policy => policy.category === 'Incident/Problem Resolution');
  const escalationPolicy = policies.find(policy => policy.policyKey === 'operational:escalation-grace');

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-[#990024]" />
            <h3 className="text-lg font-semibold text-zinc-900">SLA timelines</h3>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-zinc-600">
            Numeric targets use Monday–Friday, 08:00–17:00 Africa/Nairobi time; weekends and Kenya public holidays are excluded. A working day is nine working hours. Changes apply to new tickets only; existing deadline snapshots are preserved.
          </p>
          <p className="mt-1 max-w-3xl text-xs text-zinc-500">
            “Immediately” has no numeric response limit. Software Development stays specification-defined until an admin supplies a numeric timeline.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={saving || resetting}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          {resetting ? 'Resetting…' : 'Reset to SLA defaults'}
        </button>
      </header>

      <section className="space-y-3">
        <h4 className="text-base font-semibold text-zinc-900">Service categories</h4>
        {categoryPolicies.map(renderPolicy)}
      </section>

      <section className="space-y-3">
        <h4 className="text-base font-semibold text-zinc-900">Incident/Problem Resolution by severity</h4>
        {incidentPolicies.map(renderPolicy)}
      </section>

      {escalationPolicy && (
        <section className="space-y-3">
          <h4 className="text-base font-semibold text-zinc-900">Operational escalation policy</h4>
          {renderPolicy(escalationPolicy)}
        </section>
      )}

      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Response time cannot exceed resolution time. Durations must be positive (maximum 3,650); compliance targets must be 1–100%. Saving or resetting never recalculates existing ticket deadlines.</p>
      </div>

      <div className="flex justify-end border-b border-zinc-200 pb-6">
        <button
          type="submit"
          disabled={saving || resetting || !policies.length}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#990024] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#7a001d] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving timelines…' : 'Save SLA timelines'}
        </button>
      </div>

      <section className="space-y-3 border-t border-slate-200 pt-5">
        <div>
          <h4 className="text-base font-semibold text-zinc-900">Recent audit history</h4>
          <p className="mt-1 text-sm text-zinc-500">The latest 100 saved changes, including resets, with the actor and old/new values.</p>
        </div>
        {audits.length ? (
          <ol className="space-y-3">
            {audits.map(audit => (
              <li key={audit.id} className="rounded-lg border border-zinc-200 p-3">
                <div className="flex flex-wrap justify-between gap-1 text-xs text-zinc-600">
                  <span className="font-semibold text-zinc-800">{audit.policy?.name || audit.policyKey} — {audit.action} by {audit.changedByName}</span>
                  <time dateTime={audit.createdAt}>
                    {new Intl.DateTimeFormat(undefined, {
                      timeZone: 'Africa/Nairobi',
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    }).format(new Date(audit.createdAt))} EAT
                  </time>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-zinc-600">
                  {Object.entries(audit.changes || {}).map(([field, change]) => (
                    <li key={field}>
                      {formatAuditField(field)}: {formatAuditValue(field, change.oldValue)} → {formatAuditValue(field, change.newValue)}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">No timeline changes have been recorded yet.</p>
        )}
      </section>
    </form>
  );
};

export default SlaTimelineSettings;
