import { useState, useEffect } from 'react';
import { useGetAllPdfTemplatesQuery } from '@shared/redux';

export function useRentUpdatePdfAssets() {
  const [companySettings, setCompanySettings] = useState(null);
  const [ready, setReady] = useState(false);
  const { data: templatesData } = useGetAllPdfTemplatesQuery();

  const templates = templatesData?.data || [];
  const rentTemplate = templates.find(
    (t) => t.templateType === 'ACTUALIZACION_RENTA' && t.isDefault && t.isActive
  ) || templates.find((t) => t.templateType === 'ACTUALIZACION_RENTA' && t.isActive);

  const isPdfMakeTemplate =
    rentTemplate?.variables?.renderer === 'pdfmake' ||
    (rentTemplate?.htmlTemplate && rentTemplate.htmlTemplate.trim().startsWith('{'));

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiUrl}/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!cancelled) {
          if (res.ok) {
            setCompanySettings(await res.json());
          } else {
            setCompanySettings({ company_name: 'Inmobiliaria' });
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

  return {
    companySettings,
    ready,
    customTemplateJson: isPdfMakeTemplate ? rentTemplate?.htmlTemplate : null,
    rentTemplate,
  };
}
