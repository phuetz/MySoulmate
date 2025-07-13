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
