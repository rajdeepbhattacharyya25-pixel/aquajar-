import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Customer, Jar, Transaction } from '../domain/models';

interface AquaJarDB extends DBSchema {
  customers: {
    key: string;
    value: Customer;
  };
  jars: {
    key: string;
    value: Jar;
    indexes: { 'by-qr': string; 'by-customer': string };
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-customer': string; 'by-timestamp': number };
  };
  settings: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<AquaJarDB>> | null = null;

export const getDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<AquaJarDB>('aquajar-db', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('customers')) {
            db.createObjectStore('customers', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('jars')) {
            const jarStore = db.createObjectStore('jars', { keyPath: 'id' });
            jarStore.createIndex('by-qr', 'qr_code', { unique: true });
            jarStore.createIndex('by-customer', 'current_customer_id');
          }
          if (!db.objectStoreNames.contains('transactions')) {
            const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
            txStore.createIndex('by-customer', 'customer_id');
            txStore.createIndex('by-timestamp', 'timestamp');
          }
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings');
          }
        }
      },
    });
  }
  return dbPromise;
};
