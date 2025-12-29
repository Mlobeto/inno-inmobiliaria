import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";

const UpcomingExpiryPopup = () => {
  const leases = useSelector((state) => state.leases);
  const [showPopup, setShowPopup] = useState(false);
  const [alertContracts, setAlertContracts] = useState([]);

  // Calcular contratos próximos a vencer (optimizado)
  const upcomingContracts = useMemo(() => {
    if (!leases || leases.length === 0) return [];
    const now = new Date();
    return leases.filter((lease) => {
      // Calcula la fecha de culminación sumando totalMonths a la fecha de inicio
      const terminationDate = new Date(lease.startDate);
      terminationDate.setMonth(terminationDate.getMonth() + lease.totalMonths);
      // Calcula la diferencia en meses entre la fecha actual y la fecha de culminación
      const diffMonths =
        (terminationDate.getFullYear() - now.getFullYear()) * 12 +
        (terminationDate.getMonth() - now.getMonth());
      return diffMonths >= 0 && diffMonths <= 3;
    });
  }, [leases]);

  useEffect(() => {
    if (upcomingContracts.length > 0) {
      setAlertContracts(upcomingContracts);
      setShowPopup(true);
    }
  }, [upcomingContracts]);

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">¡Atención!</h2>
        <p className="mb-4">
          Los siguientes contratos están próximos a vencerse (dentro de 3 meses):
        </p>
        <ul className="mb-4">
          {alertContracts.map((lease) => {
            const terminationDate = new Date(lease.startDate);
            terminationDate.setMonth(terminationDate.getMonth() + lease.totalMonths);
            return (
              <li key={lease.id || lease.leaseId}>
                Contrato {lease.id || lease.leaseId} - Vence el{" "}
                {terminationDate.toLocaleDateString()}
              </li>
            );
          })}
        </ul>
        <button
          onClick={() => setShowPopup(false)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default UpcomingExpiryPopup;