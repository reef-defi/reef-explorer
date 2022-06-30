import { Router } from 'express';
import {
  queryVerifiedPoolsWithUserLP, countVerifiedPoolsWithUserLP, queryVerifiedUserPools, countVerifiedUserPools,
} from '../controllers/pools';
import { asyncHandler } from '../utils/utils';

const router = Router();

router.post('/list', asyncHandler(queryVerifiedPoolsWithUserLP));
router.post('/list-count', asyncHandler(countVerifiedPoolsWithUserLP));
router.post('/users-list', asyncHandler(queryVerifiedUserPools));
router.post('/users-list-count', asyncHandler(countVerifiedUserPools));

export default router;
