import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, User, LogOut, Settings, ChevronDown, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { notificationAPI } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const userMenuRef = useRef(null);
    const notificationRef = useRef(null);

    // Fetch notifications
    const { data: notificationsData } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationAPI.getAll(),
        enabled: isAuthenticated,
        refetchInterval: 30000, // Poll every 30 seconds
    });

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: (notificationId) => notificationAPI.markAsRead(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications']);
        },
    });

    const notifications = notificationsData?.data || [];
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
    };

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            markAsReadMutation.mutate(notification.id);
        }
    };

    const formatNotificationTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;

            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours}h ago`;

            const diffDays = Math.floor(diffHours / 24);
            if (diffDays < 7) return `${diffDays}d ago`;

            return date.toLocaleDateString();
        } catch {
            return timestamp;
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'fault':
                return '⚠️';
            case 'booking':
                return '📅';
            case 'system':
                return '🔔';
            default:
                return '📬';
        }
    };

    return (
        <nav className="border-b bg-background sticky top-0 z-40">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl">
                        <Zap className="h-6 w-6 text-primary" />
                        <span>EcoCharge</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-6">
                        {isAuthenticated && user?.role === 'driver' && (
                            <>
                                <Link to="/map" className="text-sm font-medium hover:text-primary transition-colors">
                                    Find Stations
                                </Link>
                                <Link to="/bookings" className="text-sm font-medium hover:text-primary transition-colors">
                                    My Bookings
                                </Link>
                            </>
                        )}
                        {isAuthenticated && user?.role === 'station_owner' && (
                            <>
                                <Link to="/owner/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                                    Dashboard
                                </Link>
                                <Link to="/owner/stations" className="text-sm font-medium hover:text-primary transition-colors">
                                    My Stations
                                </Link>
                            </>
                        )}
                        {isAuthenticated && user?.role === 'admin' && (
                            <Link to="/admin/console" className="text-sm font-medium hover:text-primary transition-colors">
                                Admin Console
                            </Link>
                        )}
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <>
                                {/* Notifications */}
                                <div className="relative" ref={notificationRef}>
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className="relative p-2 rounded-full hover:bg-accent transition-colors"
                                    >
                                        <Bell className="h-5 w-5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Notification Dropdown */}
                                    {showNotifications && (
                                        <div className="absolute right-0 mt-2 w-96 bg-background border rounded-lg shadow-lg py-2 max-h-[32rem] overflow-y-auto z-50">
                                            <div className="px-4 py-2 border-b sticky top-0 bg-background">
                                                <h3 className="font-semibold">Notifications</h3>
                                                {unreadCount > 0 && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {unreadCount} unread
                                                    </p>
                                                )}
                                            </div>
                                            {notifications.length > 0 ? (
                                                notifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        onClick={() => handleNotificationClick(notification)}
                                                        className={cn(
                                                            'px-4 py-3 hover:bg-accent cursor-pointer border-b last:border-b-0 transition-colors',
                                                            !notification.is_read && 'bg-accent/50'
                                                        )}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <span className="text-xl flex-shrink-0">
                                                                {getNotificationIcon(notification.type)}
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <p className="text-sm font-medium truncate">
                                                                        {notification.title}
                                                                    </p>
                                                                    {!notification.is_read && (
                                                                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                                    {notification.message}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {formatNotificationTime(notification.created_at)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                                                    No notifications
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* User Menu */}
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center gap-2 p-2 rounded-full hover:bg-accent transition-colors"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <ChevronDown className="h-4 w-4" />
                                    </button>

                                    {/* User Dropdown */}
                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-56 bg-background border rounded-lg shadow-lg py-2 z-50">
                                            <div className="px-4 py-2 border-b">
                                                <p className="font-semibold text-sm">{user?.name || user?.email}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigate('/profile');
                                                    setShowUserMenu(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                                            >
                                                <Settings className="h-4 w-4" />
                                                Settings
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" onClick={() => navigate('/login')}>
                                    Login
                                </Button>
                                <Button onClick={() => navigate('/register')}>
                                    Sign Up
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};