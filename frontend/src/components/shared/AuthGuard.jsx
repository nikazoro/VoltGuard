import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * AuthGuard component to protect routes
 * @param {string[]} allowedRoles - Array of roles allowed to access this route
 */
export const AuthGuard = ({ children, allowedRoles = [] }) => {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <div className="text-center max-w-md">
                    <h1 className="text-4xl font-bold text-destructive mb-4">Access Denied</h1>
                    <p className="text-muted-foreground mb-6">
                        You don't have permission to access this page.
                    </p>
                    <Navigate to="/" replace />
                </div>
            </div>
        );
    }

    return children;
};

/**
 * PublicRoute component - redirects to dashboard if already logged in
 */
export const PublicRoute = ({ children }) => {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        // Redirect based on role
        const role = user?.role;
        if (role === 'driver') {
            return <Navigate to="/map" replace />;
        } else if (role === 'station_owner') {
            return <Navigate to="/owner/dashboard" replace />;
        } else if (role === 'admin') {
            return <Navigate to="/admin/console" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return children;
};