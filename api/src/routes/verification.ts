import { Router } from "express";
import { formVerification, submitVerification, verificationStatus } from "../controllers/verification";

const router = Router();

router.post('/status', verificationStatus);
router.post('/form-verification', formVerification);
router.post('/submit-verification', submitVerification);

export default router;