import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { downloadRentUpdatePdf } from '../../utils/rentUpdatePdf';
import { useRentUpdatePdfAssets } from '../../hooks/useRentUpdatePdfAssets';

const UpdateRentAmount = ({ lease, newRentAmount, updateDate, ipcIndex, autoGenerate = false }) => {
  const { companySettings, ready, customTemplateJson } = useRentUpdatePdfAssets();

  const generatePdf = () => {
    if (!lease || newRentAmount == null || !updateDate) {
      toast.error('Faltan datos para generar el PDF');
      return;
    }

    downloadRentUpdatePdf(
      { lease, newRentAmount, updateDate, ipcIndex, companySettings },
      customTemplateJson,
    );
  };

  useEffect(() => {
    if (autoGenerate && ready && lease && newRentAmount != null && updateDate) {
      const t = setTimeout(generatePdf, 100);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [autoGenerate, ready, lease, newRentAmount, updateDate, ipcIndex, companySettings, customTemplateJson]);

  if (autoGenerate) return null;

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={generatePdf}
        disabled={!ready}
        className="bg-blue-500 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded"
      >
        {ready ? 'Generar PDF de Actualización' : 'Cargando plantilla...'}
      </button>
    </div>
  );
};

UpdateRentAmount.propTypes = {
  lease: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    rentAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    startDate: PropTypes.string.isRequired,
    updateFrequency: PropTypes.string.isRequired,
    Property: PropTypes.object,
    Tenant: PropTypes.object,
    Landlord: PropTypes.object,
  }).isRequired,
  newRentAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  updateDate: PropTypes.string.isRequired,
  ipcIndex: PropTypes.string,
  autoGenerate: PropTypes.bool,
};

export default UpdateRentAmount;
