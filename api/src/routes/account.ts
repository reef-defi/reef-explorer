import { Router } from 'express';
import { accountTokens } from '../controllers/account';

const router = Router();

router.post('/tokens', accountTokens);
router.get('/:address/owned-tokens', accountTokens);
/* eslint "no-unused-vars": "off" */
router.get('/:address/available-tokens', (re, rs) => {});
// router.post('/pool', accountPool);

export default router;
