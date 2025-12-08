import { useState } from "react";
import { useLocation } from "wouter";
import { useAppStore } from "@/lib/store";
import { ArrowRight, MapPin, Calendar, Clock, AlertTriangle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ServiceMain() {
  const [, setLocation] = useLocation();
  const { contacts, userProfileId } = useAppStore();
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [returnDate, setReturnDate] = useState("");
  const [timePeriod, setTimePeriod] = useState<"AM" | "PM">("AM");
  const [timeSlot, setTimeSlot] = useState<"early" | "late" | "">("");
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const returnTime = timeSlot ? `${timePeriod}_${timeSlot}` : "";

  const handleContactToggle = (phone: string) => {
    setSelectedContacts(prev => 
      prev.includes(phone) 
        ? prev.filter(p => p !== phone)
        : [...prev, phone]
    );
  };

  const startTripMutation = useMutation({
    mutationFn: async () => {
      if (!userProfileId) throw new Error("No user profile");
      
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfileId,
          returnDate,
          returnTimeSlot: returnTime,
          selectedContactIds: JSON.stringify(selectedContacts),
          isActive: true,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to start trip");
      return res.json();
    },
    onSuccess: () => {
      setIsSuccessOpen(true);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل تفعيل الخدمة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const handleStartService = () => {
    if (selectedContacts.length < 3) {
      toast({
        title: "تنبيه",
        description: "يجب اختيار 3 جهات اتصال للطوارئ على الأقل",
        variant: "destructive"
      });
      return;
    }
    if (!returnDate || !returnTime) {
      toast({
        title: "تنبيه",
        description: "يرجى تحديد وقت وتاريخ العودة",
        variant: "destructive"
      });
      return;
    }

    startTripMutation.mutate();
  };

  const handleSuccessClose = () => {
    setIsSuccessOpen(false);
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 pb-24" dir="rtl">
      <div className="flex items-center justify-between mb-6 pt-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowRight className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">معلومات الرحلة</h1>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocation("/setup")} 
          className="gap-2 border-white/10 hover:bg-white/5 text-xs h-8"
        >
          <Settings className="w-3.5 h-3.5" />
          تعديل إعدادات الخدمة
        </Button>
      </div>

      <div className="space-y-6">
        <Card className="bg-[#1e1e20] border-white/5 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              موقع الوجهة (نطاق 10 كم)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-48 bg-muted relative group cursor-pointer">
            <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover opacity-50">
              <div className="w-32 h-32 rounded-full border-2 border-primary/50 bg-primary/10 flex items-center justify-center animate-pulse">
                <MapPin className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(59,191,167,0.8)]" fill="currentColor" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
              اضغط لتحديد الموقع
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e1e20] border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              جهات اتصال الطوارئ
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              سيتم إرسال رسالة تنبيه لهذه الجهات في حين حان وقت العودة ولم يتم تأكيد الوصول.
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48 pr-4">
              <div className="space-y-3">
                {contacts.length > 0 ? (
                  contacts.map((contact, idx) => (
                    <div key={idx} className="flex items-center space-x-reverse space-x-3 p-2 rounded hover:bg-white/5 transition-colors">
                      <Checkbox 
                        id={`contact-${idx}`} 
                        checked={selectedContacts.includes(contact.phone)}
                        onCheckedChange={() => handleContactToggle(contact.phone)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className="grid gap-0.5 flex-1 mr-3">
                        <Label htmlFor={`contact-${idx}`} className="font-medium cursor-pointer">
                          {contact.name}
                        </Label>
                        <span className="text-xs text-muted-foreground">{contact.relationship} - {contact.phone}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4 text-sm">
                    لا توجد جهات اتصال محفوظة. يرجى إعداد الخدمة أولاً.
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="mt-2 text-xs text-right text-primary/80">
              {selectedContacts.length} محدد (مطلوب 3 على الأقل)
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e1e20] border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              موعد العودة المتوقع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">تاريخ العودة</Label>
              <div className="relative">
                <Input 
                  type="date" 
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="bg-background/50 border-white/10 text-right appearance-none" 
                  style={{ colorScheme: "dark" }}
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-xs">وقت العودة</Label>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTimePeriod("AM")}
                  data-testid="toggle-am"
                  className={cn(
                    "p-3 rounded-lg text-sm font-bold border transition-all",
                    timePeriod === "AM"
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background/50 border-white/10 hover:bg-white/5 text-muted-foreground"
                  )}
                >
                  صباحاً (AM)
                </button>
                <button
                  onClick={() => setTimePeriod("PM")}
                  data-testid="toggle-pm"
                  className={cn(
                    "p-3 rounded-lg text-sm font-bold border transition-all",
                    timePeriod === "PM"
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background/50 border-white/10 hover:bg-white/5 text-muted-foreground"
                  )}
                >
                  مساءً (PM)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTimeSlot("early")}
                  data-testid="slot-early"
                  className={cn(
                    "p-3 rounded-lg text-xs font-medium border transition-all",
                    timeSlot === "early"
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-background/50 border-white/10 hover:bg-white/5"
                  )}
                >
                  6:00 – 11:59
                </button>
                <button
                  onClick={() => setTimeSlot("late")}
                  data-testid="slot-late"
                  className={cn(
                    "p-3 rounded-lg text-xs font-medium border transition-all",
                    timeSlot === "late"
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-background/50 border-white/10 hover:bg-white/5"
                  )}
                >
                  12:00 – 5:59
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleStartService}
          disabled={startTripMutation.isPending}
          className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 mt-4 shadow-[0_0_20px_rgba(59,191,167,0.3)]"
        >
          {startTripMutation.isPending ? "جاري التفعيل..." : "ابدأ الخدمة"}
        </Button>
      </div>

      <AlertDialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <AlertDialogContent className="bg-[#1e1e20] border-white/10 text-right" dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="text-primary text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              تم تفعيل الخدمة
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 pt-2">
              تم تفعيل خدمة تتبع بنجاح. سيتم إرسال التنبيهات في الموعد المحدد في حال عدم العودة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start">
            <AlertDialogAction onClick={handleSuccessClose} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              العودة للرئيسية
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CheckCircle2({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
