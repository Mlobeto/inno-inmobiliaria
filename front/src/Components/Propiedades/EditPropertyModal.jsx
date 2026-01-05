import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { updateProperty, getAllProperties } from '../../redux/Actions/actions';
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
    requisito: ''
  });
  
  const [loading, setLoading] = useState(false);

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
        requisito: property.requisito || ''
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
        text: 'La propiedad se actualizó correctamente',
        timer: 2000,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <IoHomeOutline className="text-3xl" />
              Editar Propiedad
            </h2>
            <p className="text-blue-100 text-sm mt-1">ID: {property.propertyId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <IoCloseOutline className="text-2xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Básica */}
            <div className="col-span-2 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-4">
                <IoHomeOutline /> Información Básica
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barrio *
                  </label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Operación *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="venta">Venta</option>
                    <option value="alquiler">Alquiler</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Propiedad *
                  </label>
                  <select
                    name="typeProperty"
                    value={formData.typeProperty}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={formData.isAvailable}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Disponible</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Precio y Comisión */}
            <div className="col-span-2 bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <h3 className="font-bold text-green-900 flex items-center gap-2 mb-4">
                <IoPricetagOutline /> Precio y Comisión
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Referencia
                  </label>
                  <input
                    type="number"
                    name="precioReferencia"
                    value={formData.precioReferencia}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comisión (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="comision"
                    value={formData.comision}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Características */}
            <div className="col-span-2 bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
              <h3 className="font-bold text-purple-900 flex items-center gap-2 mb-4">
                <IoBedOutline /> Características
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Habitaciones
                  </label>
                  <input
                    type="number"
                    name="rooms"
                    value={formData.rooms}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Baños
                  </label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sup. Cubierta (m²)
                  </label>
                  <input
                    type="number"
                    name="superficieCubierta"
                    value={formData.superficieCubierta}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sup. Total (m²)
                  </label>
                  <input
                    type="number"
                    name="superficieTotal"
                    value={formData.superficieTotal}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Medidas (para lotes) */}
            <div className="col-span-2 bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
              <h3 className="font-bold text-orange-900 flex items-center gap-2 mb-4">
                <IoResizeOutline /> Medidas (Lotes)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frente (m)
                  </label>
                  <input
                    type="text"
                    name="frente"
                    value={formData.frente}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profundidad (m)
                  </label>
                  <input
                    type="text"
                    name="profundidad"
                    value={formData.profundidad}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Documentación */}
            <div className="col-span-2 bg-gray-50 p-4 rounded-lg border-l-4 border-gray-500">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <IoDocumentTextOutline /> Documentación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Escritura *
                  </label>
                  <input
                    type="text"
                    name="escritura"
                    value={formData.escritura}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Matrícula o Padrón
                  </label>
                  <input
                    type="text"
                    name="matriculaOPadron"
                    value={formData.matriculaOPadron}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Socio
                  </label>
                  <input
                    type="text"
                    name="socio"
                    value={formData.socio}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="col-span-2 bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
              <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-4">
                <IoLinkOutline /> Enlaces
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link Google Maps
                  </label>
                  <input
                    type="url"
                    name="linkMaps"
                    value={formData.linkMaps}
                    onChange={handleChange}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link Instagram
                  </label>
                  <input
                    type="url"
                    name="linkInstagram"
                    value={formData.linkInstagram}
                    onChange={handleChange}
                    placeholder="https://www.instagram.com/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Requisitos de Alquiler - Solo para propiedades en alquiler */}
            {formData.type === "alquiler" && (
              <div className="col-span-2 bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
                <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-4">
                  <IoDocumentTextOutline /> Requisitos de Alquiler
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requisitos Específicos
                  </label>
                  <textarea
                    name="requisito"
                    value={formData.requisito}
                    onChange={handleChange}
                    rows="10"
                    placeholder="Deja en blanco para usar la plantilla por defecto..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-sm"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Si no completas este campo, se usará la plantilla estándar de requisitos
                  </p>
                </div>
              </div>
            )}

            {/* Finca (si aplica) */}
            <div className="col-span-2 bg-lime-50 p-4 rounded-lg border-l-4 border-lime-500">
              <h3 className="font-bold text-lime-900 flex items-center gap-2 mb-4">
                <IoWaterOutline /> Información de Finca
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Planta
                  </label>
                  <input
                    type="text"
                    name="plantType"
                    value={formData.plantType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad de Plantas
                  </label>
                  <input
                    type="number"
                    name="plantQuantity"
                    value={formData.plantQuantity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                  />
                </div>
              </div>
            </div>

            {/* Descripciones */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destacados
              </label>
              <textarea
                name="highlights"
                value={formData.highlights}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inventario
              </label>
              <textarea
                name="inventory"
                value={formData.inventory}
                onChange={handleChange}
                rows="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
              <IoCloseOutline className="text-xl" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
