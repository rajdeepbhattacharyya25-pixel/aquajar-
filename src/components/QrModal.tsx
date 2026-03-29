import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QrModal({ isOpen, onClose }: QrModalProps) {
  const { getQrCode } = useAppStore();
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getQrCode().then(setQrCode);
    }
  }, [isOpen, getQrCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="bg-white p-6 rounded-3xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-center">Payment QR Code</h2>
        {qrCode ? (
          <img src={qrCode} alt="Payment QR" className="w-full h-auto" />
        ) : (
          <p className="text-center text-gray-500">No QR code uploaded.</p>
        )}
        <button 
          onClick={onClose}
          className="mt-6 w-full py-3 bg-primary text-white rounded-xl font-bold"
        >
          Close
        </button>
      </div>
    </div>
  );
}
