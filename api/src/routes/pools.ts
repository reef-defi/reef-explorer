import { Router } from 'express';
import { queryVerifiedPoolsWithUserLP, queryVerifiedUserPools } from '../controllers/pools';
import { asyncHandler } from '../utils/utils';

const router = Router();

router.post('/user-pools', asyncHandler(queryVerifiedUserPools));
router.post('/with-user-lp', asyncHandler(queryVerifiedPoolsWithUserLP));

export default router;
