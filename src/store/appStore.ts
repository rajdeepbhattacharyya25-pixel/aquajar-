import { create } from 'zustand';
import { Customer, Jar, Transaction, DashboardStats, JarStatus } from '../domain/models';
import * as services from '../domain/services';

interface AppState {
  customers: Customer[];
  jars: Jar[];
  transactions: Transaction[];
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadInitialData: () => Promise<void>;
  addCustomer: (data: Omit<Customer, 'id' | 'created_at' | 'total_due' | 'jars_held'>) => Promise<void>;
  updateCustomer: (id: string, data: Partial<Omit<Customer, 'id' | 'created_at' | 'total_due' | 'jars_held'>>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addJar: () => Promise<void>;
  deleteJar: (id: string) => Promise<void>;
  updateJarStatus: (id: string, status: JarStatus) => Promise<void>;
  processDelivery: (jarId: string, customerId: string, price?: number) => Promise<void>;
  processReturn: (jarId: string) => Promise<void>;
  recordPayment: (customerId: string, amount: number, note?: string) => Promise<void>;
  loadCustomerTransactions: (customerId: string) => Promise<void>;
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;
  undoTransaction: (transactionId: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  customers: [],
  jars: [],
  transactions: [],
  stats: null,
  isLoading: false,
  error: null,

  loadInitialData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [customers, jars, stats] = await Promise.all([
        services.getCustomers(),
        services.getJars(),
        services.getDashboardStats(),
      ]);
      set({ customers, jars, stats, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addCustomer: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await services.addCustomer(data);
      await get().loadInitialData(); // Refresh all
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateCustomer: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await services.updateCustomer(id, data);
      await get().loadInitialData(); // Refresh all
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteCustomer: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await services.deleteCustomer(id);
      await get().loadInitialData(); // Refresh all
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  addJar: async () => {
    set({ isLoading: true, error: null });
    try {
      await services.addJar();
      await get().loadInitialData();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteJar: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await services.deleteJar(id);
      await get().loadInitialData();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateJarStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      await services.updateJarStatus(id, status);
      await get().loadInitialData();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  processDelivery: async (jarId, customerId, price = 20) => {
    set({ isLoading: true, error: null });
    try {
      await services.processDelivery(jarId, customerId, price);
      await get().loadInitialData();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  processReturn: async (jarId) => {
    set({ isLoading: true, error: null });
    try {
      await services.processReturn(jarId);
      await get().loadInitialData();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  recordPayment: async (customerId, amount, note) => {
    set({ isLoading: true, error: null });
    try {
      await services.recordPayment(customerId, amount, note);
      await get().loadInitialData();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  loadCustomerTransactions: async (customerId) => {
    set({ isLoading: true, error: null });
    try {
      const transactions = await services.getTransactionsByCustomer(customerId);
      // Sort by timestamp descending
      transactions.sort((a, b) => b.timestamp - a.timestamp);
      set({ transactions, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  exportData: async () => {
    return await services.exportData();
  },

  importData: async (data: string) => {
    set({ isLoading: true, error: null });
    try {
      await services.importData(data);
      await get().loadInitialData();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  undoTransaction: async (transactionId: string) => {
    set({ isLoading: true, error: null });
    try {
      await services.undoTransaction(transactionId);
      await get().loadInitialData();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));
