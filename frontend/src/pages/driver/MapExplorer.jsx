// import { useState, useEffect } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
// import L from 'leaflet';
// import { MapPin, Zap, Battery, DollarSign, Navigation, Search } from 'lucide-react';
// import { stationAPI } from '@/services/api';
// import { Badge } from '@/components/ui/Badge';
// import { Card } from '@/components/ui/Card';
// import { Input } from '@/components/ui/Input';
// import { Button } from '@/components/ui/Button';
// import { Label } from '@/components/ui/Label';
// import { LoadingScreen } from '@/components/shared/LoadingSpinner';
// import StationDetailModal from './StationDetailModal';
// import { cn } from '@/lib/utils';

// // Fix Leaflet default icon issue
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//     iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//     shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
// });

// // Popular Indian cities with coordinates
// const INDIAN_CITIES = [
//     { name: 'New Delhi', lat: 28.6139, lng: 77.2090 },
//     { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
//     { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
//     { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
//     { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
//     { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
//     { name: 'Pune', lat: 18.5204, lng: 73.8567 },
//     { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
//     { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
//     { name: 'Surat', lat: 21.1702, lng: 72.8311 },
//     { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
//     { name: 'Kanpur', lat: 26.4499, lng: 80.3319 },
//     { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
//     { name: 'Indore', lat: 22.7196, lng: 75.8577 },
//     { name: 'Thane', lat: 19.2183, lng: 72.9781 },
//     { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
//     { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
//     { name: 'Pimpri-Chinchwad', lat: 18.6298, lng: 73.7997 },
//     { name: 'Patna', lat: 25.5941, lng: 85.1376 },
//     { name: 'Vadodara', lat: 22.3072, lng: 73.1812 },
//     { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538 },
//     { name: 'Ludhiana', lat: 30.9010, lng: 75.8573 },
//     { name: 'Agra', lat: 27.1767, lng: 78.0081 },
//     { name: 'Nashik', lat: 19.9975, lng: 73.7898 },
//     { name: 'Faridabad', lat: 28.4089, lng: 77.3178 },
// ];

// const RADIUS_OPTIONS = [5, 10, 20, 40, 50, 100];

// // Custom marker icons
// const createCustomIcon = (color) => {
//     return L.divIcon({
//         className: 'custom-marker',
//         html: `
//       <div style="
//         background-color: ${color};
//         width: 32px;
//         height: 32px;
//         border-radius: 50% 50% 50% 0;
//         transform: rotate(-45deg);
//         border: 3px solid white;
//         box-shadow: 0 2px 8px rgba(0,0,0,0.3);
//         display: flex;
//         align-items: center;
//         justify-content: center;
//       ">
//         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg)">
//           <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z"/>
//         </svg>
//       </div>
//     `,
//         iconSize: [32, 32],
//         iconAnchor: [16, 32],
//     });
// };

// const availableIcon = createCustomIcon('#22c55e');
// const busyIcon = createCustomIcon('#ef4444');
// const hoveredIcon = createCustomIcon('#3b82f6');

// // Component to handle map centering
// const MapController = ({ center, zoom }) => {
//     const map = useMap();

//     useEffect(() => {
//         if (center) {
//             map.setView(center, zoom);
//         }
//     }, [center, zoom, map]);

//     return null;
// };

// const MapExplorer = () => {
//     const [selectedStation, setSelectedStation] = useState(null);
//     const [hoveredStation, setHoveredStation] = useState(null);
//     const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // Delhi default
//     const [mapZoom, setMapZoom] = useState(12);

//     // Search filters
//     const [searchLocation, setSearchLocation] = useState('New Delhi');
//     const [userLocation, setUserLocation] = useState({ lat: 28.6139, lng: 77.2090 });
//     const [radiusKm, setRadiusKm] = useState(20);
//     const [showLocationDropdown, setShowLocationDropdown] = useState(false);

//     // Filter cities based on search
//     const filteredCities = INDIAN_CITIES.filter(city =>
//         city.name.toLowerCase().includes(searchLocation.toLowerCase())
//     );

//     // Fetch stations with location params
//     const { data: stationsData, isLoading } = useQuery({
//         queryKey: ['stations', 'map', userLocation.lat, userLocation.lng, radiusKm],
//         queryFn: () => stationAPI.getMapView({
//             user_lat: userLocation.lat,
//             user_lng: userLocation.lng,
//             radius_km: radiusKm
//         }),
//         refetchInterval: 30000,
//     });

//     const stations = stationsData?.data || [];

//     const handleLocationSelect = (city) => {
//         setSearchLocation(city.name);
//         setUserLocation({ lat: city.lat, lng: city.lng });
//         setMapCenter([city.lat, city.lng]);
//         setMapZoom(12);
//         setShowLocationDropdown(false);
//     };

//     const handleUseCurrentLocation = () => {
//         if (navigator.geolocation) {
//             navigator.geolocation.getCurrentPosition(
//                 (position) => {
//                     const { latitude, longitude } = position.coords;
//                     setUserLocation({ lat: latitude, lng: longitude });
//                     setMapCenter([latitude, longitude]);
//                     setSearchLocation('Current Location');
//                     setMapZoom(13);
//                 },
//                 (error) => {
//                     console.error('Error getting location:', error);
//                 }
//             );
//         }
//     };

//     const handleStationClick = (station) => {
//         setSelectedStation(station);
//     };

//     const handleCardHover = (station) => {
//         setHoveredStation(station);
//         if (station) {
//             setMapCenter([station.lat, station.lng]);
//             setMapZoom(15);
//         }
//     };

//     const handleCardClick = (station) => {
//         setMapCenter([station.lat, station.lng]);
//         setMapZoom(16);
//         setSelectedStation(station);
//     };

//     if (isLoading) {
//         return <LoadingScreen message="Loading stations..." />;
//     }

//     return (
//         <div className="h-[calc(100vh-4rem)] flex flex-col">
//             {/* Search Bar */}
//             <div className="bg-background border-b p-4">
//                 <div className="container mx-auto">
//                     <div className="flex gap-4 items-end">
//                         {/* Location Search */}
//                         <div className="flex-1 max-w-md relative">
//                             <Label htmlFor="location" className="mb-2 block">Search Location</Label>
//                             <div className="relative">
//                                 <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//                                 <Input
//                                     id="location"
//                                     type="text"
//                                     placeholder="Search cities..."
//                                     value={searchLocation}
//                                     onChange={(e) => {
//                                         setSearchLocation(e.target.value);
//                                         setShowLocationDropdown(true);
//                                     }}
//                                     onFocus={() => setShowLocationDropdown(true)}
//                                     className="pl-9"
//                                 />
//                             </div>

//                             {/* Location Dropdown */}
//                             {showLocationDropdown && filteredCities.length > 0 && (
//                                 <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-64 overflow-y-auto">
//                                     {filteredCities.slice(0, 10).map((city) => (
//                                         <button
//                                             key={city.name}
//                                             onClick={() => handleLocationSelect(city)}
//                                             className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
//                                         >
//                                             <MapPin className="h-4 w-4 text-muted-foreground" />
//                                             <span>{city.name}</span>
//                                         </button>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>

//                         {/* Radius Select */}
//                         <div className="w-32">
//                             <Label htmlFor="radius" className="mb-2 block">Radius (km)</Label>
//                             <select
//                                 id="radius"
//                                 value={radiusKm}
//                                 onChange={(e) => setRadiusKm(Number(e.target.value))}
//                                 className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
//                             >
//                                 {RADIUS_OPTIONS.map((radius) => (
//                                     <option key={radius} value={radius}>
//                                         {radius} km
//                                     </option>
//                                 ))}
//                             </select>
//                         </div>

//                         {/* Current Location Button */}
//                         <Button
//                             variant="outline"
//                             onClick={handleUseCurrentLocation}
//                             className="h-10"
//                         >
//                             <Navigation className="h-4 w-4 mr-2" />
//                             Use My Location
//                         </Button>
//                     </div>

//                 </div>
//             </div>

//             {/* Map View */}
//             <div className="flex-1 flex">
//                 {/* Left Panel - Station List */}
//                 <div className="w-[350px] bg-background border-r overflow-y-auto">
//                     <div className="p-4 border-b bg-background sticky top-0 z-10">
//                         <h2 className="text-xl font-bold">Available Stations</h2>
//                         <p className="text-sm text-muted-foreground mt-1">
//                             {stations.length} stations within {radiusKm} km
//                         </p>
//                     </div>

//                     <div className="p-4 space-y-3">
//                         {stations.map((station) => (
//                             <Card
//                                 key={station.station_id}
//                                 className={cn(
//                                     'p-4 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]',
//                                     hoveredStation?.station_id === station.station_id && 'ring-2 ring-primary shadow-lg scale-[1.02]',
//                                     selectedStation?.station_id === station.station_id && 'ring-2 ring-blue-500'
//                                 )}
//                                 onMouseEnter={() => handleCardHover(station)}
//                                 onMouseLeave={() => handleCardHover(null)}
//                                 onClick={() => handleCardClick(station)}
//                             >
//                                 <div className="flex items-start justify-between mb-3">
//                                     <div className="flex-1">
//                                         <h3 className="font-semibold text-base mb-1">
//                                             Station #{station.station_id}
//                                         </h3>
//                                         <p className="text-xs text-muted-foreground flex items-center gap-1">
//                                             <MapPin className="h-3 w-3" />
//                                             {station.distance_km.toFixed(1)} km away
//                                         </p>
//                                     </div>
//                                     <Badge variant={station.availability === 'AVAILABLE' ? 'success' : 'destructive'}>
//                                         {station.availability}
//                                     </Badge>
//                                 </div>

//                                 <div className="grid grid-cols-2 gap-2 text-xs">
//                                     <div className="flex items-center gap-1">
//                                         <DollarSign className="h-3 w-3 text-green-600" />
//                                         <span>${station.price_per_hour}/hr</span>
//                                     </div>
//                                     <div className="flex items-center gap-1">
//                                         <Badge
//                                             variant={station.health === 'OK' ? 'success' : station.health === 'CRITICAL' ? 'destructive' : 'warning'}
//                                             className="text-xs"
//                                         >
//                                             {station.health}
//                                         </Badge>
//                                     </div>
//                                 </div>
//                             </Card>
//                         ))}

//                         {stations.length === 0 && (
//                             <div className="text-center py-12 text-muted-foreground">
//                                 <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
//                                 <p>No stations found within {radiusKm} km</p>
//                                 <p className="text-xs mt-2">Try increasing the search radius</p>
//                             </div>
//                         )}
//                     </div>
//                 </div>

//                 {/* Right Panel - Map */}
//                 <div className="flex-1 relative">
//                     <MapContainer
//                         center={mapCenter}
//                         zoom={mapZoom}
//                         className="h-full w-full"
//                         zoomControl={true}
//                     >
//                         <MapController center={mapCenter} zoom={mapZoom} />

//                         <TileLayer
//                             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                         />

//                         {stations.map((station) => {
//                             const isHovered = hoveredStation?.station_id === station.station_id;
//                             const isAvailable = station.availability === 'AVAILABLE';

//                             let icon = isAvailable ? availableIcon : busyIcon;
//                             if (isHovered) {
//                                 icon = hoveredIcon;
//                             }

//                             return (
//                                 <Marker
//                                     key={station.station_id}
//                                     position={[station.lat, station.lng]}
//                                     icon={icon}
//                                     eventHandlers={{
//                                         click: () => handleStationClick(station),
//                                     }}
//                                 >
//                                     <Popup>
//                                         <div className="p-2">
//                                             <h3 className="font-semibold mb-1">Station #{station.station_id}</h3>
//                                             <div className="space-y-1 text-xs">
//                                                 <p className="flex items-center gap-1 text-muted-foreground">
//                                                     <MapPin className="h-3 w-3" />
//                                                     {station.distance_km.toFixed(1)} km away
//                                                 </p>
//                                                 <p className="flex items-center gap-1 text-muted-foreground">
//                                                     <DollarSign className="h-3 w-3" />
//                                                     ${station.price_per_hour}/hour
//                                                 </p>
//                                                 <div className="flex items-center gap-2 mt-2">
//                                                     <Badge variant={isAvailable ? 'success' : 'destructive'}>
//                                                         {station.availability}
//                                                     </Badge>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </Popup>
//                                 </Marker>
//                             );
//                         })}
//                     </MapContainer>

//                     {/* Legend */}
//                     <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur rounded-lg shadow-lg p-3 z-[1000]">
//                         <h4 className="text-xs font-semibold mb-2">Legend</h4>
//                         <div className="space-y-1 text-xs">
//                             <div className="flex items-center gap-2">
//                                 <div className="h-3 w-3 rounded-full bg-green-500"></div>
//                                 <span>Available</span>
//                             </div>
//                             <div className="flex items-center gap-2">
//                                 <div className="h-3 w-3 rounded-full bg-red-500"></div>
//                                 <span>Full</span>
//                             </div>
//                             <div className="flex items-center gap-2">
//                                 <div className="h-3 w-3 rounded-full bg-blue-500"></div>
//                                 <span>Hovered</span>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Search Info */}
//                     <div className="absolute top-4 left-4 bg-background/95 backdrop-blur rounded-lg shadow-lg p-3 z-[1000]">
//                         <div className="flex items-center gap-2 text-sm">
//                             <MapPin className="h-4 w-4 text-primary" />
//                             <div>
//                                 <p className="font-semibold">{searchLocation}</p>
//                                 <p className="text-xs text-muted-foreground">
//                                     Searching within {radiusKm} km
//                                 </p>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Station Detail Modal */}
//                 {selectedStation && (
//                     <StationDetailModal
//                         station={selectedStation}
//                         open={!!selectedStation}
//                         onClose={() => setSelectedStation(null)}
//                     />
//                 )}
//             </div>
//         </div>
//     );
// };

// export default MapExplorer;


import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Zap, Battery, DollarSign, Navigation, Search } from 'lucide-react';
import { stationAPI } from '@/services/api';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
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

// Popular Indian cities with coordinates
const INDIAN_CITIES = [
    { name: 'New Delhi', lat: 28.6139, lng: 77.2090 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    { name: 'Pune', lat: 18.5204, lng: 73.8567 },
    { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    { name: 'Surat', lat: 21.1702, lng: 72.8311 },
    { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
    { name: 'Kanpur', lat: 26.4499, lng: 80.3319 },
    { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
    { name: 'Indore', lat: 22.7196, lng: 75.8577 },
    { name: 'Thane', lat: 19.2183, lng: 72.9781 },
    { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
    { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
    { name: 'Pimpri-Chinchwad', lat: 18.6298, lng: 73.7997 },
    { name: 'Patna', lat: 25.5941, lng: 85.1376 },
    { name: 'Vadodara', lat: 22.3072, lng: 73.1812 },
    { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538 },
    { name: 'Ludhiana', lat: 30.9010, lng: 75.8573 },
    { name: 'Agra', lat: 27.1767, lng: 78.0081 },
    { name: 'Nashik', lat: 19.9975, lng: 73.7898 },
    { name: 'Faridabad', lat: 28.4089, lng: 77.3178 },
];

const RADIUS_OPTIONS = [5, 10, 20, 40, 50, 100];

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

    // Search filters
    const [searchLocation, setSearchLocation] = useState('New Delhi');
    const [userLocation, setUserLocation] = useState({ lat: 28.6139, lng: 77.2090 });
    const [radiusKm, setRadiusKm] = useState(20);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);

    // Filter cities based on search
    const filteredCities = INDIAN_CITIES.filter(city =>
        city.name.toLowerCase().includes(searchLocation.toLowerCase())
    );

    // Fetch stations with location params
    const { data: stationsData, isLoading } = useQuery({
        queryKey: ['stations', 'map', userLocation.lat, userLocation.lng, radiusKm],
        queryFn: () => stationAPI.getMapView({
            user_lat: userLocation.lat,
            user_lng: userLocation.lng,
            radius_km: radiusKm
        }),
        refetchInterval: 30000,
    });

    const stations = stationsData?.data || [];

    const handleLocationSelect = (city) => {
        setSearchLocation(city.name);
        setUserLocation({ lat: city.lat, lng: city.lng });
        setMapCenter([city.lat, city.lng]);
        setMapZoom(12);
        setShowLocationDropdown(false);
    };

    const handleUseCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lng: longitude });
                    setMapCenter([latitude, longitude]);
                    setSearchLocation('Current Location');
                    setMapZoom(13);
                },
                (error) => {
                    console.error('Error getting location:', error);
                }
            );
        }
    };

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
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* Search Bar */}
            <div className="bg-background border-b p-4">
                <div className="container mx-auto">
                    <div className="flex gap-4 items-end">
                        {/* Location Search */}
                        <div className="flex-1 max-w-md relative">
                            <Label htmlFor="location" className="mb-2 block">Search Location</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="location"
                                    type="text"
                                    placeholder="Search cities..."
                                    value={searchLocation}
                                    onChange={(e) => {
                                        setSearchLocation(e.target.value);
                                        setShowLocationDropdown(true);
                                    }}
                                    onFocus={() => setShowLocationDropdown(true)}
                                    className="pl-9"
                                />
                            </div>

                            {/* Location Dropdown */}
                            {showLocationDropdown && filteredCities.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                    {filteredCities.slice(0, 10).map((city) => (
                                        <button
                                            key={city.name}
                                            onClick={() => handleLocationSelect(city)}
                                            className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
                                        >
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            <span>{city.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Radius Select */}
                        <div className="w-32">
                            <Label htmlFor="radius" className="mb-2 block">Radius (km)</Label>
                            <select
                                id="radius"
                                value={radiusKm}
                                onChange={(e) => setRadiusKm(Number(e.target.value))}
                                className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {RADIUS_OPTIONS.map((radius) => (
                                    <option key={radius} value={radius}>
                                        {radius} km
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Current Location Button */}
                        <Button
                            variant="outline"
                            onClick={handleUseCurrentLocation}
                            className="h-10"
                        >
                            <Navigation className="h-4 w-4 mr-2" />
                            Use My Location
                        </Button>
                    </div>

                </div>
            </div>

            {/* Map View */}
            <div className="flex-1 flex">
                {/* Left Panel - Station List */}
                <div className="w-[350px] bg-background border-r overflow-y-auto">
                    <div className="p-4 border-b bg-background sticky top-0 z-10">
                        <h2 className="text-xl font-bold">Available Stations</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {stations.length} stations within {radiusKm} km
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
                                            {station.distance_km.toFixed(1)} km away
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
                                <p>No stations found within {radiusKm} km</p>
                                <p className="text-xs mt-2">Try increasing the search radius</p>
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
                                        mouseover: (e) => e.target.openPopup(),       // Shows the small white info bubble
                                        mouseout: (e) => e.target.closePopup(),       // Hides it when you leave
                                        click: () => handleStationClick(station),
                                    }}
                                >
                                    <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                                        {/* <Popup> */}
                                        <div className="p-2">
                                            <h3 className="font-semibold mb-1">Station #{station.station_id}</h3>
                                            <div className="space-y-1 text-xs">
                                                <p className="flex items-center gap-1 text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    {station.distance_km.toFixed(1)} km away
                                                </p>
                                                <p className="flex items-center gap-1 text-muted-foreground">
                                                    <DollarSign className="h-3 w-3" />
                                                    ${station.price_per_hour}/hour
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge variant={isAvailable ? 'success' : 'destructive'}>
                                                        {station.availability}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </Tooltip>
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

                    {/* Search Info */}
                    <div className="absolute top-4 left-4 bg-background/95 backdrop-blur rounded-lg shadow-lg p-3 z-[1000]">
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-primary" />
                            <div>
                                <p className="font-semibold">{searchLocation}</p>
                                <p className="text-xs text-muted-foreground">
                                    Searching within {radiusKm} km
                                </p>
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
        </div >
    );
};

export default MapExplorer;