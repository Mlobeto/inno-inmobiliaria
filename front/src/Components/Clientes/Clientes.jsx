import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateClientMutation } from '@shared/redux';
import { PROVINCIAS_ARGENTINA, getCiudadesByProvincia } from '@shared/constants/argentinLocations';
import { getCountryConfig, validateDocument } from '@shared/constants/countryConfigs';
import { toast } from 'react-toastify';
import {
  IoPersonAddOutline,
  IoPersonOutline,
  IoMailOutline,
  IoLocationOutline,
  IoPhonePortraitOutline,
  IoCardOutline,
  IoSaveOutline,
  IoWarningOutline,
} from 'react-icons/io5';
import { AdminPanelLayout } from '../Admin/AdminPanelLayout';
import {
  alertError,
  btnPrimary,
  btnSecondary,
  card,
  inputClass,
  labelClass,
  selectClass,
} from '../Admin/adminPanelTheme';

const inputErr =
  'w-full bg-bgElevated border border-customRed/50 rounded-lg px-3 py-2 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-customRed focus:border-transparent';

const initialState = {
  cuil: '',
  name: '',
  email: '',
  direccion: '',
  ciudad: '',
  provincia: '',
  codigoPostal: '',
  mobilePhone: '',
};

function FieldLabel({ icon: Icon, htmlFor, children, hint }) {
  return (
    <label htmlFor={htmlFor} className={`${labelClass} flex items-center gap-1.5`}>
      {Icon && <Icon className="w-3.5 h-3.5 text-brand-light shrink-0" aria-hidden />}
      <span>{children}</span>
      {hint && <span className="text-textMuted font-normal">({hint})</span>}
    </label>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 mt-1 text-customRed text-xs">
      <IoWarningOutline className="w-3.5 h-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

const CreateClientForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialState);
  const [validationErrors, setValidationErrors] = useState({});
  const [cities, setCities] = useState([]);
  const [tenantCountry] = useState('AR');
  const countryConfig = getCountryConfig(tenantCountry);

  const [createClient, { isLoading, isError, error }] = useCreateClientMutation();

  useEffect(() => {
    if (formData.provincia) {
      const provinciaObj = PROVINCIAS_ARGENTINA.find((p) => p.name === formData.provincia);
      setCities(provinciaObj ? getCiudadesByProvincia(provinciaObj.id) : []);
    } else {
      setCities([]);
    }
  }, [formData.provincia]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'provincia') {
      setFormData({ ...formData, provincia: value, ciudad: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateCUIL = (cuil) => {
    if (!countryConfig) return false;
    const documentCode = countryConfig.documentTypes.person.tax.type;
    return validateDocument(cuil, documentCode, tenantCountry);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const errors = { ...validationErrors };

    if (name === 'cuil' && value && !validateCUIL(value)) {
      const docType = countryConfig?.documentTypes.person.tax.type || 'CUIL';
      const docFormat = countryConfig?.documentTypes.person.tax.placeholder || 'XX-XXXXXXXX-X';
      errors.cuil = `Formato ${docType}: ${docFormat}`;
    } else if (name === 'cuil') {
      delete errors.cuil;
    }

    if (name === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
      errors.email = 'Email inválido';
    } else if (name === 'email') {
      delete errors.email;
    }

    if (name === 'mobilePhone' && value && !/^\d{10}$/.test(value)) {
      errors.mobilePhone = '10 dígitos (sin 0 ni 15)';
    } else if (name === 'mobilePhone') {
      delete errors.mobilePhone;
    }

    if (name === 'codigoPostal' && value && !/^\d{4}$/.test(value)) {
      errors.codigoPostal = '4 dígitos';
    } else if (name === 'codigoPostal') {
      delete errors.codigoPostal;
    }

    setValidationErrors(errors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.keys(validationErrors).length > 0) {
      toast.error('Corregí los errores antes de continuar');
      return;
    }

    try {
      await createClient(formData).unwrap();
      toast.success('Cliente creado con éxito');
      setFormData(initialState);
      setTimeout(() => navigate('/panelClientes'), 1200);
    } catch (err) {
      const errorMsg = err?.data?.details || err?.data?.error || 'Error al crear el cliente';
      toast.error(errorMsg);
    }
  };

  const docLabel = countryConfig?.documentTypes.person.tax.label || 'CUIL';
  const docPlaceholder = countryConfig?.documentTypes.person.tax.placeholder || 'XX-XXXXXXXX-X';
  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <AdminPanelLayout
      backTo="/panelClientes"
      backLabel="Clientes"
      title="Nuevo cliente"
      subtitle="Contacto y domicilio — el rol se asigna al vincular propiedades o contratos"
      icon={IoPersonAddOutline}
    >
      <div className="max-w-5xl">
        {isError && (
          <div className={`${alertError} mb-3 py-2`}>
            <IoWarningOutline className="w-4 h-4 shrink-0" />
            {error?.data?.details || error?.data?.error || 'Error al crear el cliente'}
          </div>
        )}

        <div className={`${card} p-4 sm:p-5`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-3 gap-y-3">
              <div>
                <FieldLabel icon={IoCardOutline} htmlFor="cuil" hint={countryConfig?.name || 'AR'}>
                  {docLabel}
                </FieldLabel>
                <input
                  type="text"
                  id="cuil"
                  name="cuil"
                  value={formData.cuil}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={validationErrors.cuil ? inputErr : inputClass}
                  placeholder={docPlaceholder}
                  required
                />
                <FieldError message={validationErrors.cuil} />
              </div>

              <div>
                <FieldLabel icon={IoPersonOutline} htmlFor="name">
                  Nombre completo
                </FieldLabel>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Apellido y nombre"
                  required
                />
              </div>

              <div>
                <FieldLabel icon={IoMailOutline} htmlFor="email">
                  Email
                </FieldLabel>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={validationErrors.email ? inputErr : inputClass}
                  placeholder="email@ejemplo.com"
                />
                <FieldError message={validationErrors.email} />
              </div>

              <div>
                <FieldLabel icon={IoPhonePortraitOutline} htmlFor="mobilePhone">
                  Teléfono móvil
                </FieldLabel>
                <input
                  type="text"
                  id="mobilePhone"
                  name="mobilePhone"
                  value={formData.mobilePhone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={validationErrors.mobilePhone ? inputErr : inputClass}
                  placeholder="10 dígitos"
                  required
                />
                <FieldError message={validationErrors.mobilePhone} />
              </div>
            </div>

            <div className="border-t border-borderBase pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-textSecondary flex items-center gap-1.5 mb-3">
                <IoLocationOutline className="w-3.5 h-3.5 text-brand-light" aria-hidden />
                Domicilio
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-x-3 gap-y-3">
                <div className="xl:col-span-3">
                  <FieldLabel htmlFor="provincia">Provincia</FieldLabel>
                  <select
                    id="provincia"
                    name="provincia"
                    value={formData.provincia}
                    onChange={handleChange}
                    className={`${selectClass} w-full py-2`}
                    required
                  >
                    <option value="">Seleccionar</option>
                    {PROVINCIAS_ARGENTINA.map((prov) => (
                      <option key={prov.id} value={prov.name}>
                        {prov.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="xl:col-span-3">
                  <FieldLabel htmlFor="ciudad">Ciudad</FieldLabel>
                  <select
                    id="ciudad"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    className={`${selectClass} w-full py-2 disabled:opacity-50`}
                    required
                    disabled={!formData.provincia}
                  >
                    <option value="">
                      {formData.provincia ? 'Seleccionar' : 'Elegí provincia'}
                    </option>
                    {cities.map((city, index) => (
                      <option key={`${city}-${index}`} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="xl:col-span-2">
                  <FieldLabel htmlFor="codigoPostal">C.P.</FieldLabel>
                  <input
                    type="text"
                    id="codigoPostal"
                    name="codigoPostal"
                    value={formData.codigoPostal}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={validationErrors.codigoPostal ? inputErr : inputClass}
                    placeholder="4700"
                    required
                  />
                  <FieldError message={validationErrors.codigoPostal} />
                </div>

                <div className="sm:col-span-2 xl:col-span-4">
                  <FieldLabel htmlFor="direccion">Dirección</FieldLabel>
                  <input
                    type="text"
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Calle, número, piso, depto"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-borderBase">
              {hasErrors ? (
                <p className="text-customRed text-xs flex items-center gap-1">
                  <IoWarningOutline className="w-3.5 h-3.5" aria-hidden />
                  Revisá los campos marcados
                </p>
              ) : (
                <p className="text-xs text-textMuted hidden sm:block">
                  Podés editar estos datos después desde el listado
                </p>
              )}

              <div className="flex gap-2 sm:ml-auto">
                <button
                  type="button"
                  onClick={() => navigate('/panelClientes')}
                  className={btnSecondary}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || hasErrors}
                  className={`${btnPrimary} px-5`}
                >
                  <IoSaveOutline className="w-4 h-4" />
                  {isLoading ? 'Guardando…' : hasErrors ? 'Revisar datos' : 'Crear cliente'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminPanelLayout>
  );
};

export default CreateClientForm;
