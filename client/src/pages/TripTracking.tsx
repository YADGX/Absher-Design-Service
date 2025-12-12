import { useState, useEffect, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store";
import { ArrowRight, MapPin, Clock, Navigation, Calendar, Plus, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";

type Trip = {
  id: number;
  destinationLat: string | null;
  destinationLng: string | null;
  returnDate: string;
  returnTimeSlot: string;
  createdAt: string;
  isActive: boolean;
};

function parseTimeSlot(timeSlot: string): { hour: number; minutes: number; dateOffset?: number } {
  const [period, slot] = timeSlot.split('_');
  const isAM = period === 'AM';
  
  let hour = 0;
  let dateOffset = 0;
  
  if (slot === 'early') {
    // 12:00 – 6:00 slot, end at 6:00
    hour = isAM ? 6 : 18; // 6:00 AM or 6:00 PM
  } else {
    // 6:00 – 12:00 slot, end at 12:00
    if (isAM) {
      hour = 12; // 12:00 PM (noon)
    } else {
      hour = 0; // 12:00 AM (midnight) - next day
      dateOffset = 1; // Add one day
    }
  }
  
  return { hour, minutes: 0, dateOffset };
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "انتهى الوقت";
  
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours} ساعة و ${minutes} دقيقة`;
  }
  return `${minutes} دقيقة`;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function TripTracking() {
  const [, setLocation] = useLocation();
  const params = useParams<{ tripId: string }>();
  const tripId = parseInt(params.tripId || '0');
  const { userProfileId } = useAppStore();
  
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [endTripDialogOpen, setEndTripDialogOpen] = useState(false);
  const [endTripSuccessOpen, setEndTripSuccessOpen] = useState(false);
  const [destinationAddress, setDestinationAddress] = useState<string>("");

  // Fetch trip data
  const { data: trip, refetch } = useQuery<Trip>({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trip/${tripId}`);
      if (!res.ok) throw new Error("Failed to fetch trip");
      return res.json();
    },
    enabled: !!tripId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Calculate return time
  const getReturnTime = useCallback((trip: Trip | undefined): Date | null => {
    if (!trip) return null;
    
    // Parse returnDate (format: YYYY-MM-DD)
    const returnDate = new Date(trip.returnDate + 'T00:00:00');
    const { hour, minutes, dateOffset = 0 } = parseTimeSlot(trip.returnTimeSlot);
    returnDate.setHours(hour, minutes, 0, 0);
    // Add date offset if needed (for PM_late which ends at midnight next day)
    if (dateOffset > 0) {
      returnDate.setDate(returnDate.getDate() + dateOffset);
    }
    return returnDate;
  }, []);

  // Update countdown
  useEffect(() => {
    if (!trip) return;

    const updateCountdown = () => {
      const returnTime = getReturnTime(trip);
      if (!returnTime) return;

      const now = new Date();
      const remaining = returnTime.getTime() - now.getTime();
      setTimeRemaining(remaining);

      // Calculate total duration
      const startTime = new Date(trip.createdAt);
      const duration = returnTime.getTime() - startTime.getTime();
      setTotalDuration(duration);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [trip, getReturnTime]);

  // Fetch destination address (reverse geocoding)
  useEffect(() => {
    if (!trip?.destinationLat || !trip?.destinationLng) return;

    const fetchAddress = async () => {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${trip.destinationLat},${trip.destinationLng}&language=ar&key=AIzaSyC-UiOG588zN5JeLzcU3mcnPn5nrT86sh4`
        );
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setDestinationAddress(data.results[0].formatted_address);
        }
      } catch (error) {
        console.error("Failed to fetch address:", error);
      }
    };

    fetchAddress();
  }, [trip?.destinationLat, trip?.destinationLng]);

  // Check network signal strength
  const getNetworkSignalStrength = (): 'weak' | 'strong' => {
    // Check if Network Information API is available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      // Check effective type (4G, 3G, 2G, slow-2G)
      const effectiveType = connection.effectiveType;
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        return 'weak';
      }
      
      // Check downlink (Mbps) - less than 1 Mbps is considered weak
      if (connection.downlink && connection.downlink < 1) {
        return 'weak';
      }
      
      // Check if user is on a cellular connection with limited bandwidth
      if (connection.type === 'cellular' && connection.downlink && connection.downlink < 2) {
        return 'weak';
      }
    }
    
    // Fallback: Check online status and network events
    if (!navigator.onLine) {
      return 'weak';
    }
    
    return 'strong';
  };

  // Save location update
  const saveLocationUpdate = useCallback(async (position: GeolocationPosition) => {
    if (!trip || !trip.isActive) return;

    try {
      await fetch("/api/location-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: trip.id,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
          accuracy: position.coords.accuracy ? position.coords.accuracy.toString() : null,
        }),
      });
      console.log("Location saved:", position.coords.latitude, position.coords.longitude);
    } catch (error) {
      console.error("Failed to save location:", error);
    }
  }, [trip]);

  // Location tracking with interval based on signal strength
  useEffect(() => {
    if (!trip || !trip.isActive) return;

    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported");
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;

    const getLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          saveLocationUpdate(position);
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };

    const startTracking = () => {
      // Get initial location
      getLocation();

      // Set up interval that checks signal strength each time
      const scheduleNext = () => {
        if (intervalId) {
          clearTimeout(intervalId);
        }

        const signalStrength = getNetworkSignalStrength();
        const interval = signalStrength === 'weak' ? 60000 : 300000; // 1 minute or 5 minutes
        
        intervalId = setTimeout(() => {
          getLocation();
          scheduleNext(); // Schedule next location update
        }, interval);
      };

      scheduleNext();
    };

    startTracking();

    return () => {
      if (intervalId) {
        clearTimeout(intervalId);
      }
    };
  }, [trip, saveLocationUpdate]);

  // Helper function to determine time slot from an hour
  const getTimeSlotFromHour = useCallback((hour: number): { period: 'AM' | 'PM', slot: 'early' | 'late', endHour: number, dateOffset: number } => {
    let period: 'AM' | 'PM';
    let slot: 'early' | 'late';
    let endHour: number;
    let dateOffset = 0;
    
    // Normalize hour to 0-23 range
    const normalizedHour = hour % 24;
    
    if (normalizedHour >= 0 && normalizedHour < 6) {
      // 12:00 AM - 6:00 AM slot (early AM), end at 6:00 AM
      period = 'AM';
      slot = 'early';
      endHour = 6;
    } else if (normalizedHour >= 6 && normalizedHour < 12) {
      // 6:00 AM - 12:00 PM slot (late AM), end at 12:00 PM
      period = 'AM';
      slot = 'late';
      endHour = 12;
    } else if (normalizedHour >= 12 && normalizedHour < 18) {
      // 12:00 PM - 6:00 PM slot (early PM), end at 6:00 PM
      period = 'PM';
      slot = 'early';
      endHour = 18;
    } else {
      // 6:00 PM - 12:00 AM slot (late PM), end at 12:00 AM (next day)
      period = 'PM';
      slot = 'late';
      endHour = 0;
      dateOffset = 1;
    }
    
    return { period, slot, endHour, dateOffset };
  }, []);

  // Extend trip mutation
  const extendTripMutation = useMutation({
    mutationFn: async (hours: number) => {
      if (!trip) throw new Error("No trip data");
      
      const returnTime = getReturnTime(trip);
      if (!returnTime) throw new Error("Invalid return time");
      
      // Add the extension hours to current return time
      const extendedTime = new Date(returnTime.getTime() + hours * 60 * 60 * 1000);
      
      // Determine which slot this extended time falls into
      const extendedHour = extendedTime.getHours();
      const { period, slot, endHour, dateOffset } = getTimeSlotFromHour(extendedHour);
      
      // Create a new date based on the extended time's date
      const newReturnDate = new Date(extendedTime);
      newReturnDate.setHours(endHour, 0, 0, 0);
      newReturnDate.setMinutes(0);
      newReturnDate.setSeconds(0);
      newReturnDate.setMilliseconds(0);
      
      // Add date offset if needed (for PM_late which ends at midnight next day)
      if (dateOffset > 0) {
        newReturnDate.setDate(newReturnDate.getDate() + dateOffset);
      }
      
      // Format the date for the API (YYYY-MM-DD)
      const year = newReturnDate.getFullYear();
      const month = String(newReturnDate.getMonth() + 1).padStart(2, '0');
      const day = String(newReturnDate.getDate()).padStart(2, '0');
      const newReturnDateString = `${year}-${month}-${day}`;
      
      const newTimeSlotString = `${period}_${slot}`;
      
      const res = await fetch(`/api/trip/${tripId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnDate: newReturnDateString,
          returnTimeSlot: newTimeSlotString,
          isActive: true, // Explicitly preserve active status
        }),
      });
      
      if (!res.ok) throw new Error("Failed to extend trip");
      return res.json();
    },
    onSuccess: async () => {
      toast({
        title: "تم التمديد",
        description: `تم تمديد الرحلة بنجاح لمدة ساعتين إضافيتين`,
      });
      setExtendDialogOpen(false);
      // Wait for refetch to complete to ensure countdown updates
      await refetch();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل تمديد الرحلة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  // End trip mutation
  const endTripMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/trip/${tripId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: false,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to end trip");
      return res.json();
    },
    onSuccess: () => {
      setEndTripDialogOpen(false);
      setEndTripSuccessOpen(true);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل إنهاء الرحلة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const handleOpenGoogleMaps = () => {
    if (!trip?.destinationLat || !trip?.destinationLng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${trip.destinationLat},${trip.destinationLng}`;
    window.open(url, '_blank');
  };

  const returnTime = getReturnTime(trip);
  const startTime = trip ? new Date(trip.createdAt) : null;
  const progress = totalDuration > 0 ? ((totalDuration - timeRemaining) / totalDuration) * 100 : 0;

  if (!trip) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans p-4 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-muted-foreground">جاري تحميل بيانات الرحلة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 pb-24" dir="rtl">
      <div className="flex items-center gap-4 mb-6 pt-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/home")}>
          <ArrowRight className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">تتبع الرحلة</h1>
      </div>

      <div className="space-y-6">
        {/* Trip Status */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  trip.isActive ? "bg-green-500 animate-pulse" : "bg-gray-500"
                )} />
                <span className="font-medium text-sm">
                  {trip.isActive ? "قيد التنفيذ" : "منتهية"}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">#{trip.id}</span>
            </div>
          </CardContent>
        </Card>

        {/* Destination */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-primary text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              الوجهة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">الموقع:</p>
              <p className="text-base font-medium">
                {destinationAddress || `${trip.destinationLat}, ${trip.destinationLng}`}
              </p>
            </div>
            <Button
              onClick={handleOpenGoogleMaps}
              className="w-full gap-2"
              variant="outline"
            >
              <Navigation className="w-4 h-4" />
              فتح في خرائط Google
            </Button>
          </CardContent>
        </Card>

        {/* Remaining Time */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-primary text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              الوقت المتبقي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary mb-2">
                {formatTimeRemaining(timeRemaining)}
              </p>
              <p className="text-xs text-muted-foreground">
                حتى: {returnTime ? formatDateTime(returnTime) : "غير محدد"}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>التقدم</span>
                <span>{Math.max(0, Math.min(100, progress)).toFixed(0)}%</span>
              </div>
              <Progress value={Math.max(0, Math.min(100, progress))} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Extend Trip */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <Button
              onClick={() => setExtendDialogOpen(true)}
              variant="outline"
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              تمديد الرحلة (+2 ساعة)
            </Button>
          </CardContent>
        </Card>

        {/* Trip Summary */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-primary text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              ملخص الرحلة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">وقت البدء:</span>
              <span className="font-medium">{startTime ? formatDateTime(startTime) : "غير محدد"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">وقت العودة:</span>
              <span className="font-medium">{returnTime ? formatDateTime(returnTime) : "غير محدد"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">المدة الإجمالية:</span>
              <span className="font-medium">{formatTimeRemaining(totalDuration)}</span>
            </div>
          </CardContent>
        </Card>

        {/* End Trip Button */}
        <Button
          onClick={() => setEndTripDialogOpen(true)}
          variant="destructive"
          className="w-full h-12 text-lg font-bold"
        >
          <XCircle className="w-5 h-5 ml-2" />
          إنهاء الرحلة
        </Button>
      </div>

      {/* Extend Trip Dialog */}
      <AlertDialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <AlertDialogContent className="bg-card border-border text-right" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تمديد الرحلة</AlertDialogTitle>
            <AlertDialogDescription>
              هل تريد تمديد وقت الرحلة بساعتين إضافيتين؟
              <br />
              <span className="font-medium text-foreground">
                الوقت الجديد: {returnTime ? formatDateTime(new Date(returnTime.getTime() + 2 * 60 * 60 * 1000)) : ""}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start gap-2">
            <AlertDialogAction
              onClick={() => extendTripMutation.mutate(2)}
              disabled={extendTripMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {extendTripMutation.isPending ? "جاري التمديد..." : "تأكيد التمديد"}
            </AlertDialogAction>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End Trip Dialog */}
      <AlertDialog open={endTripDialogOpen} onOpenChange={setEndTripDialogOpen}>
        <AlertDialogContent className="bg-card border-border text-right" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إنهاء الرحلة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إنهاء الرحلة؟ لن يتم إرسال أي تنبيهات بعد الآن.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start gap-2">
            <AlertDialogAction
              onClick={() => endTripMutation.mutate()}
              disabled={endTripMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {endTripMutation.isPending ? "جاري الإنهاء..." : "تأكيد إنهاء الرحلة"}
            </AlertDialogAction>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End Trip Success Dialog */}
      <AlertDialog open={endTripSuccessOpen} onOpenChange={setEndTripSuccessOpen}>
        <AlertDialogContent className="bg-card border-border text-right" dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="text-primary text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              تم إنهاء الرحلة
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground pt-2">
              تم إنهاء خدمة التتبع بنجاح. لن يتم إرسال أي تنبيهات بعد الآن.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start">
            <AlertDialogAction 
              onClick={() => {
                setEndTripSuccessOpen(false);
                setLocation("/home");
              }} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              موافق
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

