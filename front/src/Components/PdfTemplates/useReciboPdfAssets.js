import { useState, useEffect } from 'react';

export function useReciboPdfAssets() {
  const [companySettings, setCompanySettings] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [settingsRes, sigRes] = await Promise.all([
          fetch(`${apiUrl}/admin/settings`, { headers }),
          fetch(`${apiUrl}/admin/signature`, { headers }),
        ]);

        if (!cancelled) {
          if (settingsRes.ok) {
            setCompanySettings(await settingsRes.json());
          } else {
            setCompanySettings({ company_name: 'Inmobiliaria' });
          }
          if (sigRes.ok) {
            const sig = await sigRes.json();
            if (sig.signatureUrl) setSignatureUrl(sig.signatureUrl);
          }
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setCompanySettings({ company_name: 'Inmobiliaria' });
          setReady(true);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return { companySettings, signatureUrl, ready };
}
