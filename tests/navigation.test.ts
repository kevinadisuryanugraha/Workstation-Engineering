import { describe, it, expect } from 'vitest';
import { NAV_ITEMS, NAV_GROUPS, filterNavigation } from '../src/config/navigation.ts';
import { ROLE_PERMISSIONS } from '../src/lib/rbac.ts';
import type { UserRole } from '../src/types.ts';

/**
 * Story 17.1 (CC-4) — Navigation registry & permission filter.
 * Registry: src/config/navigation.ts · Filter: filterNavigation()
 */

const allKnownPermissions = new Set(
  Object.values(ROLE_PERMISSIONS).flat()
);

const visibleIdsFor = (role: UserRole) =>
  filterNavigation(NAV_ITEMS, ROLE_PERMISSIONS[role] ?? []).map((i) => i.id);

describe('Navigation Registry (Story 17.1)', () => {
  it('setiap item nav memiliki group & requiredPermission yang valid', () => {
    const groupIds = new Set(NAV_GROUPS.map((g) => g.id));
    for (const item of NAV_ITEMS) {
      expect(groupIds.has(item.group), `group tidak valid: ${item.id}`).toBe(true);
      expect(
        allKnownPermissions.has(item.requiredPermission),
        `permission tidak dikenal: ${item.id} → ${item.requiredPermission}`
      ).toBe(true);
    }
  });

  it('id nav unik dan mencakup 15 item eksisting', () => {
    const ids = NAV_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(NAV_ITEMS.length).toBe(15);
  });

  it('Developer hanya melihat item Kerjaanku + Operations yang diizinkan (AC 4)', () => {
    const visible = visibleIdsFor('Developer');
    // Kerjaanku: overview ✓, project360 ✗ (PERM_VIEW_MANAGEMENT), workitems ✓, tickets ✓
    expect(visible).toContain('overview');
    expect(visible).toContain('workitems');
    expect(visible).toContain('tickets');
    expect(visible).not.toContain('project360');
    // Operations yang diizinkan: PERM_VIEW_ENGINEERING & PERM_SERVER_TELEMETRY
    expect(visible).toContain('incidents');
    expect(visible).toContain('git');
    expect(visible).toContain('infrastructure');
    expect(visible).toContain('ai');
    expect(visible).toContain('knowledge');
    // Yang tidak diizinkan untuk Developer
    expect(visible).not.toContain('deployments');
    expect(visible).not.toContain('reports');
    expect(visible).not.toContain('report-id');
    // Governance: seluruhnya tersembunyi untuk Developer
    expect(visible).not.toContain('security');
    expect(visible).not.toContain('audit');
  });

  it('Viewer (PERM_VIEW_DASHBOARD saja) hanya melihat overview & knowledge', () => {
    expect(visibleIdsFor('Viewer').sort()).toEqual(['knowledge', 'overview']);
  });

  it('item Governance tidak terlihat oleh Viewer (AC governance)', () => {
    const governanceItems = NAV_ITEMS.filter((i) => i.group === 'governance');
    expect(governanceItems.length).toBeGreaterThan(0);
    const viewerPerms = ROLE_PERMISSIONS['Viewer'];
    const visible = filterNavigation(governanceItems, viewerPerms);
    expect(visible).toHaveLength(0);
  });

  it('Super Admin melihat seluruh item nav', () => {
    expect(visibleIdsFor('Super Admin').length).toBe(NAV_ITEMS.length);
  });

  it('grup tanpa item visible menghasilkan array kosong (basis skip render grup)', () => {
    const devPerms = ROLE_PERMISSIONS['Developer'];
    const governanceVisible = filterNavigation(
      NAV_ITEMS.filter((i) => i.group === 'governance'),
      devPerms
    );
    expect(governanceVisible).toHaveLength(0);
  });

  it('filterNavigation bekerja pada array kosong & permission kosong', () => {
    expect(filterNavigation(NAV_ITEMS, [])).toHaveLength(0);
    expect(filterNavigation([], allKnownPermissions as unknown as never[])).toHaveLength(0);
  });
});
