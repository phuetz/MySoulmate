import api from './api';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'weekly' | 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
  trialDays?: number;
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
    // In a real app, this would make an API call
    // For demo purposes, we'll return mock data
    return [
      {
        id: 'plan_weekly',
        name: 'Weekly',
        description: 'Pay weekly for maximum flexibility',
        price: 6.99,
        billingCycle: 'weekly',
        features: [
          'All premium avatars',
          'NSFW content',
          'Voice and video calls',
          'AR experiences',
        ],
        isActive: true
      },
      {
        id: 'plan_monthly',
        name: 'Monthly',
        description: 'Our most popular plan',
        price: 16.99,
        billingCycle: 'monthly',
        features: [
          'All premium avatars',
          'NSFW content',
          'Voice and video calls',
          'AR experiences',
          'Priority support',
        ],
        isActive: true
      },
      {
        id: 'plan_yearly',
        name: 'Yearly',
        description: 'Best value - save 51%',
        price: 99.99,
        billingCycle: 'yearly',
        features: [
          'All premium avatars',
          'NSFW content',
          'Voice and video calls',
          'AR experiences',
          'Priority support',
          'Exclusive seasonal content',
          'Early access to new features',
        ],
        isActive: true,
        trialDays: 14
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