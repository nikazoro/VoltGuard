import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    AlertTriangle, Power, PowerOff, Shield,
    Activity, MapPin, Users, Zap
} from 'lucide-react';
import { adminAPI } from '@/services/api';
import { useAdminAlerts } from '@/hooks/useSocket';
import { useToast } from '@/components/ui/Toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { LoadingScreen } from '@/components/shared/LoadingSpinner';
import { cn } from '@/lib/utils';

const AdminConsole = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [confirmAction, setConfirmAction] = useState(null);
    const [alerts, setAlerts] = useState([]);

    // Fetch all stations
    const { data: stationsData, isLoading } = useQuery({
        queryKey: ['admin', 'stations'],
        queryFn: () => adminAPI.getAllStations(),
        refetchInterval: 30000,
    });

    // Fetch critical faults
    const { data: faultsData } = useQuery({
        queryKey: ['admin', 'faults', 'critical'],
        queryFn: () => adminAPI.getCriticalFaults(),
        refetchInterval: 15000,
    });

    // WebSocket for live alerts
    const { isConnected } = useAdminAlerts((alert) => {
        // Add new alert to the top
        setAlerts((prev) => {
            const newAlerts = [
                {
                    ...alert,
                    id: `${Date.now()}-${Math.random()}`,
                    timestamp: new Date().toISOString(),
                },
                ...prev,
            ];
            // Keep only last 50 alerts
            return newAlerts.slice(0, 50);
        });

        // Show toast notification
        toast({
            title: 'Critical Alert',
            description: alert.message || `Alert from Station ${alert.station_id}`,
            variant: 'error',
        });
    });

    // Update station status mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ stationId, status }) =>
            adminAPI.updateStationStatus(stationId, status), // Send string directly
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['admin', 'stations']);
            toast({
                title: 'Station Updated',
                description: `Station set to ${variables.status}.`,
                variant: 'success',
            });
            setConfirmAction(null);
        },
        onError: (error) => {
            toast({
                title: 'Update Failed',
                description: error.response?.data?.message || error.response?.data?.detail || 'Failed to update station status',
                variant: 'error',
            });
        },
    });

    const handleStatusChange = (station, newStatus) => {
        setConfirmAction({
            type: 'status',
            station,
            newStatus,
            action: () => updateStatusMutation.mutate({
                stationId: station.id,
                status: newStatus
            }),
        });
    };

    const getNextStatus = (currentStatus) => {
        // Cycle through: active -> maintenance -> offline -> active
        if (currentStatus === 'active') return 'maintenance';
        if (currentStatus === 'maintenance') return 'offline';
        return 'active';
    };

    const getStatusButtonText = (status) => {
        const next = getNextStatus(status);
        return next.charAt(0).toUpperCase() + next.slice(1);
    };

    const formatAlertTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = Math.floor((now - date) / 1000); // seconds

            if (diff < 60) return `${diff}s ago`;
            if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
            return date.toLocaleString();
        } catch {
            return timestamp;
        }
    };

    if (isLoading) {
        return <LoadingScreen message="Loading admin console..." />;
    }

    const stations = stationsData?.data || [];
    const faults = faultsData?.data || [];

    // Calculate stats
    const totalStations = stations.length;
    const activeStations = stations.filter(s => s.status === 'active').length;
    const disabledStations = stations.filter(s => s.status === 'disabled').length;
    const criticalCount = faults.length + alerts.filter(a => a.severity === 'critical').length;

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Admin Console</h1>
                        <p className="text-muted-foreground">
                            System-wide monitoring and control
                        </p>
                    </div>
                    <Badge variant={isConnected ? 'success' : 'destructive'} className="text-base px-4 py-2">
                        <Activity className="h-4 w-4 mr-1" />
                        {isConnected ? 'Live Feed Active' : 'Disconnected'}
                    </Badge>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Stations</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalStations}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Network-wide
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                        <Zap className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{activeStations}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {((activeStations / totalStations) * 100).toFixed(1)}% of network
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Disabled</CardTitle>
                        <PowerOff className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{disabledStations}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Maintenance mode
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Requires attention
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Stations Table */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Stations</CardTitle>
                            <CardDescription>
                                Monitor and control charging stations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {stations.map((station) => (
                                    <div
                                        key={station.id || station.station_id}
                                        className={cn(
                                            'flex items-center justify-between p-4 border rounded-lg transition-colors',
                                            (station.health === 'CRITICAL' || station.health_status === 'Critical') && 'bg-red-50 border-red-200'
                                        )}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={cn(
                                                'h-10 w-10 rounded-full flex items-center justify-center',
                                                station.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                                            )}>
                                                {station.status === 'active' ? (
                                                    <Power className="h-5 w-5 text-green-600" />
                                                ) : (
                                                    <PowerOff className="h-5 w-5 text-gray-600" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold">
                                                    {station.name || `Station #${station.id || station.station_id}`}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {station.address || `ID: ${station.id || station.station_id}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right hidden md:block mr-4">
                                                <p className="text-sm font-medium">
                                                    {station.total_chargers || 0} Chargers
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {station.active_chargers || 0} active
                                                </p>
                                            </div>

                                            <Badge
                                                variant={
                                                    (station.health === 'OK' || station.health_status === 'Healthy') ? 'success' :
                                                        (station.health === 'WARNING' || station.health_status === 'Warning') ? 'warning' :
                                                            'destructive'
                                                }
                                            >
                                                {station.health || station.health_status || 'Unknown'}
                                            </Badge>

                                            <Badge
                                                variant={
                                                    station.status === 'active' ? 'success' :
                                                        station.status === 'maintenance' ? 'warning' :
                                                            'secondary'
                                                }
                                            >
                                                {station.status || 'unknown'}
                                            </Badge>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleStatusChange(
                                                    station,
                                                    getNextStatus(station.status || 'offline')
                                                )}
                                                disabled={updateStatusMutation.isPending}
                                            >
                                                Set {getStatusButtonText(station.status || 'offline')}
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {stations.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                        <p>No stations found</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Live Alerts Feed */}
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Live Critical Alerts</CardTitle>
                            <CardDescription>
                                Real-time system notifications
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                {alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className="p-3 bg-red-50 border border-red-200 rounded-lg animate-in slide-in-from-right"
                                    >
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-red-900">
                                                    {alert.message || 'Critical alert detected'}
                                                </p>
                                                {alert.station_name && (
                                                    <p className="text-xs text-red-700 mt-1">
                                                        Station: {alert.station_name}
                                                    </p>
                                                )}
                                                {alert.details && (
                                                    <p className="text-xs text-red-600 mt-1">
                                                        {alert.details}
                                                    </p>
                                                )}
                                                <p className="text-xs text-red-500 mt-1">
                                                    {formatAlertTime(alert.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Show persistent faults */}
                                {faults.map((fault, index) => (
                                    <div
                                        key={fault.id ? `fault-${fault.id}` : `fault-index-${index}`}
                                        className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
                                    >
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-orange-900">
                                                    {fault.message || fault.type || 'System fault'}
                                                </p>
                                                {fault.station_id && (
                                                    <p className="text-xs text-orange-700 mt-1">
                                                        Station ID: {fault.station_id}
                                                    </p>
                                                )}
                                                <p className="text-xs text-orange-500 mt-1">
                                                    Persistent fault
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {alerts.length === 0 && faults.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p className="text-sm">No critical alerts</p>
                                        <p className="text-xs mt-1">System operating normally</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Action</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to set "{confirmAction?.station?.name || `Station #${confirmAction?.station?.id}`}" to {confirmAction?.newStatus}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmAction(null)}
                            disabled={updateStatusMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={confirmAction?.newStatus === 'offline' ? 'destructive' : 'default'}
                            onClick={confirmAction?.action}
                            disabled={updateStatusMutation.isPending}
                        >
                            {updateStatusMutation.isPending
                                ? 'Processing...'
                                : `Set to ${confirmAction?.newStatus}`
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminConsole;