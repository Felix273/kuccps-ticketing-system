const test = require('node:test');
const assert = require('node:assert/strict');
const {
  SLA_CATEGORIES,
  SLA_DEFAULT_POLICIES,
  addSlaDuration,
  buildSlaCategoryIssues,
  calculateSlaCompliance,
  getConfiguredTicketSlaDeadlines,
  isActiveTicketOverdue,
  seedSlaPolicies,
  saveSlaPolicyUpdates,
  resetSlaPoliciesToDefaults,
  validateSlaPolicyUpdates
} = require('../src/services/slaService');

function createPolicyStore() {
  const policies = new Map();
  const audits = [];
  const client = {
    slaPolicy: {
      findUnique: async ({ where }) => policies.get(where.policyKey) || null,
      findMany: async ({ where } = {}) => [...policies.values()].filter(policy =>
        !where?.isSlaDefault || policy.isSlaDefault
      ),
      create: async ({ data }) => {
        const policy = { ...data, updatedAt: new Date('2026-01-01T00:00:00Z') };
        policies.set(data.policyKey, policy);
        return policy;
      },
      update: async ({ where, data }) => {
        const policy = { ...policies.get(where.policyKey), ...data, updatedAt: new Date() };
        policies.set(where.policyKey, policy);
        return policy;
      }
    },
    slaPolicyAudit: {
      create: async ({ data }) => {
        const audit = { id: `audit-${audits.length + 1}`, ...data, createdAt: new Date() };
        audits.push(audit);
        return audit;
      }
    },
    $transaction: async callback => callback(client)
  };
  return { client, policies, audits };
}

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test('SLA defaults cover the exact categories and incident severities', () => {
  const categoryPolicies = SLA_DEFAULT_POLICIES.filter(policy => policy.category);
  assert.deepEqual([...new Set(categoryPolicies.map(policy => policy.category))], SLA_CATEGORIES);
  assert.deepEqual(
    categoryPolicies.filter(policy => policy.category === 'Incident/Problem Resolution').map(policy => policy.priority),
    ['Very High', 'High', 'Medium', 'Low', 'Very Low']
  );
  assert.equal(SLA_DEFAULT_POLICIES.find(policy => policy.name === 'Software Development').resolutionValue, null);
});

test('re-running SLA seed preserves admin-edited values but updates SLA defaults', async () => {
  const { client, policies } = createPolicyStore();
  await seedSlaPolicies(client);
  const veryHigh = [...policies.values()].find(policy => policy.name === 'Incident/Problem Resolution — Very High');
  await client.slaPolicy.update({
    where: { policyKey: veryHigh.policyKey },
    data: { responseValue: 45 }
  });

  await seedSlaPolicies(client);
  assert.equal(policies.get(veryHigh.policyKey).responseValue, 45);
  assert.equal(policies.get(veryHigh.policyKey).defaultResponseValue, 30);
  assert.equal(policies.size, SLA_DEFAULT_POLICIES.length);
});

test('SLA timeline validation rejects invalid durations and response times longer than resolution', () => {
  const policy = SLA_DEFAULT_POLICIES.find(item => item.priority === 'Very High');
  assert.match(validateSlaPolicyUpdates([{ policyKey: policy.policyKey, responseValue: 0 }]), /0.1 to 3650/);
  assert.match(validateSlaPolicyUpdates([{ policyKey: policy.policyKey, responseValue: 0.05 }]), /0.1 to 3650/);
  assert.match(validateSlaPolicyUpdates([{ policyKey: policy.policyKey, responseValue: 3651 }]), /0.1 to 3650/);
  assert.match(validateSlaPolicyUpdates([{
    policyKey: policy.policyKey,
    responseValue: 2,
    responseUnit: 'working_days',
    resolutionValue: 1,
    resolutionUnit: 'working_days'
  }]), /cannot exceed resolution time/);
  assert.equal(validateSlaPolicyUpdates([{
    policyKey: policy.policyKey,
    responseValue: 1,
    responseUnit: 'working_days',
    resolutionValue: 2,
    resolutionUnit: 'working_days',
    responseTargetPercent: 90,
    resolutionTargetPercent: 100
  }]), null);
  assert.match(validateSlaPolicyUpdates([{
    policyKey: policy.policyKey,
    responseValue: null,
    responseUnit: 'working_minutes'
  }]), /required for a numeric time unit/);
  assert.match(validateSlaPolicyUpdates([{
    policyKey: policy.policyKey,
    responseValue: 1,
    responseUnit: 'specification'
  }]), /only supported for Software Development/);
  assert.match(validateSlaPolicyUpdates([{
    policyKey: policy.policyKey,
    responseTargetPercent: null
  }]), /required for this SLA policy/);
});

test('all UI policy rows, including qualitative and escalation rows, are accepted unchanged', () => {
  const updates = SLA_DEFAULT_POLICIES.map(policy => ({
    policyKey: policy.policyKey,
    responseValue: policy.responseValue,
    responseUnit: policy.responseUnit,
    responseTargetPercent: policy.responseTargetPercent,
    resolutionValue: policy.resolutionValue,
    resolutionUnit: policy.resolutionUnit,
    resolutionTargetPercent: policy.resolutionTargetPercent,
    escalationGraceHours: policy.escalationGraceHours
  }));
  assert.equal(validateSlaPolicyUpdates(updates), null);
});

test('timeline updates and resets keep an actor-attributed old/new audit trail', async () => {
  const { client, policies, audits } = createPolicyStore();
  await seedSlaPolicies(client);
  const policy = [...policies.values()].find(item => item.priority === 'Very High');
  const user = { id: 'admin-1', name: 'SLA Admin' };
  const updates = [{
    policyKey: policy.policyKey,
    responseValue: 45,
    responseUnit: 'working_minutes',
    responseTargetPercent: 90,
    resolutionValue: 1,
    resolutionUnit: 'working_days',
    resolutionTargetPercent: 100,
    escalationGraceHours: null
  }];

  await saveSlaPolicyUpdates(client, user, updates);
  assert.equal(audits[0].changedByName, 'SLA Admin');
  assert.deepEqual(audits[0].changes.responseValue, { oldValue: 30, newValue: 45 });
  await resetSlaPoliciesToDefaults(client, user);
  assert.equal(policies.get(policy.policyKey).responseValue, 30);
  assert.equal(audits[1].action, 'reset');
  assert.deepEqual(audits[1].changes.responseValue, { oldValue: 45, newValue: 30 });
});

test('working-time deadlines skip weekends and Kenya public holidays', () => {
  const fridayAtFourPmEAT = new Date(Date.UTC(2026, 4, 29, 13));
  const dueAt = addSlaDuration(fridayAtFourPmEAT, 2, 'working_hours');
  assert.equal(dueAt.toISOString(), '2026-06-02T06:00:00.000Z');
});

test('ticket deadline snapshots use edited timelines and snapshot configured compliance goals', async () => {
  const { client, policies } = createPolicyStore();
  await seedSlaPolicies(client);
  const veryHigh = [...policies.values()].find(policy => policy.priority === 'Very High');
  await client.slaPolicy.update({
    where: { policyKey: veryHigh.policyKey },
    data: { responseValue: 45 }
  });
  const createdAt = new Date(Date.UTC(2026, 1, 2, 6));
  const result = await getConfiguredTicketSlaDeadlines(
    client,
    'Incident/Problem Resolution',
    'Critical',
    createdAt
  );
  assert.equal(result.responseDueAt.toISOString(), '2026-02-02T06:45:00.000Z');
  assert.equal(result.slaResponseTargetPercent, 90);
  assert.equal(result.slaResolutionTargetPercent, 100);
  assert.equal(result.slaEscalationAt.getTime() - result.slaDueAt.getTime(), 48 * 60 * 60 * 1000);
});

test('compliance boundaries are inclusive and target attainment uses SLA percentages', () => {
  const dueAt = new Date('2026-02-02T10:00:00.000Z');
  const atDeadline = calculateSlaCompliance([{
    status: 'In Progress',
    responseDueAt: dueAt,
    firstRespondedAt: dueAt,
    slaResponseTargetPercent: 90,
    slaDueAt: dueAt,
    resolvedAt: dueAt,
    slaResolutionTargetPercent: 100
  }], dueAt);
  assert.equal(atDeadline.compliance, 100);
  assert.equal(atDeadline.targetAttainment.response[0].goalMet, true);
  assert.equal(atDeadline.targetAttainment.resolution[0].goalMet, true);

  const afterDeadline = calculateSlaCompliance([{
    status: 'In Progress',
    responseDueAt: dueAt,
    slaResponseTargetPercent: 90,
    slaDueAt: dueAt,
    slaResolutionTargetPercent: 100
  }], new Date(dueAt.getTime() + 1));
  assert.equal(afterDeadline.compliance, 0);
  assert.equal(afterDeadline.breachedTickets, 1);
  assert.equal(afterDeadline.targetAttainment.response[0].goalMet, false);
  assert.equal(afterDeadline.targetAttainment.resolution[0].goalMet, false);
});

test('active ticket overdue checks use exact stored deadlines and include On Hold tickets', () => {
  const dueAt = new Date('2026-02-02T10:00:00.000Z');
  const ticket = { status: 'On Hold', responseDueAt: null, slaDueAt: dueAt, resolvedAt: null };
  assert.equal(isActiveTicketOverdue(ticket, dueAt), false);
  assert.equal(isActiveTicketOverdue(ticket, new Date(dueAt.getTime() + 1)), true);
  assert.equal(isActiveTicketOverdue({ ...ticket, status: 'Resolved' }, new Date(dueAt.getTime() + 1)), false);
});

test('Category Issues only returns the exact SLA allowlist and hides unmatched categories', () => {
  const result = buildSlaCategoryIssues([
    { category: 'Hardware Support', _count: { _all: 2 } },
    { category: 'Unlisted category', _count: { _all: 100 } }
  ]);
  assert.deepEqual(result.map(item => item.name), SLA_CATEGORIES);
  assert.equal(result.find(item => item.name === 'Hardware Support').count, 2);
  assert.equal(result.reduce((sum, item) => sum + item.count, 0), 2);
  assert.equal(result.some(item => item.name === 'Unlisted category'), false);
});

test('SLA timeline routes enforce the admin role', () => {
  const { requireAdmin } = require('../src/middleware/auth');
  const operationsRouter = require('../src/routes/operations');
  const timelineRoutes = operationsRouter.stack
    .filter(layer => layer.route && layer.route.path.startsWith('/sla-timelines'));

  assert.equal(timelineRoutes.length, 3);
  for (const layer of timelineRoutes) {
    assert.ok(layer.route.stack.some(handler => handler.handle === requireAdmin));
  }

  const response = responseRecorder();
  let nextCalled = false;
  requireAdmin({ user: { role: 'staff' } }, response, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(response.statusCode, 403);
});
