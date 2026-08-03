'use client';

import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface ShortUrlQRProps {
  value: string;
}

export default function ShortUrlQR({ value }: ShortUrlQRProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const canvas = wrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'qr-code.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="qr-wrap" ref={wrapRef}>
      <div className="qr-box">
        <QRCodeCanvas value={value} size={160} fgColor="#000000" bgColor="#ffffff" />
      </div>
      <button type="button" className="qr-download-btn" onClick={handleDownload}>
        Download QR
      </button>
    </div>
  );
}
