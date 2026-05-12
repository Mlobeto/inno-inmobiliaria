import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  IoSwapHorizontalOutline,
  IoPricetagOutline,
  IoTimeOutline,
  IoDocumentTextOutline,
} from 'react-icons/io5';

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
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border-l-4 border-emerald-500">
        <h4 className="font-bold text-emerald-900 flex items-center gap-2 mb-4">
          <IoPricetagOutline className="w-5 h-5" /> Precios de Alquiler
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio por Noche (ARS) *
            </label>
            <input
              type="number"
              name="temporaryRentalPricePerNight"
              value={formData.temporaryRentalPricePerNight || ''}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ej: 150.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio por Semana (ARS)
            </label>
            <input
              type="number"
              name="temporaryRentalPricePerWeek"
              value={formData.temporaryRentalPricePerWeek || ''}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ej: 900.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio por Mes (ARS)
            </label>
            <input
              type="number"
              name="temporaryRentalPricePerMonth"
              value={formData.temporaryRentalPricePerMonth || ''}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ej: 3000.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarifa de Limpieza (ARS)
            </label>
            <input
              type="number"
              name="temporaryRentalCleaningFee"
              value={formData.temporaryRentalCleaningFee || ''}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ej: 50.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ej: 15"
              required
            />
          </div>
        </div>
      </div>

      {/* Sección de Disponibilidad */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-l-4 border-blue-500">
        <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-4">
          <IoSwapHorizontalOutline className="w-5 h-5" /> Disponibilidad
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estadía Mínima (noches) *
            </label>
            <input
              type="number"
              name="temporaryRentalMinimumStay"
              value={formData.temporaryRentalMinimumStay || 1}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: 3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estadía Máxima (noches)
            </label>
            <input
              type="number"
              name="temporaryRentalMaximumStay"
              value={formData.temporaryRentalMaximumStay || ''}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: 90"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="false">No publicado</option>
              <option value="true">Publicado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sección de Horarios */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border-l-4 border-orange-500">
        <h4 className="font-bold text-orange-900 flex items-center gap-2 mb-4">
          <IoTimeOutline className="w-5 h-5" /> Horarios de Check-in/Check-out
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora Check-in
            </label>
            <input
              type="time"
              name="temporaryRentalCheckInTime"
              value={formData.temporaryRentalCheckInTime || '15:00'}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora Check-out
            </label>
            <input
              type="time"
              name="temporaryRentalCheckOutTime"
              value={formData.temporaryRentalCheckOutTime || '11:00'}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Sección de Comodidades */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-l-4 border-purple-500">
        <h4 className="font-bold text-purple-900 flex items-center gap-2 mb-4">
          ✨ Comodidades / Amenities
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {amenityOptions.map((amenity) => (
            <label
              key={amenity}
              className="flex items-center space-x-2 p-2 rounded hover:bg-purple-200 transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
                className="rounded w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
              />
              <span className="text-sm text-gray-700">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sección de Descripción y Reglas */}
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border-l-4 border-indigo-500">
        <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-4">
          <IoDocumentTextOutline className="w-5 h-5" /> Descripción y Reglas
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título de la Propiedad *
            </label>
            <input
              type="text"
              name="temporaryRentalTitle"
              value={formData.temporaryRentalTitle || ''}
              onChange={handleChange}
              maxLength="255"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej: Casa frente al mar - Mar del Plata"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {(formData.temporaryRentalTitle || '').length}/255 caracteres
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción Detallada
            </label>
            <textarea
              name="temporaryRentalDescription"
              value={formData.temporaryRentalDescription || ''}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Describe la propiedad, sus características especiales, vistas, ubicación estratégica..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reglas de la Propiedad
            </label>
            <textarea
              name="temporaryRentalRules"
              value={formData.temporaryRentalRules || ''}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej: No fumar, sin mascotas, cuidar las plantas, no hacer ruido después de las 22:00..."
            />
          </div>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
        <p className="text-sm text-blue-800">
          <strong>💡 Nota:</strong> Una vez guardada la propiedad, podrás crear un alquiler temporal en la pestaña de
          "Alquileres Temporales" del panel admin, donde podrás configurar el calendario de disponibilidad y gestionar
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
