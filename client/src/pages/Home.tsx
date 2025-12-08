import Layout from "@/components/Layout";
import ServiceCard from "@/components/ServiceCard";
import { TrackingIcon } from "@/components/TrackingIcon";
import { Search, FileText, UserCircle, Car, Home as HomeIcon, Baby, CreditCard, FileCheck } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { isSetupComplete } = useAppStore();

  const handleServiceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSetupComplete) {
      setLocation("/service-main");
    } else {
      setLocation("/setup");
    }
  };

  const services = [
    { title: "تقدير", icon: <HomeIcon className="w-8 h-8" />, href: "#" },
    { title: "تجديد جواز السفر", icon: <FileText className="w-8 h-8" />, href: "#" },
    { title: "تتبع", icon: <TrackingIcon className="w-8 h-8" />, href: "/setup", onClick: handleServiceClick }, // New Service
    { title: "تسجيل المواليد", icon: <Baby className="w-8 h-8" />, href: "#" },
    { title: "خدمات الهوية الوطنية", icon: <UserCircle className="w-8 h-8" />, href: "#" },
    { title: "تجديد رخصة القيادة", icon: <Car className="w-8 h-8" />, href: "#" },
    { title: "الإبلاغ عن فقدان", icon: <FileCheck className="w-8 h-8" />, href: "#" },
    { title: "خدمات سجل الأسرة", icon: <UsersIcon className="w-8 h-8" />, href: "#" },
  ];

  return (
    <Layout>
      <div className="space-y-6 pt-2">
        <h2 className="text-3xl font-light text-right mb-6">خدماتي</h2>
        
        {/* Search Bar */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="ابحث باسم الخدمة..." 
            className="w-full bg-[#27272a] border-none text-right pr-12 pl-4 py-3 rounded-xl text-sm focus:ring-1 focus:ring-primary"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-2 gap-4 pb-4">
          {services.map((service, index) => (
            service.onClick ? (
              <div key={index} onClick={service.onClick} className="cursor-pointer">
                 <ServiceCard {...service} />
              </div>
            ) : (
              <ServiceCard key={index} {...service} />
            )
          ))}
        </div>
      </div>
    </Layout>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
