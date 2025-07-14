const logger = require('../utils/logger');
const { Subscription } = require('../models');

/**
 * Handle payment provider webhooks
 */
exports.handleWebhook = async (req, res) => {
  try {
    // In a real implementation, you would verify the signature here
    const event = req.body;

    logger.info(`Received payment webhook: ${JSON.stringify(event)}`);

    if (event && event.type) {
      switch (event.type) {
        case 'subscription.created':
          await Subscription.create({
            id: event.data.id,
            userId: event.data.userId,
            plan: event.data.plan,
            status: 'active',
            startDate: new Date(event.data.startDate),
            endDate: event.data.endDate ? new Date(event.data.endDate) : null,
            paymentMethod: event.data.paymentMethod || null,
            lastPaymentDate: new Date(event.data.startDate),
            nextPaymentDate: event.data.nextPaymentDate
              ? new Date(event.data.nextPaymentDate)
              : null,
          });
          break;
        case 'invoice.paid':
          await Subscription.update(
            {
              status: 'active',
              lastPaymentDate: new Date(event.data.paidAt),
              nextPaymentDate: event.data.nextPaymentDate
                ? new Date(event.data.nextPaymentDate)
                : null,
            },
            { where: { id: event.data.subscriptionId } },
          );
          break;
        case 'subscription.cancelled':
          await Subscription.update(
            { status: 'canceled', endDate: new Date() },
            { where: { id: event.data.subscriptionId } },
          );
          break;
        default:
          logger.warn(`Unhandled webhook event type: ${event.type}`);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error(`Webhook processing failed: ${error.message}`);
    return res.status(400).json({ success: false });
  }
};

/**
 * Generate a simple receipt with tax calculation
 */
exports.generateReceipt = async (req, res) => {
  try {
    const { items = [], taxRate = 0.2 } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items required' });
    }
    const { generateReceipt } = require('../utils/receipt');
    const receipt = generateReceipt(items, taxRate);
    return res.status(200).json({ receipt });
  } catch (error) {
    logger.error(`Receipt generation failed: ${error.message}`);
    return res.status(400).json({ message: 'Failed to generate receipt' });
  }
};

/**
 * Create a Stripe Checkout session
 */
exports.createCheckoutSession = async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    if (!priceId) {
      return res.status(400).json({ message: 'priceId required' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      logger.warn('Stripe secret key not configured');
      return res.status(400).json({ message: 'Stripe not configured' });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        { price: priceId, quantity: 1 }
      ],
      success_url: successUrl || 'https://example.com/success',
      cancel_url: cancelUrl || 'https://example.com/cancel'
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (error) {
    logger.error(`Checkout session creation failed: ${error.message}`);
    return res.status(400).json({ message: 'Failed to create checkout session' });
  }
};
