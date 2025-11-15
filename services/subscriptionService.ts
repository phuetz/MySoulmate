import api from './api';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'weekly' | 'monthly' | 'yearly' | 'lifetime';
  features: string[];
  isActive: boolean;
  trialDays?: number;
  isPopular?: boolean;
  savingsPercentage?: number;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
}

export interface Subscriber {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  autoRenew: boolean;
  paymentMethod: string;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
}

export interface SubscriptionStat {
  totalSubscribers: number;
  activeSubscribers: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  conversionRate: number;
  retentionRate: number;
  churnRate: number;
}

export interface SubscriptionFilter {
  status?: 'active' | 'cancelled' | 'expired' | 'trial';
  planId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// This is a mock service for the subscription functionality
// In a real application, you would integrate with a payment provider like Stripe
export const subscriptionService = {
  async getPlans(): Promise<SubscriptionPlan[]> {
    // Updated pricing based on competitive analysis 2025
    // Sweet spot: $9.99-$13.99/month
    return [
      {
        id: 'plan_basic',
        name: 'Basic',
        description: 'Perfect for getting started',
        price: 7.99,
        billingCycle: 'monthly',
        features: [
          'AI Chat unlimited',
          '1 companion',
          '3 Story chapters/month',
          'Light ads',
          'Voice calls (5 min/day)',
          'Basic AR features'
        ],
        isActive: true,
        trialDays: 7,
        isPopular: false
      },
      {
        id: 'plan_premium',
        name: 'Premium',
        description: 'Most popular - best value!',
        price: 12.99,
        billingCycle: 'monthly',
        features: [
          'Everything in Basic',
          'NSFW mode',
          'Stories unlimited',
          'Voice/Video unlimited',
          '5 AI images/month',
          'No ads',
          'Priority support'
        ],
        isActive: true,
        trialDays: 7,
        isPopular: true,
        savingsPercentage: 38 // vs old $16.99
      },
      {
        id: 'plan_ultimate',
        name: 'Ultimate',
        description: 'Everything + exclusive features',
        price: 19.99,
        billingCycle: 'monthly',
        features: [
          'Everything in Premium',
          'Voice cloning',
          'AI images unlimited',
          'Multiple companions (3)',
          'Priority AI (faster responses)',
          'Early access features',
          'Exclusive seasonal content',
          'Battle Pass included'
        ],
        isActive: true,
        trialDays: 7,
        isPopular: false
      },
      {
        id: 'plan_yearly',
        name: 'Yearly Premium',
        description: 'Save 35% - Best annual deal',
        price: 99.99,
        billingCycle: 'yearly',
        features: [
          'All Premium features',
          'NSFW mode',
          'Stories unlimited',
          'Voice/Video unlimited',
          '10 AI images/month',
          'No ads',
          'Priority support',
          'Exclusive seasonal content',
          'Early access to new features'
        ],
        isActive: true,
        trialDays: 7,
        isPopular: false,
        savingsPercentage: 35 // vs monthly premium $12.99 * 12 = $155.88
      },
      {
        id: 'plan_lifetime',
        name: 'Lifetime',
        description: 'Pay once, enjoy forever!',
        price: 199.99,
        billingCycle: 'lifetime',
        features: [
          'All Ultimate features forever',
          'Voice cloning',
          'AI images unlimited',
          'Multiple companions (3)',
          'Priority AI (fastest)',
          'Early access to ALL features',
          'Exclusive lifetime badge',
          'Future features included',
          'VIP support',
          'No recurring payments ever!'
        ],
        isActive: true,
        isPopular: false,
        savingsPercentage: 50 // vs Replika's $299.99
      }
    ];
  },

  async createPlan(plan: Omit<SubscriptionPlan, 'id'>): Promise<SubscriptionPlan> {
    // Mock implementation
    const newPlan = {
      ...plan,
      id: `plan_${Date.now()}`
    };
    
    return newPlan;
  },

  async updatePlan(id: string, plan: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    // Mock implementation
    const plans = await this.getPlans();
    const existingPlan = plans.find(p => p.id === id);
    
    if (!existingPlan) {
      throw new Error('Plan not found');
    }
    
    return {
      ...existingPlan,
      ...plan
    };
  },

  async deletePlan(id: string): Promise<void> {
    // Mock implementation - in a real app, you might want to deactivate instead of delete
    console.log(`Plan ${id} deleted`);
  },

  async getSubscribers(filters: SubscriptionFilter = {}): Promise<{
    subscribers: Subscriber[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
  }> {
    // Mock implementation
    const mockSubscribers: Subscriber[] = [
      {
        id: 'sub_1',
        userId: 'user_1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        planId: 'plan_monthly',
        planName: 'Monthly',
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2023-02-01T00:00:00.000Z',
        status: 'active',
        autoRenew: true,
        paymentMethod: 'Visa **** 4242',
        lastPaymentDate: '2023-01-01T00:00:00.000Z',
        nextPaymentDate: '2023-02-01T00:00:00.000Z'
      },
      {
        id: 'sub_2',
        userId: 'user_2',
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        planId: 'plan_yearly',
        planName: 'Yearly',
        startDate: '2023-01-15T00:00:00.000Z',
        endDate: '2024-01-15T00:00:00.000Z',
        status: 'active',
        autoRenew: true,
        paymentMethod: 'Mastercard **** 5555',
        lastPaymentDate: '2023-01-15T00:00:00.000Z',
        nextPaymentDate: '2024-01-15T00:00:00.000Z'
      },
      {
        id: 'sub_3',
        userId: 'user_3',
        userName: 'Alex Johnson',
        userEmail: 'alex@example.com',
        planId: 'plan_weekly',
        planName: 'Weekly',
        startDate: '2023-01-10T00:00:00.000Z',
        endDate: '2023-01-17T00:00:00.000Z',
        status: 'cancelled',
        autoRenew: false,
        paymentMethod: 'PayPal',
        lastPaymentDate: '2023-01-10T00:00:00.000Z'
      },
      {
        id: 'sub_4',
        userId: 'user_4',
        userName: 'Sarah Wilson',
        userEmail: 'sarah@example.com',
        planId: 'plan_monthly',
        planName: 'Monthly',
        startDate: '2023-01-20T00:00:00.000Z',
        endDate: '2023-02-20T00:00:00.000Z',
        status: 'trial',
        autoRenew: true,
        paymentMethod: 'Visa **** 9876',
        nextPaymentDate: '2023-02-20T00:00:00.000Z'
      }
    ];
    
    let filteredSubscribers = [...mockSubscribers];
    
    // Apply filters
    if (filters.status) {
      filteredSubscribers = filteredSubscribers.filter(sub => sub.status === filters.status);
    }
    
    if (filters.planId) {
      filteredSubscribers = filteredSubscribers.filter(sub => sub.planId === filters.planId);
    }
    
    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSubscribers = filteredSubscribers.slice(startIndex, endIndex);
    
    return {
      subscribers: paginatedSubscribers,
      totalPages: Math.ceil(filteredSubscribers.length / limit),
      currentPage: page,
      totalItems: filteredSubscribers.length
    };
  },

  async getSubscriptionStats(): Promise<SubscriptionStat> {
    // Mock implementation
    return {
      totalSubscribers: 143,
      activeSubscribers: 115,
      mrr: 1897.55,
      arr: 22770.60,
      conversionRate: 4.5, // percentage
      retentionRate: 78.3, // percentage
      churnRate: 7.2 // percentage
    };
  },

  async startTrial(user: UserInfo, plan: SubscriptionPlan): Promise<Subscriber> {
    const start = new Date();
    const days = plan.trialDays ?? 7;
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);

    const trialSubscription: Subscriber = {
      id: `sub_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      planId: plan.id,
      planName: plan.name,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      status: 'trial',
      autoRenew: false,
      paymentMethod: '',
      nextPaymentDate: end.toISOString()
    };

    return trialSubscription;
  },

  async cancelSubscription(id: string): Promise<void> {
    // Mock implementation
    console.log(`Subscription ${id} cancelled`);
  },

  async updateAutoRenew(id: string, autoRenew: boolean): Promise<void> {
    // Mock implementation
    console.log(`Auto renew for subscription ${id} set to ${autoRenew}`);
  },

  async generateInvoice(subscriberId: string, date: string): Promise<string> {
    // Mock implementation - would generate and return a download URL in a real app
    return `https://example.com/invoices/invoice-${subscriberId}-${date}.pdf`;
  },

  async getPaymentMethods(userId: string): Promise<string[]> {
    // Mock implementation
    return [
      'Visa **** 4242',
      'Mastercard **** 5555'
    ];
  },
  
  async processRefund(subscriptionId: string, amount: number, reason: string): Promise<void> {
    // Mock implementation
    console.log(`Refunded ${amount} for subscription ${subscriptionId}. Reason: ${reason}`);
  }
};