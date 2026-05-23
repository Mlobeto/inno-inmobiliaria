import { useState } from 'react';
import PropTypes from 'prop-types';
import { inputClass } from './propiedadesTheme';

/**
 * Input de moneda que muestra el valor formateado cuando está sin foco
 * y el número raw cuando está en edición.
 * Es un reemplazo directo de <input type="number"> — acepta las mismas props
 * más `currency` ('ARS' | 'USD', default 'ARS').
 *
 * El onChange sigue devolviendo el evento con el valor numérico raw,
 * por lo que el handleChange del formulario no necesita cambios.
 */
const CurrencyInput = ({
  name,
  value,
  onChange,
  currency = 'ARS',
  placeholder,
  className = inputClass,
  required,
  disabled,
  id,
}) => {
  const [focused, setFocused] = useState(false);

  const displayValue = focused || value === '' || value == null
    ? value
    : formatCurrency(value, currency);

  const handleChange = (e) => {
    // Pasar al padre el valor numérico raw (sin símbolo ni separadores)
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    onChange({ ...e, target: { ...e.target, name, value: raw } });
  };

  return (
    <input
      id={id}
      name={name}
      type={focused ? 'number' : 'text'}
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      className={className}
      required={required}
      disabled={disabled}
    />
  );
};

CurrencyInput.propTypes = {
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  currency: PropTypes.oneOf(['ARS', 'USD']),
  placeholder: PropTypes.string,
  className: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  id: PropTypes.string,
};

export default CurrencyInput;
