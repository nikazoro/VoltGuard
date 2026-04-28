import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign, TrendingUp, Zap, Activity,
    AlertTriangle, MapPin
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { ownerAPI, analyticsAPI } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/shared/LoadingSpinner';

const Dashboard = () => {
    const navigate = useNavigate();

    // Fetch revenue data
    const { data: revenueData, isLoading: revenueLoading } = useQuery({
        queryKey: ['owner', 'revenue'],
        queryFn: () => ownerAPI.getRevenue(),
        refetchInterval: 60000,
    });

    // Fetch revenue breakdown
    const { data: breakdownData, isLoading: breakdownLoading } = useQuery({
        queryKey: ['owner', 'revenue', 'breakdown'],
        queryFn: () => ownerAPI.getRevenueBreakdown({ period: 'week' }),
        refetchInterval: 60000,
    });

    // Fetch owner stations
    const { data: stationsData, isLoading: stationsLoading } = useQuery({
        queryKey: ['owner', 'stations'],
        queryFn: () => ownerAPI.getStations(),
        refetchInterval: 30000,
    });

    // Fetch usage analytics
    const { data: usageData } = useQuery({
        queryKey: ['analytics', 'usage'],
        queryFn: () => analyticsAPI.getUsage({ period: 'week' }),
    });

    if (revenueLoading || breakdownLoading || stationsLoading) {
        return <LoadingScreen message="Loading dashboard..." />;
    }

    const revenue = revenueData?.data || {};
    const breakdown = breakdownData?.data || [];
    const stations = stationsData?.data || [];
    const usage = usageData?.data || [];

    // Calculate stats
    const totalStations = stations.length;
    const activeStations = stations.filter(s => s.status === 'active').length;
    const totalChargers = stations.reduce((sum, s) => sum + (s.total_chargers || 0), 0);
    const criticalAlerts = stations.filter(s => s.health === 'CRITICAL' || s.health_status === 'Critical').length;

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-muted-foreground">
                    Monitor your charging network performance
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${revenue.total?.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {revenue.period || 'All time'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Stations</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {activeStations} / {totalStations}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {totalChargers} total chargers
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">This Week</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${revenue.this_week?.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                            {revenue.growth_percentage !== null && revenue.growth_percentage !== undefined
                                ? `${revenue.growth_percentage > 0 ? '+' : ''}${revenue.growth_percentage}% from last week`
                                : 'No previous data'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {criticalAlerts}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Critical issues
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                        <CardDescription>Last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={breakdown}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    fontSize={12}
                                    tickFormatter={(value) => {
                                        try {
                                            return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        } catch {
                                            return value;
                                        }
                                    }}
                                />
                                <YAxis fontSize={12} />
                                <Tooltip
                                    formatter={(value) => `$${value.toFixed(2)}`}
                                    labelFormatter={(label) => {
                                        try {
                                            return new Date(label).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric'
                                            });
                                        } catch {
                                            return label;
                                        }
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Usage Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Charging Sessions</CardTitle>
                        <CardDescription>Session count by day</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={usage}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    fontSize={12}
                                    tickFormatter={(value) => {
                                        try {
                                            return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        } catch {
                                            return value;
                                        }
                                    }}
                                />
                                <YAxis fontSize={12} />
                                <Tooltip
                                    labelFormatter={(label) => {
                                        try {
                                            return new Date(label).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric'
                                            });
                                        } catch {
                                            return label;
                                        }
                                    }}
                                />
                                <Bar
                                    dataKey="sessions"
                                    fill="hsl(var(--primary))"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Stations List */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Stations</CardTitle>
                    <CardDescription>
                        Click on a station to view live telemetry
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {stations.map((station) => (
                            <div
                                key={station.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                                onClick={() => navigate(`/owner/stations/${station.id}`)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <MapPin className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{station.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {station.address || 'Location not available'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden md:block">
                                        <p className="text-sm font-medium">
                                            {station.total_chargers || 0} Chargers
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {station.active_chargers || 0} active
                                        </p>
                                    </div>

                                    <Badge
                                        variant={
                                            station.health_status === 'Healthy' ? 'success' :
                                                station.health_status === 'Warning' ? 'warning' :
                                                    'destructive'
                                        }
                                    >
                                        {station.health_status || 'Unknown'}
                                    </Badge>

                                    <Button variant="ghost" size="sm">
                                        <Activity className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {stations.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>No stations registered yet</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;