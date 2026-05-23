import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  IoSwapHorizontalOutline,
  IoPricetagOutline,
  IoTimeOutline,
  IoDocumentTextOutline,
} from 'react-icons/io5';
import {
  formSectionAccent,
  formSectionAccentTitle,
  inputClass,
  labelClass,
  selectClass,
  alertSuccess,
} from './propiedadesTheme';

const TemporaryRentalOptions = ({ formData, handleChange, onAmenitiesChange }) => {
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  useEffect(() => {
    if (formData.amenities) {
      if (typeof formData.amenities === 'string') {
        try {
          setSelectedAmenities(JSON.parse(formData.amenities));
        } catch {
          setSelectedAmenities([]);
        }
      } else if (Array.isArray(formData.amenities)) {
        setSelectedAmenities(formData.amenities);
      }
    }
  }, [formData.amenities]);

  const amenityOptions = [
    'WiFi',
    'Aire acondicionado',
    'TV',
    'Cocina completa',
    'Secadora',
    'Lavarropas',
    'Pileta',
    'Jardín',
    'Garaje',
    'Balcón',
    'Terraza',
    'Estacionamiento',
    'Ascensor',
    'Amueblado',
    'Microondas',
    'Lavavajillas',
    'Horno',
    'Heladera',
  ];

  const toggleAmenity = (amenity) => {
    const updated = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter((a) => a !== amenity)
      : [...selectedAmenities, amenity];
    setSelectedAmenities(updated);
    onAmenitiesChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Sección de Precios */}
      <div className={formSectionAccent}>
        <h4 className={formSectionAccentTitle}>
          <IoPricetagOutline className="w-5 h-5" /> Precios de Alquiler
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>
              Precio por Noche (ARS) *
            </label>
            <input
              type="number"
              name="temporaryRentalPricePerNight"
              value={formData.temporaryRentalPricePerNight || ''}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={inputClass}
              placeholder="Ej: 150.00"
              required
            />
          </div>

          <div>
            <label className={labelClass}>
              Precio por Semana (ARS)
            </label>
            <input
              type="number"
              name="temporaryRentalPricePerWeek"
              value={formData.temporaryRentalPricePerWeek || ''}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={inputClass}
              placeholder="Ej: 900.00"
            />
          </div>

          <div>
            <label className={labelClass}>
              Precio por Mes (ARS)
            </label>
            <input
              type="number"
              name="temporaryRentalPricePerMonth"
              value={formData.temporaryRentalPricePerMonth || ''}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={inputClass}
              placeholder="Ej: 3000.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className={labelClass}>
              Tarifa de Limpieza (ARS)
            </label>
            <input
              type="number"
              name="temporaryRentalCleaningFee"
              value={formData.temporaryRentalCleaningFee || ''}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={inputClass}
              placeholder="Ej: 50.00"
            />
          </div>

          <div>
            <label className={labelClass}>
              Comisión (%) *
            </label>
            <input
              type="number"
              name="temporaryRentalCommissionPercentage"
              value={formData.temporaryRentalCommissionPercentage || 15}
              onChange={handleChange}
              step="0.01"
              min="0"
              max="100"
              className={inputClass}
              placeholder="Ej: 15"
              required
            />
          </div>
        </div>
      </div>

      {/* Sección de Disponibilidad */}
      <div className={formSectionAccent}>
        <h4 className={formSectionAccentTitle}>
          <IoSwapHorizontalOutline className="w-5 h-5" /> Disponibilidad
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>
              Estadía Mínima (noches) *
            </label>
            <input
              type="number"
              name="temporaryRentalMinimumStay"
              value={formData.temporaryRentalMinimumStay || 1}
              onChange={handleChange}
              min="1"
              className={inputClass}
              placeholder="Ej: 3"
              required
            />
          </div>

          <div>
            <label className={labelClass}>
              Estadía Máxima (noches)
            </label>
            <input
              type="number"
              name="temporaryRentalMaximumStay"
              value={formData.temporaryRentalMaximumStay || ''}
              onChange={handleChange}
              min="1"
              className={inputClass}
              placeholder="Ej: 90"
            />
          </div>

          <div>
            <label className={labelClass}>
              Publicar en Landing *
            </label>
            <select
              name="temporaryRentalIsPublished"
              value={formData.temporaryRentalIsPublished ? 'true' : 'false'}
              onChange={(e) =>
                handleChange({
                  target: {
                    name: 'temporaryRentalIsPublished',
                    type: 'checkbox',
                    checked: e.target.value === 'true',
                  },
                })
              }
              className={selectClass}
            >
              <option value="false">No publicado</option>
              <option value="true">Publicado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sección de Horarios */}
      <div className={formSectionAccent}>
        <h4 className={formSectionAccentTitle}>
          <IoTimeOutline className="w-5 h-5" /> Horarios de Check-in/Check-out
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Hora Check-in
            </label>
            <input
              type="time"
              name="temporaryRentalCheckInTime"
              value={formData.temporaryRentalCheckInTime || '15:00'}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Hora Check-out
            </label>
            <input
              type="time"
              name="temporaryRentalCheckOutTime"
              value={formData.temporaryRentalCheckOutTime || '11:00'}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Sección de Comodidades */}
      <div className={formSectionAccent}>
        <h4 className={formSectionAccentTitle}>
          ✨ Comodidades / Amenities
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {amenityOptions.map((amenity) => (
            <label
              key={amenity}
              className="flex items-center space-x-2 p-2 rounded hover:bg-brand-subtle transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
                className="rounded w-4 h-4 text-brand focus:ring-brand border-borderStrong"
              />
              <span className="text-sm text-textSecondary">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={formSectionAccent}>
        <h4 className={formSectionAccentTitle}>
          <IoDocumentTextOutline className="w-5 h-5" /> Descripción y Reglas
        </h4>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>
              Título de la Propiedad *
            </label>
            <input
              type="text"
              name="temporaryRentalTitle"
              value={formData.temporaryRentalTitle || ''}
              onChange={handleChange}
              maxLength="255"
              className={inputClass}
              placeholder="Ej: Casa frente al mar - Mar del Plata"
              required
            />
            <p className="text-xs text-textMuted mt-1">
              {(formData.temporaryRentalTitle || '').length}/255 caracteres
            </p>
          </div>

          <div>
            <label className={labelClass}>
              Descripción Detallada
            </label>
            <textarea
              name="temporaryRentalDescription"
              value={formData.temporaryRentalDescription || ''}
              onChange={handleChange}
              rows="4"
              className={inputClass}
              placeholder="Describe la propiedad, sus características especiales, vistas, ubicación estratégica..."
            />
          </div>

          <div>
            <label className={labelClass}>
              Reglas de la Propiedad
            </label>
            <textarea
              name="temporaryRentalRules"
              value={formData.temporaryRentalRules || ''}
              onChange={handleChange}
              rows="3"
              className={inputClass}
              placeholder="Ej: No fumar, sin mascotas, cuidar las plantas, no hacer ruido después de las 22:00..."
            />
          </div>
        </div>
      </div>

      <div className={alertSuccess}>
        <p className="text-sm">
          <strong>Nota:</strong> Una vez guardada la propiedad, podrás crear un alquiler temporal en la pestaña de
          &ldquo;Alquileres Temporales&rdquo; del panel admin, donde podrás configurar el calendario de disponibilidad y gestionar
          las reservas.
        </p>
      </div>
    </div>
  );
};

TemporaryRentalOptions.propTypes = {
  formData: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  onAmenitiesChange: PropTypes.func.isRequired,
};

export default TemporaryRentalOptions;
