import { db, pool } from './client.ts';
import { users } from './schema/users.ts';
import { VERIFIED_ENTERPRISE_USERS } from '../modules/auth/auth.service.ts';

/**
 * Seed 7 akun user enterprise ke PostgreSQL (keputusan manajemen 2026-09-18).
 * Password hash = bcrypt cost-12 yang sama dengan directory → login tetap sama.
 * Idempoten: upsert per email (onConflictDoUpdate passwordHash/tokenVersion).
 */
async function seedUsers() {
  for (const u of VERIFIED_ENTERPRISE_USERS) {
    await db
      .insert(users)
      .values({
        email: u.email,
        name: u.name,
        passwordHash: u.passwordHash,
        role: u.role,
        avatar: u.avatar,
        team: u.team,
        tokenVersion: 1,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { name: u.name, role: u.role, avatar: u.avatar, team: u.team, updatedAt: new Date() },
      });
    console.log(`[Seed Users] OK: ${u.email} (${u.role})`);
  }
}

seedUsers()
  .then(() => console.log('[Seed Users] Selesai ✅ — 7 akun tersimpan di PostgreSQL'))
  .catch((err) => { console.error('[Seed Users] Gagal:', err?.message); process.exitCode = 1; })
  .finally(() => pool.end());
