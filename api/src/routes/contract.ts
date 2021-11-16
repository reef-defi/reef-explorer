import { Router } from "express";
import { findPool, findToken, stakingRewards } from "../controllers/contract";

const router = Router();

router.post('/pool', findPool);
router.post('/token/:address', findToken);
router.post('/staking/rewards', stakingRewards);

export default router;