import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { Plus, Package, CheckCircle, XCircle, Copy, Check, Download, X, Trash2, Search } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

export default function Jars() {
  const { jars, customers, loadInitialData, addJar, deleteJar, updateJarStatus } = useAppStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedJars, setSelectedJars] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cardTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const filteredJars = jars.filter(jar => {
    const searchLower = search.toLowerCase();
    const customerName = customers.find(c => c.id === jar.current_customer_id)?.name?.toLowerCase() || '';
    return (
      (jar.qr_code && jar.qr_code.toLowerCase().includes(searchLower)) ||
      (jar.status && jar.status.toLowerCase().includes(searchLower)) ||
      customerName.includes(searchLower)
    );
  });

  const handleAddJar = async () => {
    try {
      await addJar();
      toast.success('New jar added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add jar');
    }
  };

  const handleStatusChange = async (jarId: string, newStatus: string) => {
    try {
      if (newStatus === 'lost' || newStatus === 'damaged') {
        if (window.confirm(`Are you sure you want to mark this jar as ${newStatus}?`)) {
          await updateJarStatus(jarId, newStatus as any);
          toast.success(`Jar marked as ${newStatus}`);
        }
      } else {
        await updateJarStatus(jarId, newStatus as any);
        toast.success(`Jar status updated to ${newStatus}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update jar status');
    }
  };

  const handleCopy = (text: string, id: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(err => console.error('Failed to copy!', err));
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      textArea.remove();
    }
    setCopiedId(id);
    toast.success('QR Code copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyTouchStart = (text: string, id: string) => {
    copyTimerRef.current = setTimeout(() => {
      handleCopy(text, id);
    }, 500); // 500ms for long press
  };

  const handleCopyTouchEnd = () => {
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
  };

  const handleCardTouchStart = (id: string) => {
    if (selectedJars.length > 0) return; // Already in selection mode
    cardTimerRef.current = setTimeout(() => {
      setSelectedJars([id]);
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
    if (selectedJars.length > 0) {
      setSelectedJars(prev => 
        prev.includes(id) ? prev.filter(jId => jId !== id) : [...prev, id]
      );
    }
  };

  const downloadSelected = async () => {
    if (selectedJars.length === 0) return;
    
    try {
      const zip = new JSZip();
      const folder = zip.folder("AquaJar-Labels");
      
      if (!folder) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 400;
      const padding = 40;
      const textHeight = 60;
      canvas.width = size + padding * 2;
      canvas.height = size + padding * 2 + textHeight;

      const selectedJarObjects = jars.filter(j => selectedJars.includes(j.id));

      for (const jar of selectedJarObjects) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const svg = document.getElementById(`qr-${jar.qr_code}`);
        if (!svg) continue;

        const svgData = new XMLSerializer().serializeToString(svg);
        
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, padding, padding, size, size);
            
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 32px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(jar.qr_code, canvas.width / 2, size + padding * 2 + 20);

            canvas.toBlob((blob) => {
              if (blob) {
                folder.file(`AquaJar-${jar.qr_code}.png`, blob);
              }
              resolve();
            }, 'image/png');
          };
          img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        });
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "AquaJar-Labels.zip");
      toast.success(`Downloaded ${selectedJars.length} labels`);
      setSelectedJars([]);
    } catch (error: any) {
      toast.error('Failed to download labels');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedJars.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedJars.length} jar(s)? If any are with customers, they will be returned.`)) {
      try {
        for (const id of selectedJars) {
          await deleteJar(id);
        }
        toast.success(`${selectedJars.length} jar(s) deleted`);
        setSelectedJars([]);
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete jars');
      }
    }
  };

  const handleDownload = (qrCode: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for a high-quality print
    const size = 400;
    const padding = 40;
    const textHeight = 60;
    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2 + textHeight;

    // Fill background with white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Get SVG element
    const svg = document.getElementById(`qr-${qrCode}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      // Draw QR code
      ctx.drawImage(img, padding, padding, size, size);
      
      // Draw text
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(qrCode, canvas.width / 2, size + padding * 2 + 20);

      // Trigger download
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `AquaJar-${qrCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto px-4 pt-4 pb-24">
      <div className="flex justify-between items-center h-10">
        {selectedJars.length > 0 ? (
          <>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedJars([])} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
              <h2 className="text-xl font-bold text-gray-800">{selectedJars.length} selected</h2>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleDeleteSelected}
                className="bg-red-600 text-white px-3 py-2 rounded-lg font-medium flex items-center shadow-sm hover:bg-red-700 transition-colors"
              >
                <Trash2 size={18} className="mr-1" /> Delete
              </button>
              <button 
                onClick={downloadSelected}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg font-medium flex items-center shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Download size={18} className="mr-1" /> Download
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-800">Inventory</h2>
            <button 
              onClick={handleAddJar}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} className="mr-1" /> Add Jar
            </button>
          </>
        )}
      </div>

      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search by QR code, status, or customer..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {filteredJars.length === 0 ? (
          <div className="col-span-2 text-center text-gray-500 py-8">No jars found.</div>
        ) : (
          filteredJars.map(jar => (
            <div 
              key={jar.id} 
              className={`relative bg-white p-4 rounded-xl shadow-sm border flex flex-col items-center transition-all ${
                selectedJars.includes(jar.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-100'
              }`}
              onClick={() => handleCardClick(jar.id)}
              onTouchStart={() => handleCardTouchStart(jar.id)}
              onTouchEnd={handleCardTouchEnd}
              onTouchMove={handleCardTouchEnd}
              onMouseDown={() => handleCardTouchStart(jar.id)}
              onMouseUp={handleCardTouchEnd}
              onMouseLeave={handleCardTouchEnd}
            >
              {selectedJars.length > 0 && (
                <div className="absolute top-2 left-2 z-10">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedJars.includes(jar.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'
                  }`}>
                    {selectedJars.includes(jar.id) && <Check size={12} className="text-white" />}
                  </div>
                </div>
              )}
              
              <button 
                onClick={(e) => { e.stopPropagation(); handleDownload(jar.qr_code); }}
                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors z-10"
                title="Download Label"
              >
                <Download size={16} />
              </button>
              
              <div className="bg-gray-50 p-2 rounded-lg mb-3 mt-2">
                <QRCodeSVG id={`qr-${jar.qr_code}`} value={jar.qr_code} size={80} />
              </div>
              
              <div 
                className="relative cursor-pointer select-none flex items-center justify-center gap-1.5 mb-2 px-2 py-1 rounded-md hover:bg-gray-50 active:bg-gray-100 transition-colors z-10"
                style={{ WebkitTouchCallout: 'none' }}
                onClick={(e) => { e.stopPropagation(); handleCopy(jar.qr_code, jar.id); }}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); handleCopy(jar.qr_code, jar.id); }}
                onTouchStart={(e) => { e.stopPropagation(); handleCopyTouchStart(jar.qr_code, jar.id); }}
                onTouchEnd={(e) => { e.stopPropagation(); handleCopyTouchEnd(); }}
                onTouchMove={(e) => { e.stopPropagation(); handleCopyTouchEnd(); }}
                onMouseDown={(e) => { e.stopPropagation(); handleCopyTouchStart(jar.qr_code, jar.id); }}
                onMouseUp={(e) => { e.stopPropagation(); handleCopyTouchEnd(); }}
                onMouseLeave={(e) => { e.stopPropagation(); handleCopyTouchEnd(); }}
                title="Click or long-press to copy"
              >
                <p className="text-xs font-mono text-gray-600">{jar.qr_code}</p>
                {copiedId === jar.id ? (
                  <Check size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} className="text-gray-400" />
                )}
              </div>
              
              {jar.status === 'available' && (
                <div className="relative group">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 cursor-pointer">
                    <CheckCircle size={16} className="mr-1.5" /> Available
                  </span>
                  <div className="absolute top-full mt-1 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-32 left-1/2 -translate-x-1/2">
                    <button onClick={(e) => { e.stopPropagation(); handleStatusChange(jar.id, 'lost'); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-t-lg">Mark Lost</button>
                    <button onClick={(e) => { e.stopPropagation(); handleStatusChange(jar.id, 'damaged'); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg">Mark Damaged</button>
                  </div>
                </div>
              )}
              {jar.status === 'with_customer' && (
                <div className="flex flex-col items-center gap-1.5 relative group">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200 cursor-pointer">
                    <Package size={16} className="mr-1.5" /> In Field
                  </span>
                  <div className="absolute top-full mt-1 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-32 left-1/2 -translate-x-1/2">
                    <button onClick={(e) => { e.stopPropagation(); handleStatusChange(jar.id, 'available'); }} className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-t-lg">Mark Returned</button>
                    <button onClick={(e) => { e.stopPropagation(); handleStatusChange(jar.id, 'lost'); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Mark Lost</button>
                    <button onClick={(e) => { e.stopPropagation(); handleStatusChange(jar.id, 'damaged'); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg">Mark Damaged</button>
                  </div>
                  {jar.current_customer_id && (
                    <span className="text-xs text-gray-600 font-medium text-center truncate w-full max-w-[120px]">
                      {customers.find(c => c.id === jar.current_customer_id)?.name || 'Unknown Customer'}
                    </span>
                  )}
                </div>
              )}
              {(jar.status === 'lost' || jar.status === 'damaged') && (
                <div className="relative group">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200 capitalize cursor-pointer">
                    <XCircle size={16} className="mr-1.5" /> {jar.status}
                  </span>
                  <div className="absolute top-full mt-1 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-32 left-1/2 -translate-x-1/2">
                    <button onClick={(e) => { e.stopPropagation(); handleStatusChange(jar.id, 'available'); }} className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg">Mark Available</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
