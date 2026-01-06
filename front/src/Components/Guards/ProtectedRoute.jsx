import ProfileCompletionGuard from './ProfileCompletionGuard';
import SubscriptionGuard from './SubscriptionGuard';

/**
 * Componente que combina ambos guards para simplificar su uso
 */
const ProtectedRoute = ({ children }) => {
  return (
    <ProfileCompletionGuard>
      <SubscriptionGuard>
        {children}
      </SubscriptionGuard>
    </ProfileCompletionGuard>
  );
};

export default ProtectedRoute;
