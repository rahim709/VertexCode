const express = require('express');
const router = express.Router();
const userMiddleware = require('../middleware/userMiddleware');
const {
    getPlans,
    createSubscriptionSession,
    createPortalSession,
    fulfillSubscription,

} = require('../controllers/paymentController');

router.get('/plans', getPlans);
router.post('/create-subscription-session', userMiddleware, createSubscriptionSession);
router.post('/portal', userMiddleware, createPortalSession);
router.post('/fulfill', userMiddleware, fulfillSubscription);

module.exports = router;
