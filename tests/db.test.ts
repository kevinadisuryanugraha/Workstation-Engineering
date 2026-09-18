import { describe, it, expect } from 'vitest';
import { organizations, users, projects } from '../server/db/schema/index.ts';
import { checkDatabaseConnection } from '../server/db/client.ts';

describe('Database & Schema Tests', () => {
  it('verifies that core schema definitions have required columns', () => {
    expect(organizations.name).toBeDefined();
    expect(organizations.slug).toBeDefined();
    expect(users.email).toBeDefined();
    expect(users.passwordHash).toBeDefined();
    expect(projects.key).toBeDefined();
  });

  it('verifies connection healthcheck function error handling gracefully', async () => {
    // When connecting to local postgres if not running, it gracefully returns connected: false
    const result = await checkDatabaseConnection();
    expect(typeof result.connected).toBe('boolean');
    if (!result.connected) {
      expect(result.error).toBeDefined();
    }
  });
});
