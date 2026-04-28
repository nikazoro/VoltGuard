import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, DollarSign, Edit, Activity, Power, PowerOff, Plus } from 'lucide-react';
import { ownerAPI, stationAPI } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/Dialog';
import { LoadingScreen } from '@/components/shared/LoadingSpinner';
import { cn } from '@/lib/utils';
import StationCreationForm from '@/components/owner/StationCreationForm';

const pricingSchema = z.object({
    price_per_hour: z.number().min(0.5, 'Minimum price is $0.50').max(100, 'Maximum price is $100'),
});

const OwnerStations = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [editingStation, setEditingStation] = useState(null);
    const [statusChangeStation, setStatusChangeStation] = useState(null);
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

    const { data: stationsData, isLoading } = useQuery({
        queryKey: ['owner', 'stations'],
        queryFn: () => ownerAPI.getStations(),
        refetchInterval: 30000,
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        resolver: zodResolver(pricingSchema),
    });

    const updatePricingMutation = useMutation({
        mutationFn: ({ stationId, pricePerHour }) =>
            ownerAPI.updatePricing(stationId, pricePerHour),
        onSuccess: () => {
            queryClient.invalidateQueries(['owner', 'stations']);
            toast({
                title: 'Pricing Updated',
                description: 'Station pricing has been successfully updated.',
                variant: 'success',
            });
            setEditingStation(null);
            reset();
        },
        onError: (error) => {
            toast({
                title: 'Update Failed',
                description: error.response?.data?.detail || error.response?.data?.message || 'Failed to update pricing',
                variant: 'error',
            });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ stationId, status }) =>
            ownerAPI.updateStationStatus(stationId, status),
        onSuccess: (response) => {
            queryClient.invalidateQueries(['owner', 'stations']);
            toast({
                title: 'Status Updated',
                description: `Station is now ${response.data.new_status}.`,
                variant: 'success',
            });
            setStatusChangeStation(null);
        },
        onError: (error) => {
            const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Failed to update status';
            toast({
                title: 'Update Failed',
                description: errorMsg,
                variant: 'error',
            });
            setStatusChangeStation(null);
        },
    });

    const handleEditPricing = (station) => {
        setEditingStation(station);
        reset({ price_per_hour: station.price_per_hour });
    };

    const handleStatusChange = (station, newStatus) => {
        setStatusChangeStation({ station, newStatus });
    };

    const confirmStatusChange = () => {
        if (statusChangeStation) {
            updateStatusMutation.mutate({
                stationId: statusChangeStation.station.id || statusChangeStation.station.station_id,
                status: statusChangeStation.newStatus,
            });
        }
    };

    const getNextStatus = (currentStatus) => {
        if (currentStatus === 'active') return 'maintenance';
        if (currentStatus === 'maintenance') return 'offline';
        return 'active';
    };

    const getStatusVariant = (status) => {
        if (status === 'active') return 'success';
        if (status === 'maintenance') return 'warning';
        return 'secondary';
    };

    const onSubmit = (data) => {
        if (editingStation) {
            updatePricingMutation.mutate({
                stationId: editingStation.id,
                pricePerHour: data.price_per_hour, // Send just the number
            });
        }
    };

    const handleStationCreated = (newStation) => {
        queryClient.invalidateQueries(['owner', 'stations']);
        toast({
            title: 'Station Added',
            description: 'Your new station has been successfully added.',
            variant: 'success',
        });
    };

    if (isLoading) {
        return <LoadingScreen message="Loading your stations..." />;
    }

    const stations = stationsData?.data || [];

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">My Stations</h1>
                    <p className="text-muted-foreground">
                        Manage your charging stations
                    </p>
                </div>
                <Button
                    onClick={() => setIsCreateFormOpen(true)}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Add Station
                </Button>
            </div>

            {stations.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No Stations Yet</h3>
                        <p className="text-muted-foreground mb-6">
                            You don't have any registered charging stations yet.
                        </p>
                        <Button
                            onClick={() => setIsCreateFormOpen(true)}
                            className="flex items-center gap-2 mx-auto"
                        >
                            <Plus className="h-4 w-4" />
                            Add Your First Station
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stations.map((station) => (
                        <Card key={station.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between mb-2">
                                    <CardTitle className="text-xl">{station.name || `Station #${station.id || station.station_id}`}</CardTitle>
                                    <div className="flex gap-2">
                                        <Badge
                                            variant={
                                                station.health === 'OK' || station.health_status === 'Healthy' ? 'success' :
                                                    station.health === 'WARNING' || station.health_status === 'Warning' ? 'warning' :
                                                        'destructive'
                                            }
                                        >
                                            {station.health || station.health_status || 'Unknown'}
                                        </Badge>
                                        <Badge variant={getStatusVariant(station.status)}>
                                            {station.status || 'unknown'}
                                        </Badge>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {station.address || 'Address not available'}
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Total Chargers</p>
                                        <p className="font-semibold text-lg">{station.total_chargers || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Active</p>
                                        <p className="font-semibold text-lg text-green-600">
                                            {station.active_chargers || 0}
                                        </p>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="pt-3 border-t">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-green-600" />
                                            <span className="text-sm text-muted-foreground">Price/Hour</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditPricing(station)}
                                        >
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <p className="text-2xl font-bold">${station.price_per_hour || 0}</p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => navigate(`/owner/stations/${station.id || station.station_id}`)}
                                    >
                                        <Activity className="h-4 w-4 mr-1" />
                                        Monitor
                                    </Button>
                                    <Button
                                        variant={station.status === 'active' ? 'outline' : 'default'}
                                        size="sm"
                                        onClick={() => handleStatusChange(station, getNextStatus(station.status || 'offline'))}
                                    >
                                        {station.status === 'active' ? (
                                            <Power className="h-4 w-4 mr-1" />
                                        ) : (
                                            <PowerOff className="h-4 w-4 mr-1" />
                                        )}
                                        {getNextStatus(station.status || 'offline')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Pricing Dialog */}
            <Dialog open={!!editingStation} onOpenChange={() => setEditingStation(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Pricing</DialogTitle>
                        <DialogDescription>
                            {editingStation?.name || `Station #${editingStation?.id}`}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="price_per_hour">Price per Hour ($)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="price_per_hour"
                                    type="number"
                                    step="0.50"
                                    min="0.50"
                                    max="100"
                                    className="pl-9"
                                    {...register('price_per_hour', { valueAsNumber: true })}
                                />
                            </div>
                            {errors.price_per_hour && (
                                <p className="text-sm text-destructive">
                                    {errors.price_per_hour.message}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Current price: ${editingStation?.price_per_hour || 0}/hour
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingStation(null)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={updatePricingMutation.isPending}
                            >
                                {updatePricingMutation.isPending ? 'Updating...' : 'Update Price'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Status Change Confirmation Dialog */}
            <Dialog open={!!statusChangeStation} onOpenChange={() => setStatusChangeStation(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Station Status</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to set "{statusChangeStation?.station?.name || `Station #${statusChangeStation?.station?.id}`}" to {statusChangeStation?.newStatus}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setStatusChangeStation(null)}
                            disabled={updateStatusMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={statusChangeStation?.newStatus === 'offline' ? 'destructive' : 'default'}
                            onClick={confirmStatusChange}
                            disabled={updateStatusMutation.isPending}
                        >
                            {updateStatusMutation.isPending ? 'Updating...' : `Set to ${statusChangeStation?.newStatus}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Station Creation Form */}
            <StationCreationForm
                isOpen={isCreateFormOpen}
                onClose={() => setIsCreateFormOpen(false)}
                onSuccess={handleStationCreated}
            />
        </div>
    );
};

export default OwnerStations;