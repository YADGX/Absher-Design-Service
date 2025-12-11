import { useCallback, useRef, useState, useEffect } from "react";
import { GoogleMap, Circle, Marker, LoadScript } from "@react-google-maps/api";
import { MapPin } from "lucide-react";

const GOOGLE_MAPS_API_KEY = "AIzaSyC-UiOG588zN5JeLzcU3mcnPn5nrT86sh4";

const getContainerStyle = (height: string) => ({
  width: "100%",
  height: height || "100%",
});

const defaultCenter = {
  lat: 24.7136, // Riyadh coordinates
  lng: 46.6753,
};

interface MapSelectorProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  height?: string;
}

export default function MapSelector({ 
  onLocationSelect, 
  selectedLocation,
  height = "100%"
}: MapSelectorProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [showError, setShowError] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (loadError) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [loadError]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMap(map);
    
    // Get user's current location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(userLocation);
          map.setCenter(userLocation);
        },
        () => {
          // If geolocation fails, use default center
          map.setCenter(defaultCenter);
        }
      );
    }
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      onLocationSelect(lat, lng);
    }
  }, [onLocationSelect]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback((error: Error) => {
    setLoadError(error);
    console.error("Google Maps load error:", error);
  }, []);

  // Don't block the map if there's an error - show it as a notification
  // Only show error notification if error exists and hasn't been dismissed
  const shouldShowError = loadError && showError;

  return (
    <LoadScript
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      onLoad={handleLoad}
      onError={handleError}
    >
      {!isLoaded ? (
        <div 
          className="w-full bg-neutral-800 flex items-center justify-center"
          style={{ height }}
        >
          <div className="text-center text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            <p className="text-sm">جاري تحميل الخريطة...</p>
          </div>
        </div>
      ) : (
        <div className="relative w-full" style={{ height }}>
          {shouldShowError && (
            <div 
              className="absolute top-2 left-2 right-2 bg-destructive/90 text-destructive-foreground text-xs p-2 rounded z-20 shadow-lg cursor-pointer hover:bg-destructive transition-colors"
              onClick={() => setShowError(false)}
            >
              <p>تحذير: قد تكون هناك مشكلة في تحميل الخريطة (اضغط للإخفاء)</p>
            </div>
          )}
          <GoogleMap
            mapContainerStyle={getContainerStyle(height)}
            center={selectedLocation || center}
            zoom={selectedLocation ? 12 : 10}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={handleMapClick}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
              styles: [
                {
                  featureType: "all",
                  elementType: "geometry",
                  stylers: [{ color: "#242424" }],
                },
                {
                  featureType: "all",
                  elementType: "labels.text.stroke",
                  stylers: [{ visibility: "off" }],
                },
                {
                  featureType: "all",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#ffffff" }],
                },
                {
                  featureType: "water",
                  elementType: "geometry",
                  stylers: [{ color: "#17263c" }],
                },
                {
                  featureType: "road",
                  elementType: "geometry",
                  stylers: [{ color: "#38414e" }],
                },
              ],
            }}
          >
            {selectedLocation && (
              <>
                <Marker
                  position={selectedLocation}
                  icon={{
                    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="8" fill="#3BBFA3" stroke="#fff" stroke-width="2"/>
                      </svg>
                    `),
                    scaledSize: new google.maps.Size(40, 40),
                    anchor: new google.maps.Point(20, 20),
                  }}
                />
                <Circle
                  center={selectedLocation}
                  radius={10000} // 10km in meters
                  options={{
                    fillColor: "#3BBFA3",
                    fillOpacity: 0.2,
                    strokeColor: "#3BBFA3",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                  }}
                />
              </>
            )}
          </GoogleMap>
          <div className="absolute bottom-2 right-2 bg-black/70 px-3 py-2 rounded text-xs text-white z-10">
            {selectedLocation 
              ? "تم تحديد الموقع - اضغط لتغييره" 
              : "اضغط على الخريطة لتحديد الموقع"}
          </div>
        </div>
      )}
    </LoadScript>
  );
}

