import { ApifyClient } from 'apify-client';
import { config } from '../config';
import { AppError } from '../types/api';
import { logger } from '../utils/logger';
import { getDb } from '../utils/db';
import type { ContactExtraction, ExtractionJob } from '../types/extraction';
import { randomUUID } from 'crypto';

const client = new ApifyClient({ token: config.apifyApiToken });

function buildActorInput(urls: string[]): Record<string, unknown> {
  if (config.apifyActorId.includes('custom-web-scraper')) {
    return {
      startUrls: urls.map((url) => ({ url })),
      maxPagesPerCrawl: urls.length,
      linkSelector: '',
      pageFunction: null,
      selectors: null,
    };
  }
  return { urls };
}

let activeRuns = 0;

function normalizeUrl(url: string): string {
  let u = url.trim();
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    u = 'https://' + u;
  }
  return u;
}

export async function runExtraction(urls: string[]): Promise<ExtractionJob> {
  const normalized = urls.map(normalizeUrl).filter(Boolean);
  if (normalized.length === 0) {
    throw new AppError('INVALID_PARAMS', 'At least one valid URL is required.', 400);
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const db = getDb();

  db.prepare(`
    INSERT INTO extractions (id, urls, status, results, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, JSON.stringify(normalized), 'running', JSON.stringify([]), createdAt);

  if (activeRuns >= config.maxConcurrentApifyRuns) {
    db.prepare(`UPDATE extractions SET status = ?, completed_at = ? WHERE id = ?`)
      .run('failed', new Date().toISOString(), id);
    throw new AppError(
      'APIFY_RUN_FAILED',
      'Too many concurrent Apify runs. Please try again shortly.',
      503
    );
  }

  activeRuns++;

  try {
    logger.info('Starting email extraction actor run', { id, urlCount: normalized.length });

    const run = await client.actor(config.apifyActorId).call(
      buildActorInput(normalized),
      { waitSecs: config.apifyRunTimeoutSecs }
    );

    if (run.status !== 'SUCCEEDED') {
      db.prepare(`UPDATE extractions SET status = ?, completed_at = ? WHERE id = ?`)
        .run('failed', new Date().toISOString(), id);
      throw new AppError(
        'APIFY_RUN_FAILED',
        `Apify actor run ended with status: ${run.status}`,
        502
      );
    }

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    const results: ContactExtraction[] = items.map((item: any) => ({
      url: item.url,
      emails: item.emails || [],
      socialLinks: item.socialLinks || item.social_links || {},
      phoneNumbers: item.phoneNumbers || item.phone_numbers || [],
      scannedPages: item.scannedPages || item.scanned_pages || [],
      status: item.status,
      error: item.error ?? null,
      extractedAt: new Date().toISOString(),
    }));

    const completedAt = new Date().toISOString();
    db.prepare(`UPDATE extractions SET status = ?, results = ?, completed_at = ? WHERE id = ?`)
      .run('completed', JSON.stringify(results), completedAt, id);

    logger.info('Email extraction actor run complete', {
      id,
      runId: run.id,
      itemCount: results.length,
    });

    return {
      id,
      urls: normalized,
      status: 'completed',
      results,
      createdAt,
      completedAt,
    };
  } catch (err) {
    db.prepare(`UPDATE extractions SET status = ?, completed_at = ? WHERE id = ?`)
      .run('failed', new Date().toISOString(), id);

    if (err instanceof AppError) throw err;

    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes('timeout')) {
      throw new AppError('APIFY_TIMEOUT', 'Apify actor run timed out.', 504);
    }
    throw new AppError('APIFY_RUN_FAILED', `Apify run failed: ${message}`, 502);
  } finally {
    activeRuns--;
  }
}

export function getExtraction(id: string): ExtractionJob | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM extractions WHERE id = ?`).get(id) as any;
  if (!row) return null;

  return {
    id: row.id,
    urls: JSON.parse(row.urls),
    status: row.status,
    results: JSON.parse(row.results),
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
  };
}

export function listExtractions(limit = 50, offset = 0): ExtractionJob[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM extractions ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset) as any[];

  return rows.map((row) => ({
    id: row.id,
    urls: JSON.parse(row.urls),
    status: row.status,
    results: JSON.parse(row.results),
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
  }));
}
