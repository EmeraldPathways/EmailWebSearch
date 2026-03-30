import request from 'supertest';
import app from '../../src/server';

jest.mock('../../src/services/extraction-service', () => ({
  runExtraction: jest.fn(),
  getExtraction: jest.fn(),
  listExtractions: jest.fn(),
}));

import { runExtraction, getExtraction, listExtractions } from '../../src/services/extraction-service';

const TOKEN = process.env['API_SECRET_KEY'] ?? 'dev-secret-key';

describe('Extractions API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('POST /v1/extract starts an extraction', async () => {
    const mockJob = {
      id: 'job-1',
      urls: ['https://example.com'],
      status: 'completed',
      results: [],
      createdAt: new Date().toISOString(),
    };
    (runExtraction as jest.Mock).mockResolvedValue(mockJob);

    const res = await request(app)
      .post('/v1/extract')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ urls: ['https://example.com'] });

    expect(res.status).toBe(202);
    expect(res.body.data.id).toBe('job-1');
  });

  it('GET /v1/extract/:id returns a job', async () => {
    const mockJob = {
      id: 'job-1',
      urls: ['https://example.com'],
      status: 'completed',
      results: [],
      createdAt: new Date().toISOString(),
    };
    (getExtraction as jest.Mock).mockReturnValue(mockJob);

    const res = await request(app)
      .get('/v1/extract/job-1')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('job-1');
  });

  it('GET /v1/extract/history returns jobs', async () => {
    (listExtractions as jest.Mock).mockReturnValue([]);

    const res = await request(app)
      .get('/v1/extract/history')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
