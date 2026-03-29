import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../data/db';
import { Customer, Jar, Transaction, DashboardStats, JarStatus } from './models';

// --- BACKUP & RESTORE SERVICES ---
export const exportData = async (): Promise<string> => {
  const db = await getDB();
  const customers = await db.getAll('customers');
  const jars = await db.getAll('jars');
  const transactions = await db.getAll('transactions');
  return JSON.stringify({ customers, jars, transactions });
};

export const importData = async (data: string): Promise<void> => {
  const { customers, jars, transactions } = JSON.parse(data);
  const db = await getDB();
  const tx = db.transaction(['customers', 'jars', 'transactions'], 'readwrite');
  
  await tx.objectStore('customers').clear();
  await tx.objectStore('jars').clear();
  await tx.objectStore('transactions').clear();
  
  for (const customer of customers) await tx.objectStore('customers').put(customer);
  for (const jar of jars) await tx.objectStore('jars').put(jar);
  for (const transaction of transactions) await tx.objectStore('transactions').put(transaction);
  
  await tx.done;
};

// --- CUSTOMER SERVICES ---
export const getCustomers = async (): Promise<Customer[]> => {
  const db = await getDB();
  return db.getAll('customers');
};

export const getCustomer = async (id: string): Promise<Customer | undefined> => {
  const db = await getDB();
  return db.get('customers', id);
};

export const addCustomer = async (
  data: Omit<Customer, 'id' | 'created_at' | 'total_due' | 'jars_held'>
): Promise<Customer> => {
  const db = await getDB();
  const newCustomer: Customer = {
    ...data,
    id: uuidv4(),
    created_at: Date.now(),
    total_due: 0,
    jars_held: 0,
    price_per_jar: data.price_per_jar || 20,
  };
  await db.put('customers', newCustomer);
  return newCustomer;
};

export const updateCustomer = async (
  id: string,
  data: Partial<Omit<Customer, 'id' | 'created_at' | 'total_due' | 'jars_held'>>
): Promise<Customer> => {
  const db = await getDB();
  const existingCustomer = await db.get('customers', id);
  if (!existingCustomer) throw new Error('Customer not found');

  const updatedCustomer: Customer = {
    ...existingCustomer,
    ...data,
  };
  await db.put('customers', updatedCustomer);
  return updatedCustomer;
};

export const deleteCustomer = async (id: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['customers', 'jars', 'transactions'], 'readwrite');
  
  const customerStore = tx.objectStore('customers');
  const jarStore = tx.objectStore('jars');
  const transactionStore = tx.objectStore('transactions');

  // 1. Free up jars held by this customer
  const jarsIndex = jarStore.index('by-customer');
  let jarCursor = await jarsIndex.openCursor(id);
  while (jarCursor) {
    const jar = jarCursor.value;
    jar.status = 'available';
    jar.current_customer_id = null;
    jar.last_updated = Date.now();
    await jarCursor.update(jar);
    jarCursor = await jarCursor.continue();
  }

  // 2. Delete all transactions for this customer
  const txIndex = transactionStore.index('by-customer');
  let txCursor = await txIndex.openCursor(id);
  while (txCursor) {
    await txCursor.delete();
    txCursor = await txCursor.continue();
  }

  // 3. Delete the customer
  await customerStore.delete(id);

  await tx.done;
};

// --- JAR SERVICES ---
export const getJars = async (): Promise<Jar[]> => {
  const db = await getDB();
  return db.getAll('jars');
};

export const getJarByQR = async (qr_code: string): Promise<Jar | undefined> => {
  const db = await getDB();
  return db.getFromIndex('jars', 'by-qr', qr_code);
};

export const addJar = async (): Promise<Jar> => {
  const db = await getDB();
  const id = uuidv4();
  const newJar: Jar = {
    id,
    qr_code: `AQJAR_${id.substring(0, 8).toUpperCase()}`,
    status: 'available',
    current_customer_id: null,
    last_updated: Date.now(),
  };
  await db.put('jars', newJar);
  return newJar;
};

export const deleteJar = async (id: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['jars', 'customers'], 'readwrite');
  
  const jarStore = tx.objectStore('jars');
  const customerStore = tx.objectStore('customers');

  const jar = await jarStore.get(id);
  if (!jar) {
    await tx.done;
    return;
  }

  // If jar is with a customer, decrement their jars_held
  if (jar.status === 'with_customer' && jar.current_customer_id) {
    const customer = await customerStore.get(jar.current_customer_id);
    if (customer) {
      customer.jars_held = Math.max(0, customer.jars_held - 1);
      await customerStore.put(customer);
    }
  }

  // Delete the jar
  await jarStore.delete(id);

  await tx.done;
};

export const updateJarStatus = async (id: string, status: JarStatus): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['jars', 'customers'], 'readwrite');
  
  const jarStore = tx.objectStore('jars');
  const customerStore = tx.objectStore('customers');

  const jar = await jarStore.get(id);
  if (!jar) {
    await tx.done;
    throw new Error('Jar not found');
  }

  // If it was with a customer and now it's not
  if (jar.status === 'with_customer' && status !== 'with_customer' && jar.current_customer_id) {
    const customer = await customerStore.get(jar.current_customer_id);
    if (customer) {
      customer.jars_held = Math.max(0, customer.jars_held - 1);
      await customerStore.put(customer);
    }
    jar.current_customer_id = null;
  }

  jar.status = status;
  jar.last_updated = Date.now();
  await jarStore.put(jar);

  await tx.done;
};

// --- TRANSACTION & BUSINESS LOGIC SERVICES ---
export const getTransactionsByCustomer = async (customerId: string): Promise<Transaction[]> => {
  const db = await getDB();
  return db.getAllFromIndex('transactions', 'by-customer', customerId);
};

export const processDelivery = async (jarId: string, customerId: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['jars', 'customers', 'transactions'], 'readwrite');
  
  const jarStore = tx.objectStore('jars');
  const customerStore = tx.objectStore('customers');
  const transactionStore = tx.objectStore('transactions');

  const jar = await jarStore.get(jarId);
  const customer = await customerStore.get(customerId);

  if (!jar || !customer) throw new Error('Jar or Customer not found');
  if (jar.status === 'with_customer') throw new Error('Jar is already with a customer');

  // 1. Update Jar
  jar.status = 'with_customer';
  jar.current_customer_id = customerId;
  jar.last_updated = Date.now();
  await jarStore.put(jar);

  // 2. Update Customer
  customer.jars_held += 1;
  customer.total_due += customer.price_per_jar;
  await customerStore.put(customer);

  // 3. Record Transaction
  const transaction: Transaction = {
    id: uuidv4(),
    type: 'delivery',
    customer_id: customerId,
    jar_id: jarId,
    amount: customer.price_per_jar,
    jar_count: 1,
    note: 'Jar Delivered',
    timestamp: Date.now(),
  };
  await transactionStore.put(transaction);

  await tx.done;
};

export const processReturn = async (jarId: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['jars', 'customers', 'transactions'], 'readwrite');
  
  const jarStore = tx.objectStore('jars');
  const customerStore = tx.objectStore('customers');
  const transactionStore = tx.objectStore('transactions');

  const jar = await jarStore.get(jarId);
  if (!jar) throw new Error('Jar not found');
  if (jar.status !== 'with_customer' || !jar.current_customer_id) {
    throw new Error('Jar is not currently with a customer');
  }

  const customerId = jar.current_customer_id;
  const customer = await customerStore.get(customerId);

  // 1. Update Jar
  jar.status = 'available';
  jar.current_customer_id = null;
  jar.last_updated = Date.now();
  await jarStore.put(jar);

  // 2. Update Customer
  if (customer) {
    customer.jars_held = Math.max(0, customer.jars_held - 1);
    await customerStore.put(customer);
  }

  // 3. Record Transaction
  const transaction: Transaction = {
    id: uuidv4(),
    type: 'return',
    customer_id: customerId,
    jar_id: jarId,
    amount: 0,
    jar_count: 1,
    note: 'Jar Returned',
    timestamp: Date.now(),
  };
  await transactionStore.put(transaction);

  await tx.done;
};

export const recordPayment = async (customerId: string, amount: number, note: string = 'Payment Received'): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['customers', 'transactions'], 'readwrite');
  
  const customerStore = tx.objectStore('customers');
  const transactionStore = tx.objectStore('transactions');

  const customer = await customerStore.get(customerId);
  if (!customer) throw new Error('Customer not found');

  // 1. Update Customer Balance
  customer.total_due -= amount;
  await customerStore.put(customer);

  // 2. Record Transaction
  const transaction: Transaction = {
    id: uuidv4(),
    type: 'payment',
    customer_id: customerId,
    jar_id: null,
    amount: amount,
    jar_count: 0,
    note,
    timestamp: Date.now(),
  };
  await transactionStore.put(transaction);

  await tx.done;
};

export const undoTransaction = async (transactionId: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['jars', 'customers', 'transactions'], 'readwrite');
  
  const jarStore = tx.objectStore('jars');
  const customerStore = tx.objectStore('customers');
  const transactionStore = tx.objectStore('transactions');

  const transaction = await transactionStore.get(transactionId);
  if (!transaction) throw new Error('Transaction not found');

  const customer = await customerStore.get(transaction.customer_id);
  if (!customer) throw new Error('Customer not found');

  if (transaction.type === 'delivery') {
    if (!transaction.jar_id) throw new Error('Invalid delivery transaction');
    const jar = await jarStore.get(transaction.jar_id);
    if (!jar) throw new Error('Jar not found');

    // Reverse delivery
    jar.status = 'available';
    jar.current_customer_id = null;
    jar.last_updated = Date.now();
    await jarStore.put(jar);

    customer.jars_held = Math.max(0, customer.jars_held - 1);
    customer.total_due -= transaction.amount;
    await customerStore.put(customer);
  } else if (transaction.type === 'payment') {
    // Reverse payment
    customer.total_due += transaction.amount;
    await customerStore.put(customer);
  }

  await transactionStore.delete(transactionId);
  await tx.done;
};

// --- DASHBOARD SERVICES ---
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const db = await getDB();
  const jars = await db.getAll('jars');
  const customers = await db.getAll('customers');
  
  // Get today's deliveries
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  
  // OPTIMIZATION FOR LOW-END DEVICES: 
  // Instead of loading all transactions into memory (which crashes low-end phones over time),
  // we use an IndexedDB cursor to only iterate through today's transactions.
  const txIndex = db.transaction('transactions').store.index('by-timestamp');
  const range = IDBKeyRange.lowerBound(startOfToday.getTime());
  
  let recentDeliveries = 0;
  let todaysCollection = 0;
  let cursor = await txIndex.openCursor(range);
  
  while (cursor) {
    if (cursor.value.type === 'delivery') {
      recentDeliveries++;
    } else if (cursor.value.type === 'payment') {
      todaysCollection += cursor.value.amount;
    }
    cursor = await cursor.continue();
  }

  return {
    totalJars: jars.length,
    jarsAvailable: jars.filter(j => j.status === 'available').length,
    jarsWithCustomers: jars.filter(j => j.status === 'with_customer').length,
    totalOutstandingDue: customers.reduce((sum, c) => sum + c.total_due, 0),
    recentDeliveries,
    todaysCollection,
  };
};
