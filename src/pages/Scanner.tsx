import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { QrCode, Search, CheckCircle, ArrowRight, Camera, ChevronDown, ChevronUp, User, Phone, MapPin } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import * as services from '../domain/services';
import { Jar } from '../domain/models';
import { toast } from 'sonner';
import { isAtLimit } from '../lib/utils';

export default function Scanner() {
  const { customers, loadInitialData, processDelivery, processReturn } = useAppStore();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [jar, setJar] = useState<Jar | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Initialize Scanner only when requested (saves battery/CPU on low-end devices)
  useEffect(() => {
    if (!isScanning || scanResult) return;

    // OPTIMIZATION: Lower FPS (5 instead of 10) prevents thermal throttling on cheap Android phones
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 5, 
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [0] // 0 = QR_CODE only, speeds up processing
      },
      false
    );

    scanner.render(
      (decodedText) => {
        if (navigator.vibrate) navigator.vibrate(100);
        setScanResult(decodedText);
        setIsScanning(false);
        scanner.clear().catch(console.error);
      },
      (error) => {
        // Ignore continuous frame errors
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [isScanning, scanResult]);

  // Fetch Jar details when scanResult changes
  useEffect(() => {
    if (scanResult) {
      services.getJarByQR(scanResult).then(foundJar => {
        if (foundJar) {
          setJar(foundJar);
          setShowCustomerDetails(false); // Reset on new scan
        } else {
          setJar(null);
          toast.error('Jar not found in system.');
        }
      });
    }
  }, [scanResult]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      setScanResult(manualCode.trim().toUpperCase());
      setIsScanning(false);
    }
  };

  const handleAction = async (action: 'deliver' | 'return') => {
    if (!jar) return;
    setIsProcessing(true);
    try {
      if (action === 'deliver') {
        if (!selectedCustomer) {
          toast.error('Please select a customer.');
          setIsProcessing(false);
          return;
        }

        const customer = customers.find(c => c.id === selectedCustomer);
        if (customer && isAtLimit(customer)) {
          const confirmDelivery = window.confirm(
            `WARNING: ${customer.name} has reached their payment limit (Due: ₹${customer.total_due}). \n\nAre you sure you want to deliver another jar without payment?`
          );
          if (!confirmDelivery) {
            setIsProcessing(false);
            return;
          }
        }

        await processDelivery(jar.id, selectedCustomer);
        if (navigator.vibrate) navigator.vibrate(200);
        toast.success('Jar delivered successfully!');
      } else if (action === 'return') {
        await processReturn(jar.id);
        if (navigator.vibrate) navigator.vibrate(200);
        toast.success('Jar returned successfully!');
      }
      // Reset after 0.5 seconds
      setTimeout(() => {
        setScanResult(null);
        setJar(null);
        setSelectedCustomer('');
        setManualCode('');
        setShowCustomerDetails(false);
        setIsProcessing(false);
      }, 500);
    } catch (error: any) {
      toast.error(error.message || 'Failed to process action');
      setIsProcessing(false);
    }
  };

  const currentCustomer = jar?.current_customer_id ? customers.find(c => c.id === jar.current_customer_id) : null;

  return (
    <div className="space-y-4 max-w-5xl mx-auto px-4 pt-4 pb-24">
      <h2 className="text-2xl font-bold text-gray-800">Scan Jar</h2>

      {!scanResult ? (
        <div className="space-y-6">
          
          {isScanning ? (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div id="reader" className="w-full overflow-hidden rounded-lg"></div>
              <button 
                onClick={() => setIsScanning(false)}
                className="w-full mt-4 bg-red-100 text-red-700 font-medium py-2 rounded-lg"
              >
                Stop Camera
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsScanning(true)}
              className="w-full bg-blue-50 border-2 border-dashed border-blue-200 text-blue-700 p-8 rounded-xl flex flex-col items-center justify-center gap-3"
            >
              <div className="bg-blue-100 p-4 rounded-full">
                <Camera size={32} />
              </div>
              <span className="font-semibold">Tap to Start Camera</span>
              <span className="text-xs text-blue-500 text-center">Saves battery by keeping camera off until needed</span>
            </button>
          )}

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Enter QR Code manually" 
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase text-lg"
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 rounded-xl shadow-sm">
              <Search size={20} />
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-3">
              <QrCode size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 font-mono truncate">{scanResult}</h3>
            {jar && (
              <p className={`text-sm font-medium mt-1 truncate ${jar.status === 'available' ? 'text-green-600' : 'text-orange-600'}`}>
                Status: {jar.status.replace('_', ' ').toUpperCase()}
              </p>
            )}
          </div>

          {jar && jar.status === 'available' && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700">Select Customer for Delivery</label>
              <select 
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className={`w-full border rounded-lg p-3 bg-white text-base ${
                  selectedCustomer && customers.find(c => c.id === selectedCustomer) && isAtLimit(customers.find(c => c.id === selectedCustomer)!)
                    ? 'border-red-500 ring-2 ring-red-100'
                    : 'border-gray-300'
                }`}
              >
                <option value="">-- Choose Customer --</option>
                {customers.map(c => {
                  const atLimit = isAtLimit(c);
                  return (
                    <option key={c.id} value={c.id} className={atLimit ? 'text-red-600 font-bold' : ''}>
                      {c.name} ({c.phone}) {atLimit ? ' - LIMIT REACHED' : ''}
                    </option>
                  );
                })}
              </select>
              
              {selectedCustomer && customers.find(c => c.id === selectedCustomer) && isAtLimit(customers.find(c => c.id === selectedCustomer)!) && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2 animate-pulse">
                  <div className="bg-red-100 text-red-600 p-1 rounded-full">
                    <ChevronUp size={16} className="rotate-180" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Payment Limit Reached</p>
                    <p className="text-sm text-red-600">This customer has ₹{customers.find(c => c.id === selectedCustomer)?.total_due} pending. Collect payment before delivery.</p>
                  </div>
                </div>
              )}

              <button 
                onClick={() => handleAction('deliver')}
                disabled={!selectedCustomer || isProcessing}
                className="w-full bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg flex items-center justify-center"
              >
                {isProcessing ? 'Processing...' : 'Confirm Delivery'} <ArrowRight size={18} className="ml-2" />
              </button>
            </div>
          )}

          {jar && jar.status === 'with_customer' && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              {currentCustomer ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <button 
                    onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <User size={18} className="text-gray-500" />
                      <span className="font-medium text-gray-800">{currentCustomer.name}</span>
                    </div>
                    {showCustomerDetails ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                  </button>
                  
                  {showCustomerDetails && (
                    <div className="p-4 pt-0 border-t border-gray-200 bg-white space-y-2 text-sm">
                      <div className="flex items-start gap-2 mt-3">
                        <Phone size={16} className="text-gray-400 mt-0.5" />
                        <span className="text-gray-600">{currentCustomer.phone || 'No phone number'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-gray-400 mt-0.5" />
                        <span className="text-gray-600">{currentCustomer.address || 'No address provided'}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center mb-4">
                  This jar is currently with a customer.
                </p>
              )}
              <button 
                onClick={() => handleAction('return')}
                disabled={isProcessing}
                className="w-full bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 rounded-lg flex items-center justify-center"
              >
                <CheckCircle size={18} className="mr-2" /> {isProcessing ? 'Processing...' : 'Mark as Returned'}
              </button>
            </div>
          )}

          <button 
            onClick={() => { setScanResult(null); setJar(null); setSelectedCustomer(''); setShowCustomerDetails(false); }}
            className="w-full bg-gray-100 text-gray-700 font-medium py-3 rounded-lg mt-4"
          >
            Scan Another
          </button>
        </div>
      )}
    </div>
  );
}
