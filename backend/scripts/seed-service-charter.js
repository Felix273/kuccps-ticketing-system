const { PrismaClient } = require('@prisma/client');
const { 
  calculateTicketSlaDeadlines, 
  isActiveTicketOverdue, 
  SLA_DEFAULT_POLICIES 
} = require('../src/services/slaService');

const prisma = new PrismaClient();

async function run() {
  console.log('📋 Ingesting ICT Service Delivery Charter into Knowledge Base...');

  const charterTitle = 'KUCCPS ICT Directorate Service Delivery Charter & SLA Standards';
  const charterSlug = 'kuccps-ict-department-service-charter';

  const charterContent = `
## ICT Directorate Service Delivery Charter

The Kenya Universities and Colleges Central Placement Service (KUCCPS) ICT Directorate is committed to providing timely, transparent, and high-quality technical support to facilitate institutional operations.

### 1.0 Service Delivery Catalog & Timelines
| S/NO | Service | Requirements | Cost | Standard Timeline |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Equipment Issuance** | Approved request on the ICT Service Desk | Free | **Immediately to 24 hrs** |
| **2** | **Hardware Support** | Filed incident Ticket on the ICT Service Desk | Free | **Immediately to 24 hrs** |
| **3** | **Software Support** | Filed incident Ticket on the ICT Service Desk | Free | **Immediately to 48 hrs** |
| **4** | **Provision of Information** | Filed incident Ticket on the ICT Service Desk | Free | **Immediately to 7 Days** |
| **5** | **Incident/Problem Resolution** | Filed incident Ticket on the ICT Service Desk | Free | **As per Incident Rating** |
| **6** | **Software Development** | Approved Project Request | Free | **As per Specifications** |
| **7** | **Information Inquiry** | Enquiry via: Face-to-Face, Email, Service Desk, Memo | Free | **Immediately to 3 days** |

---

### 2.0 Incident Urgency & Service Level Agreement (SLA) Matrix
| Urgency Level | Target First Response | Target Final Resolution |
| :--- | :--- | :--- |
| **Very High** | **90% Response within 30 minutes** | **100% Resolution within 1 working day** |
| **High** | **90% Response within 60 minutes** | **100% Resolution within 1 working day** |
| **Medium** | **90% Response within 1 working day** | **100% Resolution within 5 working days** |
| **Low** | **90% Response within 2 working days** | **100% Resolution within 5 working days** |
| **Very Low** | **90% Response within 3 working days** | **100% Resolution within 7 working days** |

*Working Hours:* Monday to Friday, 8:00 AM – 5:00 PM EAT (excluding gazetted public holidays in Kenya).
`.trim();

  // 1. Upsert Service Charter into Knowledge Base
  await prisma.knowledgeArticle.upsert({
    where: { slug: charterSlug },
    update: {
      title: charterTitle,
      category: 'General Requests',
      affectedDevices: 'Institutional ICT Support Desk',
      symptoms: 'Official Charter reference for Service Desk delivery timelines, ticket response targets, and escalation thresholds.',
      cause: 'Governance & Service Level Agreement compliance.',
      resolution: charterContent,
      escalation: 'If SLA is breached, ticket escalates to Head of ICT Directorate automatically.',
      content: charterContent,
      status: 'published',
      isArchived: false,
      version: 1,
      authorName: 'KUCCPS ICT Directorate',
      authorRole: 'admin'
    },
    create: {
      title: charterTitle,
      slug: charterSlug,
      category: 'General Requests',
      affectedDevices: 'Institutional ICT Support Desk',
      symptoms: 'Official Charter reference for Service Desk delivery timelines, ticket response targets, and escalation thresholds.',
      cause: 'Governance & Service Level Agreement compliance.',
      resolution: charterContent,
      escalation: 'If SLA is breached, ticket escalates to Head of ICT Directorate automatically.',
      content: charterContent,
      status: 'published',
      isArchived: false,
      version: 1,
      authorName: 'KUCCPS ICT Directorate',
      authorRole: 'admin'
    }
  });

  console.log('✓ Service Charter article successfully published in Knowledge Base.');

  // 2. Fetch policies from DB (fallback to defaults if empty)
  let policies = await prisma.slaPolicy.findMany({ where: { isSlaDefault: true } });
  if (!policies || policies.length === 0) {
    policies = SLA_DEFAULT_POLICIES || [];
  }

  // 3. Recalculate SLA Deadlines & Overdue Status for ALL existing tickets
  console.log('⏱ Recalculating SLA thresholds and overdue flags for all tickets...');
  const tickets = await prisma.ticket.findMany();
  let updatedCount = 0;
  let overdueCount = 0;

  for (const ticket of tickets) {
    const deadlines = calculateTicketSlaDeadlines({
      category: ticket.category,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
      policies
    });

    const isOverdue = isActiveTicketOverdue({
      ...ticket,
      responseDueAt: deadlines.responseDueAt,
      slaDueAt: deadlines.slaDueAt
    });

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        responseDueAt: deadlines.responseDueAt,
        slaDueAt: deadlines.slaDueAt,
        slaBreached: isOverdue || ticket.slaBreached
      }
    });

    if (isOverdue) overdueCount++;
    updatedCount++;
  }

  console.log(`✓ SLA Alignment Complete: ${updatedCount} tickets processed. ${overdueCount} tickets flagged as Overdue according to Charter.`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
