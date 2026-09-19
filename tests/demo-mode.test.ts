import { describe, it, expect } from "vitest";

/**
 * Story 17.2 — Demo Data Gating (CC-4).
 *
 * Contract under test:
 * 1. Flag OFF (default boot) → sumber data awal KOSONG; view beralih ke hook
 *    API React Query. Tidak ada konsumsi runtime mock.
 * 2. Flag ON (VITE_DEMO_MODE truthy) → seed mock lengkap + banner demo di App.
 * 3. Empty API response → view menampilkan empty state jujur (bukan data
 *    palsu, bukan area kosong tanpa pesan) — dikontrakkan lewat seed kosong.
 */

import {
  DEMO_MODE,
  getInitialDataSource,
  isDemoModeEnabled,
  mockProjects,
  mockWorkItems,
  mockTickets,
  mockIncidents,
  mockServers
} from "../src/mockData.ts";

describe("Story 17.2 — isDemoModeEnabled (flag resolver)", () => {
  it("mengaktifkan demo untuk nilai truthy yang eksplisit", () => {
    expect(isDemoModeEnabled("1")).toBe(true);
    expect(isDemoModeEnabled("true")).toBe(true);
    expect(isDemoModeEnabled("TRUE")).toBe(true);
    expect(isDemoModeEnabled("Yes")).toBe(true);
    expect(isDemoModeEnabled("on")).toBe(true);
    expect(isDemoModeEnabled(" 1 ")).toBe(true); // toleran whitespace
    expect(isDemoModeEnabled(true)).toBe(true);
  });

  it("TIDAK mengaktifkan demo untuk flag kosong, nihil, atau tidak dikenal", () => {
    expect(isDemoModeEnabled(undefined)).toBe(false);
    expect(isDemoModeEnabled(null)).toBe(false);
    expect(isDemoModeEnabled("")).toBe(false);
    expect(isDemoModeEnabled("0")).toBe(false);
    expect(isDemoModeEnabled("false")).toBe(false);
    expect(isDemoModeEnabled("off")).toBe(false);
    expect(isDemoModeEnabled("yes-but-actually-no")).toBe(false);
  });
});

describe("Story 17.2 — DEMO_MODE default boot (AC1)", () => {
  it("boot tanpa flag VITE_DEMO_MODE berjalan dalam mode produksi (bukan demo)", () => {
    // Lingkungan test tidak menyetel VITE_DEMO_MODE — sama seperti boot produksi.
    expect(DEMO_MODE).toBe(false);
  });
});

describe("Story 17.2 — getInitialDataSource(false): tanpa mock (AC1)", () => {
  const real = getInitialDataSource(false);

  it("seluruh koleksi data KOSONG — nol kebocoran mock ke runtime", () => {
    expect(real.projects).toEqual([]);
    expect(real.workItems).toEqual([]);
    expect(real.tickets).toEqual([]);
    expect(real.deployments).toEqual([]);
    expect(real.servers).toEqual([]);
    expect(real.aiFindings).toEqual([]);
    expect(real.aiRecommendations).toEqual([]);
    expect(real.technicalDebts).toEqual([]);
    expect(real.incidents).toEqual([]);
    expect(real.commits).toEqual([]);
    expect(real.pullRequests).toEqual([]);
    expect(real.events).toEqual([]);
    expect(real.articles).toEqual([]);
  });

  it("tidak meminjam referensi array mock mana pun", () => {
    expect(mockProjects.length).toBeGreaterThan(0); // kontrol: mock memang terisi
    expect(mockWorkItems.length).toBeGreaterThan(0);
    expect(real.projects).not.toBe(mockProjects);
    expect(real.workItems).not.toBe(mockWorkItems);
    expect(real.tickets).not.toBe(mockTickets);
    expect(real.incidents).not.toBe(mockIncidents);
    expect(real.servers).not.toBe(mockServers);
  });

  it("currentProject null → App menampilkan status jujur, bukan proyek fiktif", () => {
    expect(real.currentProject).toBeNull();
  });
});

describe("Story 17.2 — getInitialDataSource(true): mode demo (AC2)", () => {
  const demo = getInitialDataSource(true);

  it("menyediakan seed mock lengkap (perilaku lama dipertahankan di mode demo)", () => {
    expect(demo.projects).toBe(mockProjects);
    expect(demo.workItems).toBe(mockWorkItems);
    expect(demo.tickets).toBe(mockTickets);
    expect(demo.incidents).toBe(mockIncidents);
    expect(demo.servers).toBe(mockServers);
  });

  it("currentProject terisi dari mock pertama (mode demo tetap fungsional)", () => {
    expect(demo.currentProject).toBe(mockProjects[0]);
  });
});

describe("Story 17.2 — kontrak sumber data awal (struktur stabil)", () => {
  it("bentuk InitialDataSource identik di kedua mode (gating transparan bagi App)", () => {
    expect(Object.keys(getInitialDataSource(false)).sort()).toEqual(
      Object.keys(getInitialDataSource(true)).sort()
    );
  });
});
