import React, { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { toast } from 'sonner';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Transactions() {
  const { transactions, loadInitialData, undoTransaction, customers } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleUndo = async (transactionId: string) => {
    if (window.confirm('Are you sure you want to undo this transaction?')) {
      try {
        await undoTransaction(transactionId);
        toast.success('Transaction undone successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to undo transaction');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-24">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Recent Transactions</h2>
      </div>

      <div className="space-y-3">
        {transactions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No transactions found.</p>
        ) : (
          transactions.map(tx => {
            const customer = customers.find(c => c.id === tx.customer_id);
            return (
              <div key={tx.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800 capitalize">{tx.type}</h4>
                  <p className="text-sm text-gray-500">{customer?.name || 'Unknown Customer'} • {new Date(tx.timestamp).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">{tx.note}</p>
                </div>
                <button 
                  onClick={() => handleUndo(tx.id)}
                  className="bg-orange-100 text-orange-700 p-3 rounded-full hover:bg-orange-200 transition-colors"
                  title="Undo Transaction"
                >
                  <RotateCcw size={20} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
