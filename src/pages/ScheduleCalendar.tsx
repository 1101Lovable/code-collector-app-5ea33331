import { ChevronLeft, ChevronRight, Trash2, Users, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { toLocalDateString } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TimePicker from "@/components/TimePicker";
interface ScheduleCalendarProps {
  onEditSchedule?: (schedule: any) => void;
  onAddSchedule?: () => void;
}

export default function ScheduleCalendar({ onEditSchedule, onAddSchedule }: ScheduleCalendarProps = {}) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedules, setSchedules] = useState<any[]>([]);
  const [monthSchedules, setMonthSchedules] = useState<{ [key: string]: any[] }>({});
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [addScheduleDate, setAddScheduleDate] = useState(toLocalDateString(new Date()));
  const [addScheduleTime, setAddScheduleTime] = useState("");
  const [addScheduleEndTime, setAddScheduleEndTime] = useState("");
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [parsedRecommendations, setParsedRecommendations] = useState<Array<{ title: string; description: string }>>([]);

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
    fetchMonthSchedules();
  }, [user, currentDate]);

  useEffect(() => {
    fetchDaySchedules();
  }, [user, selectedDate]);

  const fetchMonthSchedules = async () => {
    if (!user) return;

    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-${daysInMonth}`;

      // Get user's own schedules
      const { data: ownSchedules, error: ownError } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", user.id)
        .gte("schedule_date", startDate)
        .lte("schedule_date", endDate);

      if (ownError) throw ownError;

      // Get family members for shared schedules
      const { data: memberships } = await supabase
        .from("family_members")
        .select("family_group_id")
        .eq("user_id", user.id);

      let familySchedules: any[] = [];

      if (memberships && memberships.length > 0) {
        const groupIds = memberships.map((m) => m.family_group_id);

        // Get family members' user IDs
        const { data: familyMembers } = await supabase
          .from("family_members")
          .select("user_id, family_group_id")
          .in("family_group_id", groupIds)
          .neq("user_id", user.id);

        if (familyMembers && familyMembers.length > 0) {
          const familyUserIds = familyMembers.map((m) => m.user_id);

          // Get family members' display names
          const { data: familyProfiles } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", familyUserIds);

          // Get shared schedules from family members
          const scheduleQuery = supabase
            .from("schedules")
            .select("*")
            .in("user_id", familyUserIds)
            .not("family_id", "is", null)
            .gte("schedule_date", startDate)
            .lte("schedule_date", endDate);

          const result: any = await scheduleQuery;
          const sharedSchedules = result.data;

          // Add display names to family schedules
          familySchedules = (sharedSchedules || []).map((schedule) => {
            const memberProfile = familyProfiles?.find((p) => p.id === schedule.user_id);
            return {
              ...schedule,
              owner_name: memberProfile?.display_name || "그룹",
            };
          });
        }
      }

      // Combine all schedules
      const allSchedules = [...(ownSchedules || []), ...familySchedules];

      const schedulesByDate: { [key: string]: any[] } = {};
      allSchedules.forEach((schedule) => {
        const day = parseInt(schedule.schedule_date.split("-")[2], 10);
        if (!schedulesByDate[day]) {
          schedulesByDate[day] = [];
        }
        schedulesByDate[day].push(schedule);
      });

      setMonthSchedules(schedulesByDate);
    } catch (error) {
      console.error("월별 일정을 가져오는데 실패했습니다:", error);
    }
  };

  const fetchDaySchedules = async () => {
    if (!user) return;

    try {
      const dateStr = toLocalDateString(selectedDate);

      // Get user's own schedules
      const { data: ownSchedules, error: ownError } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", user.id)
        .eq("schedule_date", dateStr)
        .order("schedule_time", { ascending: true });

      if (ownError) throw ownError;

      // Get family members for shared schedules
      const { data: memberships } = await supabase
        .from("family_members")
        .select("family_group_id")
        .eq("user_id", user.id);

      let familySchedules: any[] = [];

      if (memberships && memberships.length > 0) {
        const groupIds = memberships.map((m) => m.family_group_id);

        // Get family members' user IDs
        const { data: familyMembers } = await supabase
          .from("family_members")
          .select("user_id")
          .in("family_group_id", groupIds)
          .neq("user_id", user.id);

        if (familyMembers && familyMembers.length > 0) {
          const familyUserIds = familyMembers.map((m) => m.user_id);

          // Get family members' display names
          const { data: familyProfiles } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", familyUserIds);

          // Get shared schedules from family members
          const scheduleQuery2 = supabase
            .from("schedules")
            .select("*")
            .in("user_id", familyUserIds)
            .eq("schedule_date", dateStr)
            .not("family_id", "is", null)
            .order("start_time", { ascending: true });

          const result2: any = await scheduleQuery2;
          const sharedSchedules = result2.data;

          // Add display names to family schedules
          familySchedules = (sharedSchedules || []).map((schedule) => {
            const memberProfile = familyProfiles?.find((p) => p.id === schedule.user_id);
            return {
              ...schedule,
              owner_name: memberProfile?.display_name || "그룹",
            };
          });
        }
      }

      const allSchedules = [...(ownSchedules || []), ...familySchedules].sort((a, b) => {
        const getTimeValue = (s: any) => {
          if (s.schedule_time) {
            const [h, m] = s.schedule_time.split(":");
            return parseInt(h) * 60 + parseInt(m);
          }
          if (s.start_time) {
            const d = new Date(s.start_time);
            return d.getHours() * 60 + d.getMinutes();
          }
          return Number.MAX_SAFE_INTEGER;
        };
        return getTimeValue(a) - getTimeValue(b);
      });

      setSchedules(allSchedules);
    } catch (error) {
      console.error("일정을 가져오는데 실패했습니다:", error);
    }
  };

  const fetchAIRecommendation = async () => {
    if (!user?.user_metadata?.location_district || !user?.id) return;

    setIsLoadingRecommendation(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-activity-recommendations", {
        body: {
          district: user.user_metadata.location_district,
          userId: user.id,
        },
      });

      if (error) throw error;

      setAiRecommendations(data.recommendation);

      // Parse the recommendation text to extract individual activities
      const lines = data.recommendation.split("\n");
      const activities: Array<{ title: string; description: string }> = [];

      for (const line of lines) {
        // Match pattern like "1. **활동명**: 설명"
        const match = line.match(/^\d+\.\s+\*\*(.+?)\*\*:\s+(.+)$/);
        if (match) {
          activities.push({
            title: match[1].trim(),
            description: match[2].trim(),
          });
        }
      }

      setParsedRecommendations(activities);
    } catch (error: any) {
      console.error("추천을 가져오는데 실패했습니다:", error);
      toast.error("추천을 가져오는데 실패했습니다");
    } finally {
      setIsLoadingRecommendation(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const { error } = await supabase.from("schedules").delete().eq("id", scheduleId);

      if (error) throw error;

      toast.success("일정이 삭제되었습니다");
      fetchDaySchedules();
      fetchMonthSchedules();
    } catch (error) {
      console.error("일정 삭제 오류:", error);
      toast.error("일정 삭제에 실패했습니다");
    }
  };

  const handleAddRecommendationToSchedule = async () => {
    if (!user || !selectedRecommendation) return;

    // Validate time range if both times are provided
    if (addScheduleTime && addScheduleEndTime) {
      const [startH, startM] = addScheduleTime.split(":").map(Number);
      const [endH, endM] = addScheduleEndTime.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (endMinutes <= startMinutes) {
        toast.error("종료 시간은 시작 시간보다 늦어야 합니다");
        return;
      }
    }

    setIsAddingSchedule(true);
    try {
      const cleanTime = addScheduleTime ? addScheduleTime.split(":").slice(0, 2).join(":") : null;
      const cleanEndTime = addScheduleEndTime ? addScheduleEndTime.split(":").slice(0, 2).join(":") : null;

      const startTime = cleanTime ? `${addScheduleDate}T${cleanTime}:00` : `${addScheduleDate}T00:00:00`;
      const endTime = cleanEndTime
        ? `${addScheduleDate}T${cleanEndTime}:00`
        : cleanTime
          ? `${addScheduleDate}T${cleanTime}:00`
          : `${addScheduleDate}T23:59:59`;

      const scheduleData: any = {
        user_id: user.id,
        title: selectedRecommendation.title,
        schedule_date: addScheduleDate,
        schedule_time: cleanTime,
        start_time: startTime,
        end_time: endTime,
      };

      // Add location and description if it's from cultural data
      if (selectedRecommendation.location) {
        scheduleData.location = selectedRecommendation.location;
      }
      if (selectedRecommendation.type === "event") {
        scheduleData.event_type = selectedRecommendation.data?.event_type;
        scheduleData.description = selectedRecommendation.data?.program_description;
      } else if (selectedRecommendation.type === "space") {
        scheduleData.event_type = "문화공간";
        scheduleData.description = selectedRecommendation.data?.description;
      } else if (selectedRecommendation.description) {
        // AI generated recommendation
        scheduleData.description = selectedRecommendation.description;
      }

      const { error } = await supabase.from("schedules").insert(scheduleData);

      if (error) throw error;

      toast.success("일정에 추가되었습니다!");
      setSelectedRecommendation(null);
      setAddScheduleDate(toLocalDateString(new Date()));
      setAddScheduleTime("");
      setAddScheduleEndTime("");
      fetchDaySchedules();
      fetchMonthSchedules();
    } catch (error) {
      console.error("일정 추가 오류:", error);
      toast.error("일정 추가에 실패했습니다");
    } finally {
      setIsAddingSchedule(false);
    }
  };

  const isEventWithFixedTime = () => {
    return false; // AI recommendations don't have fixed times
  };

  const getFixedEventDate = () => {
    return "";
  };

  const getFixedEventTime = () => {
    return "";
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const formatTime = (time: string | null) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const period = hour < 12 ? "오전" : "오후";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${period} ${displayHour}:${minutes}`;
  };

  const formatStartTimestamp = (ts: string | null) => {
    if (!ts) return "";
    const d = new Date(ts);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const period = h < 12 ? "오전" : "오후";
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${period} ${displayHour}:${m}`;
  };

  const getDisplayTime = (s: any) =>
    s?.schedule_time ? formatTime(s.schedule_time) : formatStartTimestamp(s?.start_time);
  return (
    <div className="flex flex-col min-h-screen pb-24 bg-gradient-to-br from-background via-background to-secondary/30 px-4">
      {/* Month Navigator */}
      <div className="pt-8 pb-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <Button size="icon" variant="outline" onClick={prevMonth}>
            <ChevronLeft size={32} />
          </Button>

          <h2 className="text-senior-xl font-bold">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h2>

          <Button size="icon" variant="outline" onClick={nextMonth}>
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
              const isSelected =
                day === selectedDate.getDate() &&
                currentDate.getMonth() === selectedDate.getMonth() &&
                currentDate.getFullYear() === selectedDate.getFullYear();

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all hover:shadow-md cursor-pointer ${
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground font-bold"
                      : isToday
                        ? "bg-accent border-accent text-accent-foreground font-bold"
                        : "border-border hover:border-primary"
                  }`}
                >
                  <span className="text-senior-sm mb-1">{day}</span>

                  {hasSchedule && (
                    <div className={`w-2 h-2 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Selected Day's Schedule */}
      <section className="max-w-2xl mx-auto w-full mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-senior-xl font-bold text-secondary-foreground">
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정
          </h2>
        </div>

        {schedules.length === 0 ? (
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-border/50">
            <p className="text-senior-base text-muted-foreground">이 날은 일정이 없어요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-card/90 backdrop-blur-sm rounded-2xl p-4 border border-border/50 flex justify-between items-center hover:shadow-md transition-all"
              >
                <div className="flex-1">
                  {(schedule.schedule_time || schedule.start_time) && (
                    <p className="text-primary font-bold text-senior-lg">{getDisplayTime(schedule)}</p>
                  )}
                  <p className="text-foreground text-senior-base mt-1">{schedule.title}</p>
                  {schedule.family_id && schedule.user_id !== user?.id && (
                    <div className="flex items-center gap-1 bg-accent/10 px-2 py-1 rounded-full text-senior-xs text-accent mt-2 inline-flex">
                      <Users size={12} /> {schedule.owner_name}님
                    </div>
                  )}
                </div>
                {schedule.user_id === user?.id && (
                  <div className="flex gap-2 flex-shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditSchedule?.(schedule)}
                      className="text-primary hover:bg-primary/10"
                    >
                      <Edit2 size={20} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Schedule Button */}
        <div className="mt-6">
          <Button
            size="xl"
            onClick={onAddSchedule}
            className="w-full h-16 text-senior-2xl font-bold text-primary-foreground"
          >
            일정 추가
          </Button>
        </div>
      </section>

      {/* AI Activity Recommendations */}
      <section className="max-w-2xl mx-auto w-full pb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-senior-xl font-bold text-secondary-foreground">오늘 뭐 할까요?</h2>
        </div>

        <div className="bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-sm">
          {isLoadingRecommendation ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-senior-base text-muted-foreground">추천을 불러오는 중...</span>
            </div>
          ) : parsedRecommendations.length > 0 ? (
            <div className="space-y-3">
              {parsedRecommendations.map((rec, index) => (
                <Card
                  key={index}
                  className="p-4 hover:shadow-md transition-all cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => {
                    setSelectedRecommendation({
                      title: rec.title,
                      description: rec.description,
                      type: "ai",
                    });
                    setAddScheduleDate(toLocalDateString(new Date()));
                    setAddScheduleTime("");
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-senior-lg font-semibold text-foreground mb-1">{rec.title}</h3>
                      <p className="text-senior-sm text-muted-foreground leading-relaxed">{rec.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecommendation({
                          title: rec.title,
                          description: rec.description,
                          type: "ai",
                        });
                        setAddScheduleDate(toLocalDateString(new Date()));
                        setAddScheduleTime("");
                      }}
                    >
                      일정 추가
                    </Button>
                  </div>
                </Card>
              ))}
              <Button onClick={fetchAIRecommendation} variant="outline" className="w-full mt-4">
                다른 추천 보기
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-senior-base text-muted-foreground mb-4">
                오늘 하루를 즐겁게 보낼 수 있는 활동을 추천해드릴게요
              </p>
              <Button onClick={fetchAIRecommendation} variant="default" className="text-primary-foreground">
                추천 받기
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Add to Schedule Dialog */}
      <Dialog open={!!selectedRecommendation} onOpenChange={(open) => !open && setSelectedRecommendation(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-senior-xl">일정 추가</DialogTitle>
            <DialogDescription className="text-senior-base">
              {selectedRecommendation?.title}을(를) 일정에 추가합니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-date" className="text-senior-xl font-bold">
                날짜
              </Label>
              <Input
                id="schedule-date"
                type="date"
                className="h-24 text-senior-xl md:text-senior-xl px-4 [&::-webkit-calendar-picker-indicator]:scale-150 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                value={addScheduleDate}
                onChange={(e) => setAddScheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-time" className="text-senior-xl font-bold">
                시작 시간 (선택)
              </Label>
              <TimePicker value={addScheduleTime} onChange={setAddScheduleTime} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-end-time" className="text-senior-xl font-bold">
                종료 시간 (선택)
              </Label>
              <TimePicker value={addScheduleEndTime} onChange={setAddScheduleEndTime} />
            </div>
            <Button
              size="xl"
              onClick={handleAddRecommendationToSchedule}
              disabled={isAddingSchedule}
              className="w-full"
            >
              {isAddingSchedule ? "추가 중..." : "일정에 추가"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
