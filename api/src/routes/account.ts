import { Router } from "express";
import { accountPool, accountTokens } from "../controllers/account";

const router = Router();

router.post('/tokens', accountTokens);
router.post('/pool', accountPool);

export default router;