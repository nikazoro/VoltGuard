import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, DollarSign, Plus, X } from 'lucide-react';
import { stationAPI } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';

const stationSchema = z.object({
    name: z.string().min(3, 'Station name must be at least 3 characters').max(100, 'Station name must be less than 100 characters'),
    location_lat: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
    location_lng: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
    status: z.enum(['active', 'maintenance', 'offline']),
    price_per_hour: z.number().min(0.5, 'Minimum price is $0.50').max(100, 'Maximum price is $100'),
});

const StationCreationForm = ({ isOpen, onClose, onSuccess }) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        resolver: zodResolver(stationSchema),
        defaultValues: {
            name: '',
            location_lat: 0,
            location_lng: 0,
            status: 'active',
            price_per_hour: 5.0,
        },
    });

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const response = await stationAPI.create(data);
            toast({
                title: 'Station Created Successfully',
                description: `"${data.name}" has been added to your stations.`,
                variant: 'success',
            });
            reset();
            onSuccess?.(response.data);
            onClose();
        } catch (error) {
            console.error('Station creation error:', error);
            const errorMessage = error.response?.data?.detail ||
                                error.response?.data?.message ||
                                'Failed to create station. Please try again.';
            toast({
                title: 'Creation Failed',
                description: errorMessage,
                variant: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            reset();
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Add New Charging Station
                    </DialogTitle>
                    <DialogDescription>
                        Fill in the details below to register a new charging station to your network.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                    {/* Station Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Station Name *</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Downtown EV Hub"
                            {...register('name')}
                            disabled={isSubmitting}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Location */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Location Coordinates *
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="location_lat">Latitude *</Label>
                                    <Input
                                        id="location_lat"
                                        type="number"
                                        step="any"
                                        placeholder="e.g., 40.7128"
                                        {...register('location_lat', { valueAsNumber: true })}
                                        disabled={isSubmitting}
                                    />
                                    {errors.location_lat && (
                                        <p className="text-sm text-destructive">{errors.location_lat.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location_lng">Longitude *</Label>
                                    <Input
                                        id="location_lng"
                                        type="number"
                                        step="any"
                                        placeholder="e.g., -74.0060"
                                        {...register('location_lng', { valueAsNumber: true })}
                                        disabled={isSubmitting}
                                    />
                                    {errors.location_lng && (
                                        <p className="text-sm text-destructive">{errors.location_lng.message}</p>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Tip: You can find coordinates using Google Maps by right-clicking on a location.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Pricing */}
                    <div className="space-y-2">
                        <Label htmlFor="price_per_hour">Price per Hour ($) *</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="price_per_hour"
                                type="number"
                                step="0.50"
                                min="0.50"
                                max="100"
                                placeholder="5.00"
                                className="pl-9"
                                {...register('price_per_hour', { valueAsNumber: true })}
                                disabled={isSubmitting}
                            />
                        </div>
                        {errors.price_per_hour && (
                            <p className="text-sm text-destructive">{errors.price_per_hour.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Set your hourly charging rate. Minimum: $0.50, Maximum: $100
                        </p>
                    </div>

                    {/* Initial Status */}
                    <div className="space-y-2">
                        <Label htmlFor="status">Initial Status *</Label>
                        <select
                            id="status"
                            className="w-full px-3 py-2 border border-input rounded-md bg-background"
                            {...register('status')}
                            disabled={isSubmitting}
                        >
                            <option value="active">Active - Ready for bookings</option>
                            <option value="maintenance">Maintenance - Under maintenance</option>
                            <option value="offline">Offline - Not available</option>
                        </select>
                        {errors.status && (
                            <p className="text-sm text-destructive">{errors.status.message}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Station
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default StationCreationForm;