import { Router } from 'express';
import extractionsRouter from './extractions';

const router = Router();

router.use('/extract', extractionsRouter);

export default router;
