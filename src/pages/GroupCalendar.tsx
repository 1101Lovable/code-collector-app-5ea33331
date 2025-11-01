import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import FamilyManagement from "./FamilyManagement";

interface FamilyMember {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

export default function GroupCalendar() {
  const { user } = useAuth();
  const [showManagement, setShowManagement] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthSchedules, setMonthSchedules] = useState<{ [key: string]: any[] }>({});

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

  useEffect(() => {
    fetchFamilyMembers();
  }, [user]);

  useEffect(() => {
    if (selectedMember) {
      fetchMemberSchedules();
    }
  }, [selectedMember, currentDate]);

  const fetchFamilyMembers = async () => {
    if (!user) return;

    try {
      // Get current user's group code
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("family_group_code")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      if (!userProfile?.family_group_code) {
        setFamilyMembers([]);
        return;
      }

      // Get all profiles with same group code (excluding current user)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .eq("family_group_code", userProfile.family_group_code)
        .neq("user_id", user.id);

      if (profilesError) throw profilesError;

      setFamilyMembers(profiles || []);
      if (profiles && profiles.length > 0) {
        setSelectedMember(profiles[0].user_id);
      }
    } catch (error: any) {
      console.error("Error fetching family members:", error);
    }
  };

  const fetchMemberSchedules = async () => {
    if (!selectedMember) return;

    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;

      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", selectedMember)
        .eq("shared_with_family", true)
        .gte("schedule_date", startDate)
        .lte("schedule_date", endDate);

      if (error) throw error;

      const schedulesByDate: { [key: string]: any[] } = {};
      data?.forEach((schedule) => {
        const day = new Date(schedule.schedule_date).getDate();
        if (!schedulesByDate[day]) {
          schedulesByDate[day] = [];
        }
        schedulesByDate[day].push(schedule);
      });

      setMonthSchedules(schedulesByDate);
    } catch (error) {
      console.error("가족 일정을 가져오는데 실패했습니다:", error);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const selectedMemberData = familyMembers.find((m) => m.user_id === selectedMember);

  if (showManagement) {
    return <FamilyManagement onBack={() => setShowManagement(false)} />;
  }

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-gradient-to-br from-background via-background to-secondary/30 px-4">
      {/* Family Members Selection */}
      <section className="pt-8 pb-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-senior-xl font-bold text-secondary-foreground">
            가족 구성원
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowManagement(true)}
            className="gap-2"
          >
            <Settings size={18} />
            그룹 관리
          </Button>
        </div>
        
        {familyMembers.length === 0 ? (
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-border/50">
            <p className="text-senior-base text-muted-foreground">아직 가족 그룹이 없어요</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {familyMembers.map((member) => (
              <button
                key={member.user_id}
                onClick={() => setSelectedMember(member.user_id)}
                className={`flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  selectedMember === member.user_id
                    ? "bg-primary/10 border-primary"
                    : "bg-card/90 border-border/50 hover:border-primary/30"
                }`}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center text-3xl">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.display_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    "👤"
                  )}
                </div>
                <span className="text-senior-sm font-semibold">{member.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedMember && (
        <>
          {/* Month Navigator */}
          <div className="pb-4 max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-between">
              <Button
                size="icon"
                variant="outline"
                onClick={prevMonth}
              >
                <ChevronLeft size={32} />
              </Button>
              
              <h2 className="text-senior-xl font-bold">
                {selectedMemberData?.display_name}님의 {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </h2>
              
              <Button
                size="icon"
                variant="outline"
                onClick={nextMonth}
              >
                <ChevronRight size={32} />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="pb-6 max-w-2xl mx-auto w-full">
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
                  const hasSchedule = monthSchedules[day] && monthSchedules[day].length > 0;
                  const isToday = 
                    day === new Date().getDate() &&
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear();

                  return (
                    <div
                      key={day}
                      className={`aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all ${
                        isToday
                          ? "bg-accent border-accent text-accent-foreground font-bold"
                          : "border-border"
                      }`}
                    >
                      <span className="text-senior-sm mb-1">{day}</span>
                      
                      {hasSchedule && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="mt-4 bg-gradient-to-r from-primary/5 to-accent/5 backdrop-blur-sm rounded-2xl p-4 border border-primary/20">
              <p className="text-senior-sm text-center">
                💚 가족과 공유된 일정만 표시됩니다
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
