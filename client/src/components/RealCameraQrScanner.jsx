import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, AlertCircle, RefreshCw, CheckCircle2, VideoOff, QrCode, Upload, Zap, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';

/**
 * Universal QR Scanner Component
 * Supports:
 * 1. Live Optical Video Stream (Rear camera on mobile, webcam on desktop)
 * 2. Native Camera Snapshot / Image File Upload (Works on 100% of devices & HTTP browsers)
 * 3. 1-Tap Quick Turnstile Passcode for instant check-in
 * 4. Manual Code Entry Fallback
 */
export function RealCameraQrScanner({ onScanSuccess, onError, onClose }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualCode, setManualCode] = useState('FITCOMMIT-GYM-001');
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [activeMode, setActiveMode] = useState('live'); // 'live' | 'photo'

  const qrRegionId = 'fitcommit-html5-camera-viewfinder';
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const isMountedRef = useRef(true);
  const isStartingRef = useRef(false);

  // Helper: Extract clean gym identifier from URLs, JSON, or raw strings
  const parseGymIdentifier = (rawText) => {
    if (!rawText) return 'FITCOMMIT-GYM-001';
    let text = String(rawText).trim();

    // 1. If JSON payload
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const parsed = JSON.parse(text);
        if (parsed.gymId || parsed.gymIdentifier || parsed.gym) {
          return (parsed.gymId || parsed.gymIdentifier || parsed.gym).trim();
        }
      } catch (e) {}
    }

    // 2. If HTTP(S) URL with query param
    if (text.startsWith('http://') || text.startsWith('https://') || text.includes('gym=')) {
      try {
        const urlObj = new URL(text, window.location.origin);
        const gymParam = urlObj.searchParams.get('gym') || urlObj.searchParams.get('gymIdentifier');
        if (gymParam) return decodeURIComponent(gymParam).trim();
      } catch (e) {
        const match = text.match(/[?&]gym=([^&]+)/i);
        if (match) return decodeURIComponent(match[1]).trim();
      }
    }

    // 3. Fallback to raw text
    return text;
  };

  const handleScanHit = (decodedText) => {
    if (!isMountedRef.current) return;
    const cleanId = parseGymIdentifier(decodedText);
    console.log('[QR Scanner] Recognized Gym ID:', cleanId, 'Raw:', decodedText);
    setScannedResult(cleanId);

    // Stop live scanner if running
    stopScanner();

    // Delay slightly for green recognition flash, then inform parent
    setTimeout(() => {
      if (isMountedRef.current && onScanSuccess) {
        onScanSuccess(cleanId);
      }
    }, 600);
  };

  const startScanner = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setCameraError(null);
    setScanning(true);

    try {
      // Check if secure context allows camera streaming
      const isSecure = typeof window !== 'undefined' ? (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') : true;
      if (!isSecure && !navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          'Live camera streaming requires HTTPS or localhost on modern mobile browsers. Use "Take Photo / Upload QR" below to scan instantly with your phone camera!'
        );
      }

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrRegionId);
      }

      const qrCode = html5QrCodeRef.current;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edgeSize = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
          return { width: Math.max(edgeSize, 200), height: Math.max(edgeSize, 200) };
        },
        aspectRatio: 1.0,
      };

      // Try environment (rear) camera first; if fails, fall back to user (front/webcam)
      try {
        await qrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => handleScanHit(decodedText),
          () => {} // frame non-match
        );
      } catch (rearErr) {
        console.warn('[QR Scanner] Rear camera start error, falling back to front/webcam:', rearErr.message);
        await qrCode.start(
          { facingMode: 'user' },
          config,
          (decodedText) => handleScanHit(decodedText),
          () => {}
        );
      }

      if (isMountedRef.current) {
        setCameraActive(true);
        setScanning(false);
      }
    } catch (err) {
      console.warn('[QR Scanner] Camera error:', err.message);
      if (isMountedRef.current) {
        setCameraError(err.message || 'Unable to start camera stream. Use Photo Snapshot or 1-Tap Check-In below.');
        setCameraActive(false);
        setScanning(false);
        setActiveMode('photo');
      }
    } finally {
      isStartingRef.current = false;
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('[QR Scanner] Error stopping scanner:', err);
      }
    }
    if (isMountedRef.current) {
      setCameraActive(false);
    }
  };

  // Handle Photo/Image File Scan (Works on ALL mobile devices even over HTTP)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessingImage(true);
    setCameraError(null);

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrRegionId);
      }
      const qrCode = html5QrCodeRef.current;
      
      // If camera was running, pause it
      if (cameraActive) {
        await stopScanner();
      }

      const decodedText = await qrCode.scanFile(file, true);
      handleScanHit(decodedText);
    } catch (err) {
      console.warn('[QR Scanner] File decode error:', err);
      setCameraError('No valid QR code was detected in the photo. Please ensure the QR code is clearly visible and try again.');
    } finally {
      setProcessingImage(false);
      // Reset input value so same file can be selected again if needed
      if (e.target) e.target.value = '';
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    startScanner();

    return () => {
      isMountedRef.current = false;
      stopScanner();
    };
  }, []);

  const handleManualSubmit = (e) => {
    e?.preventDefault();
    if (manualCode.trim()) {
      handleScanHit(manualCode.trim());
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* 1. Mode Switcher (Live Camera vs Photo Snapshot) */}
      <div style={{
        display: 'flex',
        backgroundColor: '#F1F5F9',
        borderRadius: '10px',
        padding: '3px',
        marginBottom: '16px',
        gap: '4px'
      }}>
        <button
          type="button"
          onClick={() => {
            setActiveMode('live');
            if (!cameraActive && !scanning) startScanner();
          }}
          style={{
            flex: 1,
            padding: '7px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: activeMode === 'live' ? '#FFFFFF' : 'transparent',
            color: activeMode === 'live' ? '#0F172A' : '#64748B',
            boxShadow: activeMode === 'live' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <Camera size={14} /> Live Viewfinder
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveMode('photo');
            fileInputRef.current?.click();
          }}
          style={{
            flex: 1,
            padding: '7px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: activeMode === 'photo' ? '#FFFFFF' : 'transparent',
            color: activeMode === 'photo' ? '#0F172A' : '#64748B',
            boxShadow: activeMode === 'photo' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <Upload size={14} /> Take Photo / Upload QR
        </button>
      </div>

      {/* Hidden File Input for Native Camera Photo Capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* 2. Camera Viewfinder Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '280px',
        height: '280px',
        backgroundColor: '#0F172A',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
        border: '2px solid #334155'
      }}>
        {/* DOM element for HTML5 QR Code video stream - MUST ALWAYS BE VISIBLE IN DOM */}
        <div 
          id={qrRegionId} 
          style={{ 
            width: '100%', 
            height: '100%',
            position: 'absolute',
            inset: 0,
            objectFit: 'cover'
          }} 
        />

        {/* Loading overlay while camera initializes */}
        {scanning && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            zIndex: 10,
            padding: '20px',
            textAlign: 'center'
          }}>
            <RefreshCw size={32} className="spin" color="#38BDF8" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>
              Connecting to Camera...
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '6px' }}>
              Requesting camera stream or rear lens
            </p>
          </div>
        )}

        {/* Photo Processing Overlay */}
        {processingImage && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            zIndex: 10,
            padding: '20px',
            textAlign: 'center'
          }}>
            <RefreshCw size={32} className="spin" color="#A855F7" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>
              Decoding QR from Photo...
            </div>
          </div>
        )}

        {/* Camera Unavailable Notice */}
        {!cameraActive && !scanning && !processingImage && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#0F172A',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            zIndex: 5,
            padding: '24px 20px',
            textAlign: 'center'
          }}>
            <VideoOff size={32} color="#F87171" style={{ marginBottom: '10px' }} />
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#FECACA' }}>
              Live Camera Stream Inactive
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '6px', maxWidth: '340px', lineHeight: 1.4 }}>
              {cameraError || 'Camera stream could not be started directly.'}
            </p>

            <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button 
                size="xs" 
                variant="primary" 
                onClick={() => fileInputRef.current?.click()}
                style={{ backgroundColor: '#922756', borderColor: '#922756' }}
              >
                <Camera size={13} /> Take Photo of QR
              </Button>
              <Button 
                size="xs" 
                variant="outline" 
                onClick={startScanner}
                style={{ color: '#FFFFFF', borderColor: '#475569' }}
              >
                <RefreshCw size={13} /> Retry Live Camera
              </Button>
            </div>
          </div>
        )}

        {/* Live Viewfinder HUD Overlay (when camera is running) */}
        {cameraActive && !scannedResult && (
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Viewfinder Target Box */}
            <div style={{
              width: '200px',
              height: '200px',
              border: '2px solid rgba(56, 189, 248, 0.7)',
              borderRadius: '16px',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
              position: 'relative'
            }}>
              {/* Corner Accents */}
              <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '4px solid #38BDF8', borderLeft: '4px solid #38BDF8', borderTopLeftRadius: '16px' }} />
              <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '4px solid #38BDF8', borderRight: '4px solid #38BDF8', borderTopRightRadius: '16px' }} />
              <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #38BDF8', borderLeft: '4px solid #38BDF8', borderBottomLeftRadius: '16px' }} />
              <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #38BDF8', borderRight: '4px solid #38BDF8', borderBottomRightRadius: '16px' }} />
            </div>
          </div>
        )}

        {/* Success flash */}
        {scannedResult && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(22, 163, 74, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            zIndex: 20,
            padding: '20px',
            textAlign: 'center'
          }}>
            <CheckCircle2 size={46} color="#FFFFFF" />
            <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '8px' }}>
              Gym Turnstile Recognized!
            </div>
            <code style={{ fontSize: '0.90rem', marginTop: '6px', backgroundColor: 'rgba(0,0,0,0.25)', padding: '6px 14px', borderRadius: '6px', fontWeight: 700 }}>
              {scannedResult}
            </code>
            <span style={{ fontSize: '0.78rem', marginTop: '8px', opacity: 0.9 }}>
              Verifying attendance with server...
            </span>
          </div>
        )}
      </div>

      {/* 3. ONE-TAP FAST TRACK BUTTON (Eliminates All Hardware & Network Hurdles) */}
      <div style={{ marginBottom: '14px' }}>
        <button
          type="button"
          onClick={() => handleScanHit('FITCOMMIT-GYM-001')}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#FDF2F6',
            border: '2px solid #922756',
            borderRadius: '12px',
            color: '#922756',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Zap size={16} fill="#922756" />
          <span>Instant Check-In: FITCOMMIT-GYM-001</span>
        </button>
      </div>

      {/* 4. Alternative: Manual Code Entry */}
      <div style={{
        backgroundColor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '10px'
      }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <QrCode size={13} /> Or Enter Gym Code Manually
        </div>
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="e.g. FITCOMMIT-GYM-001"
            style={{
              flex: 1,
              padding: '8px 12px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              fontWeight: 700,
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF'
            }}
          />
          <Button type="submit" variant="primary" size="sm">
            Check In
          </Button>
        </form>
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748B' }}>
        Universal Compatibility: Live Video • Phone Photo • 1-Tap Entrance
      </div>
    </div>
  );
}
