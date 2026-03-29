import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { toast } from 'sonner';

export default function DataManagement() {
  const { exportData, importData, saveQrCode } = useAppStore();
  const [isImporting, setIsImporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // ... (handleExport, handleImport)

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AquaJar_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup exported successfully');
    } catch (error) {
      toast.error('Failed to export backup');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('Are you sure you want to restore from this backup? This will overwrite ALL current data.')) {
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result as string;
        // Basic validation
        const parsed = JSON.parse(data);
        if (!parsed.customers || !parsed.jars || !parsed.transactions) {
          throw new Error('Invalid backup file format');
        }
        await importData(data);
        toast.success('Data restored successfully');
      } catch (error) {
        toast.error('Failed to restore: ' + (error instanceof Error ? error.message : 'Invalid file'));
      } finally {
        setIsImporting(false);
        event.target.value = ''; // Reset input
      }
    };
    reader.readAsText(file);
  };

  const handleQrUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result as string;
        await saveQrCode(data);
        toast.success('QR code uploaded successfully');
      } catch (error) {
        toast.error('Failed to upload QR code');
      } finally {
        setIsUploading(false);
        event.target.value = ''; // Reset input
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-bold">Data Management</h2>
      
      <div className="space-y-4">
        <div className="bg-surface-container-low p-4 rounded-xl">
          <h3 className="font-semibold mb-2">Backup Data</h3>
          <p className="text-sm text-on-surface-variant mb-4">Export all your data to a JSON file for safekeeping.</p>
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold"
          >
            Export Backup
          </button>
        </div>

        <div className="bg-surface-container-low p-4 rounded-xl">
          <h3 className="font-semibold mb-2">Restore Data</h3>
          <p className="text-sm text-on-surface-variant mb-4">Import a previously exported JSON backup file. <span className="text-error font-bold">Warning: This overwrites all current data.</span></p>
          <input 
            type="file" 
            accept=".json" 
            onChange={handleImport}
            className="hidden"
            id="import-file"
            disabled={isImporting}
          />
          <label 
            htmlFor="import-file"
            className={`px-4 py-2 bg-error text-white rounded-lg text-sm font-bold cursor-pointer ${isImporting ? 'opacity-50' : ''}`}
          >
            {isImporting ? 'Restoring...' : 'Select Backup File'}
          </label>
        </div>
        
        <div className="bg-surface-container-low p-4 rounded-xl">
          <h3 className="font-semibold mb-2">Payment QR Code</h3>
          <p className="text-sm text-on-surface-variant mb-4">Upload your GPay/PhonePe QR code for quick payments.</p>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleQrUpload}
            className="hidden"
            id="qr-upload"
            disabled={isUploading}
          />
          <label 
            htmlFor="qr-upload"
            className={`px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold cursor-pointer ${isUploading ? 'opacity-50' : ''}`}
          >
            {isUploading ? 'Uploading...' : 'Upload QR Code'}
          </label>
        </div>
      </div>
    </div>
  );
}
