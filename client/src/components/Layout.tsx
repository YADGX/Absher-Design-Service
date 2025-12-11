import { Bell, Settings, Home, User, Users, Briefcase, Grid } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "الرئيسية", path: "/home-placeholder" },
    { icon: User, label: "خدماتي", path: "/home" },
    { icon: Users, label: "عائلتي", path: "/family" },
    { icon: Briefcase, label: "عمالتي", path: "/workers" },
    { icon: Grid, label: "خدمات أخرى", path: "/more" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans" dir="rtl">
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-background sticky top-0 z-10">
        <div className="flex gap-4">
          <Bell className="w-6 h-6 text-primary" />
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div className="flex items-center">
          <img 
            src="/absher-logo.png" 
            alt="Absher" 
            className="h-10 w-auto" 
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 px-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#2C2C2C] border-t border-[#333] px-2 py-3 z-50">
        <ul className="flex justify-between items-center">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <li key={item.label} className="flex-1">
                <Link href={item.path}>
                  <a className={cn(
                    "flex flex-col items-center justify-center gap-1 text-[10px]",
                    isActive ? "text-primary" : "text-gray-400"
                  )}>
                    <item.icon className={cn("w-6 h-6", isActive && "fill-current")} />
                    <span>{item.label}</span>
                    {isActive && <div className="w-1 h-1 rounded-full bg-primary mt-1" />}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
