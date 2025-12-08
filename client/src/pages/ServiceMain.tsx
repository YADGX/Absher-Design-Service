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
  const { contacts } = useAppStore();
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const handleContactToggle = (phone: string) => {
    setSelectedContacts(prev => 
      prev.includes(phone) 
        ? prev.filter(p => p !== phone)
        : [...prev, phone]
    );
  };

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

    setIsSuccessOpen(true);
  };

  const handleSuccessClose = () => {
    setIsSuccessOpen(false);
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 pb-24" dir="rtl">
      {/* Header */}
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
          تعديل الإعدادات
        </Button>
      </div>

      <div className="space-y-6">
        {/* Map Section */}
        <Card className="bg-[#1e1e20] border-white/5 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              موقع الوجهة (نطاق 10 كم)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-48 bg-muted relative group cursor-pointer">
            {/* Mock Map */}
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

        {/* Emergency Contacts */}
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

        {/* Return Time */}
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
            <div className="space-y-2">
              <Label className="text-xs">وقت العودة</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "morning", label: "06:00 ص - 11:59 ص" },
                  { id: "afternoon", label: "12:00 م - 05:59 م" },
                  { id: "evening", label: "06:00 م - 11:59 م" },
                  { id: "night", label: "12:00 ص - 05:59 ص" }
                ].map((timeSlot) => (
                  <button
                    key={timeSlot.id}
                    onClick={() => setReturnTime(timeSlot.id)}
                    className={cn(
                      "p-3 rounded-lg text-xs font-medium border transition-all",
                      returnTime === timeSlot.id 
                        ? "bg-primary/20 border-primary text-primary" 
                        : "bg-background/50 border-white/10 hover:bg-white/5"
                    )}
                  >
                    {timeSlot.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleStartService}
          className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 mt-4 shadow-[0_0_20px_rgba(59,191,167,0.3)]"
        >
          ابدأ الخدمة
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
