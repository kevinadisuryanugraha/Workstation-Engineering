import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Story 19.2 (CC-6) — Export UI: download helper, fallback nama file jujur,
 * dan kontrak fetch ekspor (endpoint + auth + Content-Disposition + blob).
 * Lingkungan test = node (tanpa DOM) — `saveBlob` dimock di boundary modul;
 * helper murni (fileNameFromDisposition, genericReportFileName) diuji REAL.
 */

process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';

const { saveBlobMock } = vi.hoisted(() => ({ saveBlobMock: vi.fn() }));

vi.mock('../src/lib/auth.ts', () => ({
  authManager: {
    getToken: () => 'tok-123',
    getUser: () => null,
  },
}));

vi.mock('../src/lib/download.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/lib/download.ts')>();
  return {
    ...original,
    saveBlob: saveBlobMock,
  };
});

import { fileNameFromDisposition, genericReportFileName } from '../src/lib/download.ts';
import { requestExport, ExportError } from '../src/hooks/api/useReportExport.ts';

describe('fileNameFromDisposition (Story 19.2 / AC #2)', () => {
  it('parses plain quoted filename', () => {
    expect(fileNameFromDisposition('attachment; filename="laporan-weekly-20260912-20260919.pdf"', 'x.pdf')).toBe(
      'laporan-weekly-20260912-20260919.pdf'
    );
  });

  it('parses unquoted filename', () => {
    expect(fileNameFromDisposition('attachment; filename=laporan.pdf', 'x.pdf')).toBe('laporan.pdf');
  });

  it('falls back honestly when header absent', () => {
    expect(fileNameFromDisposition(null, 'fallback.pdf')).toBe('fallback.pdf');
  });
});

describe('genericReportFileName (AC #2)', () => {
  it('builds laporan-{type}-{tanggal}.ext', () => {
    expect(genericReportFileName('WEEKLY', 'xlsx')).toMatch(/^laporan-weekly-\d{8}\.xlsx$/);
  });
});

describe('requestExport contract (AC #2, #3)', () => {
  beforeEach(() => {
    saveBlobMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hits the story 19.1 endpoint, applies auth header, and uses disposition filename', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Blob(['%PDF-fake'], { type: 'application/pdf' }), {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename="laporan-weekly-20260912-20260919.pdf"',
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await requestExport('rep-1', 'pdf');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/v1/reports/history/rep-1/export.pdf');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok-123');
    expect(result.filename).toBe('laporan-weekly-20260912-20260919.pdf');
    expect(result.size).toBeGreaterThan(0);
    expect(saveBlobMock).toHaveBeenCalledTimes(1);
    expect(saveBlobMock.mock.calls[0][1]).toBe('laporan-weekly-20260912-20260919.pdf');
  });

  it('falls back to an honest archive-id filename without disposition header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Blob(['PK-xlsx'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), {
        status: 200,
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await requestExport('rep-77', 'xlsx');
    expect(result.filename).toBe('laporan-rep-77.xlsx');
    expect(saveBlobMock.mock.calls[0][1]).toBe('laporan-rep-77.xlsx');
  });

  it('surfaces a truthful error message from the server envelope (AC #3)', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'Report archive not found' } }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        })
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(requestExport('missing', 'pdf')).rejects.toBeInstanceOf(ExportError);
    await expect(requestExport('missing', 'pdf')).rejects.toThrow('Report archive not found');
    expect(saveBlobMock).not.toHaveBeenCalled();
  });

  it('encodes the archive id into the path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Blob(['x'], { type: 'application/pdf' }), { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);
    await requestExport('rep with space', 'pdf');
    expect((fetchMock.mock.calls[0] as unknown[])[0]).toBe('/api/v1/reports/history/rep%20with%20space/export.pdf');
  });
});
