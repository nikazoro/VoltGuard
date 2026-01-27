import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, DollarSign, XCircle } from 'lucide-react';
import { bookingAPI } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingScreen } from '@/components/shared/LoadingSpinner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { useState } from 'react';

const MyBookings = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [cancelBookingId, setCancelBookingId] = useState(null);

    const { data: bookingsData, isLoading } = useQuery({
        queryKey: ['bookings', 'my'],
        queryFn: () => bookingAPI.getMy(),
        refetchInterval: 30000,
    });

    const cancelMutation = useMutation({
        mutationFn: (bookingId) => bookingAPI.cancel(bookingId),
        onSuccess: () => {
            queryClient.invalidateQueries(['bookings']);
            queryClient.invalidateQueries(['stations']);
            toast({
                title: 'Booking Cancelled',
                description: 'Your booking has been successfully cancelled.',
                variant: 'success',
            });
            setCancelBookingId(null);
        },
        onError: (error) => {
            toast({
                title: 'Cancellation Failed',
                description: error.response?.data?.message || 'Failed to cancel booking',
                variant: 'error',
            });
        },
    });

    const handleCancelClick = (bookingId) => {
        setCancelBookingId(bookingId);
    };

    const handleConfirmCancel = () => {
        if (cancelBookingId) {
            cancelMutation.mutate(cancelBookingId);
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            confirmed: 'default',
            active: 'success',
            completed: 'secondary',
            cancelled: 'destructive',
        };
        return variants[status] || 'default';
    };

    const formatDateTime = (dateString) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy - h:mm a');
        } catch {
            return dateString;
        }
    };

    if (isLoading) {
        return <LoadingScreen message="Loading your bookings..." />;
    }

    const bookings = bookingsData?.data || [];

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
                <p className="text-muted-foreground">
                    Manage your charging slot reservations
                </p>
            </div>

            {bookings.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No Bookings Yet</h3>
                        <p className="text-muted-foreground mb-6">
                            You haven't made any charging reservations yet.
                        </p>
                        <Button onClick={() => window.location.href = '/map'}>
                            Find Stations
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {bookings.map((booking) => (
                        <Card key={booking.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-xl mb-1">
                                            {booking.station_name || `Station #${booking.station_id}`}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {booking.station_address || 'Location not available'}
                                        </p>
                                    </div>
                                    <Badge variant={getStatusBadge(booking.status)}>
                                        {booking.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Start Time</p>
                                            <p className="font-medium">{formatDateTime(booking.start_time)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Duration</p>
                                            <p className="font-medium">{booking.duration_hours} hours</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Total Cost</p>
                                            <p className="font-medium text-primary">
                                                ${booking.total_cost?.toFixed(2) || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    {booking.charger_id && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Charger</p>
                                                <p className="font-medium">Port #{booking.charger_id}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {booking.status === 'confirmed' && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleCancelClick(booking.id)}
                                        disabled={cancelMutation.isPending}
                                    >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Cancel Booking
                                    </Button>
                                )}

                                {booking.notes && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm text-muted-foreground">{booking.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Cancel Confirmation Dialog */}
            <Dialog open={!!cancelBookingId} onOpenChange={() => setCancelBookingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Booking</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel this booking? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCancelBookingId(null)}
                            disabled={cancelMutation.isPending}
                        >
                            Keep Booking
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmCancel}
                            disabled={cancelMutation.isPending}
                        >
                            {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel Booking'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MyBookings;