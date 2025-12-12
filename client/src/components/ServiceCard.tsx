import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface ServiceCardProps {
  title: string;
  icon: React.ReactNode;
  href: string;
}

export default function ServiceCard({ title, icon, href }: ServiceCardProps) {
  return (
    <Link href={href}>
      <a className="block group">
        <div className="bg-card hover:bg-card/80 transition-colors rounded-xl p-6 flex flex-col items-center justify-center gap-4 aspect-square border border-border relative overflow-hidden">
          <div className="text-primary group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <h3 className="text-sm font-medium text-center text-card-foreground">{title}</h3>
          
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-bl-full -mr-2 -mt-2" />
        </div>
      </a>
    </Link>
  );
}
