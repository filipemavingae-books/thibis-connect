import { useState, useEffect } from 'react';

interface DeviceFingerprint {
  id: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  cookiesEnabled: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  webGL: string;
  canvas: string;
}

export const useDeviceFingerprint = () => {
  const [fingerprint, setFingerprint] = useState<DeviceFingerprint | null>(null);
  const [loading, setLoading] = useState(true);

  const generateFingerprint = async (): Promise<DeviceFingerprint> => {
    // Get basic device info
    const userAgent = navigator.userAgent;
    const screenResolution = `${screen.width}x${screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const platform = navigator.platform;
    const cookiesEnabled = navigator.cookieEnabled;
    const localStorage = !!window.localStorage;
    const sessionStorage = !!window.sessionStorage;

    // Generate WebGL fingerprint
    const getWebGLFingerprint = (): string => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
        if (!gl) return 'no-webgl';
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const vendor = gl.getParameter(debugInfo?.UNMASKED_VENDOR_WEBGL || gl.VENDOR);
        const renderer = gl.getParameter(debugInfo?.UNMASKED_RENDERER_WEBGL || gl.RENDERER);
        
        return `${vendor}-${renderer}`;
      } catch (e) {
        return 'webgl-error';
      }
    };

    // Generate Canvas fingerprint
    const getCanvasFingerprint = (): string => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return 'no-canvas';
        
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Thibis Device Fingerprint 🔒', 2, 2);
        
        return canvas.toDataURL();
      } catch (e) {
        return 'canvas-error';
      }
    };

    const webGL = getWebGLFingerprint();
    const canvas = getCanvasFingerprint();

    // Create unique device ID from all components
    const components = [
      userAgent,
      screenResolution,
      timezone,
      language,
      platform,
      cookiesEnabled.toString(),
      localStorage.toString(),
      sessionStorage.toString(),
      webGL,
      canvas.slice(0, 100) // Truncate canvas for ID generation
    ];

    // Simple hash function
    const hashString = (str: string): string => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(36);
    };

    const id = hashString(components.join('|'));

    return {
      id,
      userAgent,
      screenResolution,
      timezone,
      language,
      platform,
      cookiesEnabled,
      localStorage,
      sessionStorage,
      webGL,
      canvas: canvas.slice(0, 200) // Store truncated version
    };
  };

  useEffect(() => {
    const init = async () => {
      try {
        const fp = await generateFingerprint();
        setFingerprint(fp);
        
        // Store in localStorage for consistency checks
        const existingFp = localStorage.getItem('thibis_device_fp');
        if (existingFp) {
          const existing = JSON.parse(existingFp);
          if (existing.id !== fp.id) {
            console.warn('Device fingerprint changed - potential security concern');
          }
        }
        
        localStorage.setItem('thibis_device_fp', JSON.stringify(fp));
      } catch (error) {
        console.error('Error generating device fingerprint:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const isDeviceRegistered = (deviceId: string): boolean => {
    const registeredDevices = JSON.parse(localStorage.getItem('thibis_registered_devices') || '[]');
    return registeredDevices.includes(deviceId);
  };

  const registerDevice = (deviceId: string) => {
    const registeredDevices = JSON.parse(localStorage.getItem('thibis_registered_devices') || '[]');
    if (!registeredDevices.includes(deviceId)) {
      registeredDevices.push(deviceId);
      localStorage.setItem('thibis_registered_devices', JSON.stringify(registeredDevices));
    }
  };

  return {
    fingerprint,
    loading,
    isDeviceRegistered,
    registerDevice,
    generateFingerprint
  };
};