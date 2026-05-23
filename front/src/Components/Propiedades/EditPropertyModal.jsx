import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { updateProperty, getAllProperties } from '../../redux/Actions/actions';
import { useDolarRate } from '../hooks/useDolarRate';
import { formatCurrency, calcularComision } from '../../utils/formatCurrency';
import CurrencyInput from './CurrencyInput';
import { 
  IoCloseOutline, 
  IoSaveOutline,
  IoHomeOutline,
  IoPricetagOutline,
 
  IoDocumentTextOutline,
  IoBedOutline,
  IoWaterOutline,
  IoResizeOutline,
  
  IoLinkOutline
} from 'react-icons/io5';
import Swal from 'sweetalert2';
import {
  modalOverlay,
  modalBox,
  modalHeader,
  btnPrimary,
  btnSecondary,
  inputClass,
  selectClass,
  labelClass,
  formSectionAccent,
  formSectionAccentTitle,
} from './propiedadesTheme';

const EditPropertyModal = ({ property, onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    address: '',
    neighborhood: '',
    city: '',
    type: 'venta',
    typeProperty: 'casa',
    price: '',
    precioReferencia: '',
    rooms: '',
    bathrooms: '',
    comision: '',
    escritura: '',
    matriculaOPadron: '',
    frente: '',
    profundidad: '',
    linkInstagram: '',
    linkMaps: '',
    description: '',
    highlights: '',
    inventory: '',
    superficieCubierta: '',
    superficieTotal: '',
    isAvailable: true,
    socio: '',
    plantType: '',
    plantQuantity: '',
    requisito: '',
    rentalType: 'TRADICIONAL',
    minStayDays: '',
    currency: 'ARS',
    // Campos para alquileres temporales
    temporaryRentalTitle: '',
    temporaryRentalDescription: '',
    temporaryRentalPricePerNight: '',
    temporaryRentalPricePerWeek: '',
    temporaryRentalPricePerMonth: '',
    temporaryRentalCleaningFee: '',
    temporaryRentalCommissionPercentage: 15,
    temporaryRentalMinimumStay: 1,
    temporaryRentalMaximumStay: '',
    temporaryRentalCheckInTime: '15:00',
    temporaryRentalCheckOutTime: '11:00',
    temporaryRentalRules: '',
    amenities: [],
    temporaryRentalIsPublished: false,
  });
  
  const [loading, setLoading] = useState(false);
  const { dolar, loading: dolarLoading } = useDolarRate();

  useEffect(() => {
    if (property) {
      setFormData({
        address: property.address || '',
        neighborhood: property.neighborhood || '',
        city: property.city || '',
        type: property.type || 'venta',
        typeProperty: property.typeProperty || 'casa',
        price: property.price || '',
        precioReferencia: property.precioReferencia || '',
        rooms: property.rooms || '',
        bathrooms: property.bathrooms || '',
        comision: property.comision || '',
        escritura: property.escritura || '',
        matriculaOPadron: property.matriculaOPadron || '',
        frente: property.frente || '',
        profundidad: property.profundidad || '',
        linkInstagram: property.linkInstagram || '',
        linkMaps: property.linkMaps || '',
        description: property.description || '',
        highlights: property.highlights || '',
        inventory: property.inventory || '',
        superficieCubierta: property.superficieCubierta || '',
        superficieTotal: property.superficieTotal || '',
        isAvailable: property.isAvailable ?? true,
        socio: property.socio || '',
        plantType: property.plantType || '',
        plantQuantity: property.plantQuantity || '',
        requisito: property.requisito || '',
        rentalType: property.rentalType || 'TRADICIONAL',
        minStayDays: property.minStayDays || '',
        currency: property.currency || 'ARS',
        // Campos de alquiler temporal (se cargarán después si existen en DB)
        temporaryRentalTitle: '',
        temporaryRentalDescription: '',
        temporaryRentalPricePerNight: '',
        temporaryRentalPricePerWeek: '',
        temporaryRentalPricePerMonth: '',
        temporaryRentalCleaningFee: '',
        temporaryRentalCommissionPercentage: 15,
        temporaryRentalMinimumStay: 1,
        temporaryRentalMaximumStay: '',
        temporaryRentalCheckInTime: '15:00',
        temporaryRentalCheckOutTime: '11:00',
        temporaryRentalRules: '',
        amenities: [],
        temporaryRentalIsPublished: false,
      });
    }
  }, [property]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.address || !formData.neighborhood || !formData.city || !formData.price) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor completa todos los campos obligatorios (dirección, barrio, ciudad, precio)'
      });
      return;
    }

    try {
      setLoading(true);
      await dispatch(updateProperty(property.propertyId, formData));
      await dispatch(getAllProperties());
      
      Swal.fire({
        icon: 'success',
        title: '¡Actualizado!',
        text:
          'La propiedad se actualizó correctamente. Si está publicada en Mercado Libre, el aviso se sincroniza en segundo plano (precio, fotos, descripción).',
        timer: 3500,
        showConfirmButton: false
      });
      
      onClose();
    } catch (error) {
      console.error('Error al actualizar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar la propiedad'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!property) return null;

  return (
    <div className={modalOverlay}>
      <div className={`${modalBox} max-w-5xl my-8`}>
        <div className={`${modalHeader} bg-brand-subtle/40 rounded-t-xl`}>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-textPrimary">
              <IoHomeOutline className="text-3xl text-brand-light" />
              Editar Propiedad
            </h2>
            <p className="text-textSecondary text-sm mt-1">ID: {property.propertyId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-brand-subtle rounded-full transition-colors text-textSecondary hover:text-textPrimary"
          >
            <IoCloseOutline className="text-2xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Básica */}
            <div className={`col-span-2 ${formSectionAccent}`}>
              <h3 className={formSectionAccentTitle}>
                <IoHomeOutline /> Información Básica
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>
                    Dirección *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
                
                <div>
                  <label className={labelClass}>
                    Barrio *
                  </label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
                
                <div>
                  <label className={labelClass}>
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Tipo de Operación *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="venta">Venta</option>
                    <option value="alquiler">Alquiler</option>
                  </select>
                </div>

                {formData.type === 'alquiler' && (
                  <div>
                    <label className={labelClass}>
                      Modalidad de Alquiler
                    </label>
                    <select
                      name="rentalType"
                      value={formData.rentalType}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="TRADICIONAL">Alquiler Tradicional</option>
                      <option value="TEMPORAL">Alquiler Temporal (Turismo)</option>
                    </select>
                  </div>
                )}

                {formData.type === 'alquiler' && formData.rentalType === 'TEMPORAL' && (
                  <div>
                    <label className={labelClass}>
                      Estadía Mínima (días)
                    </label>
                    <input
                      type="number"
                      name="minStayDays"
                      value={formData.minStayDays}
                      onChange={handleChange}
                      min="1"
                      className={inputClass}
                      placeholder="Ej: 2"
                    />
                  </div>
                )}

                <div>
                  <label className={labelClass}>
                    Tipo de Propiedad *
                  </label>
                  <select
                    name="typeProperty"
                    value={formData.typeProperty}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="casa">Casa</option>
                    <option value="departamento">Departamento</option>
                    <option value="terreno">Terreno</option>
                    <option value="lote">Lote</option>
                    <option value="local">Local</option>
                    <option value="oficina">Oficina</option>
                    <option value="finca">Finca</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm text-textSecondary">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={formData.isAvailable}
                      onChange={handleChange}
                      className="rounded border-borderStrong text-brand focus:ring-brand"
                    />
                    <span>Disponible</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Precio y Comisión */}
            <div className={`col-span-2 ${formSectionAccent}`}>
              <h3 className={formSectionAccentTitle}>
                <IoPricetagOutline /> Precio y Comisión
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Moneda + Precio */}
                <div className="md:col-span-3">
                  <label className={labelClass}>
                    Moneda y Precio *
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className={`${selectClass} min-w-[90px]`}
                    >
                      <option value="ARS">$ ARS</option>
                      <option value="USD">U$D USD</option>
                    </select>
                    <CurrencyInput
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      currency={formData.currency}
                      placeholder={formData.currency === 'USD' ? 'Precio en USD' : 'Precio en pesos'}
                      className={`${inputClass} flex-1`}
                      required
                    />
                  </div>

                  {formData.currency === 'USD' && (
                    <div className="mt-2 p-3 bg-customYellowMuted border border-customYellow/30 rounded-lg text-xs text-customYellow">
                      {dolarLoading ? (
                        <p className="text-customYellow">Obteniendo cotización...</p>
                      ) : dolar ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-textSecondary">
                            <span>Dólar Oficial venta:</span>
                            <span className="font-semibold">{formatCurrency(dolar.oficial?.venta, 'ARS')}</span>
                          </div>
                          <div className="flex justify-between text-textSecondary">
                            <span>Dólar Blue venta:</span>
                            <span className="font-semibold">{formatCurrency(dolar.blue?.venta, 'ARS')}</span>
                          </div>
                          {formData.price && (
                            <>
                              <div className="border-t border-customYellow/30 pt-1 mt-1">
                                <div className="flex justify-between">
                                  <span className="text-customYellow">Equiv. Oficial:</span>
                                  <span className="text-customYellow font-semibold">
                                    {formatCurrency(parseFloat(formData.price) * (dolar.oficial?.venta || 0), 'ARS')}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-brand-light">Equiv. Blue:</span>
                                  <span className="text-brand-light font-semibold">
                                    {formatCurrency(parseFloat(formData.price) * (dolar.blue?.venta || 0), 'ARS')}
                                  </span>
                                </div>
                              </div>
                              {formData.comision && (
                                <div className="border-t border-customYellow/30 pt-1 mt-1">
                                  <p className="text-textMuted mb-0.5">Comisión {formData.comision}%:</p>
                                  {(() => {
                                    const { comisionOriginal, comisionARS: comArsOficial } = calcularComision(formData.price, 'USD', formData.comision, dolar.oficial?.venta);
                                    const { comisionARS: comArsBlue } = calcularComision(formData.price, 'USD', formData.comision, dolar.blue?.venta);
                                    return (
                                      <>
                                        <div className="flex justify-between">
                                          <span>En USD:</span>
                                          <span>USD {comisionOriginal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                                        </div>
                                        <div className="flex justify-between text-customYellow">
                                          <span>En ARS (Oficial):</span>
                                          <span>{formatCurrency(comArsOficial, 'ARS')}</span>
                                        </div>
                                        <div className="flex justify-between text-brand-light">
                                          <span>En ARS (Blue):</span>
                                          <span>{formatCurrency(comArsBlue, 'ARS')}</span>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              )}
                            </>
                          )}
                          <p className="text-textMuted text-[10px] mt-1">Actualizado: {dolar.lastUpdate ? new Date(dolar.lastUpdate).toLocaleString('es-AR') : '—'}</p>
                        </div>
                      ) : (
                        <p className="text-customRed">No se pudo obtener la cotización</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className={labelClass}>
                    Precio Referencia
                  </label>
                  <CurrencyInput
                    name="precioReferencia"
                    value={formData.precioReferencia}
                    onChange={handleChange}
                    currency={formData.currency}
                    className={inputClass}
                  />
                </div>
                
                <div>
                  <label className={labelClass}>
                    Comisión (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="comision"
                    value={formData.comision}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Características */}
            <div className={`col-span-2 ${formSectionAccent}`}>
              <h3 className={formSectionAccentTitle}>
                <IoBedOutline /> Características
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>
                    Habitaciones
                  </label>
                  <input
                    type="number"
                    name="rooms"
                    value={formData.rooms}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                
                <div>
                  <label className={labelClass}>
                    Baños
                  </label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Sup. Cubierta (m²)
                  </label>
                  <input
                    type="number"
                    name="superficieCubierta"
                    value={formData.superficieCubierta}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Sup. Total (m²)
                  </label>
                  <input
                    type="number"
                    name="superficieTotal"
                    value={formData.superficieTotal}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Medidas (para lotes) */}
            <div className={`col-span-2 ${formSectionAccent}`}>
              <h3 className={formSectionAccentTitle}>
                <IoResizeOutline /> Medidas (Lotes)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Frente (m)
                  </label>
                  <input
                    type="text"
                    name="frente"
                    value={formData.frente}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                
                <div>
                  <label className={labelClass}>
                    Profundidad (m)
                  </label>
                  <input
                    type="text"
                    name="profundidad"
                    value={formData.profundidad}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Documentación */}
            <div className={`col-span-2 ${formSectionAccent}`}>
              <h3 className={formSectionAccentTitle}>
                <IoDocumentTextOutline /> Documentación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Escritura *
                  </label>
                  <input
                    type="text"
                    name="escritura"
                    value={formData.escritura}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
                
                <div>
                  <label className={labelClass}>
                    Matrícula o Padrón
                  </label>
                  <input
                    type="text"
                    name="matriculaOPadron"
                    value={formData.matriculaOPadron}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Socio
                  </label>
                  <input
                    type="text"
                    name="socio"
                    value={formData.socio}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Links */}
            <div className={`col-span-2 ${formSectionAccent}`}>
              <h3 className={formSectionAccentTitle}>
                <IoLinkOutline /> Enlaces
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Link Google Maps
                  </label>
                  <input
                    type="url"
                    name="linkMaps"
                    value={formData.linkMaps}
                    onChange={handleChange}
                    placeholder="https://maps.app.goo.gl/..."
                    className={inputClass}
                  />
                </div>
                
                <div>
                  <label className={labelClass}>
                    Link Instagram
                  </label>
                  <input
                    type="url"
                    name="linkInstagram"
                    value={formData.linkInstagram}
                    onChange={handleChange}
                    placeholder="https://www.instagram.com/..."
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Requisitos de Alquiler - Solo para propiedades en alquiler */}
            {formData.type === "alquiler" && (
              <div className={`col-span-2 ${formSectionAccent}`}>
                <h3 className={formSectionAccentTitle}>
                  <IoDocumentTextOutline /> Requisitos de Alquiler
                </h3>
                <div>
                  <label className={labelClass}>
                    Requisitos Específicos
                  </label>
                  <textarea
                    name="requisito"
                    value={formData.requisito}
                    onChange={handleChange}
                    rows="10"
                    placeholder="Deja en blanco para usar la plantilla por defecto..."
                    className={`${inputClass} font-mono text-sm`}
                  />
                  <p className="text-textMuted text-xs mt-1">
                    Si no completas este campo, se usará la plantilla estándar de requisitos
                  </p>
                </div>
              </div>
            )}

            {/* Finca (si aplica) */}
            <div className={`col-span-2 ${formSectionAccent}`}>
              <h3 className={formSectionAccentTitle}>
                <IoWaterOutline /> Información de Finca
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Tipo de Planta
                  </label>
                  <input
                    type="text"
                    name="plantType"
                    value={formData.plantType}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                
                <div>
                  <label className={labelClass}>
                    Cantidad de Plantas
                  </label>
                  <input
                    type="number"
                    name="plantQuantity"
                    value={formData.plantQuantity}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Descripciones */}
            <div className="col-span-2">
              <label className={labelClass}>
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className={inputClass}
              />
            </div>

            <div className="col-span-2">
              <label className={labelClass}>
                Destacados
              </label>
              <textarea
                name="highlights"
                value={formData.highlights}
                onChange={handleChange}
                rows="3"
                className={inputClass}
              />
            </div>

            <div className="col-span-2">
              <label className={labelClass}>
                Inventario
              </label>
              <textarea
                name="inventory"
                value={formData.inventory}
                onChange={handleChange}
                rows="6"
                className={`${inputClass} font-mono text-sm`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-borderBase">
            <button type="button" onClick={onClose} className={btnSecondary}>
              <IoCloseOutline className="text-xl" />
              Cancelar
            </button>
            <button type="submit" disabled={loading} className={btnPrimary}>
              <IoSaveOutline className="text-xl" />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

EditPropertyModal.propTypes = {
  property: PropTypes.object,
  onClose: PropTypes.func.isRequired
};

export default EditPropertyModal;
