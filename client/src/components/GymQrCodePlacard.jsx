import React, { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Printer, Copy, Check, Globe, Wifi, QrCode, Sparkles, ExternalLink, Smartphone, ShieldCheck, Terminal } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';
import { APP_BASE_URL } from '../config/api';

export function GymQrCodePlacard({ 
  gymId = 'FITCOMMIT-GYM-001', 
  gymName = 'FitCommit Central Gym',
  capacity = 100,
  currentOccupancy = 24,
  compact = false
}) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);

  // Local Wi-Fi IPv4 address detected on this host
  const detectedLanIp = 'http://172.16.210.219:5173';
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  // Read any saved public tunnel from localStorage
  const savedPublicUrl = typeof window !== 'undefined' ? (localStorage.getItem('fitcommit_public_qr_url') || '') : '';
  const [customPublicUrl, setCustomPublicUrl] = useState(savedPublicUrl);

  // Default to 'lan' (Wi-Fi URL) or 'public' so Google Lens / Phone Camera immediately recognizes it as a clickable website!
  const initialMode = savedPublicUrl 
    ? 'public' 
    : (!isLocalhost && isHttps ? 'origin' : 'lan');

  const [qrMode, setQrMode] = useState(initialMode); // 'lan' | 'public' | 'origin'
  const [showTunnelHelp, setShowTunnelHelp] = useState(false);

  // Determine effective base URL
  let effectiveBaseUrl = originUrl;
  if (qrMode === 'public') {
    effectiveBaseUrl = customPublicUrl.trim().replace(/\/$/, '') || originUrl;
  } else if (qrMode === 'lan') {
    effectiveBaseUrl = detectedLanIp;
  } else if (qrMode === 'origin') {
    effectiveBaseUrl = originUrl;
  }

  // Construct real encoded QR payload - ALWAYS a valid HTTP/HTTPS URL so Google Lens opens website directly
  const qrPayload = `${effectiveBaseUrl}/gym/check-in?gym=${encodeURIComponent(gymId)}`;

  const handleCopyPayload = () => {
    navigator.clipboard?.writeText(qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavePublicUrl = (url) => {
    setCustomPublicUrl(url);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fitcommit_public_qr_url', url);
    }
  };

  // High-Resolution PNG Download for Printing
  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current.querySelector('canvas');
    if (!canvas) return;

    const dlCanvas = document.createElement('canvas');
    const ctx = dlCanvas.getContext('2d');
    const width = 1000;
    const height = 1320;
    dlCanvas.width = width;
    dlCanvas.height = height;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#922756';
    ctx.lineWidth = 14;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Inner thin border
    ctx.strokeStyle = '#F5D3E0';
    ctx.lineWidth = 3;
    ctx.strokeRect(44, 44, width - 88, height - 88);

    // Typography
    ctx.textAlign = 'center';

    // Header Pill Text
    ctx.fillStyle = '#922756';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('FITCOMMIT SMART FACILITY ENTRANCE PLAQUE', width / 2, 110);

    // Main Gym Title
    ctx.fillStyle = '#181B26';
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.fillText(gymName.toUpperCase(), width / 2, 178);

    // Subtitle
    ctx.fillStyle = '#505A69';
    ctx.font = '26px system-ui, sans-serif';
    ctx.fillText('Scan with the FitCommit App or your Phone Camera', width / 2, 226);

    // Draw the QR Code image scaled
    const qrSize = 640;
    const qrX = (width - qrSize) / 2;
    const qrY = 265;
    ctx.drawImage(canvas, qrX, qrY, qrSize, qrSize);

    // Gym ID Pill Background
    ctx.fillStyle = '#FDF2F6';
    ctx.fillRect(width / 2 - 260, 935, 520, 70);
    ctx.strokeStyle = '#F5D3E0';
    ctx.lineWidth = 2;
    ctx.strokeRect(width / 2 - 260, 935, 520, 70);

    // Gym ID Callout
    ctx.fillStyle = '#922756';
    ctx.font = 'bold 40px monospace';
    ctx.fillText(gymId, width / 2, 984);

    // Telemetry text
    ctx.fillStyle = '#505A69';
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText(`Max Capacity: ${capacity} Members • Real-Time Occupancy Tracking`, width / 2, 1050);

    // Encoded URL label
    ctx.fillStyle = '#888888';
    ctx.font = '18px monospace';
    ctx.fillText(qrPayload, width / 2, 1095);

    // Footer divider and system note
    ctx.strokeStyle = '#ECECEA';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 1140);
    ctx.lineTo(width - 100, 1140);
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 18px system-ui, sans-serif';
    ctx.fillText('FitCommit Smart Facility • Contactless Entrance Access System', width / 2, 1190);

    const imageUri = dlCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `fitcommit-entrance-qr-${gymId.toLowerCase()}.png`;
    link.href = imageUri;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="gym-qr-placard-wrapper" style={{ width: '100%' }}>
      
      {/* 1. Network & Payload Resolver Configurator */}
      {!compact && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} color="#922756" />
              <strong style={{ fontSize: '0.95rem', color: '#181B26' }}>
                QR Destination URL (Google Lens & Phone Camera Compatible)
              </strong>
            </div>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              padding: '3px 10px', 
              borderRadius: '9999px',
              backgroundColor: '#ECFDF5',
              color: '#059669'
            }}>
              ✓ GOOGLE LENS READY
            </span>
          </div>

          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
            Scanning with Google Lens or your phone camera will directly open the FitCommit check-in page:
          </p>

          {/* Selector Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '16px' }}>
            {/* Mode 1: Local Wi-Fi IP */}
            <button
              type="button"
              onClick={() => setQrMode('lan')}
              style={{
                textAlign: 'left',
                padding: '10px 14px',
                borderRadius: '10px',
                border: qrMode === 'lan' ? '2px solid #922756' : '1px solid #E2E8F0',
                backgroundColor: qrMode === 'lan' ? '#FDF2F6' : '#FAFBFC',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.86rem', color: qrMode === 'lan' ? '#922756' : '#181B26' }}>
                <Wifi size={14} color="#922756" /> Wi-Fi Network Link
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '3px' }}>
                <code>{detectedLanIp}</code>. When scanning from phone on the same Wi-Fi.
              </div>
            </button>

            {/* Mode 2: Public Tunnel / Cloud URL */}
            <button
              type="button"
              onClick={() => setQrMode('public')}
              style={{
                textAlign: 'left',
                padding: '10px 14px',
                borderRadius: '10px',
                border: qrMode === 'public' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                backgroundColor: qrMode === 'public' ? '#EFF6FF' : '#FAFBFC',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.86rem', color: qrMode === 'public' ? '#1D4ED8' : '#181B26' }}>
                <Smartphone size={14} color="#2563EB" /> Public Tunnel Link (4G / 5G Data)
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '3px' }}>
                For scanning from mobile cellular data outside local Wi-Fi.
              </div>
            </button>

            {/* Mode 3: Current Origin */}
            <button
              type="button"
              onClick={() => setQrMode('origin')}
              style={{
                textAlign: 'left',
                padding: '10px 14px',
                borderRadius: '10px',
                border: qrMode === 'origin' ? '2px solid #7C3AED' : '1px solid #E2E8F0',
                backgroundColor: qrMode === 'origin' ? '#F5F3FF' : '#FAFBFC',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.86rem', color: qrMode === 'origin' ? '#6D28D9' : '#181B26' }}>
                <Globe size={14} color="#7C3AED" /> Current Browser Host
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '3px' }}>
                <code>{originUrl}</code>
              </div>
            </button>
          </div>

          {/* If Mode 2 (Public Tunnel) is selected, show custom URL input and 1-line helper */}
          {qrMode === 'public' && (
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '14px'
            }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Public Tunnel or Deployed Domain URL:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={customPublicUrl} 
                  onChange={(e) => handleSavePublicUrl(e.target.value)}
                  placeholder="https://fitcommit.loca.lt or https://xyz.ngrok-free.app"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '0.85rem',
                    border: '1px solid #94A3B8',
                    borderRadius: '6px',
                    fontFamily: 'monospace'
                  }}
                />
                <Button 
                  size="xs" 
                  variant="outline" 
                  onClick={() => setShowTunnelHelp(!showTunnelHelp)}
                >
                  <Terminal size={12} /> {showTunnelHelp ? 'Hide Tunnel Guide' : 'How to get free tunnel'}
                </Button>
              </div>

              {showTunnelHelp && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px 12px',
                  backgroundColor: '#0F172A',
                  color: '#F8FAFC',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  lineHeight: 1.5
                }}>
                  <div style={{ color: '#38BDF8', fontWeight: 700, marginBottom: '4px' }}>
                    1-Step Free Public Tunnel (Zero Sign-up):
                  </div>
                  Run this command in any terminal on your laptop to get a free public HTTPS URL accessible from 4G/5G mobile phones:
                  <div style={{ backgroundColor: '#1E293B', padding: '6px 10px', borderRadius: '4px', margin: '6px 0', fontFamily: 'monospace', color: '#4ADE80' }}>
                    npx localtunnel --port 5173
                  </div>
                  Copy the generated <code>https://....loca.lt</code> link and paste it into the field above!
                </div>
              )}
            </div>
          )}

          {/* Current Encoded String View */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FAFBFC',
            border: '1px solid #E2E8F0',
            padding: '10px 14px',
            borderRadius: '8px',
            gap: '12px'
          }}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              <span style={{ fontSize: '0.74rem', color: '#64748B', marginRight: '6px' }}>Encoded QR Payload:</span>
              <code style={{ fontSize: '0.84rem', color: '#0F172A', fontWeight: 700 }}>{qrPayload}</code>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {qrPayload.startsWith('http') && (
                <a
                  href={qrPayload}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    color: '#2563EB',
                    textDecoration: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #BFDBFE',
                    backgroundColor: '#EFF6FF'
                  }}
                  title="Open destination in new tab to test"
                >
                  <ExternalLink size={12} /> Test Link
                </a>
              )}
              <button 
                onClick={handleCopyPayload}
                style={{ 
                  background: '#FFFFFF', 
                  border: '1px solid #CBD5E1', 
                  borderRadius: '4px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  color: '#334155', 
                  fontSize: '0.75rem',
                  padding: '4px 8px'
                }}
                title="Copy QR Payload"
              >
                {copied ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Official Physical Printable Plaque Card */}
      <div 
        className="printable-gym-plaque"
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #922756',
          borderRadius: '24px',
          padding: compact ? '24px' : '40px 32px',
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(146, 39, 86, 0.08)',
          maxWidth: '560px',
          margin: '0 auto'
        }}
      >
        {/* Plaque Header */}
        <div style={{ marginBottom: '16px' }}>
          <img 
            src="/images/fitcommit-logo.png" 
            alt="FitCommit" 
            style={{ 
              height: '40px', 
              width: 'auto', 
              maxWidth: '180px',
              margin: '0 auto 12px auto', 
              display: 'block' 
            }} 
          />
          <div className="label-micro" style={{ letterSpacing: '0.14em', color: '#922756' }}>
            FITCOMMIT SMART FACILITY ACCESS
          </div>
          <h2 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: compact ? '1.5rem' : '1.9rem', 
            fontWeight: 800, 
            letterSpacing: '-0.02em',
            margin: '6px 0 6px 0',
            color: '#181B26'
          }}>
            {gymName}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
            {qrMode === 'raw' 
              ? 'Scan with the FitCommit in-app camera or take a photo to check in'
              : 'Scan with your phone camera or the FitCommit in-app scanner to check in'}
          </p>
        </div>

        {/* Real Generated QR Code (qrcode.react) */}
        <div 
          ref={canvasRef}
          style={{
            display: 'inline-flex',
            padding: '16px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E8ECF2',
            borderRadius: '16px',
            margin: '12px auto 20px auto',
            boxShadow: '0 4px 16px rgba(24, 27, 38, 0.06)'
          }}
        >
          <QRCodeCanvas
            value={qrPayload}
            size={compact ? 200 : 260}
            level="H"
            includeMargin={true}
            imageSettings={{
              src: "/images/fitcommit-emblem.png",
              x: undefined,
              y: undefined,
              height: 40,
              width: 40,
              excavate: true,
            }}
          />
        </div>

        {/* Gym ID Callout */}
        <div style={{
          backgroundColor: '#FDF2F6',
          border: '1px solid #F5D3E0',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <div className="label-micro" style={{ fontSize: '10px', color: '#922756' }}>Gym Entrance Turnstile Code</div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '0.04em', color: '#922756', marginTop: '2px' }}>
            {gymId}
          </div>
        </div>

        {/* Telemetry Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid var(--border-color)', paddingTop: '16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <div>
            <div>Facility Capacity</div>
            <strong style={{ color: '#181B26', fontSize: '1.05rem' }}>{capacity} Spots</strong>
          </div>
          <div>
            <div>Current Occupancy</div>
            <strong style={{ color: '#922756', fontSize: '1.05rem' }}>{currentOccupancy} Inside</strong>
          </div>
          <div>
            <div>Access Type</div>
            <strong style={{ color: '#181B26', fontSize: '1.05rem' }}>Instant QR</strong>
          </div>
        </div>

        {/* Print & Download Action Buttons */}
        {!compact && (
          <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'center' }}>
            <Button variant="primary" onClick={handleDownloadPNG}>
              <Download size={15} /> Download High-Res QR (PNG)
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer size={15} /> Print Entrance Plaque
            </Button>
          </div>
        )}
      </div>

      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-gym-plaque, .printable-gym-plaque * {
            visibility: visible;
          }
          .printable-gym-plaque {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 90% !important;
            max-width: 600px !important;
            box-shadow: none !important;
            border: 3px solid #000000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}
