import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Zap, Battery, DollarSign } from 'lucide-react';
import { stationAPI } from '@/services/api';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LoadingScreen } from '@/components/shared/LoadingSpinner';
import StationDetailModal from './StationDetailModal';
import { cn } from '@/lib/utils';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg)">
          <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z"/>
        </svg>
      </div>
    `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });
};

const availableIcon = createCustomIcon('#22c55e');
const busyIcon = createCustomIcon('#ef4444');
const hoveredIcon = createCustomIcon('#3b82f6');

// Component to handle map centering
const MapController = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);

    return null;
};

const MapExplorer = () => {
    const [selectedStation, setSelectedStation] = useState(null);
    const [hoveredStation, setHoveredStation] = useState(null);
    const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // Delhi default
    const [mapZoom, setMapZoom] = useState(12);

    // Fetch stations
    const { data: stationsData, isLoading } = useQuery({
        queryKey: ['stations', 'map'],
        queryFn: () => stationAPI.getMapView(),
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const stations = stationsData?.data || [];

    const handleStationClick = (station) => {
        setSelectedStation(station);
    };

    const handleCardHover = (station) => {
        setHoveredStation(station);
        if (station) {
            setMapCenter([station.lat, station.lng]);
            setMapZoom(15);
        }
    };

    const handleCardClick = (station) => {
        setMapCenter([station.lat, station.lng]);
        setMapZoom(16);
        setSelectedStation(station);
    };

    if (isLoading) {
        return <LoadingScreen message="Loading stations..." />;
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex">
            {/* Left Panel - Station List */}
            <div className="w-[350px] bg-background border-r overflow-y-auto">
                <div className="p-4 border-b bg-background sticky top-0 z-10">
                    <h2 className="text-xl font-bold">Available Stations</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {stations.length} stations found
                    </p>
                </div>

                <div className="p-4 space-y-3">
                    {stations.map((station) => (
                        <Card
                            key={station.station_id}
                            className={cn(
                                'p-4 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]',
                                hoveredStation?.station_id === station.station_id && 'ring-2 ring-primary shadow-lg scale-[1.02]',
                                selectedStation?.station_id === station.station_id && 'ring-2 ring-blue-500'
                            )}
                            onMouseEnter={() => handleCardHover(station)}
                            onMouseLeave={() => handleCardHover(null)}
                            onClick={() => handleCardClick(station)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-base mb-1">
                                        Station #{station.station_id}
                                    </h3>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                                    </p>
                                </div>
                                <Badge variant={station.availability === 'AVAILABLE' ? 'success' : 'destructive'}>
                                    {station.availability}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3 text-green-600" />
                                    <span>${station.price_per_hour}/hr</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Badge
                                        variant={station.health === 'OK' ? 'success' : station.health === 'CRITICAL' ? 'destructive' : 'warning'}
                                        className="text-xs"
                                    >
                                        {station.health}
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {stations.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No stations found in this area</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Map */}
            <div className="flex-1 relative">
                <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    className="h-full w-full"
                    zoomControl={true}
                >
                    <MapController center={mapCenter} zoom={mapZoom} />

                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {stations.map((station) => {
                        const isHovered = hoveredStation?.station_id === station.station_id;
                        const isAvailable = station.availability === 'AVAILABLE';

                        let icon = isAvailable ? availableIcon : busyIcon;
                        if (isHovered) {
                            icon = hoveredIcon;
                        }

                        return (
                            <Marker
                                key={station.station_id}
                                position={[station.lat, station.lng]}
                                icon={icon}
                                eventHandlers={{
                                    click: () => handleStationClick(station),
                                }}
                            >
                                <Popup>
                                    <div className="p-2">
                                        <h3 className="font-semibold mb-1">Station #{station.station_id}</h3>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs">
                                            <Badge variant={isAvailable ? 'success' : 'destructive'}>
                                                {station.availability}
                                            </Badge>
                                            <span className="text-muted-foreground">
                                                ${station.price_per_hour}/hr
                                            </span>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur rounded-lg shadow-lg p-3 z-[1000]">
                    <h4 className="text-xs font-semibold mb-2">Legend</h4>
                    <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                            <span>Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-500"></div>
                            <span>Full</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                            <span>Hovered</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Station Detail Modal */}
            {selectedStation && (
                <StationDetailModal
                    station={selectedStation}
                    open={!!selectedStation}
                    onClose={() => setSelectedStation(null)}
                />
            )}
        </div>
    );
};

export default MapExplorer;