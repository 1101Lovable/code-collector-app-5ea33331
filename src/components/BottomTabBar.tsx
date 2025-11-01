import { Calendar, Users } from "lucide-react";

interface BottomTabBarProps {
  activeTab: "schedule" | "family";
  onTabChange: (tab: "schedule" | "family") => void;
}

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 z-50 rounded-t-3xl shadow-lg">
      <div className="flex justify-around items-center h-16 max-w-screen-lg mx-auto px-4">
        <button
          onClick={() => onTabChange("schedule")}
          className={`flex flex-col items-center justify-center gap-1 px-6 py-2 transition-all ${
            activeTab === "schedule" ? "text-primary scale-105" : "text-muted-foreground hover:text-primary/70"
          }`}
        >
          <Calendar size={20} />
          <span className="text-senior-xs">오늘 일정</span>
        </button>

        <button
          onClick={() => onTabChange("family")}
          className={`flex flex-col items-center justify-center gap-1 px-6 py-2 transition-all ${
            activeTab === "family" ? "text-primary scale-105" : "text-muted-foreground hover:text-primary/70"
          }`}
        >
          <Users size={20} />
          <span className="text-senior-xs">가족 소식</span>
        </button>
      </div>
    </nav>
  );
}
