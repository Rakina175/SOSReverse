import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { MapPin, Navigation, Compass, AlertCircle } from 'lucide-react';

interface MapProps {
  victimLat: number;
  victimLon: number;
  responderLat?: number | null;
  responderLon?: number | null;
  status?: string;
  zoom?: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

export const GoogleMapWrapper: React.FC<MapProps> = ({
  victimLat,
  victimLon,
  responderLat,
  responderLon,
  status,
  zoom = 14
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isGoogleMapsEnabled = !!apiKey && apiKey !== 'your_google_maps_api_key';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: isGoogleMapsEnabled ? apiKey : '',
  });

  const center = {
    lat: victimLat,
    lng: victimLon,
  };

  // Google Map implementation
  if (isGoogleMapsEnabled) {
    if (loadError) {
      return (
        <div className="w-full h-full bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle size={32} className="text-rose-500 mb-2" />
          <h4 className="text-sm font-bold text-white mb-1">Google Maps failed to load</h4>
          <p className="text-xs text-slate-400">Please verify your VITE_GOOGLE_MAPS_API_KEY in your .env file.</p>
        </div>
      );
    }

    if (!isLoaded) {
      return (
        <div className="w-full h-full bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-slate-800 border-t-rose-500 animate-spin"></div>
        </div>
      );
    }

    const responderPos = responderLat && responderLon ? { lat: responderLat, lng: responderLon } : null;

    return (
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        options={{
          styles: darkMapStyles, // Custom dark mode style sheets for Google Maps
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        {/* Victim Location pin */}
        <Marker 
          position={center} 
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          }}
          title="Citizen Emergency Location"
        />

        {/* Responder Location pin */}
        {responderPos && (
          <Marker 
            position={responderPos} 
            icon={{
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: '#6366F1',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 1.5,
            }}
            title="Responder Live Location"
          />
        )}

        {/* Route Connection Line */}
        {responderPos && (
          <Polyline
            path={[responderPos, center]}
            options={{
              strokeColor: '#6366F1',
              strokeOpacity: 0.8,
              strokeWeight: 4,
              geodesic: true,
            }}
          />
        )}
      </GoogleMap>
    );
  }

  // Fallback Vector SVG Map Mockup (Beautiful Glassmorphic Simulation)
  return <MockVectorMap {...{ victimLat, victimLon, responderLat, responderLon, status }} />;
};

// ----------------------------------------------------
// FALLBACK VECTOR MAP SIMULATOR COMPONENT
// ----------------------------------------------------
const MockVectorMap: React.FC<MapProps> = ({
  victimLat,
  victimLon,
  responderLat,
  responderLon,
  status
}) => {
  // Convert lat/lon coordinate differences to SVG coordinate offsets
  // Center is victim coordinates (200, 200) on a 400x400 grid canvas
  const [respX, setRespX] = useState(100);
  const [respY, setRespY] = useState(100);

  useEffect(() => {
    if (responderLat && responderLon) {
      // Scale lat/lon offsets to 400px canvas coordinates
      const dLat = responderLat - victimLat;
      const dLon = responderLon - victimLon;
      
      // Calculate coordinates. Lat increases going up, but SVG Y increases going down.
      const x = 200 + dLon * 4500;
      const y = 200 - dLat * 4500;
      
      // Clamp coordinates to stay within map canvas bounds
      setRespX(Math.max(20, Math.min(380, x)));
      setRespY(Math.max(20, Math.min(380, y)));
    }
  }, [victimLat, victimLon, responderLat, responderLon]);

  return (
    <div className="relative w-full h-full bg-[#05080E] overflow-hidden rounded-2xl border border-slate-800 shadow-inner flex flex-col justify-between">
      
      {/* SVG Vector Canvas Grid */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
        <defs>
          <radialGradient id="beacon" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#EF4444" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="respBeacon" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </radialGradient>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Backdrop Grid Pattern */}
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Vector Streets / Roads */}
        <g stroke="rgba(255, 255, 255, 0.035)" strokeLinecap="round">
          {/* Main Avenues */}
          <line x1="50" y1="0" x2="50" y2="400" strokeWidth="12" />
          <line x1="200" y1="0" x2="200" y2="400" strokeWidth="16" />
          <line x1="350" y1="0" x2="350" y2="400" strokeWidth="12" />
          
          {/* Connecting Streets */}
          <line x1="0" y1="80" x2="400" y2="80" strokeWidth="10" />
          <line x1="0" y1="200" x2="400" y2="200" strokeWidth="14" />
          <line x1="0" y1="320" x2="400" y2="320" strokeWidth="10" />
          
          {/* Diagonal highways */}
          <line x1="0" y1="0" x2="400" y2="400" strokeWidth="6" strokeDasharray="5,5" opacity="0.3" />
        </g>

        {/* Vector Street Labels */}
        <g fill="rgba(255,255,255,0.15)" fontSize="8" fontWeight="bold" letterSpacing="1">
          <text x="208" y="45" transform="rotate(90, 208, 45)">BROADWAY AVE</text>
          <text x="15" y="194">W 42ND ST</text>
          <text x="290" y="314">E 14TH ST</text>
        </g>

        {/* Dispatch routing pathing line */}
        {responderLat && responderLon && (
          <g>
            {/* Pulsing route glow path */}
            <line 
              x1={respX} y1={respY} x2="200" y2="200" 
              stroke="#6366F1" strokeWidth="3" strokeOpacity="0.4"
              strokeLinecap="round"
            />
            {/* Dashed overlay arrow pathway */}
            <line 
              x1={respX} y1={respY} x2="200" y2="200" 
              stroke="#818CF8" strokeWidth="2" strokeDasharray="6,4"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Citizen SOS pulsing beacon */}
        <g transform="translate(200, 200)">
          <circle r="25" fill="url(#beacon)" className="animate-pulse" />
          <circle r="12" fill="none" stroke="#EF4444" strokeWidth="1" opacity="0.8" className="animate-ping" style={{ animationDuration: '2s' }} />
          <circle r="4" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
        </g>

        {/* Responder Marker */}
        {responderLat && responderLon && (
          <g transform={`translate(${respX}, ${respY})`}>
            <circle r="20" fill="url(#respBeacon)" className="animate-pulse" style={{ animationDuration: '1.5s' }} />
            <circle r="4" fill="#6366F1" stroke="#FFFFFF" strokeWidth="1.5" />
          </g>
        )}
      </svg>

      {/* Dynamic compass indicator details */}
      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5 font-mono select-none">
        <Compass size={12} className="text-indigo-400 animate-spin-slow" />
        <span>VEC-MAP v1.02 // NY GRID</span>
      </div>

      {responderLat && responderLon ? (
        <div className="absolute bottom-3 right-3 bg-indigo-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-indigo-900/40 text-[10px] text-slate-300 font-mono select-none flex items-center gap-1">
          <Navigation size={10} className="text-indigo-400 animate-bounce" />
          <span>ROUTE GPS LOCK: {responderLat.toFixed(5)}, {responderLon.toFixed(5)}</span>
        </div>
      ) : (
        <div className="absolute bottom-3 right-3 bg-rose-950/70 backdrop-blur px-2.5 py-1 rounded-lg border border-rose-900/40 text-[9px] text-rose-300 font-mono tracking-wide select-none animate-pulse">
          BROADCASTING LOCALIZATION PINGS...
        </div>
      )}
    </div>
  );
};

// Dark style theme for Google Maps API loading
const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#070b13' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#070b13' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#09151c' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#131b2c' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#18243c' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca3af' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#1d2a45' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#253556' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3f4f6' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#131e33' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#020508' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];
