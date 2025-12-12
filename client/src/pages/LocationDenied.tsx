import { Button } from "@/components/ui/button";
import { MapPin, AlertTriangle, Settings } from "lucide-react";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";

export default function LocationDenied() {
  const [, setLocation] = useLocation();

  const handleRequestPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      
      if (permission.state === 'prompt' || permission.state === 'denied') {
        // Request permission
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(),
            () => reject(),
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
          );
        });
      }
      
      // Check if permission was granted
      const newPermission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      if (newPermission.state === 'granted') {
        setLocation("/service-main");
      }
    } catch (error) {
      console.error("Failed to request location permission:", error);
      // Try to open device settings
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center" dir="rtl">
        <div className="max-w-md w-full space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-6 bg-destructive/10 rounded-full border border-destructive/20">
              <MapPin className="w-16 h-16 text-destructive" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              الوصول إلى الموقع مطلوب
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              خدمة التتبع تحتاج إلى الوصول إلى موقعك لتوفير الحماية والأمان خلال رحلتك
            </p>
          </div>

          {/* Explanation Card */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 text-right">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">لماذا نحتاج موقعك؟</h3>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>تتبع موقعك أثناء الرحلة</li>
                  <li>إرسال تنبيهات في حالة الطوارئ</li>
                  <li>توفير معلومات دقيقة لجهات الاتصال</li>
                  <li>ضمان سلامتك وأمانك</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground mb-2">كيفية تفعيل الإذن:</p>
            <ol className="space-y-1 text-right list-decimal list-inside">
              <li>انقر على زر "تفعيل الإذن" أدناه</li>
              <li>اختر "السماح" في نافذة الإذن</li>
              <li>أو اذهب إلى إعدادات المتصفح وافعل موقعك يدوياً</li>
            </ol>
          </div>

          {/* Action Button */}
          <div className="space-y-3">
            <Button
              onClick={handleRequestPermission}
              className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90"
              size="lg"
            >
              <MapPin className="w-5 h-5 ml-2" />
              تفعيل إذن الموقع
            </Button>
            
            <Button
              onClick={() => setLocation("/home")}
              variant="outline"
              className="w-full"
            >
              العودة للرئيسية
            </Button>
          </div>

          {/* Note */}
          <p className="text-xs text-muted-foreground">
            ملاحظة: لن يتم استخدام موقعك إلا أثناء الرحلة النشطة
          </p>
        </div>
      </div>
    </Layout>
  );
}


