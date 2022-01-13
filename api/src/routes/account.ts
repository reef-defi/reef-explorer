import { Router } from 'express';
import { accountOwnedContracts, accountTokens } from '../controllers/account';

const router = Router();

router.post('/tokens', accountTokens);
router.get('/:address/contracts', accountOwnedContracts);
/* eslint "no-unused-vars": "off" */
router.get('/:address/available-tokens', (re, rs) => {});
// router.post('/pool', accountPool);

export default router;
