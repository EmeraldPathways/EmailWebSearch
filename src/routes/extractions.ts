import { Router } from 'express';
import { z } from 'zod';
import { runExtraction, getExtraction, listExtractions } from '../services/extraction-service';
import { AppError } from '../types/api';

const router = Router();

const extractBodySchema = z.object({
  urls: z.array(z.string().min(1)).min(1).max(20),
});

router.post('/', async (req, res, next) => {
  try {
    const parse = extractBodySchema.safeParse(req.body);
    if (!parse.success) {
      throw new AppError('INVALID_PARAMS', parse.error.message, 400);
    }

    const job = await runExtraction(parse.data.urls);
    res.status(202).json({ data: job });
  } catch (err) {
    next(err);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const offset = Math.max(parseInt(req.query.offset as string, 10) || 0, 0);
    const jobs = listExtractions(limit, offset);
    res.json({ data: jobs });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const job = getExtraction(req.params.id);
    if (!job) {
      throw new AppError('NOT_FOUND', 'Extraction job not found.', 404);
    }
    res.json({ data: job });
  } catch (err) {
    next(err);
  }
});

export default router;
