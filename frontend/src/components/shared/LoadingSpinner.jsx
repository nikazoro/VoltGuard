import { cn } from '@/lib/utils';

export const LoadingSpinner = ({ size = 'md', className }) => {
    const sizes = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-2',
        lg: 'h-12 w-12 border-4',
        xl: 'h-16 w-16 border-4',
    };

    return (
        <div
            className={cn(
                'animate-spin rounded-full border-primary border-t-transparent',
                sizes[size],
                className
            )}
        />
    );
};

export const LoadingScreen = ({ message = 'Loading...' }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <LoadingSpinner size="xl" />
            <p className="text-muted-foreground">{message}</p>
        </div>
    );
};

export const LoadingOverlay = ({ message = 'Loading...' }) => {
    return (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground">{message}</p>
        </div>
    );
};