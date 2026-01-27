import { useNavigate } from 'react-router-dom';
import { Zap, MapPin, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const handleGetStarted = () => {
        if (isAuthenticated) {
            if (user?.role === 'driver') {
                navigate('/map');
            } else if (user?.role === 'station_owner') {
                navigate('/owner/dashboard');
            } else if (user?.role === 'admin') {
                navigate('/admin/console');
            }
        } else {
            navigate('/register');
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)]">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-green-50 to-blue-50 py-20 px-4">
                <div className="container mx-auto text-center max-w-4xl">
                    <div className="flex justify-center mb-6">
                        <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center">
                            <Zap className="h-10 w-10 text-primary-foreground" />
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        Welcome to <span className="text-primary">EcoCharge</span>
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        The smart EV charging network powered by AI. Find stations, book slots,
                        and monitor your charging infrastructure in real-time.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button size="lg" onClick={handleGetStarted}>
                            Get Started
                        </Button>
                        <Button size="lg" variant="outline" onClick={() => navigate('/map')}>
                            Explore Stations
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <h2 className="text-3xl font-bold text-center mb-12">Why Choose EcoCharge?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                    <MapPin className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Real-Time Availability</h3>
                                <p className="text-muted-foreground">
                                    Find available charging stations near you with live status updates
                                    and instant booking.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                    <TrendingUp className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">AI-Powered Analytics</h3>
                                <p className="text-muted-foreground">
                                    Advanced telemetry monitoring with AI-driven anomaly detection
                                    and predictive maintenance.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                    <Shield className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
                                <p className="text-muted-foreground">
                                    Enterprise-grade security with optimistic locking to prevent
                                    double bookings and ensure reliability.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-primary text-primary-foreground py-16 px-4">
                <div className="container mx-auto text-center max-w-3xl">
                    <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                    <p className="text-lg mb-8 opacity-90">
                        Join thousands of drivers and station owners on the EcoCharge network.
                    </p>
                    <Button size="lg" variant="secondary" onClick={() => navigate('/register')}>
                        Create Free Account
                    </Button>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;