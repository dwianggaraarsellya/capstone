import { Router } from 'express';
import { getPublicFaqs } from '../controllers/faqsController.js';

const router = Router();

// GET /api/faqs - Public list of active FAQs
router.get('/', getPublicFaqs);

export default router;
