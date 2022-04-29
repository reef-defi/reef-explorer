import { Router } from 'express';
import {
  formVerification, submitVerification, verificationStatus, getVerifiedContract,
} from '../controllers/verification';
import { asyncHandler } from '../utils/utils';

const router = Router();

router.post('/status', asyncHandler(verificationStatus));
router.post('/form-verification', asyncHandler(formVerification));
router.post('/submit-verification', asyncHandler(submitVerification));
router.get('/contract/:address', asyncHandler(getVerifiedContract));

export default router;
