import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

// eslint-disable-next-line react/prop-types
const ProtectedRoute = ({ children }) => {
  // Selecciona solo la parte necesaria del estado
  const adminInfo = useSelector((state) => state.adminInfo);

  if (!adminInfo || !adminInfo.role) {
    return <Navigate to="/login" />;
  }

  if (adminInfo.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;