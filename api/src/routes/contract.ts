import { Router } from "express";
import { findContract, findPool, findToken, stakingRewards } from "../controllers/contract";

const router = Router();

router.post('/pool', findPool);
router.get('/token/:address', findToken);
router.get('/contract/:address', findContract);
router.post('/staking/rewards', stakingRewards);

export default router;