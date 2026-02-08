import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { MapPin, Navigation, LocateFixed } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ref, set } from 'firebase/database';
import { db } from '../firebase/config';

// Fix Icon Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RecenterAutomatically = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => { if (lat && lng) map.setView([lat, lng], map.getZoom()); }, [lat, lng, map]);
  return null;
};

const GPSRadarCard = ({ gpsData, geofenceData, deviceId, currentMaxDistance, customToast }) => {
  const [radius, setRadius] = useState(30);

  // Sync radius dengan database
  useEffect(() => { if (currentMaxDistance) setRadius(currentMaxDistance); }, [currentMaxDistance]);

  const lat = gpsData?.lat || -6.200000;
  const lng = gpsData?.lng || 106.816666;
  const homeLat = geofenceData?.home_lat || gpsData?.lat;
  const homeLng = geofenceData?.home_lng || gpsData?.lng;
  const dist = gpsData?.distance_home || 0;

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    if (deviceId) {
      set(ref(db, `devices/${deviceId}/controls/max_distance`), newRadius);
      if (customToast) customToast(`Radius aman diubah ke ${newRadius}m`, 'success');
    }
  };

  const handleSetHome = () => {
    if (!deviceId || !gpsData?.lat) return;
    set(ref(db, `devices/${deviceId}/gps/home_lat`), gpsData.lat);
    set(ref(db, `devices/${deviceId}/gps/home_lng`), gpsData.lng);
    if (customToast) customToast('Lokasi Home diperbarui', 'success');
  };

  return (
    <Card className="bg-white/80 backdrop-blur shadow-sm overflow-hidden mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-lg">Lokasi Alat</CardTitle>
          </div>
          <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
             Sat: {gpsData?.satellites || 0}
          </div>
        </div>
      </CardHeader>
      
      <div className="h-64 w-full relative z-0">
        <MapContainer center={[lat, lng]} zoom={18} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='© OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[lat, lng]}> <Popup>Alat Disini</Popup> </Marker>
          {homeLat && <Circle center={[homeLat, homeLng]} radius={radius} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }} />}
          <RecenterAutomatically lat={lat} lng={lng} />
        </MapContainer>
      </div>

      <CardContent className="pt-4 space-y-4">
        {/* SLIDER RADIUS */}
        <div>
            <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Radius Aman</span>
                <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded"> {radius}m </span>
            </div>
            <input type="range" min="10" max="200" step="5" value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} onMouseUp={(e) => handleRadiusChange(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-2 rounded border text-center">
                <p className="text-[10px] text-slate-400">Jarak dari Home</p>
                <p className="text-lg font-bold text-slate-800">{dist.toFixed(1)}m</p>
            </div>
             <Button variant="outline" size="sm" onClick={handleSetHome} className="h-full flex flex-col gap-1 border-dashed">
                <LocateFixed className="w-4 h-4" /> <span className="text-xs">Set Home</span>
             </Button>
        </div>
        <Button className="w-full gap-2 text-xs" variant="default" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank')}>
            <Navigation className="w-4 h-4" /> Buka Google Maps
        </Button>
      </CardContent>
    </Card>
  );
};

export default GPSRadarCard;