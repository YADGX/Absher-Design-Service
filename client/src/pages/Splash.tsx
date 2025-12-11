import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { TrackingIcon } from "@/components/TrackingIcon";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";

export default function Splash() {
  const [, setLocation] = useLocation();
  const { isSetupComplete } = useAppStore();

  const handleContinue = () => {
    if (isSetupComplete) {
      setLocation("/service-main");
    } else {
      setLocation("/setup");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center relative overflow-hidden" dir="rtl">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8 p-6 bg-primary/10 rounded-full border border-primary/20"
      >
        <TrackingIcon className="w-24 h-24 text-primary" />
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-4xl font-bold mb-4 text-primary"
      >
        تتبع
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-xl text-muted-foreground leading-relaxed max-w-sm mb-12"
      >
        "نضيء ليلاً دامساً، بحماية تلقائية لرحلاتك البرية"
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="w-full max-w-xs"
      >
        <Button 
          onClick={handleContinue}
          className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90"
        >
          اذهب إلى الخدمة
        </Button>
      </motion.div>
    </div>
  );
}
