import { Router } from 'express';
import {
  formVerification, submitVerification, verificationStatus, getVerifiedContract,
} from '../controllers/verification';

const router = Router();

router.post('/status', verificationStatus);
router.post('/form-verification', formVerification);
router.post('/submit-verification', submitVerification);
router.get('/contract/:address', getVerifiedContract);

export default router;
