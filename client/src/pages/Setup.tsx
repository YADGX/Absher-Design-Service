import { useState } from "react";
import { useLocation } from "wouter";
import { useAppStore, Contact } from "@/lib/store";
import { ArrowRight, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Validation Schema
const setupSchema = z.object({
  city: z.string().min(1, "يرجى اختيار المدينة"),
  contacts: z.array(z.object({
    name: z.string().min(2, "الاسم مطلوب"),
    phone: z.string().min(9, "رقم الجوال مطلوب"),
    relationship: z.string().min(2, "صلة القرابة مطلوبة"),
  })).min(3, "يجب إضافة 3 جهات اتصال على الأقل").max(5, "الحد الأقصى 5 جهات اتصال"),
  bloodType: z.string().optional(),
  chronicDiseases: z.string().optional(),
});

type SetupFormValues = z.infer<typeof setupSchema>;

export default function Setup() {
  const [, setLocation] = useLocation();
  const { setSetupComplete, setContacts, setMedicalInfo, setCity } = useAppStore();
  
  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      city: "",
      contacts: [
        { name: "", phone: "", relationship: "" },
        { name: "", phone: "", relationship: "" },
        { name: "", phone: "", relationship: "" },
      ],
      bloodType: "",
      chronicDiseases: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contacts",
  });

  const onSubmit = (data: SetupFormValues) => {
    setCity(data.city);
    setContacts(data.contacts);
    setMedicalInfo({
      bloodType: data.bloodType || "",
      chronicDiseases: data.chronicDiseases || "",
    });
    setSetupComplete(true);
    setLocation("/splash");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
          <ArrowRight className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">إعدادات خدمة تتبع</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">
          
          {/* City Selection */}
          <Card className="bg-[#1e1e20] border-white/5">
            <CardHeader>
              <CardTitle className="text-primary text-lg">بيانات السكن</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مدينة السكن</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50 border-white/10 text-right">
                          <SelectValue placeholder="اختر المدينة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent dir="rtl">
                        <SelectItem value="riyadh">الرياض</SelectItem>
                        <SelectItem value="jeddah">جدة</SelectItem>
                        <SelectItem value="dammam">الدمام</SelectItem>
                        <SelectItem value="makkah">مكة المكرمة</SelectItem>
                        <SelectItem value="madinah">المدينة المنورة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contacts Section */}
          <Card className="bg-[#1e1e20] border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-primary text-lg">جهات الاتصال (3-5)</CardTitle>
              {fields.length < 5 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append({ name: "", phone: "", relationship: "" })}
                  className="h-8 gap-2 text-xs"
                >
                  <Plus className="w-3 h-3" /> إضافة
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="relative bg-background/30 p-4 rounded-lg border border-white/5">
                  <div className="absolute left-2 top-2">
                    {fields.length > 3 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-destructive/70 hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name={`contacts.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">الاسم</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-background/50 border-white/10" placeholder="الاسم الكامل" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`contacts.${index}.phone`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">رقم الجوال</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-background/50 border-white/10" placeholder="05xxxxxxxx" type="tel" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`contacts.${index}.relationship`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">صلة القرابة</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-background/50 border-white/10" placeholder="أخ، أب، صديق..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {form.formState.errors.contacts && (
                <p className="text-destructive text-sm">{form.formState.errors.contacts.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Medical Info Section */}
          <Card className="bg-[#1e1e20] border-white/5">
            <CardHeader>
              <CardTitle className="text-primary text-lg">المعلومات الطبية (اختياري)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="bloodType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>فصيلة الدم</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50 border-white/10 text-right">
                          <SelectValue placeholder="اختياري" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent dir="rtl">
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="chronicDiseases"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الأمراض المزمنة</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-background/50 border-white/10" placeholder="سكري، ضغط، ..." />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 text-lg">
            حفظ ومتابعة
          </Button>
        </form>
      </Form>
    </div>
  );
}
