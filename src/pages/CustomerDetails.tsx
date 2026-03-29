import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { ArrowLeft, Phone, MapPin, Calendar, FileText, IndianRupee, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Transaction } from '../domain/models';

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, transactions, loadCustomerTransactions, loadInitialData } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  const customer = customers.find(c => c.id === id);

  useEffect(() => {
    const fetchData = async () => {
      if (!customers.length) {
        await loadInitialData();
      }
      if (id) {
        await loadCustomerTransactions(id);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [id, loadInitialData, loadCustomerTransactions, customers.length]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full p-8 text-gray-500">Loading customer details...</div>;
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <p className="text-gray-500">Customer not found.</p>
        <button onClick={() => navigate('/customers')} className="text-blue-600 font-medium">Back to Customers</button>
      </div>
    );
  }

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'delivery': return <Package size={16} className="text-orange-500" />;
      case 'return': return <CheckCircle size={16} className="text-green-500" />;
      case 'payment': return <IndianRupee size={16} className="text-blue-500" />;
      case 'lost':
      case 'damaged': return <XCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'delivery': return 'bg-orange-50 border-orange-100';
      case 'return': return 'bg-green-50 border-green-100';
      case 'payment': return 'bg-blue-50 border-blue-100';
      case 'lost':
      case 'damaged': return 'bg-red-50 border-red-100';
      default: return 'bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/customers')} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Customer Profile</h2>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{customer.name}</h3>
          <div className="flex items-center text-gray-500 gap-4">
            <span className="flex items-center gap-1.5"><Phone size={16} /> {customer.phone}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500 font-medium mb-1 uppercase tracking-wider">Total Due</p>
            <p className={`text-3xl font-bold flex items-center justify-center ${customer.total_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
              <IndianRupee size={24} /> {customer.total_due}
            </p>
          </div>
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500 font-medium mb-1 uppercase tracking-wider">Jars Held</p>
            <p className="text-3xl font-bold text-blue-600">{customer.jars_held}</p>
          </div>
        </div>

        <div className="p-6 bg-gray-50/50 space-y-4">
          {customer.address && (
            <div className="flex items-start gap-3 text-gray-600">
              <MapPin size={20} className="text-gray-400 mt-0.5 shrink-0" />
              <span>{customer.address}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar size={20} className="text-gray-400 shrink-0" />
            <span className="capitalize">{customer.payment_cycle} Payment Cycle</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <IndianRupee size={20} className="text-gray-400 shrink-0" />
            <span>Credit Limit: ₹{customer.credit_limit}</span>
          </div>
          {customer.notes && (
            <div className="flex items-start gap-3 text-gray-600">
              <FileText size={20} className="text-gray-400 mt-0.5 shrink-0" />
              <span className="italic">{customer.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800">Transaction History</h3>
        
        {transactions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
            <Clock size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No transactions yet.</p>
            <p className="text-sm text-gray-400 mt-1">Deliveries, returns, and payments will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className={`flex items-center justify-between p-4 rounded-xl border ${getTransactionColor(tx.type)}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 capitalize">{tx.type}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(tx.timestamp).toLocaleString('en-IN', { 
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </p>
                    {tx.note && <p className="text-xs text-gray-600 mt-1 italic">{tx.note}</p>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {tx.type === 'payment' ? (
                    <p className="font-bold text-green-600 flex items-center justify-end"><IndianRupee size={14} /> {tx.amount}</p>
                  ) : tx.type === 'delivery' ? (
                    <>
                      <p className="font-bold text-orange-600">{tx.jar_count} Jar{tx.jar_count > 1 ? 's' : ''}</p>
                      <p className="text-xs text-red-500 font-medium flex items-center justify-end mt-0.5">+<IndianRupee size={10} />{tx.amount}</p>
                    </>
                  ) : tx.type === 'return' ? (
                    <p className="font-bold text-green-600">{tx.jar_count} Jar{tx.jar_count > 1 ? 's' : ''}</p>
                  ) : (
                    <p className="font-bold text-red-600 capitalize">{tx.type}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
