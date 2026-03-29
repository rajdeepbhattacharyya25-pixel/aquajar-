import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';

export default function Reports() {
  const { customers, loadInitialData } = useAppStore();

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Calculate top customers based on total_due or jars_held
  // For this prototype, we'll sort by jars_held as a proxy for activity
  const topCustomers = [...customers]
    .sort((a, b) => b.jars_held - a.jars_held)
    .slice(0, 4);

  // Mock data for the chart
  const chartData = [
    { day: 'MON', value: '12k', height: '40%' },
    { day: 'TUE', value: '18k', height: '65%' },
    { day: 'WED', value: '24k', height: '85%', active: true },
    { day: 'THU', value: '15k', height: '55%' },
    { day: 'FRI', value: '20k', height: '70%' },
    { day: 'SAT', value: '13k', height: '45%' },
    { day: 'SUN', value: '9k', height: '30%' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8 space-y-10">
      {/* Hero Header & Filter */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <p className="text-[0.75rem] font-medium font-inter tracking-wider text-primary uppercase">Analytics Overview</p>
          <h2 className="text-[2.75rem] font-bold font-headline tracking-tight leading-tight">Reports</h2>
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-2xl w-fit">
          <button className="px-6 py-2 rounded-xl text-sm font-medium transition-all hover:bg-surface-container-high">Day</button>
          <button className="px-6 py-2 rounded-xl text-sm font-medium bg-surface-container-lowest shadow-sm text-primary">Week</button>
          <button className="px-6 py-2 rounded-xl text-sm font-medium transition-all hover:bg-surface-container-high">Month</button>
        </div>
      </section>

      {/* Summary Cards (Asymmetric Bento) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/15 flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div className="bg-primary-fixed p-3 rounded-2xl">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">+12.4% from last week</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-medium tracking-wide mb-1">Total Revenue</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold font-headline">₹84,250</span>
              <span className="text-on-surface-variant/60 text-lg font-medium">INR</span>
            </div>
          </div>
        </div>
        <div className="bg-primary-container bg-gradient-to-br from-primary to-primary-container p-8 rounded-3xl text-on-primary-container flex flex-col justify-between min-h-[220px]">
          <div className="bg-white/20 w-fit p-3 rounded-2xl backdrop-blur-md">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
          </div>
          <div>
            <p className="text-white/80 text-sm font-medium tracking-wide mb-1">Jar Circulation</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold font-headline text-white">1,284</span>
              <span className="text-white/60 text-lg font-medium">Units</span>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Trend Chart */}
      <section className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/15 space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold font-headline">Revenue Trend</h3>
          <button className="flex items-center gap-2 text-primary font-semibold text-sm hover:underline">
            <span className="material-symbols-outlined text-sm">download</span>
            Export to Excel
          </button>
        </div>
        <div className="h-64 flex items-end justify-between gap-4 px-2">
          {chartData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center group gap-3">
              <div 
                className={`w-full rounded-t-xl relative transition-colors ${data.active ? 'bg-primary' : 'bg-surface-container-high group-hover:bg-primary-container/20'}`}
                style={{ height: data.height }}
              >
                <div className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] px-2 py-1 rounded transition-opacity ${data.active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  ₹{data.value}
                </div>
              </div>
              <span className={`text-[10px] font-bold ${data.active ? 'text-primary' : 'text-on-surface-variant'}`}>
                {data.day}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Top Customers */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold font-headline">Top Customers</h3>
          <button className="text-primary text-sm font-semibold">View All</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topCustomers.length > 0 ? topCustomers.map((customer, index) => {
            const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const colors = [
              'bg-secondary-container text-on-secondary-container',
              'bg-tertiary-fixed text-on-tertiary-fixed',
              'bg-error-container text-on-error-container',
              'bg-primary-fixed text-on-primary-fixed'
            ];
            const colorClass = colors[index % colors.length];
            
            return (
              <div key={customer.id} className="flex items-center justify-between p-5 bg-surface-container-low rounded-2xl hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${colorClass}`}>
                    {initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface leading-none">{customer.name}</h4>
                    <p className="text-xs text-on-surface-variant mt-1">{customer.jars_held} Jars this week</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">₹{customer.total_due}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{customer.payment_cycle}</p>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-2 text-center py-8 text-on-surface-variant">
              No customers found.
            </div>
          )}
        </div>
      </section>

      {/* Actions */}
      <section className="flex flex-col sm:flex-row gap-4 py-8">
        <button className="flex-1 h-[3.5rem] bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,88,188,0.15)] active:scale-95 transition-all">
          <span className="material-symbols-outlined">picture_as_pdf</span>
          Download PDF Report
        </button>
        <button className="flex-1 h-[3.5rem] bg-surface-container-highest text-on-surface rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
          <span className="material-symbols-outlined">share</span>
          Share Analytics
        </button>
      </section>
    </div>
  );
}
