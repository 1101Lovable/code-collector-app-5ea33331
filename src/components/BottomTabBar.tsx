import { Calendar, Users } from "lucide-react";

interface BottomTabBarProps {
  activeTab: "schedule" | "family";
  onTabChange: (tab: "schedule" | "family") => void;
}

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 rounded-t-3xl shadow-inner">
      <div className="flex justify-around items-center h-20 max-w-screen-lg mx-auto px-4">
        <button
          onClick={() => onTabChange("schedule")}
          className={`flex flex-col items-center justify-center gap-1 px-6 py-2 transition-colors ${
            activeTab === "schedule" ? "text-primary font-bold" : "text-muted-foreground"
          }`}
        >
          <Calendar size={22} />
          <span className="text-senior-sm">오늘 일정</span>
        </button>

        <button
          onClick={() => onTabChange("family")}
          className={`flex flex-col items-center justify-center gap-1 px-6 py-2 transition-colors ${
            activeTab === "family" ? "text-primary font-bold" : "text-muted-foreground"
          }`}
        >
          <Users size={22} />
          <span className="text-senior-sm">가족 소식</span>
        </button>
      </div>
    </nav>
  );
}
