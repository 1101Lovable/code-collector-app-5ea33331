import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TodaySchedule from "./TodaySchedule";
import FamilyNews from "./FamilyNews";
import AddSchedule from "./AddSchedule";
import CalendarView from "./CalendarView";
import BottomTabBar from "@/components/BottomTabBar";
import { useAuth } from "@/contexts/AuthContext";

type View = "schedule" | "family" | "add-schedule" | "calendar";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"schedule" | "family">("schedule");
  const [currentView, setCurrentView] = useState<View>("schedule");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-senior-xl text-muted-foreground">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleAddSchedule = () => {
    setCurrentView("add-schedule");
  };

  const handleViewCalendar = () => {
    setCurrentView("calendar");
  };

  const handleBackToSchedule = () => {
    setCurrentView("schedule");
    setActiveTab("schedule");
  };

  const handleTabChange = (tab: "schedule" | "family") => {
    setActiveTab(tab);
    setCurrentView(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-senior-xl">로딩중...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {currentView === "schedule" && (
        <TodaySchedule onAddSchedule={handleAddSchedule} userId={user.id} />
      )}
      
      {currentView === "family" && <FamilyNews />}
      
      {currentView === "add-schedule" && (
        <AddSchedule
          onBack={handleBackToSchedule}
          onViewCalendar={handleViewCalendar}
        />
      )}
      
      {currentView === "calendar" && (
        <CalendarView onBack={() => setCurrentView("add-schedule")} />
      )}

      {(currentView === "schedule" || currentView === "family") && (
        <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
  );
};

export default Index;
