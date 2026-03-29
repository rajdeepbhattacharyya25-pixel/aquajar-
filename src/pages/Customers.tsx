import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, IndianRupee, CreditCard, MapPin, Calendar, FileText, ChevronDown, ChevronUp, Pencil, Trash2, X, Check, User } from 'lucide-react';
import { Customer } from '../domain/models';
import { toast } from 'sonner';

export default function Customers() {
  const { customers, loadInitialData, addCustomer, updateCustomer, deleteCustomer, recordPayment } = useAppStore();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; customerId: string; name: string; due: number }>({ isOpen: false, customerId: '', name: '', due: 0 });
  const [search, setSearch] = useState('');
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const cardTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const filteredCustomers = customers.filter(c => {
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return true;
    return (
      (c.name && c.name.toLowerCase().includes(searchLower)) || 
      (c.phone && c.phone.toLowerCase().includes(searchLower)) ||
      (c.address && c.address.toLowerCase().includes(searchLower)) ||
      (c.notes && c.notes.toLowerCase().includes(searchLower))
    );
  });

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await addCustomer({
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        payment_cycle: formData.get('payment_cycle') as any,
        credit_limit: Number(formData.get('credit_limit')),
        notes: formData.get('notes') as string,
      });
      setIsAdding(false);
      toast.success('Customer added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add customer');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCustomer) return;
    const formData = new FormData(e.currentTarget);
    try {
      await updateCustomer(editingCustomer.id, {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        payment_cycle: formData.get('payment_cycle') as any,
        credit_limit: Number(formData.get('credit_limit')),
        notes: formData.get('notes') as string,
      });
      setEditingCustomer(null);
      toast.success('Customer updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update customer');
    }
  };

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    if (amount > 0) {
      try {
        await recordPayment(paymentModal.customerId, amount);
        setPaymentModal({ isOpen: false, customerId: '', name: '', due: 0 });
        if (navigator.vibrate) navigator.vibrate(200);
        toast.success(`Payment of ₹${amount} recorded for ${paymentModal.name}`);
      } catch (error: any) {
        toast.error(error.message || 'Failed to record payment');
      }
    }
  };

  const toggleExpand = (id: string) => {
    if (selectedCustomers.length > 0) return; // Disable expand in selection mode
    setExpandedCustomerId(prev => prev === id ? null : id);
  };

  const handleCardTouchStart = (id: string) => {
    if (selectedCustomers.length > 0) return; // Already in selection mode
    cardTimerRef.current = setTimeout(() => {
      setSelectedCustomers([id]);
      setExpandedCustomerId(null); // Collapse if expanded
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleCardTouchEnd = () => {
    if (cardTimerRef.current) {
      clearTimeout(cardTimerRef.current);
      cardTimerRef.current = null;
    }
  };

  const handleCardClick = (id: string) => {
    if (selectedCustomers.length > 0) {
      setSelectedCustomers(prev => 
        prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
      );
    } else {
      toggleExpand(id);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCustomers.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedCustomers.length} customer(s)? This will also return their jars and delete their transaction history.`)) {
      try {
        for (const id of selectedCustomers) {
          await deleteCustomer(id);
        }
        toast.success(`${selectedCustomers.length} customer(s) deleted`);
        setSelectedCustomers([]);
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete customers');
      }
    }
  };

  if (isAdding || editingCustomer) {
    const isEditMode = !!editingCustomer;
    const initialData = editingCustomer || {} as Partial<Customer>;

    return (
      <div className="space-y-4 max-w-5xl mx-auto px-6 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Customer' : 'New Customer'}</h2>
          <button onClick={() => { setIsAdding(false); setEditingCustomer(null); }} className="text-gray-500">Cancel</button>
        </div>
        <form onSubmit={isEditMode ? handleEditSubmit : handleAdd} className="space-y-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input required name="name" type="text" defaultValue={initialData.name} className="w-full border border-gray-300 rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input required name="phone" type="tel" inputMode="tel" defaultValue={initialData.phone} className="w-full border border-gray-300 rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea name="address" defaultValue={initialData.address} className="w-full border border-gray-300 rounded-lg p-2" rows={2}></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Cycle</label>
              <select name="payment_cycle" defaultValue={initialData.payment_cycle || 'monthly'} className="w-full border border-gray-300 rounded-lg p-2 bg-white">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (₹)</label>
              <input name="credit_limit" type="number" inputMode="numeric" defaultValue={initialData.credit_limit || 1000} className="w-full border border-gray-300 rounded-lg p-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input name="notes" type="text" defaultValue={initialData.notes} className="w-full border border-gray-300 rounded-lg p-2" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg mt-4">
            {isEditMode ? 'Save Changes' : 'Save Customer'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto px-4 pt-4 pb-24">
      <div className="flex justify-between items-center h-10">
        {selectedCustomers.length > 0 ? (
          <>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedCustomers([])} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
              <h2 className="text-xl font-bold text-gray-800">{selectedCustomers.length} selected</h2>
            </div>
            <button 
              onClick={handleDeleteSelected}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-sm hover:bg-red-700 transition-colors"
            >
              <Trash2 size={18} className="mr-1" /> Delete
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-blue-100 text-blue-700 p-2 rounded-full hover:bg-blue-200 transition-colors"
            >
              <Plus size={20} />
            </button>
          </>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search customers..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-3 mt-4">
        {filteredCustomers.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No customers found.</p>
        ) : (
          filteredCustomers.map(customer => {
            const isExpanded = expandedCustomerId === customer.id;
            
            return (
              <div 
                key={customer.id} 
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200 ${
                  selectedCustomers.includes(customer.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-100'
                }`}
              >
                {/* Header / Summary (Clickable) */}
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 active:bg-gray-100 relative"
                  onClick={() => handleCardClick(customer.id)}
                  onTouchStart={() => handleCardTouchStart(customer.id)}
                  onTouchEnd={handleCardTouchEnd}
                  onTouchMove={handleCardTouchEnd}
                  onMouseDown={() => handleCardTouchStart(customer.id)}
                  onMouseUp={handleCardTouchEnd}
                  onMouseLeave={handleCardTouchEnd}
                >
                  {selectedCustomers.length > 0 && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedCustomers.includes(customer.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'
                      }`}>
                        {selectedCustomers.includes(customer.id) && <Check size={12} className="text-white" />}
                      </div>
                    </div>
                  )}
                  
                  <div className={`flex-1 ${selectedCustomers.length > 0 ? 'pl-8' : ''}`}>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 text-lg truncate">{customer.name}</h3>
                      {selectedCustomers.length === 0 && (
                        isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Phone size={14} className="mr-1.5" /> {customer.phone}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className={`font-bold flex items-center justify-end text-lg ${customer.total_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      <IndianRupee size={16} /> {customer.total_due}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">{customer.jars_held} jars held</p>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50">
                    <div className="grid grid-cols-1 gap-3 mb-4 text-sm text-gray-600">
                      {customer.address && (
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                          <span>{customer.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400 shrink-0" />
                        <span className="capitalize">{customer.payment_cycle} Payment Cycle</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IndianRupee size={16} className="text-gray-400 shrink-0" />
                        <span>Credit Limit: ₹{customer.credit_limit}</span>
                      </div>
                      {customer.notes && (
                        <div className="flex items-start gap-2">
                          <FileText size={16} className="text-gray-400 mt-0.5 shrink-0" />
                          <span className="italic">{customer.notes}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customers/${customer.id}`);
                        }}
                        className="flex-1 text-sm font-medium text-gray-700 flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-lg transition-colors"
                      >
                        <User size={16} className="mr-2" /> Profile
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCustomer(customer);
                        }}
                        className="flex-1 text-sm font-medium text-gray-700 flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-lg transition-colors"
                      >
                        <Pencil size={16} className="mr-2" /> Edit
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentModal({ isOpen: true, customerId: customer.id, name: customer.name, due: customer.total_due });
                        }}
                        className="flex-[2] text-sm font-medium text-blue-600 flex items-center justify-center bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-lg transition-colors"
                      >
                        <CreditCard size={16} className="mr-2" /> Receive Payment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Payment Modal */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Receive Payment</h3>
            <p className="text-sm text-gray-500 mb-4">From {paymentModal.name}</p>
            
            <div className="bg-red-50 text-red-800 p-3 rounded-lg mb-4 flex justify-between items-center">
              <span className="text-sm font-medium">Current Due:</span>
              <span className="font-bold flex items-center"><IndianRupee size={14} /> {paymentModal.due}</span>
            </div>

            <form onSubmit={handlePayment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received (₹)</label>
                <input 
                  required 
                  name="amount" 
                  type="number" 
                  min="1"
                  defaultValue={paymentModal.due > 0 ? paymentModal.due : ''}
                  className="w-full border border-gray-300 rounded-lg p-3 text-lg font-bold" 
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setPaymentModal({ isOpen: false, customerId: '', name: '', due: 0 })}
                  className="flex-1 py-3 rounded-lg font-medium text-gray-600 bg-gray-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 rounded-lg font-medium text-white bg-green-600"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
