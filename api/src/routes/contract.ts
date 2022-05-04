import { Router } from 'express';
import {
  accountTokenBalance, findContract, findToken, getAllERC20Tokens,
} from '../controllers/contract';
import { asyncHandler } from '../utils/utils';

const router = Router();
router.get('/erc20', asyncHandler(getAllERC20Tokens));
router.get('/token/:address', asyncHandler(findToken));
router.get('/contract/:address', asyncHandler(findContract));
router.post('/token-balance', asyncHandler(accountTokenBalance));

export default router;
