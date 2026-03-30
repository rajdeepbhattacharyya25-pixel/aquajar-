import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'sonner';

export default function Reports() {
  const { customers, loadInitialData } = useAppStore();
  const [timeRange, setTimeRange] = useState<'Day' | 'Week' | 'Month'>('Week');

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Calculate top customers based on total_due or jars_held
  // For this prototype, we'll sort by jars_held as a proxy for activity
  const topCustomers = [...customers]
    .sort((a, b) => b.jars_held - a.jars_held)
    .slice(0, 4);

  // Dynamic chart data based on timeRange
  const getChartData = () => {
    // In production, this would fetch data from Firestore based on timeRange
    return [];
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Water Jar Delivery - Analytics Report', 14, 22);
      
      // Date
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      // Summary
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Summary', 14, 45);
      
      const totalRevenue = customers.reduce((acc, c) => acc + (c.total_due || 0), 0);
      const totalJars = customers.reduce((acc, c) => acc + (c.jars_held || 0), 0);
      
      (doc as any).autoTable({
        startY: 50,
        head: [['Metric', 'Value']],
        body: [
          ['Total Outstanding Revenue', `INR ${totalRevenue}`],
          ['Total Jars in Circulation', `${totalJars} Units`],
          ['Total Customers', `${customers.length}`],
        ],
      });
      
      // Top Customers
      doc.text('Top Customers', 14, (doc as any).lastAutoTable.finalY + 15);
      
      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Customer Name', 'Jars Held', 'Total Due', 'Cycle']],
        body: topCustomers.map(c => [
          c.name,
          c.jars_held,
          `INR ${c.total_due}`,
          `${c.payment_cycle} jars`
        ]),
      });
      
      doc.save(`WaterJar_Report_${timeRange}.pdf`);
      toast.success('PDF Report generated successfully!');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error('Failed to generate PDF report.');
    }
  };

  const handleShare = async () => {
    const totalRevenue = customers.reduce((acc, c) => acc + (c.total_due || 0), 0);
    const shareData = {
      title: 'Water Jar Delivery Report',
      text: `Water Jar Delivery Analytics Summary:\nTotal Revenue: ₹${totalRevenue}\nTotal Customers: ${customers.length}\nTop Customer: ${topCustomers[0]?.name || 'N/A'}`,
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast.success('Report summary copied to clipboard!');
      }
    } catch (error) {
      console.error('Share Error:', error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pt-2 space-y-4">
      {/* Hero Header & Filter */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div className="space-y-0">
          <p className="text-[0.6rem] font-medium font-inter tracking-wider text-primary uppercase">Analytics Overview</p>
          <h2 className="text-[1.75rem] font-bold font-headline tracking-tight leading-tight">Reports</h2>
        </div>
        <div className="flex bg-surface-container-low p-0.5 rounded-lg w-fit">
          {(['Day', 'Week', 'Month'] as const).map((range) => (
            <button 
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all ${
                timeRange === range 
                  ? 'bg-surface-container-lowest shadow-sm text-primary' 
                  : 'hover:bg-surface-container-high'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </section>

      {/* Summary Cards (Asymmetric Bento) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="md:col-span-2 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/15 flex flex-row items-center justify-between min-h-[80px]">
          <div className="flex items-center gap-3">
            <div className="bg-primary-fixed p-2 rounded-lg">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            </div>
            <div>
              <p className="text-on-surface-variant text-[10px] font-medium tracking-wide mb-0">Total Revenue</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold font-headline">₹0</span>
                <span className="text-on-surface-variant/60 text-[10px] font-medium">INR</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-primary-container bg-gradient-to-br from-primary to-primary-container p-3 rounded-xl text-on-primary-container flex flex-row items-center justify-between min-h-[80px]">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
              <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
            </div>
            <div>
              <p className="text-white/80 text-[10px] font-medium tracking-wide mb-0">Jar Circulation</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold font-headline text-white">0</span>
                <span className="text-white/60 text-[10px] font-medium">Units</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Trend Chart */}
      <section className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/15 space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold font-headline">Revenue Trend</h3>
          <button className="flex items-center gap-0.5 text-primary font-semibold text-[10px] hover:underline">
            <span className="material-symbols-outlined text-[10px]">download</span>
            Export
          </button>
        </div>
        <div className="h-28 flex items-center justify-center text-on-surface-variant text-xs">
          No data available for the selected range.
        </div>
      </section>

      {/* Top Customers */}
      <section className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold font-headline">Top Customers</h3>
          <button className="text-primary text-[10px] font-semibold">View All</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
              <div key={customer.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${colorClass}`}>
                    {initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface text-base leading-tight">{customer.name}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">{customer.jars_held} Jars this week</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary text-base">₹{customer.total_due}</p>
                  <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">{customer.payment_cycle} jars</p>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-2 text-center py-4 text-on-surface-variant text-sm">
              No customers found.
            </div>
          )}
        </div>
      </section>

      {/* Actions */}
      <section className="flex flex-col sm:flex-row gap-2 py-2">
        <button 
          onClick={handleExportPDF}
          className="flex-1 h-12 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg font-bold flex items-center justify-center gap-2 text-sm shadow-[0_2px_6px_rgba(0,88,188,0.15)] active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
          PDF Report
        </button>
        <button 
          onClick={handleShare}
          className="flex-1 h-12 bg-surface-container-highest text-on-surface rounded-lg font-bold flex items-center justify-center gap-2 text-sm active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-sm">share</span>
          Share
        </button>
      </section>
    </div>
  );
}
