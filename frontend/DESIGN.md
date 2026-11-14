# KUCCPS IT Ticketing — Design System Specification (DESIGN.md)

An engineering-grade, high-density design specification inspired by getdesign.md (Linear & Vercel craft principles) tailored for the Kenya Universities and Colleges Central Placement Service.

## 1. Design Philosophy
- **Hairline Geometry**: Clean 1px structural dividers (`border-zinc-200`) instead of heavy shadows or floaty boxes.
- **Surgical Crimson**: The palette is 95% monochromatic slate/zinc. KUCCPS Crimson (`#990024`) is strictly reserved for primary actions, active states, and urgent escalations.
- **Data Density**: Monospaced numerical values (`tabular-nums`), clean uppercase tracking (`font-mono text-[10.5px] uppercase tracking-wider`), and structured tabular feeds.
- **Instant Spatial Clarity**: High contrast between background `#fafafa`, surface cards `#ffffff`, and active indicators.

## 2. Color Palette
- Canvas Background: `#fafafa` (Zinc-50)
- Surface Cards: `#ffffff`
- Borders: `#e4e4e7` (Zinc-200 hairline)
- Text Primary: `#09090b` (Zinc-950)
- Text Muted: `#71717a` (Zinc-500)
- Brand Primary: `#990024` (KUCCPS Crimson)
- Success: `#059669` (Emerald-600)
- Urgent / SLA: `#e11d48` (Rose-600)

## 3. Typography
- UI Sans: `Geist` (weights: 400, 500, 600, 700)
- Data Mono: `Geist Mono` (for ticket codes, SLA hours, metrics, and timestamps)
