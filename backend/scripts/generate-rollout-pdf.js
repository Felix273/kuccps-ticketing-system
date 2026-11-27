const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const outputPath = path.join(__dirname, '../../KUCCPS_IT_Rollout_Plan.pdf');
const logoPath = path.join(__dirname, '../../frontend/public/kuccps-logo.png');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 35, bottom: 35, left: 45, right: 45 },
  info: {
    Title: 'KUCCPS IT Support System — Rollout Plan',
    Author: 'Felix Ngitari',
    Subject: 'Internal Helpdesk Implementation & Rollout Plan'
  }
});

doc.pipe(fs.createWriteStream(outputPath));

// ── COLOR PALETTE ─────────────────────────────────────────────
const PRIMARY = '#990024';   // Official KUCCPS Crimson
const TEXT_DARK = '#18181b'; // Charcoal Black
const TEXT_MUTED = '#52525b';// Slate Muted
const LINE_COLOR = '#e4e4e7';// Light Border
const BG_LIGHT = '#f8fafc';  // Soft Gray Fill

// ── HEADER WITH KUCCPS LOGO ───────────────────────────────────
if (fs.existsSync(logoPath)) {
  doc.image(logoPath, 45, 30, { width: 95 });
}

doc.fillColor(PRIMARY)
   .fontSize(12)
   .font('Helvetica-Bold')
   .text('KENYA UNIVERSITIES AND COLLEGES CENTRAL PLACEMENT SERVICE', 150, 32, { align: 'right' });

doc.fillColor(TEXT_DARK)
   .fontSize(9.5)
   .font('Helvetica')
   .text('DIRECTORATE OF INFORMATION & COMMUNICATION TECHNOLOGY', 150, 48, { align: 'right' });

doc.fillColor(TEXT_MUTED)
   .fontSize(8)
   .text('ACK Garden House, 1st Ngong Avenue, Community, Nairobi', 150, 62, { align: 'right' });

doc.strokeColor(PRIMARY).lineWidth(1.5).moveTo(45, 78).lineTo(550, 78).stroke();

// ── MEMORANDUM DETAILS BLOCK ──────────────────────────────────
const memoY = 90;
doc.roundedRect(45, memoY, 505, 52, 3).fillAndStroke(BG_LIGHT, LINE_COLOR);

doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica-Bold');
doc.text('REF NO:', 55, memoY + 8);
doc.font('Helvetica').text('KUCCPS/ICT/DEP/2026/01', 120, memoY + 8);

doc.font('Helvetica-Bold').text('PROJECT MANAGER:', 305, memoY + 8);
doc.fillColor(PRIMARY).font('Helvetica-Bold').text('Felix Ngitari (ICT Directorate)', 410, memoY + 8);

doc.fillColor(TEXT_DARK).font('Helvetica-Bold').text('DATE:', 55, memoY + 22);
doc.font('Helvetica').text('23rd November 2026', 120, memoY + 22);

doc.font('Helvetica-Bold').text('CLASSIFICATION:', 305, memoY + 22);
doc.font('Helvetica').text('Internal Institutional Document', 410, memoY + 22);

doc.font('Helvetica-Bold').text('SUBJECT:', 55, memoY + 36);
doc.fillColor(PRIMARY).font('Helvetica-Bold').text('UPGRADED ICT HELPDESK & TICKETING SYSTEM ROLLOUT PLAN', 120, memoY + 36);

// ── SECTION 1: BACKGROUND & PURPOSE ───────────────────────────
const sec1Y = 152;
doc.fillColor(PRIMARY).fontSize(10.5).font('Helvetica-Bold').text('1.0 Background & Practical Purpose', 45, sec1Y);
doc.strokeColor(LINE_COLOR).lineWidth(0.8).moveTo(45, sec1Y + 14).lineTo(550, sec1Y + 14).stroke();

const sec1Text = 'Historically, internal IT support at KUCCPS has relied on informal channels: staff walking into the server room, direct phone calls, untracked WhatsApp messages, and direct personal emails to ICT staff. During busy placement processing periods, requests easily get lost, recurring printer and network issues are not tracked systematically, and there is no audit trail against the Service Charter.\n\nThe upgraded system provides a simple, structured channel. All requests are sent to itsupport@kuccps.ac.ke or submitted through the Google Workspace button. The system connects directly to Active Directory to identify the requester and their Directorate, assigns tracking numbers, alerts officers on overdue deadlines, and prompts users for a quick 1-click satisfaction rating upon ticket resolution.';

doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica').text(sec1Text, 45, sec1Y + 20, { width: 505, align: 'justify', lineGap: 2 });

// ── SECTION 2: PHASED ROLLOUT SCHEDULE ────────────────────────
const sec2Y = 228;
doc.fillColor(PRIMARY).fontSize(10.5).font('Helvetica-Bold').text('2.0 Phased Rollout Schedule (Practical Implementation)', 45, sec2Y);
doc.strokeColor(LINE_COLOR).lineWidth(0.8).moveTo(45, sec2Y + 14).lineTo(550, sec2Y + 14).stroke();

const phases = [
  {
    title: 'Phase 1: ICT Internal Readiness & Testing (Week 1)',
    lead: 'Lead: Felix Ngitari (Project Manager)',
    desc: 'ICT officers test the queue internally for 5 business days. Verify Kyocera printer troubleshooting steps, eduroam Wi-Fi guides, password reset SOPs, and 1-click email rating auto-closure. Confirm the 2:00 AM Active Directory sync runs cleanly without errors.'
  },
  {
    title: 'Phase 2: Pilot Rollout — Placement Coordination & Corporate Services (Week 2)',
    lead: 'Lead: Support Specialists & Directorate Focal Persons',
    desc: 'Deploy live to Placement Coordination (high workload, dual-monitor workstations) and Corporate Services (HR, Finance, Admin). Staff begin routing all issues through itsupport@kuccps.ac.ke. Helpdesk monitors resolution times against the Service Charter.'
  },
  {
    title: 'Phase 3: Full Cutover & Sensitization (Week 3)',
    lead: 'Lead: Project Team & Executive Management',
    desc: 'Issue an internal circular signed by Management advising all staff that itsupport@kuccps.ac.ke is the official channel. Automatically push the Google Workspace Add-on to staff Gmail. Politely redirect informal WhatsApp and walk-in requests into official tickets.'
  },
  {
    title: 'Phase 4: Routine Operations & Monthly Review (Ongoing)',
    lead: 'Lead: Helpdesk Lead & Project Manager',
    desc: 'Hold 10-minute daily morning standups to clear any overdue tickets. Review monthly customer satisfaction ratings (CSAT) and analyze recurring hardware/software issues to keep improving service delivery.'
  }
];

let curY = sec2Y + 20;
phases.forEach((p, idx) => {
  doc.rect(45, curY, 505, 14).fill(BG_LIGHT);
  doc.fillColor(PRIMARY).fontSize(8).font('Helvetica-Bold').text(p.title, 52, curY + 3);
  doc.fillColor(TEXT_MUTED).fontSize(7).font('Helvetica-Oblique').text(p.lead, 340, curY + 3);
  curY += 17;

  doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica').text(p.desc, 55, curY, { width: 490, lineGap: 1.5 });
  curY += (doc.heightOfString(p.desc, { width: 490 }) + 6);
});

// ── PAGE BREAK: SERVICE CHARTER & TEAM ────────────────────────
doc.addPage();

// Mini Header on Page 2
doc.fillColor(PRIMARY).fontSize(9).font('Helvetica-Bold').text('KUCCPS ICT DIRECTORATE — ROLLOUT PLAN (PAGE 2)', 45, 30);
doc.strokeColor(LINE_COLOR).lineWidth(0.5).moveTo(45, 42).lineTo(550, 42).stroke();

// ── SECTION 3: SERVICE CHARTER TABLES ─────────────────────────
doc.fillColor(PRIMARY).fontSize(10.5).font('Helvetica-Bold').text('3.0 Service Charter Timelines & Target Response Matrix', 45, 52);
doc.strokeColor(LINE_COLOR).lineWidth(0.8).moveTo(45, 66).lineTo(550, 66).stroke();

// Table 1: Service Catalog
const tbl1Y = 74;
doc.rect(45, tbl1Y, 505, 14).fill(PRIMARY);
doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
doc.text('#', 52, tbl1Y + 3);
doc.text('SERVICE DOMAIN', 72, tbl1Y + 3);
doc.text('MANDATORY REQUIREMENTS', 205, tbl1Y + 3);
doc.text('COST', 375, tbl1Y + 3);
doc.text('TIMELINE', 435, tbl1Y + 3);

const services = [
  ['1', 'Equipment Issuance', 'Approved request on ICT Service Desk', 'Free', 'Immediately to 24 Hours'],
  ['2', 'Hardware Support', 'Filed incident ticket on ICT Service Desk', 'Free', 'Immediately to 24 Hours'],
  ['3', 'Software Support', 'Filed incident ticket on ICT Service Desk', 'Free', 'Immediately to 48 Hours'],
  ['4', 'Provision of Information', 'Filed incident ticket on ICT Service Desk', 'Free', 'Immediately to 7 Days'],
  ['5', 'Incident / Problem Resolution', 'Filed incident ticket on ICT Service Desk', 'Free', 'As per Urgency Matrix below'],
  ['6', 'Software Development', 'Approved Project Request', 'Free', 'As per Specifications'],
  ['7', 'Information Inquiry', 'Enquiry via Face-to-Face, Email, Desk, Memo', 'Free', 'Immediately to 3 Days']
];

let rY = tbl1Y + 14;
services.forEach((row, idx) => {
  doc.rect(45, rY, 505, 12.5).fill(idx % 2 === 0 ? '#ffffff' : BG_LIGHT);
  doc.fillColor(TEXT_DARK).fontSize(7).font(row[0] === '5' ? 'Helvetica-Bold' : 'Helvetica');
  doc.text(row[0], 52, rY + 2.5);
  doc.text(row[1], 72, rY + 2.5);
  doc.text(row[2], 205, rY + 2.5, { width: 165 });
  doc.text(row[3], 375, rY + 2.5);
  doc.fillColor(row[0] === '1' || row[0] === '2' ? PRIMARY : TEXT_DARK).text(row[4], 435, rY + 2.5);
  rY += 12.5;
});

// Table 2: Urgency SLA Matrix
const tbl2Y = rY + 12;
doc.fillColor(PRIMARY).fontSize(9.5).font('Helvetica-Bold').text('Incident Urgency & Target SLA Matrix', 45, tbl2Y);

const uY = tbl2Y + 12;
doc.rect(45, uY, 505, 14).fill(PRIMARY);
doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
doc.text('URGENCY LEVEL', 52, uY + 3);
doc.text('TARGET FIRST RESPONSE', 185, uY + 3);
doc.text('TARGET FINAL RESOLUTION', 360, uY + 3);

const urgencies = [
  ['Very High', '90% Response within 30 Minutes', '100% Resolution within 1 Working Day'],
  ['High', '90% Response within 60 Minutes', '100% Resolution within 1 Working Day'],
  ['Medium', '90% Response within 1 Working Day', '100% Resolution within 5 Working Days'],
  ['Low', '90% Response within 2 Working Days', '100% Resolution within 5 Working Days'],
  ['Very Low', '90% Response within 3 Working Days', '100% Resolution within 7 Working Days']
];

let urY = uY + 14;
urgencies.forEach((row, idx) => {
  doc.rect(45, urY, 505, 12).fill(idx % 2 === 0 ? '#ffffff' : BG_LIGHT);
  doc.fillColor(idx === 0 ? PRIMARY : TEXT_DARK).fontSize(7).font(idx === 0 ? 'Helvetica-Bold' : 'Helvetica');
  doc.text(row[0], 52, urY + 2);
  doc.text(row[1], 185, urY + 2);
  doc.text(row[2], 360, urY + 2);
  urY += 12;
});

// ── SECTION 4: PROJECT IMPLEMENTATION TEAM ────────────────────
const teamY = urY + 16;
doc.fillColor(PRIMARY).fontSize(10.5).font('Helvetica-Bold').text('4.0 Project Implementation Team', 45, teamY);
doc.strokeColor(LINE_COLOR).lineWidth(0.8).moveTo(45, teamY + 14).lineTo(550, teamY + 14).stroke();

const tHeaderY = teamY + 20;
doc.rect(45, tHeaderY, 505, 14).fill(PRIMARY);
doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
doc.text('OFFICER NAME', 52, tHeaderY + 3);
doc.text('PROJECT ASSIGNMENT', 185, tHeaderY + 3);
doc.text('DESIGNATION & DIRECTORATE', 345, tHeaderY + 3);

const teamMembers = [
  ['Felix Ngitari', 'Project Manager', 'Systems Analyst / Project Lead, ICT'],
  ['Derrick Makana', 'Lead Technical Specialist', 'ICT Support Specialist, ICT'],
  ['Infrastructure Lead', 'Active Directory & Network Systems', 'Senior Network Administrator, ICT'],
  ['Helpdesk Lead', 'User Support & Queue Operations', 'ICT Support Officer, ICT'],
  ['Database Lead', 'Database Integration & Email Ingestion', 'Database Administrator, ICT'],
  ['Project Sponsor', 'Project Sponsor & Management Approver', 'Director, ICT Directorate']
];

let memY = tHeaderY + 14;
teamMembers.forEach((member, idx) => {
  doc.rect(45, memY, 505, 13).fill(idx % 2 === 0 ? '#ffffff' : BG_LIGHT);
  doc.fillColor(idx === 0 ? PRIMARY : TEXT_DARK).fontSize(7.5).font(idx === 0 ? 'Helvetica-Bold' : 'Helvetica');
  doc.text(member[0], 52, memY + 3);
  doc.text(member[1], 185, memY + 3);
  doc.text(member[2], 345, memY + 3);
  memY += 13;
});

// ── SIGN-OFF BLOCK ────────────────────────────────────────────
const signY = memY + 18;
doc.roundedRect(45, signY, 245, 55, 3).stroke(LINE_COLOR);
doc.roundedRect(305, signY, 245, 55, 3).stroke(LINE_COLOR);

doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica-Bold');
doc.text('PREPARED BY (PROJECT MANAGER):', 52, signY + 6);
doc.fillColor(PRIMARY).text('Felix Ngitari', 52, signY + 17);
doc.fillColor(TEXT_MUTED).font('Helvetica').fontSize(7);
doc.text('Signature: __________________________', 52, signY + 30);
doc.text('Date: ______________________________', 52, signY + 42);

doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica-Bold');
doc.text('MANAGEMENT APPROVAL:', 312, signY + 6);
doc.fillColor(TEXT_DARK).text('Director, ICT Directorate', 312, signY + 17);
doc.fillColor(TEXT_MUTED).font('Helvetica').fontSize(7);
doc.text('Signature: __________________________', 312, signY + 30);
doc.text('Date: ______________________________', 312, signY + 42);

// Page Numbers & Footer
doc.fillColor(TEXT_MUTED).fontSize(7).font('Helvetica')
   .text('KUCCPS ICT Directorate — Internal Rollout Framework — ACK Garden House, Nairobi', 45, 785, { align: 'center' });

doc.end();
console.log('✓ Grounded, institutional PDF generated successfully with logo at:', outputPath);
