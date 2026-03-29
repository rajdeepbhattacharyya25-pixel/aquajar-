import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { stats, customers, loadInitialData, isLoading, exportData, importData } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  if (isLoading && !stats) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  // Calculate overdue customers
  const overdueCustomers = customers
    .filter(c => c.total_due > 0)
    .sort((a, b) => b.total_due - a.total_due)
    .slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 space-y-8">
      {/* Summary Bento Grid */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Large Highlight Card: Jars Out */}
          <div className="col-span-2 row-span-2 bg-surface-container-lowest p-3 md:p-6 rounded-[1.25rem] shadow-[0_8px_24px_rgba(0,88,188,0.04)] flex flex-col justify-between min-h-[120px] md:min-h-[220px]">
            <div>
              <span className="material-symbols-outlined text-primary mb-1 md:mb-2 text-sm">water_drop</span>
              <h2 className="text-on-surface-variant text-[0.65rem] font-bold font-label tracking-[0.05em] uppercase">Total Jars Out</h2>
            </div>
            <div>
              <p className="text-[2rem] md:text-[3.5rem] font-extrabold font-headline leading-none text-primary">{stats?.jarsWithCustomers || 0}</p>
              <p className="text-[0.65rem] md:text-[0.875rem] text-primary/70 font-medium mt-1">Across {customers.filter(c => c.jars_held > 0).length} Active Customers</p>
            </div>
          </div>
          
          {/* Secondary Card: Total Dues */}
          <div className="col-span-2 bg-error-container p-3 md:p-6 rounded-[1.25rem] flex flex-col justify-between">
            <h2 className="text-on-error-container text-[0.65rem] font-bold font-label tracking-[0.05em] uppercase">Total Outstanding Dues</h2>
            <p className="text-[1.25rem] md:text-[2rem] font-extrabold font-headline text-error mt-1 md:mt-2">₹{stats?.totalOutstandingDue || 0}</p>
          </div>
          
          {/* Small Card: Available */}
          <div className="bg-surface-container-low p-3 rounded-[1.25rem] flex flex-col justify-between">
            <h2 className="text-on-surface-variant text-[0.65rem] font-bold font-label tracking-[0.05em] uppercase leading-tight">Jars Ready</h2>
            <p className="text-[1rem] md:text-[1.75rem] font-bold font-headline text-on-surface">{stats?.jarsAvailable || 0}</p>
          </div>
          
          {/* Small Card: Today's Collection */}
          <div className="bg-primary/5 p-3 rounded-[1.25rem] flex flex-col justify-between">
            <h2 className="text-primary text-[0.65rem] font-bold font-label tracking-[0.05em] uppercase leading-tight">Today</h2>
            <p className="text-[1rem] md:text-[1.75rem] font-bold font-headline text-primary">₹{stats?.todaysCollection || 0}</p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h3 className="text-on-surface-variant text-[0.75rem] font-bold font-label tracking-[0.1em] uppercase mb-4 px-1">Quick Management</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => navigate('/scan')} className="aqua-gradient text-white h-20 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
            <span className="text-[0.75rem] font-semibold">Scan Jar</span>
          </button>
          <button onClick={() => navigate('/customers')} className="bg-surface-container-highest text-on-surface h-20 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-xl">person_add</span>
            <span className="text-[0.75rem] font-semibold">Add Customer</span>
          </button>
          <button onClick={() => navigate('/customers')} className="bg-surface-container-highest text-on-surface h-20 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-xl">payments</span>
            <span className="text-[0.75rem] font-semibold">Collect Payment</span>
          </button>
          <button onClick={() => navigate('/jars')} className="bg-surface-container-highest text-on-surface h-20 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-xl">inventory_2</span>
            <span className="text-[0.75rem] font-semibold">Add Jar</span>
          </button>
          <button onClick={() => navigate('/transactions')} className="bg-surface-container-highest text-on-surface h-20 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-xl">history</span>
            <span className="text-[0.75rem] font-semibold">Transactions</span>
          </button>
          <button 
            onClick={async () => {
              const data = await exportData();
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `aquajar_backup_${new Date().toISOString()}.json`;
              a.click();
            }}
            className="bg-surface-container-highest text-on-surface h-20 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-xl">download</span>
            <span className="text-[0.75rem] font-semibold">Export</span>
          </button>
          <button 
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = async (e) => {
                    const data = e.target?.result as string;
                    await importData(data);
                    alert('Data imported successfully');
                  };
                  reader.readAsText(file);
                }
              };
              input.click();
            }}
            className="bg-surface-container-highest text-on-surface h-20 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-xl">upload</span>
            <span className="text-[0.75rem] font-semibold">Import</span>
          </button>
        </div>
      </section>

      {/* Overdue Section */}
      <section className="pb-10">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-on-surface-variant text-[0.75rem] font-bold font-label tracking-[0.1em] uppercase">Critical Overdue</h3>
          <button onClick={() => navigate('/customers')} className="text-primary text-[0.75rem] font-bold font-label uppercase">View All</button>
        </div>
        <div className="space-y-3">
          {overdueCustomers.length === 0 ? (
            <p className="text-sm text-gray-500 px-1">No overdue customers.</p>
          ) : (
            overdueCustomers.map((customer, index) => (
              <div key={customer.id} className="bg-surface-container-lowest p-4 rounded-2xl flex items-center justify-between group hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${index === 0 ? 'bg-error-container/30 text-error' : 'bg-primary-fixed/30 text-primary'}`}>
                    <span className="material-symbols-outlined">{index === 0 ? 'priority_high' : 'person'}</span>
                  </div>
                  <div>
                    <h4 className="text-on-surface font-semibold font-headline">{customer.name}</h4>
                    <p className="text-[0.75rem] text-on-surface-variant">{customer.jars_held} Jars • {customer.payment_cycle} jars</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${index === 0 ? 'text-error' : 'text-on-surface'}`}>₹{customer.total_due}</p>
                  <span className={`text-[0.65rem] font-bold uppercase tracking-tighter ${index === 0 ? 'text-error' : 'text-primary'}`}>
                    {index === 0 ? 'High Debt' : 'Pending'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
