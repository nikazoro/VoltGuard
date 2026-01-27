import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    MapPin, Zap, Battery, DollarSign, Clock,
    Calendar, ArrowLeft, CheckCircle
} from 'lucide-react';
import { stationAPI, bookingAPI } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const bookingSchema = z.object({
    start_time: z.string().min(1, 'Start time is required'),
    duration_hours: z.number().min(0.5, 'Minimum duration is 0.5 hours').max(24, 'Maximum duration is 24 hours'),
});

const StationDetailModal = ({ station, open, onClose }) => {
    const [showBookingForm, setShowBookingForm] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Use station_id from the map data
    const stationId = station?.station_id || station?.id;

    // Fetch detailed station info
    const { data: stationDetail, isLoading: detailLoading } = useQuery({
        queryKey: ['station', stationId],
        queryFn: () => stationAPI.getById(stationId),
        enabled: open && !!stationId,
    });

    // Fetch availability
    const { data: availability } = useQuery({
        queryKey: ['station', stationId, 'availability'],
        queryFn: () => stationAPI.getAvailability(stationId),
        enabled: open && !!stationId,
        refetchInterval: 10000, // Refresh every 10 seconds
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            start_time: '',
            duration_hours: 2,
        },
    });

    // Booking mutation
    const bookingMutation = useMutation({
        mutationFn: (data) => {
            // Calculate end_time from start_time + duration
            const startTime = new Date(data.start_time);
            const endTime = new Date(startTime.getTime() + data.duration_hours * 60 * 60 * 1000);

            return bookingAPI.create({
                station_id: stationId,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['stations']);
            queryClient.invalidateQueries(['bookings']);
            toast({
                title: 'Booking Confirmed!',
                description: 'Your charging slot has been reserved.',
                variant: 'success',
            });
            reset();
            onClose();
        },
        onError: (error) => {
            const errorMessage = error.response?.data?.message || error.message;

            // Handle 409 Conflict (Double booking)
            if (error.response?.status === 409) {
                toast({
                    title: 'Slot Taken!',
                    description: 'This time slot was just booked. Please select another time.',
                    variant: 'error',
                });
            } else {
                toast({
                    title: 'Booking Failed',
                    description: errorMessage,
                    variant: 'error',
                });
            }
        },
    });

    const onSubmit = (data) => {
        bookingMutation.mutate({
            start_time: data.start_time,
            duration_hours: parseFloat(data.duration_hours),
        });
    };

    const handleBookSlot = () => {
        setShowBookingForm(true);
    };

    const handleBack = () => {
        setShowBookingForm(false);
        reset();
    };

    const detailData = stationDetail?.data || station;
    const availabilityData = availability?.data;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                {!showBookingForm ? (
                    // Station Details View
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl">
                                {detailData.name || `Station #${stationId}`}
                            </DialogTitle>
                            <DialogDescription className="flex items-center gap-1 mt-2">
                                <MapPin className="h-4 w-4" />
                                {detailData.address || `${station.lat?.toFixed(4)}, ${station.lng?.toFixed(4)}`}
                            </DialogDescription>
                        </DialogHeader>

                        {detailLoading ? (
                            <div className="flex justify-center py-12">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : (
                            <div className="space-y-6 mt-4">
                                {/* Status Badge */}
                                <div className="flex items-center gap-3">
                                    <Badge
                                        variant={station.availability === 'AVAILABLE' ? 'success' : 'destructive'}
                                        className="text-base px-4 py-1"
                                    >
                                        {station.availability === 'AVAILABLE' ? (
                                            <>
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                Available
                                            </>
                                        ) : (
                                            'Not Available'
                                        )}
                                    </Badge>
                                    {station.health && (
                                        <Badge variant={station.health === 'OK' ? 'success' : 'destructive'}>
                                            {station.health}
                                        </Badge>
                                    )}
                                </div>

                                {/* Station Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Battery className="h-4 w-4 text-orange-500" />
                                                <span className="text-sm text-muted-foreground">Status</span>
                                            </div>
                                            <p className="text-2xl font-bold text-green-600">
                                                {station.availability || 'Unknown'}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <DollarSign className="h-4 w-4 text-green-600" />
                                                <span className="text-sm text-muted-foreground">Price/Hour</span>
                                            </div>
                                            <p className="text-2xl font-bold">${station.price_per_hour || 0}</p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Clock className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm text-muted-foreground">Health</span>
                                            </div>
                                            <p className="text-2xl font-bold">{station.health || 'Unknown'}</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Additional Info */}
                                {detailData.description && (
                                    <div>
                                        <h3 className="font-semibold mb-2">About</h3>
                                        <p className="text-sm text-muted-foreground">{detailData.description}</p>
                                    </div>
                                )}

                                {/* Action Button */}
                                <Button
                                    onClick={handleBookSlot}
                                    disabled={station.availability !== 'AVAILABLE'}
                                    className="w-full"
                                    size="lg"
                                >
                                    {station.availability === 'AVAILABLE' ? 'Book Charging Slot' : 'Not Available'}
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    // Booking Form View
                    <>
                        <DialogHeader>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBack}
                                className="w-fit mb-2"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Back to Details
                            </Button>
                            <DialogTitle>Book Charging Slot</DialogTitle>
                            <DialogDescription>
                                Station #{stationId} - ${station.price_per_hour}/hour
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                            {/* Start Time */}
                            <div className="space-y-2">
                                <Label htmlFor="start_time">Start Time</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="start_time"
                                        type="datetime-local"
                                        className="pl-9"
                                        {...register('start_time')}
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                </div>
                                {errors.start_time && (
                                    <p className="text-sm text-destructive">{errors.start_time.message}</p>
                                )}
                            </div>

                            {/* Duration */}
                            <div className="space-y-2">
                                <Label htmlFor="duration_hours">Duration (hours)</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="duration_hours"
                                        type="number"
                                        step="0.5"
                                        min="0.5"
                                        max="24"
                                        className="pl-9"
                                        {...register('duration_hours', { valueAsNumber: true })}
                                    />
                                </div>
                                {errors.duration_hours && (
                                    <p className="text-sm text-destructive">{errors.duration_hours.message}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Minimum 0.5 hours, Maximum 24 hours
                                </p>
                            </div>

                            {/* Estimated Cost */}
                            <Card className="bg-accent">
                                <CardContent className="pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Estimated Cost:</span>
                                        <span className="text-2xl font-bold text-primary">
                                            ${((station.price_per_hour || 0) * 2).toFixed(2)}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={bookingMutation.isPending}
                            >
                                {bookingMutation.isPending ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Confirming Booking...
                                    </>
                                ) : (
                                    'Confirm Booking'
                                )}
                            </Button>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default StationDetailModal;