import React from 'react';
import PropTypes from 'prop-types';

const ContractEndAlert = ({ lease }) => {
  const { startDate, totalMonths } = lease;

  const start = new Date(startDate);
  const now = new Date();
  // Calcular los meses transcurridos
  let monthsElapsed =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  // Ajuste si el día actual es menor que el día del inicio
  if (now.getDate() < start.getDate()) {
    monthsElapsed -= 1;
  }
  const monthsRemaining = totalMonths - monthsElapsed;

  return (
    <div className="mb-4">
      {monthsRemaining <= 3 ? (
        <div className="p-4 bg-red-100 text-red-800 rounded">
          ¡Atención! El contrato termina en {monthsRemaining} mes(es).
        </div>
      ) : (
        <div className="p-4 bg-green-100 text-green-800 rounded">
          El contrato está vigente. Quedan {monthsRemaining} meses para su finalización.
        </div>
      )}
    </div>
  );
};
ContractEndAlert.propTypes = {
  lease: PropTypes.shape({
    startDate: PropTypes.string.isRequired,
    totalMonths: PropTypes.number.isRequired,
  }).isRequired,
};

export default ContractEndAlert;
