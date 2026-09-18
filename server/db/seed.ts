import { db, pool } from './client.ts';
import { organizations } from './schema/organizations.ts';
import { projects } from './schema/projects.ts';
import { workItems } from './schema/work_items.ts';
import { tickets } from './schema/tickets.ts';

/**
 * Demo seed — mengisi data operasional realistis agar dashboard hidup saat
 * pemeriksaan manual / demo manajemen. Idempoten: aman dijalankan berulang
 * (skip bila organization seed sudah ada).
 */

async function seed() {
  console.log('[Seed] Memeriksa data yang sudah ada...');

  const existing = await db.select({ id: organizations.id }).from(organizations).limit(1);
  if (existing.length > 0) {
    console.log('[Seed] Data sudah ada — skip (idempoten). Hapus manual bila ingin seed ulang.');
    return;
  }

  // ===== Organization =====
  const [org] = await db
    .insert(organizations)
    .values({ name: 'Zamzami Digital', slug: 'zamzami-digital' })
    .returning();
  console.log(`[Seed] Organization: ${org.name}`);

  // ===== Projects =====
  const projectRows = await db
    .insert(projects)
    .values([
      {
        organizationId: org.id,
        key: 'WRK',
        name: 'WORKSTATION Platform',
        tagline: 'Engineering Intelligence & Operations',
        description: 'Platform operasional internal: tiket, work item, git intelligence, deployment, dan audit.',
        status: 'ACTIVE',
        progress: 100,
        health: 95,
      },
      {
        organizationId: org.id,
        key: 'POS',
        name: 'POS Retail Modernisasi',
        tagline: 'Kasir & inventaris multi-outlet',
        description: 'Modernisasi sistem kasir gerai retail: offline-first, receipt printer, dan sinkronisasi stok.',
        status: 'AT_RISK',
        progress: 64,
        health: 70,
      },
    ])
    .returning();
  const [wrk, pos] = projectRows;
  console.log(`[Seed] Projects: ${projectRows.map((p) => p.key).join(', ')}`);

  // ===== Work Items =====
  await db.insert(workItems).values([
    { key: 'WRK-101', projectId: wrk.id, title: 'Fondasi platform: auth, RBAC, dan audit trail', type: 'EPIC', priority: 'P0', status: 'DONE' },
    { key: 'WRK-102', projectId: wrk.id, title: 'Server agent & telemetri infrastruktur', type: 'FEATURE', priority: 'P1', status: 'DONE' },
    { key: 'WRK-103', projectId: wrk.id, title: 'Laporan manajemen otomatis Bahasa Indonesia', type: 'FEATURE', priority: 'P1', status: 'DONE' },
    { key: 'WRK-104', projectId: wrk.id, title: 'Notifikasi alerting (email/Slack) untuk insiden kritis', type: 'FEATURE', priority: 'P2', status: 'READY' },
    { key: 'WRK-105', projectId: wrk.id, title: 'Refactor modul git-linker: pisahkan parser regex', type: 'TECH_DEBT', priority: 'P3', status: 'IN_PROGRESS' },
    { key: 'POS-201', projectId: pos.id, title: 'Fix deadlock spooler printer struk kasir', type: 'BUG', priority: 'P0', status: 'DONE' },
    { key: 'POS-202', projectId: pos.id, title: 'Sinkronisasi stok offline-first dengan conflict resolution', type: 'FEATURE', priority: 'P1', status: 'IN_PROGRESS' },
    { key: 'POS-203', projectId: pos.id, title: 'Audit keamanan endpoint pembayaran', type: 'TASK', priority: 'P1', status: 'BACKLOG' },
  ]);
  console.log('[Seed] Work items: 8');

  // ===== Tickets =====
  await db.insert(tickets).values([
    { key: 'TCK-1001', projectId: wrk.id, title: 'Login gagal untuk akun baru di jaringan kantor Cabang-2', type: 'BUG', severity: 'High', priority: 'P1', status: 'ASSIGNED' },
    { key: 'TCK-1002', projectId: wrk.id, title: 'Request audit log viewer lambat saat filter rentang 30 hari', type: 'PERFORMANCE', severity: 'Medium', priority: 'P2', status: 'TRIAGED' },
    { key: 'TCK-1003', projectId: pos.id, title: 'Struk kasir terpotong di printer thermal Epson TM-T82', type: 'BUG', severity: 'Critical', priority: 'P0', status: 'RESOLVED' },
    { key: 'TCK-1004', projectId: pos.id, title: 'Permintaan fitur: laporan penjualan per jam untuk store manager', type: 'FEATURE_REQUEST', severity: 'Low', priority: 'P3', status: 'NEW' },
    { key: 'TCK-1005', projectId: wrk.id, title: 'Rotasi JWT secret sebelum go-live produksi', type: 'SECURITY', severity: 'High', priority: 'P1', status: 'IN_PROGRESS' },
  ]);
  console.log('[Seed] Tickets: 5');
}

seed()
  .then(() => {
    console.log('[Seed] Selesai ✅');
  })
  .catch((err) => {
    console.error('[Seed] Gagal:', err?.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
