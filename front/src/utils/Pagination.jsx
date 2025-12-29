import { useEffect, useState } from 'react';

// eslint-disable-next-line react/prop-types
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const [touchStartX, setTouchStartX] = useState(0);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      onPageChange(page);
    }
  };

  // Manejo de eventos táctiles para "swipe" en dispositivos móviles
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX); // Guardar la posición inicial del toque
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX; // Obtener la posición final del toque
    const diff = touchStartX - touchEndX; // Diferencia entre toque inicial y final

    // Si se desliza hacia la izquierda, avanzar página
    if (diff > 50) {
      handlePageChange(currentPage + 1);
    }

    // Si se desliza hacia la derecha, retroceder página
    if (diff < -50) {
      handlePageChange(currentPage - 1);
    }
  };

  // Manejar la navegación por teclas de flechas izquierda/derecha
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePageChange(currentPage - 1);
      } else if (e.key === 'ArrowRight') {
        handlePageChange(currentPage + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown); // Añadir evento para teclas de flecha

    return () => {
      window.removeEventListener('keydown', handleKeyDown); // Limpiar evento al desmontar el componente
    };
  }, [currentPage, totalPages]);

  // Agregar los eventos de "touchstart" y "touchend" para móviles
  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStartX, currentPage, totalPages]);

  return (
    <div className="pagination">
     
  
    </div>
  );
};

export default Pagination;

