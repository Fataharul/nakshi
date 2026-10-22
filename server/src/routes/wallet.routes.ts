import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// All wallet operations require authenticated user session
router.use(authenticateJWT);

router.post('/top-up', WalletController.topUp);
router.get('/balance', WalletController.getBalance);
router.get('/transactions', WalletController.getTransactions);

export default router;
