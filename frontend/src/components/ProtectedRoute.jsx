import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gaming-darker">
        <Loader2 className="animate-spin text-gaming-neon w-12 h-12" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on role if they try to access unauthorized page
    if (user.role === 'OWNER') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/staff" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
