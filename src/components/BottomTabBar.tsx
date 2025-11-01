import { Home, Calendar, Users, User } from "lucide-react";

interface BottomTabBarProps {
  activeTab: "home" | "schedule" | "group" | "profile";
  onTabChange: (tab: "home" | "schedule" | "group" | "profile") => void;
}

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 z-50 rounded-t-3xl shadow-lg">
      <div className="flex justify-around items-center h-16 max-w-screen-lg mx-auto px-4">
        <button
          onClick={() => onTabChange("home")}
          className={`flex flex-col items-center justify-center gap-1 px-6 py-2 transition-all ${
            activeTab === "home" ? "text-primary scale-105" : "text-muted-foreground hover:text-primary/70"
          }`}
        >
          <Home size={20} />
          <span className="text-senior-xs">홈</span>
        </button>

        <button
          onClick={() => onTabChange("schedule")}
          className={`flex flex-col items-center justify-center gap-1 px-6 py-2 transition-all ${
            activeTab === "schedule" ? "text-primary scale-105" : "text-muted-foreground hover:text-primary/70"
          }`}
        >
          <Calendar size={20} />
          <span className="text-senior-xs">캘린더/일정</span>
        </button>

        <button
          onClick={() => onTabChange("group")}
          className={`flex flex-col items-center justify-center gap-1 px-6 py-2 transition-all ${
            activeTab === "group" ? "text-primary scale-105" : "text-muted-foreground hover:text-primary/70"
          }`}
        >
          <Users size={20} />
          <span className="text-senior-xs">그룹</span>
        </button>

        <button
          onClick={() => onTabChange("profile")}
          className={`flex flex-col items-center justify-center gap-1 px-6 py-2 transition-all ${
            activeTab === "profile" ? "text-primary scale-105" : "text-muted-foreground hover:text-primary/70"
          }`}
        >
          <User size={20} />
          <span className="text-senior-xs">내 정보</span>
        </button>
      </div>
    </nav>
  );
}
