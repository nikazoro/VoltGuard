import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    ArrowLeft, Activity, Zap, Thermometer,
    AlertTriangle, TrendingUp
} from 'lucide-react';
import { ownerAPI, telemetryAPI } from '@/services/api';
import { useOwnerTelemetry } from '@/hooks/useSocket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/shared/LoadingSpinner';
import { cn } from '@/lib/utils';

const StationMonitor = () => {
    const { stationId } = useParams();
    const navigate = useNavigate();
    const [telemetryData, setTelemetryData] = useState([]);
    const [isCritical, setIsCritical] = useState(false);

    // Fetch station details
    const { data: stationData, isLoading: stationLoading } = useQuery({
        queryKey: ['owner', 'stations', stationId],
        queryFn: () => ownerAPI.getStationById(stationId),
    });

    // Fetch historical telemetry
    const { data: historicalData, isLoading: telemetryLoading } = useQuery({
        queryKey: ['telemetry', 'station', stationId],
        queryFn: () => telemetryAPI.getStationTelemetry(stationId, {
            limit: 50,
            order: 'desc'
        }),
    });

    // WebSocket for live telemetry
    const { isConnected, lastMessage } = useOwnerTelemetry(
        stationId,
        (data) => {
            // Handle incoming telemetry data
            const newPoint = {
                timestamp: data.timestamp || new Date().toISOString(),
                voltage: data.voltage,
                current: data.current,
                temperature: data.temperature,
                power: data.power || (data.voltage * data.current),
            };

            setTelemetryData((prev) => {
                const updated = [...prev, newPoint];
                // Keep only last 100 points
                return updated.slice(-100);
            });

            // Check for critical status
            if (data.status === 'Critical') {
                setIsCritical(true);
                setTimeout(() => setIsCritical(false), 3000);
            }
        }
    );

    // Initialize telemetry data with historical data
    useEffect(() => {
        if (historicalData?.data) {
            const formatted = historicalData.data
                .reverse() // Oldest first
                .map((item) => ({
                    timestamp: item.timestamp,
                    voltage: item.voltage,
                    current: item.current,
                    temperature: item.temperature,
                    power: item.power || (item.voltage * item.current),
                }));
            setTelemetryData(formatted);
        }
    }, [historicalData]);

    if (stationLoading || telemetryLoading) {
        return <LoadingScreen message="Loading station data..." />;
    }

    const station = stationData?.data || {};
    const latestData = telemetryData[telemetryData.length - 1] || {};

    // Format timestamp for chart
    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch {
            return timestamp;
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/owner/dashboard')}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </Button>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{station.name}</h1>
                        <p className="text-muted-foreground">{station.address}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant={isConnected ? 'success' : 'destructive'}>
                            {isConnected ? 'Live' : 'Disconnected'}
                        </Badge>
                        <Badge
                            variant={
                                station.health_status === 'Healthy' ? 'success' :
                                    station.health_status === 'Warning' ? 'warning' :
                                        'destructive'
                            }
                        >
                            {station.health_status || 'Unknown'}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Real-time Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Voltage</CardTitle>
                        <Zap className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {latestData.voltage?.toFixed(1) || '--'} V
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Real-time reading
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Current</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {latestData.current?.toFixed(1) || '--'} A
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Real-time reading
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Temperature</CardTitle>
                        <Thermometer className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {latestData.temperature?.toFixed(1) || '--'} °C
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Real-time reading
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Power</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {latestData.power?.toFixed(1) || '--'} kW
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Calculated output
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Live Telemetry Chart */}
            <Card
                className={cn(
                    'mb-8 transition-all',
                    isCritical && 'border-red-500 border-4 animate-flash-red'
                )}
            >
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Live Digital Twin</CardTitle>
                            <CardDescription>
                                Real-time telemetry monitoring
                            </CardDescription>
                        </div>
                        {isCritical && (
                            <Badge variant="destructive" className="text-base px-4 py-2">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                CRITICAL ALERT
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={telemetryData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="timestamp"
                                fontSize={12}
                                tickFormatter={formatTime}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis fontSize={12} />
                            <Tooltip
                                labelFormatter={formatTime}
                                formatter={(value, name) => {
                                    const units = {
                                        voltage: 'V',
                                        current: 'A',
                                        temperature: '°C',
                                        power: 'kW'
                                    };
                                    return [`${value.toFixed(2)} ${units[name] || ''}`, name.charAt(0).toUpperCase() + name.slice(1)];
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="voltage"
                                stroke="#eab308"
                                strokeWidth={2}
                                dot={false}
                                name="Voltage"
                            />
                            <Line
                                type="monotone"
                                dataKey="current"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={false}
                                name="Current"
                            />
                            <Line
                                type="monotone"
                                dataKey="temperature"
                                stroke="#ef4444"
                                strokeWidth={2}
                                dot={false}
                                name="Temperature"
                            />
                        </LineChart>
                    </ResponsiveContainer>

                    {!isConnected && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                            <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-yellow-600" />
                            <p className="text-sm text-yellow-800">
                                WebSocket disconnected. Attempting to reconnect...
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Station Info */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Station Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Chargers</span>
                            <span className="font-medium">{station.total_chargers || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Active Chargers</span>
                            <span className="font-medium">{station.active_chargers || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Price per Hour</span>
                            <span className="font-medium">${station.price_per_hour || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge variant={station.status === 'active' ? 'success' : 'secondary'}>
                                {station.status || 'unknown'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Data Stream Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Connection Status</span>
                            <Badge variant={isConnected ? 'success' : 'destructive'}>
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Data Points</span>
                            <span className="font-medium">{telemetryData.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Last Update</span>
                            <span className="font-medium text-sm">
                                {latestData.timestamp
                                    ? formatTime(latestData.timestamp)
                                    : 'No data'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Critical Alerts</span>
                            <span className={cn(
                                'font-medium',
                                isCritical && 'text-red-600 animate-pulse'
                            )}>
                                {isCritical ? 'ACTIVE' : 'None'}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default StationMonitor;