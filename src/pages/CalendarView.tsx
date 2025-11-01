import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface CalendarViewProps {
  onBack: () => void;
}

export default function CalendarView({ onBack }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  // Mock schedule data
  const schedules: { [key: number]: { personal: boolean; family: boolean } } = {
    5: { personal: true, family: false },
    12: { personal: false, family: true },
    18: { personal: true, family: true },
    25: { personal: true, family: false },
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft size={32} />
          </Button>
          <h1 className="text-senior-2xl">전체 캘린더</h1>
        </div>
      </header>

      {/* Month Navigator */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <Button size="icon" variant="outline" onClick={prevMonth}>
            <ChevronLeft size={32} />
          </Button>

          <h2 className="text-senior-xl">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h2>

          <Button size="icon" variant="outline" onClick={nextMonth}>
            <ChevronRight size={32} />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="px-6 pb-6">
        <Card className="p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
              <div
                key={day}
                className={`text-center text-senior-base py-3 ${
                  index === 0 ? "text-destructive" : index === 6 ? "text-primary" : ""
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {days.map((day) => {
              const schedule = schedules[day];
              const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={day}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all hover:shadow-md ${
                    isToday
                      ? "bg-accent border-accent text-accent-foreground font-bold"
                      : "border-border hover:border-primary"
                  }`}
                >
                  <span className="text-senior-sm mb-1">{day}</span>

                  {schedule && (
                    <div className="flex gap-1">
                      {schedule.personal && <div className="w-2 h-2 rounded-full bg-primary" />}
                      {schedule.family && <div className="w-2 h-2 rounded-full bg-accent" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Legend */}
        <div className="mt-6 flex justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary" />
            <span className="text-senior-base">내 일정</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-accent" />
            <span className="text-senior-base">그룹 일정</span>
          </div>
        </div>
      </div>
    </div>
  );
}
