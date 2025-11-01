import { Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomTabBarProps {
  activeTab: "schedule" | "family";
  onTabChange: (tab: "schedule" | "family") => void;
}

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t-2 border-border shadow-2xl z-50">
      <div className="grid grid-cols-2 gap-0">
        <Button
          variant="ghost"
          size="xl"
          onClick={() => onTabChange("schedule")}
          className={`rounded-none h-20 flex-col gap-2 ${
            activeTab === "schedule"
              ? "bg-primary/10 text-primary border-t-4 border-primary"
              : "text-muted-foreground"
          }`}
        >
          <Calendar size={32} />
          <span className="text-senior-sm">오늘 일정</span>
        </Button>

        <Button
          variant="ghost"
          size="xl"
          onClick={() => onTabChange("family")}
          className={`rounded-none h-20 flex-col gap-2 ${
            activeTab === "family"
              ? "bg-primary/10 text-primary border-t-4 border-primary"
              : "text-muted-foreground"
          }`}
        >
          <Users size={32} />
          <span className="text-senior-sm">가족 소식</span>
        </Button>
      </div>
    </nav>
  );
}
