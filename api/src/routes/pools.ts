import { Router } from 'express';
import { queryVerifiedPoolsWithUserLP, queryVerifiedUserPools } from '../controllers/pools';
import { asyncHandler } from '../utils/utils';

const router = Router();

router.post('/list', asyncHandler(queryVerifiedPoolsWithUserLP));
router.post('/users-list', asyncHandler(queryVerifiedUserPools));

export default router;
