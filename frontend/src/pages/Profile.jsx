import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Save } from 'lucide-react';
import { profileAPI } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingScreen } from '@/components/shared/LoadingSpinner';

const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
});

const Profile = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: () => profileAPI.get(),
    });

    const updateMutation = useMutation({
        mutationFn: (data) => profileAPI.update(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['profile']);
            queryClient.invalidateQueries(['auth', 'me']);
            toast({
                title: 'Profile Updated',
                description: 'Your profile has been successfully updated.',
                variant: 'success',
            });
        },
        onError: (error) => {
            toast({
                title: 'Update Failed',
                description: error.response?.data?.message || 'Failed to update profile',
                variant: 'error',
            });
        },
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(profileSchema),
        values: {
            name: profile?.data?.name || '',
            email: profile?.data?.email || '',
        },
    });

    const onSubmit = (data) => {
        updateMutation.mutate(data);
    };

    if (isLoading) {
        return <LoadingScreen message="Loading profile..." />;
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                        Update your account details
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    className="pl-9"
                                    {...register('name')}
                                />
                            </div>
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className="pl-9"
                                    {...register('email')}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Role (Read-only) */}
                        <div className="space-y-2">
                            <Label>Account Type</Label>
                            <div className="p-3 bg-muted rounded-md">
                                <p className="text-sm capitalize font-medium">
                                    {profile?.data?.role}
                                </p>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="w-full"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Profile;