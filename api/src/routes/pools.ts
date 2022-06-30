import { Router } from 'express';
import { queryVerifiedPoolsWithUserLP, queryVerifiedPoolsWithUserLPCount, queryVerifiedUserPools, queryVerifiedUserPoolsCount } from '../controllers/pools';
import { asyncHandler } from '../utils/utils';

const router = Router();

router.post('/list', asyncHandler(queryVerifiedPoolsWithUserLP));
router.post('/list-count', asyncHandler(queryVerifiedPoolsWithUserLPCount));
router.post('/users-list', asyncHandler(queryVerifiedUserPools));
router.post('/users-list-count', asyncHandler(queryVerifiedUserPoolsCount));

export default router;
