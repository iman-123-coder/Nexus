const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @route POST /api/payments/deposit
exports.deposit = async (req, res) => {
  try {
    const { amount } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
      metadata: { userId: req.user.id }
    });

    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'deposit',
      amount,
      status: 'pending',
      stripePaymentId: paymentIntent.id
    });

    res.json({ success: true, clientSecret: paymentIntent.client_secret, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/payments/deposit/confirm
exports.confirmDeposit = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const transaction = await Transaction.findOneAndUpdate(
        { stripePaymentId: paymentIntentId },
        { status: 'completed' },
        { new: true }
      );
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { walletBalance: transaction.amount }
      });
      res.json({ success: true, transaction });
    } else {
      res.status(400).json({ success: false, message: 'Payment not completed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/payments/withdraw
exports.withdraw = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);

    if (user.walletBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    await User.findByIdAndUpdate(req.user.id, { $inc: { walletBalance: -amount } });

    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'withdraw',
      amount,
      status: 'completed'
    });

    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/payments/transfer
exports.transfer = async (req, res) => {
  try {
    const { recipientId, amount, description } = req.body;
    const sender = await User.findById(req.user.id);

    if (sender.walletBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    await User.findByIdAndUpdate(req.user.id, { $inc: { walletBalance: -amount } });
    await User.findByIdAndUpdate(recipientId, { $inc: { walletBalance: amount } });

    await Transaction.create({ user: req.user.id, type: 'transfer_sent', amount, status: 'completed', recipient: recipientId, description });
    await Transaction.create({ user: recipientId, type: 'transfer_received', amount, status: 'completed', recipient: req.user.id, description });

    res.json({ success: true, message: 'Transfer successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/payments/history
exports.getHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .populate('recipient', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};