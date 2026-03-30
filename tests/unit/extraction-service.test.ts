import { runExtraction } from '../../src/services/extraction-service';
import { getDb } from '../../src/utils/db';

jest.mock('apify-client', () => ({
  ApifyClient: jest.fn().mockImplementation(() => ({
    actor: jest.fn().mockReturnValue({
      call: jest.fn().mockResolvedValue({
        status: 'SUCCEEDED',
        id: 'run-1',
        defaultDatasetId: 'dataset-1',
      }),
    }),
    dataset: jest.fn().mockReturnValue({
      listItems: jest.fn().mockResolvedValue({
        items: [
          {
            url: 'https://example.com',
            emails: ['hello@example.com'],
            social_links: {},
            phone_numbers: [],
            scanned_pages: ['https://example.com'],
            status: 'success',
            error: null,
          },
        ],
      }),
    }),
  })),
}));

jest.mock('../../src/config', () => ({
  config: {
    apifyApiToken: 'test-token',
    apifyActorId: 'logical_scrapers/extract-email-from-any-website',
    apifyRunTimeoutSecs: 60,
    maxConcurrentApifyRuns: 3,
    sqliteDbPath: ':memory:',
    cache: { extractionTtlMs: 0 },
  },
}));

describe('extraction-service', () => {
  beforeEach(() => {
    const db = getDb();
    db.exec(`DELETE FROM extractions`);
  });

  it('runExtraction normalizes URLs and returns a completed job', async () => {
    const job = await runExtraction(['example.com']);
    expect(job.status).toBe('completed');
    expect(job.results[0].emails).toContain('hello@example.com');
  });
});
