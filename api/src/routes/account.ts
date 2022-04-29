import { Router } from 'express';
import { accountOwnedContracts, accountTokens } from '../controllers/account';
import { asyncHandler } from '../utils/utils';

const router = Router();

router.post('/tokens', asyncHandler(accountTokens));
router.get('/:address/contracts', asyncHandler(accountOwnedContracts));
/* eslint "no-unused-vars": "off" */
router.get('/:address/available-tokens', (re, rs) => {});
// router.post('/pool', accountPool);

export default router;
