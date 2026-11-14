const Holidays = require('date-holidays');

const TIME_UNITS = new Set([
  'calendar_minutes',
  'calendar_hours',
  'calendar_days',
  'working_minutes',
  'working_hours',
  'working_days',
  'promptly',
  'specification'
]);

const NUMERIC_TIME_UNITS = new Set([
  'calendar_minutes',
  'calendar_hours',
  'calendar_days',
  'working_minutes',
  'working_hours',
  'working_days'
]);

const SLA_CATEGORIES = [
  'Equipment Issuance',
  'Hardware Support',
  'Software Support',
  'Provision of Information',
  'Incident/Problem Resolution',
  'Software Development',
  'Information Inquiry'
];

const SEVERITIES = ['Very High', 'High', 'Medium', 'Low', 'Very Low'];
const ESCALATION_POLICY_KEY = 'operational:escalation-grace';

function categoryPolicyKey(category) {
  return `category:${String(category).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function severityPolicyKey(severity) {
  return `severity:${String(severity).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function normalizeSeverity(priority) {
  if (priority === 'Critical') return 'Very High';
  return SEVERITIES.includes(priority) ? priority : 'Medium';
}

const SLA_DEFAULT_POLICIES = [
  {
    policyKey: categoryPolicyKey('Equipment Issuance'),
    name: 'Equipment Issuance',
    category: 'Equipment Issuance',
    responseValue: null,
    responseUnit: 'promptly',
    responseTargetPercent: null,
    resolutionValue: 24,
    resolutionUnit: 'working_hours',
    resolutionTargetPercent: null,
    escalationGraceHours: null
  },
  {
    policyKey: categoryPolicyKey('Hardware Support'),
    name: 'Hardware Support',
    category: 'Hardware Support',
    responseValue: null,
    responseUnit: 'promptly',
    responseTargetPercent: null,
    resolutionValue: 24,
    resolutionUnit: 'working_hours',
    resolutionTargetPercent: null,
    escalationGraceHours: null
  },
  {
    policyKey: categoryPolicyKey('Software Support'),
    name: 'Software Support',
    category: 'Software Support',
    responseValue: null,
    responseUnit: 'promptly',
    responseTargetPercent: null,
    resolutionValue: 48,
    resolutionUnit: 'working_hours',
    resolutionTargetPercent: null,
    escalationGraceHours: null
  },
  {
    policyKey: categoryPolicyKey('Provision of Information'),
    name: 'Provision of Information',
    category: 'Provision of Information',
    responseValue: null,
    responseUnit: 'promptly',
    responseTargetPercent: null,
    resolutionValue: 7,
    resolutionUnit: 'working_days',
    resolutionTargetPercent: null,
    escalationGraceHours: null
  },
  ...SEVERITIES.map((priority, index) => {
    const responseValues = [30, 60, 1, 2, 3];
    const responseUnits = ['working_minutes', 'working_minutes', 'working_days', 'working_days', 'working_days'];
    const resolutionValues = [1, 1, 5, 5, 7];
    return {
      policyKey: severityPolicyKey(priority),
      name: `Incident/Problem Resolution — ${priority}`,
      category: 'Incident/Problem Resolution',
      priority,
      responseValue: responseValues[index],
      responseUnit: responseUnits[index],
      responseTargetPercent: 90,
      resolutionValue: resolutionValues[index],
      resolutionUnit: 'working_days',
      resolutionTargetPercent: 100,
      escalationGraceHours: null
    };
  }),
  {
    policyKey: categoryPolicyKey('Software Development'),
    name: 'Software Development',
    category: 'Software Development',
    responseValue: null,
    responseUnit: 'specification',
    responseTargetPercent: null,
    resolutionValue: null,
    resolutionUnit: 'specification',
    resolutionTargetPercent: null,
    escalationGraceHours: null
  },
  {
    policyKey: categoryPolicyKey('Information Inquiry'),
    name: 'Information Inquiry',
    category: 'Information Inquiry',
    responseValue: null,
    responseUnit: 'promptly',
    responseTargetPercent: null,
    resolutionValue: 3,
    resolutionUnit: 'working_days',
    resolutionTargetPercent: null,
    escalationGraceHours: null
  },
  {
    policyKey: ESCALATION_POLICY_KEY,
    name: 'Post-SLA Escalation Grace',
    category: null,
    responseValue: null,
    responseUnit: null,
    responseTargetPercent: null,
    resolutionValue: null,
    resolutionUnit: null,
    resolutionTargetPercent: null,
    escalationGraceHours: 48
  }
].map(policy => ({
  ...policy,
  defaultResponseValue: policy.responseValue,
  defaultResponseUnit: policy.responseUnit,
  defaultResponseTargetPercent: policy.responseTargetPercent,
  defaultResolutionValue: policy.resolutionValue,
  defaultResolutionUnit: policy.resolutionUnit,
  defaultResolutionTargetPercent: policy.resolutionTargetPercent,
  defaultEscalationGraceHours: policy.escalationGraceHours
}));

const policyDefaultsByKey = new Map(SLA_DEFAULT_POLICIES.map(policy => [policy.policyKey, policy]));
const holidays = new Holidays('KE', { timezone: 'Africa/Nairobi' });

function getLocalParts(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  return Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
}

function localInstant(year, month, day, hour, minute = 0, second = 0) {
  return new Date(Date.UTC(year, month - 1, day, hour - 3, minute, second));
}

function isKenyaWorkingDay(year, month, day) {
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  if (weekday === 0 || weekday === 6) return false;
  const dateAtNairobiMidday = new Date(Date.UTC(year, month - 1, day, 12));
  const dayHolidays = holidays.isHoliday(dateAtNairobiMidday) || [];
  return !dayHolidays.some(holiday => holiday.type === 'public');
}

function nextLocalDay(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day + 1, 12));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

function nextWorkingStart(date) {
  let candidate = new Date(date);
  let local = getLocalParts(candidate);
  for (let attempts = 0; attempts < 3660; attempts += 1) {
    if (!isKenyaWorkingDay(local.year, local.month, local.day)) {
      local = nextLocalDay(local.year, local.month, local.day);
      candidate = localInstant(local.year, local.month, local.day, 8);
      continue;
    }

    const localMinutes = local.hour * 60 + local.minute;
    if (localMinutes < 8 * 60) {
      return localInstant(local.year, local.month, local.day, 8);
    }
    if (localMinutes >= 17 * 60) {
      local = nextLocalDay(local.year, local.month, local.day);
      candidate = localInstant(local.year, local.month, local.day, 8);
      continue;
    }
    return candidate;
  }
  throw new Error('Unable to find the next Kenya working period');
}

function getDurationMinutes(value, unit) {
  const multipliers = {
    calendar_minutes: 1,
    calendar_hours: 60,
    calendar_days: 24 * 60,
    working_minutes: 1,
    working_hours: 60,
    working_days: 9 * 60
  };
  if (!NUMERIC_TIME_UNITS.has(unit)) throw new Error(`Unsupported SLA time unit: ${unit}`);
  return Number(value) * multipliers[unit];
}

function addSlaDuration(start, value, unit) {
  if (value == null) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('SLA duration must be a positive number');

  const milliseconds = getDurationMinutes(amount, unit) * 60_000;
  if (unit.startsWith('calendar_')) return new Date(new Date(start).getTime() + milliseconds);

  let remaining = milliseconds;
  let cursor = nextWorkingStart(new Date(start));
  for (let attempts = 0; attempts < 3660 && remaining > 0; attempts += 1) {
    const local = getLocalParts(cursor);
    const close = localInstant(local.year, local.month, local.day, 17);
    const available = close.getTime() - cursor.getTime();
    const used = Math.min(available, remaining);
    cursor = new Date(cursor.getTime() + used);
    remaining -= used;
    if (remaining > 0) {
      const next = nextLocalDay(local.year, local.month, local.day);
      cursor = localInstant(next.year, next.month, next.day, 8);
      cursor = nextWorkingStart(cursor);
    }
  }
  if (remaining > 0) throw new Error('SLA duration exceeds the supported working-calendar range');
  return cursor;
}

function getPolicyKey(category, priority) {
  if (!SLA_CATEGORIES.includes(category)) return null;
  if (category === 'Incident/Problem Resolution') {
    return severityPolicyKey(normalizeSeverity(priority));
  }
  return categoryPolicyKey(category);
}

function calculateTicketSlaDeadlines({ category, priority, createdAt, policies }) {
  const policyMap = policies instanceof Map
    ? policies
    : new Map(policies.map(policy => [policy.policyKey, policy]));
  const policyKey = getPolicyKey(category, priority);
  const policy = policyKey ? policyMap.get(policyKey) : null;
  if (!policy) {
    return { policyKey, responseDueAt: null, slaDueAt: null, slaEscalationAt: null };
  }

  const responseDueAt = policy.responseValue == null || !NUMERIC_TIME_UNITS.has(policy.responseUnit)
    ? null
    : addSlaDuration(createdAt, policy.responseValue, policy.responseUnit);
  const slaDueAt = policy.resolutionValue == null || !NUMERIC_TIME_UNITS.has(policy.resolutionUnit)
    ? null
    : addSlaDuration(createdAt, policy.resolutionValue, policy.resolutionUnit);
  const severity = normalizeSeverity(priority);
  const escalation = policyMap.get(ESCALATION_POLICY_KEY);
  const slaEscalationAt = slaDueAt && ['Very High', 'High'].includes(severity) && escalation?.escalationGraceHours
    ? new Date(slaDueAt.getTime() + escalation.escalationGraceHours * 60 * 60_000)
    : null;

  return { policyKey, responseDueAt, slaDueAt, slaEscalationAt };
}

async function getConfiguredTicketSlaDeadlines(client, category, priority, createdAt) {
  const policyKey = getPolicyKey(category, priority);
  if (!policyKey) {
    return {
      ...calculateTicketSlaDeadlines({ category, priority, createdAt, policies: [] }),
      slaResponseTargetPercent: null,
      slaResolutionTargetPercent: null
    };
  }

  const policies = await client.slaPolicy.findMany({
    where: {
      isSlaDefault: true,
      policyKey: { in: [policyKey, ESCALATION_POLICY_KEY] }
    }
  });
  const policy = policies.find(item => item.policyKey === policyKey);
  if (!policy) {
    throw new Error(`SLA timeline is not seeded for ${category}; run the SLA seed before creating tickets`);
  }
  if (['High', 'Very High'].includes(normalizeSeverity(priority)) &&
    policy.resolutionValue != null &&
    !policies.some(item => item.policyKey === ESCALATION_POLICY_KEY)) {
    throw new Error('SLA escalation settings are not seeded; run the SLA seed before creating tickets');
  }

  return {
    ...calculateTicketSlaDeadlines({ category, priority, createdAt, policies }),
    slaResponseTargetPercent: policy.responseTargetPercent,
    slaResolutionTargetPercent: policy.resolutionTargetPercent
  };
}

function getTicketSlaChecks(ticket, now = new Date()) {
  const checks = [];
  if (ticket.responseDueAt) {
    const dueAt = new Date(ticket.responseDueAt);
    checks.push(ticket.firstRespondedAt
      ? new Date(ticket.firstRespondedAt) <= dueAt
      : now <= dueAt);
  }
  if (ticket.slaDueAt) {
    const dueAt = new Date(ticket.slaDueAt);
    const completedAt = ticket.resolvedAt || (ticket.status === 'Closed' ? ticket.closedAt : null);
    checks.push(completedAt
      ? new Date(completedAt) <= dueAt
      : now <= dueAt);
  }
  return checks;
}

function calculateSlaCompliance(tickets, now = new Date()) {
  let targets = 0;
  let met = 0;
  let breachedTickets = 0;
  const targetGroups = {
    response: new Map(),
    resolution: new Map()
  };
  for (const ticket of tickets) {
    const checks = getTicketSlaChecks(ticket, now);
    if (!checks.length) continue;
    targets += checks.length;
    met += checks.filter(Boolean).length;
    if (checks.some(check => !check)) breachedTickets += 1;

    const responseMet = ticket.responseDueAt
      ? Boolean(ticket.firstRespondedAt
        ? new Date(ticket.firstRespondedAt) <= new Date(ticket.responseDueAt)
        : now <= new Date(ticket.responseDueAt))
      : null;
    const resolutionMet = ticket.slaDueAt
      ? Boolean((ticket.resolvedAt || (ticket.status === 'Closed' ? ticket.closedAt : null))
        ? new Date(ticket.resolvedAt || ticket.closedAt) <= new Date(ticket.slaDueAt)
        : now <= new Date(ticket.slaDueAt))
      : null;

    for (const [type, value, targetPercent] of [
      ['response', responseMet, ticket.slaResponseTargetPercent],
      ['resolution', resolutionMet, ticket.slaResolutionTargetPercent]
    ]) {
      if (value == null || !Number.isInteger(targetPercent)) continue;
      const group = targetGroups[type].get(targetPercent) || { targetPercent, eligible: 0, met: 0 };
      group.eligible += 1;
      if (value) group.met += 1;
      targetGroups[type].set(targetPercent, group);
    }
  }
  const targetAttainment = Object.fromEntries(Object.entries(targetGroups).map(([type, groups]) => [
    type,
    [...groups.values()]
      .sort((left, right) => left.targetPercent - right.targetPercent)
      .map(group => {
        const actualPercent = Math.round((group.met / group.eligible) * 100);
        return {
          ...group,
          actualPercent,
          goalMet: actualPercent >= group.targetPercent
        };
      })
  ]));
  return {
    eligibleTargets: targets,
    breachedTickets,
    compliance: targets ? Math.round((met / targets) * 100) : 100,
    targetAttainment
  };
}

function buildSlaCategoryIssues(groups) {
  const counts = new Map(groups.map(group => [
    group.category,
    typeof group._count === 'number' ? group._count : group._count?._all || 0
  ]));
  const total = SLA_CATEGORIES.reduce((sum, category) => sum + (counts.get(category) || 0), 0);
  return SLA_CATEGORIES.map(name => {
    const count = counts.get(name) || 0;
    return {
      name,
      count,
      percentage: total ? Math.round((count / total) * 100) : 0
    };
  });
}

function isActiveTicketOverdue(ticket, now = new Date()) {
  if (!['Open', 'In Progress', 'On Hold'].includes(ticket.status)) return false;
  return Boolean(getActiveOverdueDeadline(ticket, now));
}

function getActiveOverdueDeadline(ticket, now = new Date()) {
  if (!['Open', 'In Progress', 'On Hold'].includes(ticket.status)) return null;
  const deadlines = [];
  if (ticket.responseDueAt && !ticket.firstRespondedAt) deadlines.push(new Date(ticket.responseDueAt));
  if (ticket.slaDueAt && !ticket.resolvedAt) deadlines.push(new Date(ticket.slaDueAt));
  return deadlines
    .filter(deadline => deadline < now)
    .sort((left, right) => left - right)[0] || null;
}

function validateSlaPolicyUpdates(updates, existingPolicies = SLA_DEFAULT_POLICIES) {
  if (!Array.isArray(updates) || updates.length === 0) return 'At least one SLA row is required';
  const existingByKey = new Map(existingPolicies.map(policy => [policy.policyKey, policy]));
  const seen = new Set();
  const allowedFields = new Set([
    'responseValue',
    'responseUnit',
    'responseTargetPercent',
    'resolutionValue',
    'resolutionUnit',
    'resolutionTargetPercent',
    'escalationGraceHours'
  ]);
  const numericFields = ['responseValue', 'resolutionValue'];
  const percentFields = ['responseTargetPercent', 'resolutionTargetPercent'];

  for (const update of updates) {
    if (!update || typeof update !== 'object' || typeof update.policyKey !== 'string') {
      return 'Each SLA row must include a policy key';
    }
    const current = existingByKey.get(update.policyKey);
    if (!current || seen.has(update.policyKey)) return 'SLA row is unknown or duplicated';
    seen.add(update.policyKey);
    if (Object.keys(update).some(key => key !== 'policyKey' && !allowedFields.has(key))) {
      return 'SLA rows contain unsupported fields';
    }

    const next = { ...current, ...update };
    for (const field of numericFields) {
      if (!(field in update)) continue;
      if (update.policyKey === ESCALATION_POLICY_KEY) {
        if (update[field] != null) return 'Escalation policy cannot contain response or resolution durations';
        continue;
      }
      const value = update[field];
      const softwareDevelopment = update.policyKey === categoryPolicyKey('Software Development');
      const unit = next[field === 'responseValue' ? 'responseUnit' : 'resolutionUnit'];
      const qualitativeIsAllowed = unit === 'promptly' && field === 'responseValue' ||
        unit === 'specification' && softwareDevelopment;
      if (value == null && qualitativeIsAllowed) continue;
      if (value == null) return `${field} is required for a numeric time unit`;
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0.1 || value > 3650) {
        return `${field} must be a number from 0.1 to 3650`;
      }
    }
    for (const field of percentFields) {
      if (!(field in update)) continue;
      const defaultField = `default${field[0].toUpperCase()}${field.slice(1)}`;
      if (update[field] == null && current[defaultField] != null) {
        return `${field} is required for this SLA policy`;
      }
      if (update[field] == null) continue;
      if (!Number.isInteger(update[field]) || update[field] < 1 || update[field] > 100) {
        return `${field} must be a whole number from 1 to 100`;
      }
    }
    for (const field of ['responseUnit', 'resolutionUnit']) {
      if (!(field in update)) continue;
      if (update.policyKey === ESCALATION_POLICY_KEY) {
        if (update[field] != null) return 'Escalation policy cannot contain response or resolution units';
        continue;
      }
      if (!TIME_UNITS.has(update[field])) return `${field} is not a supported time unit`;
      const softwareDevelopment = update.policyKey === categoryPolicyKey('Software Development');
      if (update[field] === 'promptly' && field !== 'responseUnit') {
        return 'Promptly is only a supported response unit';
      }
      if (update[field] === 'specification' && !softwareDevelopment) {
        return 'Specification-defined timelines are only supported for Software Development';
      }
      const valueField = field === 'responseUnit' ? 'responseValue' : 'resolutionValue';
      if (next[valueField] != null && !NUMERIC_TIME_UNITS.has(update[field])) {
        return `${field} must be a numeric time unit when its duration is set`;
      }
      const canBeQualitative = update[field] === 'promptly' && field === 'responseUnit' ||
        update[field] === 'specification' && softwareDevelopment;
      if (next[valueField] == null && !canBeQualitative) {
        return `${valueField} is required for a numeric time unit`;
      }
    }
    if ('escalationGraceHours' in update) {
      if (update.policyKey !== ESCALATION_POLICY_KEY && update.escalationGraceHours != null) {
        return 'Escalation grace can only be set on the operational escalation policy';
      }
      if (update.policyKey === ESCALATION_POLICY_KEY &&
        (!Number.isInteger(update.escalationGraceHours) || update.escalationGraceHours < 1 || update.escalationGraceHours > 8760)) {
        return 'Escalation grace must be a whole number from 1 to 8760 hours';
      }
    }
    if (next.responseValue != null && next.resolutionValue != null &&
      getDurationMinutes(next.responseValue, next.responseUnit) > getDurationMinutes(next.resolutionValue, next.resolutionUnit)) {
      return 'Response time cannot exceed resolution time';
    }
  }
  return null;
}

function currentPolicyData(policy) {
  return {
    responseValue: policy.responseValue,
    responseUnit: policy.responseUnit,
    responseTargetPercent: policy.responseTargetPercent,
    resolutionValue: policy.resolutionValue,
    resolutionUnit: policy.resolutionUnit,
    resolutionTargetPercent: policy.resolutionTargetPercent,
    escalationGraceHours: policy.escalationGraceHours
  };
}

async function seedSlaPolicies(client) {
  for (const defaults of SLA_DEFAULT_POLICIES) {
    const existing = await client.slaPolicy.findUnique({ where: { policyKey: defaults.policyKey } });
    const legacyDefaults = {
      responseMinutes: defaults.responseValue == null ? 0 : Math.round(getDurationMinutes(defaults.responseValue, defaults.responseUnit)),
      resolutionMinutes: defaults.resolutionValue == null ? 0 : Math.round(getDurationMinutes(defaults.resolutionValue, defaults.resolutionUnit))
    };
    if (!existing) {
      await client.slaPolicy.create({
        data: {
          ...defaults,
          ...legacyDefaults,
          isActive: true,
          isSlaDefault: true
        }
      });
      continue;
    }

    const changes = {
      name: defaults.name,
      category: defaults.category,
      priority: defaults.priority || null,
      isSlaDefault: true,
      ...legacyDefaults,
      defaultResponseValue: defaults.defaultResponseValue,
      defaultResponseUnit: defaults.defaultResponseUnit,
      defaultResponseTargetPercent: defaults.defaultResponseTargetPercent,
      defaultResolutionValue: defaults.defaultResolutionValue,
      defaultResolutionUnit: defaults.defaultResolutionUnit,
      defaultResolutionTargetPercent: defaults.defaultResolutionTargetPercent,
      defaultEscalationGraceHours: defaults.defaultEscalationGraceHours
    };
    for (const field of [
      'responseValue',
      'responseUnit',
      'responseTargetPercent',
      'resolutionValue',
      'resolutionUnit',
      'resolutionTargetPercent',
      'escalationGraceHours'
    ]) {
      const defaultField = `default${field[0].toUpperCase()}${field.slice(1)}`;
      if (existing[field] === existing[defaultField]) changes[field] = defaults[field];
    }
    const oldResponseMinutes = existing.defaultResponseValue == null
      ? 0
      : Math.round(getDurationMinutes(existing.defaultResponseValue, existing.defaultResponseUnit));
    const oldResolutionMinutes = existing.defaultResolutionValue == null
      ? 0
      : Math.round(getDurationMinutes(existing.defaultResolutionValue, existing.defaultResolutionUnit));
    if (existing.responseMinutes === oldResponseMinutes) changes.responseMinutes = legacyDefaults.responseMinutes;
    if (existing.resolutionMinutes === oldResolutionMinutes) changes.resolutionMinutes = legacyDefaults.resolutionMinutes;
    await client.slaPolicy.update({ where: { policyKey: defaults.policyKey }, data: changes });
  }
}

async function saveSlaPolicyUpdates(client, user, updates) {
  return client.$transaction(async transaction => {
    const saved = [];
    for (const update of updates) {
      const existing = await transaction.slaPolicy.findUnique({ where: { policyKey: update.policyKey } });
      if (!existing?.isSlaDefault) throw new Error(`SLA policy not found: ${update.policyKey}`);
      const data = Object.fromEntries(Object.entries(update).filter(([key]) => key !== 'policyKey'));
      const previous = currentPolicyData(existing);
      const next = { ...previous, ...data };
      const changes = Object.fromEntries(Object.keys(data)
        .filter(field => previous[field] !== next[field])
        .map(field => [field, { oldValue: previous[field], newValue: next[field] }]));
      const policy = await transaction.slaPolicy.update({
        where: { policyKey: update.policyKey },
        data
      });
      if (Object.keys(changes).length) {
        await transaction.slaPolicyAudit.create({
          data: {
            policyKey: update.policyKey,
            changedById: user.id,
            changedByName: user.name || user.email || user.id,
            action: 'updated',
            changes
          }
        });
      }
      saved.push(policy);
    }
    return saved;
  });
}

async function resetSlaPoliciesToDefaults(client, user) {
  return client.$transaction(async transaction => {
    const policies = await transaction.slaPolicy.findMany({ where: { isSlaDefault: true } });
    const reset = [];
    for (const policy of policies) {
      const defaults = {
        responseValue: policy.defaultResponseValue,
        responseUnit: policy.defaultResponseUnit,
        responseTargetPercent: policy.defaultResponseTargetPercent,
        resolutionValue: policy.defaultResolutionValue,
        resolutionUnit: policy.defaultResolutionUnit,
        resolutionTargetPercent: policy.defaultResolutionTargetPercent,
        escalationGraceHours: policy.defaultEscalationGraceHours
      };
      const previous = currentPolicyData(policy);
      const changes = Object.fromEntries(Object.keys(defaults)
        .filter(field => previous[field] !== defaults[field])
        .map(field => [field, { oldValue: previous[field], newValue: defaults[field] }]));
      const updated = await transaction.slaPolicy.update({
        where: { policyKey: policy.policyKey },
        data: defaults
      });
      if (Object.keys(changes).length) {
        await transaction.slaPolicyAudit.create({
          data: {
            policyKey: policy.policyKey,
            changedById: user.id,
            changedByName: user.name || user.email || user.id,
            action: 'reset',
            changes
          }
        });
      }
      reset.push(updated);
    }
    return reset;
  });
}

module.exports = {
  ESCALATION_POLICY_KEY,
  SLA_CATEGORIES,
  SLA_DEFAULT_POLICIES,
  SEVERITIES,
  TIME_UNITS,
  addSlaDuration,
  buildSlaCategoryIssues,
  calculateSlaCompliance,
  calculateTicketSlaDeadlines,
  categoryPolicyKey,
  getConfiguredTicketSlaDeadlines,
  getPolicyKey,
  getActiveOverdueDeadline,
  getTicketSlaChecks,
  isActiveTicketOverdue,
  normalizeSeverity,
  resetSlaPoliciesToDefaults,
  saveSlaPolicyUpdates,
  seedSlaPolicies,
  severityPolicyKey,
  validateSlaPolicyUpdates
};
