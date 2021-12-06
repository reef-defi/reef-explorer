import { Router } from "express";
import { findContract, findToken, getAllERC20Tokens } from "../controllers/contract";

const router = Router();

// router.post('/pool', findPool);
router.get('/erc20', getAllERC20Tokens);
router.get('/token/:address', findToken);
router.get('/contract/:address', findContract);
// router.post('/staking/rewards', stakingRewards);

export default router;