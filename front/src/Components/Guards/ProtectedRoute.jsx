import ProfileCompletionGuard from './ProfileCompletionGuard';
import SubscriptionGuard from './SubscriptionGuard';
import RestrictedAgentRoutes from './RestrictedAgentRoutes';

/**
 * Componente que combina ambos guards para simplificar su uso
 */
const ProtectedRoute = ({ children }) => {
  return (
    <ProfileCompletionGuard>
      <SubscriptionGuard>
        <RestrictedAgentRoutes>{children}</RestrictedAgentRoutes>
      </SubscriptionGuard>
    </ProfileCompletionGuard>
  );
};

export default ProtectedRoute;
