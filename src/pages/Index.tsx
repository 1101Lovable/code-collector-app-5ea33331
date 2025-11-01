import { useState } from "react";
import TodaySchedule from "./TodaySchedule";
import FamilyNews from "./FamilyNews";
import AddSchedule from "./AddSchedule";
import CalendarView from "./CalendarView";
import BottomTabBar from "@/components/BottomTabBar";

type View = "schedule" | "family" | "add-schedule" | "calendar";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"schedule" | "family">("schedule");
  const [currentView, setCurrentView] = useState<View>("schedule");

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

  return (
    <div className="min-h-screen bg-background">
      {currentView === "schedule" && (
        <TodaySchedule onAddSchedule={handleAddSchedule} />
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
