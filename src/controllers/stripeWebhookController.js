const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');
const { logger } = require('../config/logger');
const { auditLogger } = require('../utils/auditLogger');
const { sendSubscriptionConfirmation } = require('../services/emailService');
const { captureException } = require('../config/sentry');

/**
 * Contrôleur amélioré pour les webhooks Stripe
 * Gère tous les événements de paiement de manière robuste
 */

/**
 * Traite les événements checkout.session.completed
 */
const handleCheckoutSessionCompleted = async (session) => {
  try {
    logger.info('Processing checkout.session.completed', {
      sessionId: session.id,
      customerId: session.customer,
    });

    const userId = session.metadata?.userId;
    if (!userId) {
      logger.error('No userId in session metadata', { sessionId: session.id });
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      logger.error('User not found for checkout session', { userId, sessionId: session.id });
      return;
    }

    // Mettre à jour le customer ID Stripe
    if (session.customer && !user.stripeCustomerId) {
      user.stripeCustomerId = session.customer;
      await user.save();
    }

    // Envoyer une confirmation par email
    if (session.amount_total) {
      const amount = (session.amount_total / 100).toFixed(2);
      const currency = session.currency.toUpperCase();
      const planName = session.metadata?.planName || 'Premium';

      try {
        await sendSubscriptionConfirmation(
          user.email,
          user.name,
          planName,
          `${amount} ${currency}`,
          'Prochain renouvellement automatique'
        );
      } catch (emailError) {
        logger.error('Failed to send subscription confirmation email', emailError);
      }
    }

    await auditLogger.log({
      action: 'checkout_completed',
      userId: user.id,
      status: 'success',
      details: {
        sessionId: session.id,
        amount: session.amount_total,
        currency: session.currency,
      },
    });

    logger.info('Checkout session processed successfully', { userId, sessionId: session.id });
  } catch (error) {
    logger.error('Error handling checkout.session.completed', error);
    captureException(error, { webhook: 'checkout.session.completed', session });
    throw error;
  }
};

/**
 * Traite les événements customer.subscription.created
 */
const handleSubscriptionCreated = async (subscription) => {
  try {
    logger.info('Processing customer.subscription.created', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
    });

    // Trouver l'utilisateur par customer ID
    const user = await User.findOne({
      where: { stripeCustomerId: subscription.customer },
    });

    if (!user) {
      logger.error('User not found for subscription', { customerId: subscription.customer });
      return;
    }

    // Mettre à jour le statut d'abonnement
    user.subscriptionStatus = subscription.status;
    user.subscriptionId = subscription.id;
    user.subscriptionPlan = subscription.items.data[0]?.price?.id || null;
    user.subscriptionCurrentPeriodEnd = new Date(subscription.current_period_end * 1000);
    await user.save();

    await auditLogger.log({
      action: 'subscription_created',
      userId: user.id,
      status: 'success',
      details: {
        subscriptionId: subscription.id,
        plan: user.subscriptionPlan,
        status: subscription.status,
      },
    });

    logger.info('Subscription created successfully', { userId: user.id, subscriptionId: subscription.id });
  } catch (error) {
    logger.error('Error handling customer.subscription.created', error);
    captureException(error, { webhook: 'customer.subscription.created', subscription });
    throw error;
  }
};

/**
 * Traite les événements customer.subscription.updated
 */
const handleSubscriptionUpdated = async (subscription) => {
  try {
    logger.info('Processing customer.subscription.updated', {
      subscriptionId: subscription.id,
      status: subscription.status,
    });

    const user = await User.findOne({
      where: { stripeCustomerId: subscription.customer },
    });

    if (!user) {
      logger.error('User not found for subscription update', { customerId: subscription.customer });
      return;
    }

    // Mettre à jour le statut
    const previousStatus = user.subscriptionStatus;
    user.subscriptionStatus = subscription.status;
    user.subscriptionPlan = subscription.items.data[0]?.price?.id || null;
    user.subscriptionCurrentPeriodEnd = new Date(subscription.current_period_end * 1000);

    // Si l'abonnement est annulé à la fin de la période
    if (subscription.cancel_at_period_end) {
      user.subscriptionCancelAtPeriodEnd = true;
      user.subscriptionCancelAt = new Date(subscription.cancel_at * 1000);
    } else {
      user.subscriptionCancelAtPeriodEnd = false;
      user.subscriptionCancelAt = null;
    }

    await user.save();

    await auditLogger.log({
      action: 'subscription_updated',
      userId: user.id,
      status: 'success',
      details: {
        subscriptionId: subscription.id,
        previousStatus,
        newStatus: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    logger.info('Subscription updated successfully', {
      userId: user.id,
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  } catch (error) {
    logger.error('Error handling customer.subscription.updated', error);
    captureException(error, { webhook: 'customer.subscription.updated', subscription });
    throw error;
  }
};

/**
 * Traite les événements customer.subscription.deleted
 */
const handleSubscriptionDeleted = async (subscription) => {
  try {
    logger.info('Processing customer.subscription.deleted', {
      subscriptionId: subscription.id,
    });

    const user = await User.findOne({
      where: { stripeCustomerId: subscription.customer },
    });

    if (!user) {
      logger.error('User not found for subscription deletion', { customerId: subscription.customer });
      return;
    }

    // Réinitialiser l'abonnement
    user.subscriptionStatus = 'canceled';
    user.subscriptionId = null;
    user.subscriptionPlan = null;
    user.subscriptionCurrentPeriodEnd = null;
    user.subscriptionCancelAtPeriodEnd = false;
    user.subscriptionCancelAt = null;
    await user.save();

    await auditLogger.log({
      action: 'subscription_deleted',
      userId: user.id,
      status: 'success',
      details: {
        subscriptionId: subscription.id,
      },
    });

    logger.info('Subscription deleted successfully', { userId: user.id, subscriptionId: subscription.id });
  } catch (error) {
    logger.error('Error handling customer.subscription.deleted', error);
    captureException(error, { webhook: 'customer.subscription.deleted', subscription });
    throw error;
  }
};

/**
 * Traite les événements invoice.payment_succeeded
 */
const handleInvoicePaymentSucceeded = async (invoice) => {
  try {
    logger.info('Processing invoice.payment_succeeded', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
    });

    const user = await User.findOne({
      where: { stripeCustomerId: invoice.customer },
    });

    if (!user) {
      logger.error('User not found for invoice', { customerId: invoice.customer });
      return;
    }

    // TODO: Créer un enregistrement de transaction
    // await Transaction.create({...})

    await auditLogger.log({
      action: 'invoice_payment_succeeded',
      userId: user.id,
      status: 'success',
      details: {
        invoiceId: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
      },
    });

    logger.info('Invoice payment processed successfully', {
      userId: user.id,
      invoiceId: invoice.id,
      amount: invoice.amount_paid,
    });
  } catch (error) {
    logger.error('Error handling invoice.payment_succeeded', error);
    captureException(error, { webhook: 'invoice.payment_succeeded', invoice });
    throw error;
  }
};

/**
 * Traite les événements invoice.payment_failed
 */
const handleInvoicePaymentFailed = async (invoice) => {
  try {
    logger.info('Processing invoice.payment_failed', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
    });

    const user = await User.findOne({
      where: { stripeCustomerId: invoice.customer },
    });

    if (!user) {
      logger.error('User not found for failed invoice', { customerId: invoice.customer });
      return;
    }

    // TODO: Envoyer un email de notification de paiement échoué
    // await emailService.sendPaymentFailedNotification(user.email, user.name);

    await auditLogger.log({
      action: 'invoice_payment_failed',
      userId: user.id,
      status: 'failed',
      details: {
        invoiceId: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        attemptCount: invoice.attempt_count,
      },
    });

    logger.warn('Invoice payment failed', {
      userId: user.id,
      invoiceId: invoice.id,
      attemptCount: invoice.attempt_count,
    });
  } catch (error) {
    logger.error('Error handling invoice.payment_failed', error);
    captureException(error, { webhook: 'invoice.payment_failed', invoice });
    throw error;
  }
};

/**
 * Point d'entrée principal du webhook Stripe
 * POST /api/v1/webhooks/stripe
 */
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('Stripe webhook secret not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  let event;

  try {
    // Vérifier la signature du webhook
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: err.message });
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  logger.info('Stripe webhook received', {
    type: event.type,
    id: event.id,
  });

  try {
    // Router vers le handler approprié
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      // Événements additionnels
      case 'payment_intent.succeeded':
        logger.info('PaymentIntent succeeded', { id: event.data.object.id });
        break;

      case 'payment_intent.payment_failed':
        logger.warn('PaymentIntent failed', { id: event.data.object.id });
        break;

      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }

    // Toujours retourner 200 pour confirmer la réception
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook', {
      type: event.type,
      error: error.message,
    });

    // Même en cas d'erreur, retourner 200 pour éviter les retries
    // L'erreur est loggée et capturée par Sentry
    res.status(200).json({ received: true, error: error.message });
  }
};

/**
 * Test de webhook (développement uniquement)
 * POST /api/v1/webhooks/stripe/test
 */
exports.testWebhook = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }

  const { eventType, data } = req.body;

  logger.info('Testing webhook event', { eventType });

  try {
    switch (eventType) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(data);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(data);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(data);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(data);
        break;
      default:
        return res.status(400).json({ error: 'Unknown event type' });
    }

    res.status(200).json({ success: true, message: 'Webhook event processed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
