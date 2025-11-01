import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Home from "./Home";
import ScheduleCalendar from "./ScheduleCalendar";
import GroupCalendar from "./GroupCalendar";
import FamilyManagement from "./FamilyManagement";
import FamilyNews from "./FamilyNews";
import AddSchedule from "./AddSchedule";
import CalendarView from "./CalendarView";
import MyProfile from "./MyProfile";
import BottomTabBar from "@/components/BottomTabBar";
import { useAuth } from "@/contexts/AuthContext";

type View = "home" | "schedule" | "group" | "profile" | "family-management" | "family" | "add-schedule" | "calendar";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"home" | "schedule" | "group" | "profile">("home");
  const [currentView, setCurrentView] = useState<View>("home");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-secondary/30">
        <div className="text-center">
          <p className="text-senior-lg text-muted-foreground">불러오는 중...</p>
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

  const handleBackToHome = () => {
    setCurrentView("home");
    setActiveTab("home");
  };

  const handleTabChange = (tab: "home" | "schedule" | "group" | "profile") => {
    setActiveTab(tab);
    setCurrentView(tab);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      {currentView === "home" && (
        <Home onAddSchedule={handleAddSchedule} />
      )}
      
      {currentView === "schedule" && <ScheduleCalendar />}
      
      {currentView === "group" && <GroupCalendar />}
      
      {currentView === "family" && <FamilyNews />}
      
      {currentView === "add-schedule" && (
        <AddSchedule
          onBack={handleBackToHome}
          onViewCalendar={handleViewCalendar}
        />
      )}
      
      {currentView === "calendar" && (
        <CalendarView onBack={() => setCurrentView("add-schedule")} />
      )}

      {currentView === "profile" && <MyProfile />}

      {(currentView === "home" || currentView === "schedule" || currentView === "group" || currentView === "profile") && (
        <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
  );
};

export default Index;
