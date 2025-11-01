import { Calendar, MapPin, Plus, Sparkles, LogOut, Sun, CloudRain, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { toLocalDateString } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TodayScheduleProps {
  onAddSchedule: () => void;
  userId: string;
}

interface WeatherData {
  temperature: number;
  weathercode: number;
}

// 한국 주요 지역 좌표 매핑
const districtCoordinates: Record<string, { lat: number; lon: number }> = {
  종로구: { lat: 37.5735, lon: 126.9792 },
  중구: { lat: 37.5641, lon: 126.9979 },
  용산구: { lat: 37.5326, lon: 126.99 },
  성동구: { lat: 37.5634, lon: 127.0371 },
  광진구: { lat: 37.5388, lon: 127.0824 },
  동대문구: { lat: 37.5744, lon: 127.0398 },
  중랑구: { lat: 37.6065, lon: 127.0927 },
  성북구: { lat: 37.5894, lon: 127.0167 },
  강북구: { lat: 37.6396, lon: 127.0254 },
  도봉구: { lat: 37.6688, lon: 127.0469 },
  노원구: { lat: 37.6543, lon: 127.0568 },
  은평구: { lat: 37.6176, lon: 126.9227 },
  서대문구: { lat: 37.5791, lon: 126.9368 },
  마포구: { lat: 37.5663, lon: 126.9019 },
  양천구: { lat: 37.5172, lon: 126.8664 },
  강서구: { lat: 37.5509, lon: 126.8495 },
  구로구: { lat: 37.4954, lon: 126.8874 },
  금천구: { lat: 37.4567, lon: 126.8956 },
  영등포구: { lat: 37.5264, lon: 126.8963 },
  동작구: { lat: 37.5124, lon: 126.9394 },
  관악구: { lat: 37.4781, lon: 126.9515 },
  서초구: { lat: 37.4837, lon: 127.0324 },
  강남구: { lat: 37.5172, lon: 127.0473 },
  송파구: { lat: 37.5145, lon: 127.1059 },
  강동구: { lat: 37.5301, lon: 127.1238 },
};

// 날씨 코드를 이모지로 변환
const getWeatherEmoji = (code: number): string => {
  if (code === 0) return "☀️";
  if (code <= 3) return "🌤️";
  if (code <= 48) return "☁️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  return "🌤️";
};

// 이벤트 타입에 따른 아이콘
const getEventIcon = (eventType: string | null): string => {
  if (!eventType) return "🎪";
  if (eventType.includes("음악") || eventType.includes("클래식") || eventType.includes("콘서트")) return "🎵";
  if (eventType.includes("전시") || eventType.includes("미술")) return "🎨";
  if (eventType.includes("연극") || eventType.includes("뮤지컬")) return "🎭";
  if (eventType.includes("무용")) return "💃";
  if (eventType.includes("영화")) return "🎬";
  if (eventType.includes("교육") || eventType.includes("체험")) return "📚";
  return "🎪";
};

export default function TodaySchedule({ onAddSchedule, userId }: TodayScheduleProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [addScheduleDate, setAddScheduleDate] = useState(toLocalDateString(new Date()));
  const [addScheduleTime, setAddScheduleTime] = useState("");
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!user?.user_metadata?.location_district) return;

      const district = user.user_metadata.location_district;
      const coords = districtCoordinates[district] || { lat: 37.5665, lon: 126.978 }; // 기본값: 서울시청

      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`,
        );
        const data = await response.json();

        if (data.current_weather) {
          setWeather({
            temperature: data.current_weather.temperature,
            weathercode: data.current_weather.weathercode,
          });
        }
      } catch (error) {
        console.error("날씨 정보를 가져오는데 실패했습니다:", error);
      }
    };

    const fetchRecommendations = async () => {
      if (!user?.user_metadata?.location_district) return;

      const district = user.user_metadata.location_district;

      try {
        // Fetch cultural events
        const { data: events, error: eventsError } = await supabase
          .from("cultural_events")
          .select("*")
          .eq("district", district)
          .gte("end_date", new Date().toISOString())
          .order("start_date", { ascending: true })
          .limit(2);

        if (eventsError) throw eventsError;

        // Fetch cultural spaces
        const { data: spaces, error: spacesError } = await supabase
          .from("cultural_spaces")
          .select("*")
          .eq("district", district)
          .limit(1);

        if (spacesError) throw spacesError;

        const allRecommendations = [];

        if (events && events.length > 0) {
          const formattedEvents = events.map((event) => ({
            id: event.id,
            type: "event",
            title: event.title,
            location: event.place || district,
            image: getEventIcon(event.event_type),
            data: event,
          }));
          allRecommendations.push(...formattedEvents);
        }

        if (spaces && spaces.length > 0) {
          const formattedSpaces = spaces.map((space) => ({
            id: space.id,
            type: "space",
            title: space.name,
            location: space.address || district,
            image: "🏛️",
            data: space,
          }));
          allRecommendations.push(...formattedSpaces);
        }

        if (allRecommendations.length > 0) {
          setRecommendations(allRecommendations);
        } else {
          // Fallback to default recommendations
          setRecommendations([
            {
              id: 1,
              type: "event",
              title: "가을 음악회",
              location: "동네 문화센터",
              image: "🎵",
            },
            {
              id: 2,
              type: "place",
              title: "단풍 구경하기",
              location: "근처 공원",
              image: "🍁",
            },
          ]);
        }
      } catch (error) {
        console.error("추천 정보를 가져오는데 실패했습니다:", error);
        // Set fallback recommendations
        setRecommendations([
          {
            id: 1,
            type: "event",
            title: "가을 음악회",
            location: "동네 문화센터",
            image: "🎵",
          },
          {
            id: 2,
            type: "place",
            title: "단풍 구경하기",
            location: "근처 공원",
            image: "🍁",
          },
        ]);
      }
    };

    const fetchSchedules = async () => {
      if (!user) return;

      try {
        const today = toLocalDateString(new Date());

        // Get user's own schedules
        const { data: ownSchedules, error: ownError } = await supabase
          .from("schedules")
          .select("*")
          .eq("user_id", user.id)
          .eq("schedule_date", today)
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

          // Get family groups info
          const { data: groups } = await supabase
            .from("family_groups")
            .select("id, name")
            .in("id", groupIds);

          const groupMap = new Map(groups?.map(g => [g.id, g.name]) || []);

          // Get shared schedules through schedule_family_shares
          const { data: shares } = await supabase
            .from("schedule_family_shares")
            .select("schedule_id, family_group_id")
            .in("family_group_id", groupIds);

          if (shares && shares.length > 0) {
            const scheduleIds = shares.map((s) => s.schedule_id);

            // Get the actual schedules
            const { data: sharedSchedules } = await supabase
              .from("schedules")
              .select("*")
              .in("id", scheduleIds)
              .eq("schedule_date", today)
              .neq("user_id", user.id);

            // Map group names to schedules
            familySchedules = (sharedSchedules || []).map((schedule) => {
              const share = shares.find((s) => s.schedule_id === schedule.id);
              const groupName = share ? groupMap.get(share.family_group_id) : null;
              return {
                ...schedule,
                group_name: groupName,
              };
            });
          }
        }

        const allSchedules = [...(ownSchedules || []), ...familySchedules].sort((a, b) => {
          const getTimeValue = (s: any) => {
            if (s.schedule_time) {
              const [h, m] = s.schedule_time.split(':');
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

    fetchWeather();
    fetchRecommendations();
    fetchSchedules();

    // Realtime subscription for schedule updates
    const channel = supabase
      .channel("schedule-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "schedules",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchSchedules();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("로그아웃에 실패했어요");
    } else {
      toast.success("로그아웃 되었어요");
      navigate("/auth");
    }
  };

  const handleAddRecommendationToSchedule = async () => {
    if (!user || !selectedRecommendation) return;

    setIsAddingSchedule(true);
    try {
      const cleanTime = addScheduleTime ? addScheduleTime.split(":").slice(0, 2).join(":") : null;
      const startTime = cleanTime ? `${addScheduleDate}T${cleanTime}:00` : `${addScheduleDate}T00:00:00`;
      const endTime = cleanTime ? `${addScheduleDate}T${cleanTime}:00` : `${addScheduleDate}T23:59:59`;

      const { error } = await supabase.from("schedules").insert({
        user_id: user.id,
        title: selectedRecommendation.title,
        location: selectedRecommendation.location,
        schedule_date: addScheduleDate,
        schedule_time: cleanTime,
        start_time: startTime,
        end_time: endTime,
        event_type: selectedRecommendation.type === "event" ? selectedRecommendation.data?.event_type : "문화공간",
        description: selectedRecommendation.data?.program_description || selectedRecommendation.data?.description,
      });

      if (error) throw error;

      toast.success("일정에 추가되었습니다!");
      setSelectedRecommendation(null);
      setAddScheduleDate(toLocalDateString(new Date()));
      setAddScheduleTime("");
    } catch (error) {
      console.error("일정 추가 오류:", error);
      toast.error("일정 추가에 실패했습니다");
    } finally {
      setIsAddingSchedule(false);
    }
  };

  const isEventWithFixedTime = () => {
    return (
      selectedRecommendation?.type === "event" &&
      selectedRecommendation?.data?.start_date
    );
  };

  const getFixedEventDate = () => {
    if (!isEventWithFixedTime()) return "";
    const startDate = new Date(selectedRecommendation.data.start_date);
    return toLocalDateString(startDate);
  };

  const getFixedEventTime = () => {
    if (!isEventWithFixedTime()) return "";
    const eventTime = selectedRecommendation.data.event_time;
    if (!eventTime) return "";
    // event_time이 "14:00~16:00" 같은 형식일 수 있으므로 시작 시간만 추출
    const match = eventTime.match(/(\d{1,2}):(\d{2})/);
    return match ? `${match[1].padStart(2, "0")}:${match[2]}` : "";
  };

  const today = new Date();

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

  const getDisplayTime = (s: any) => (s?.schedule_time ? formatTime(s.schedule_time) : formatStartTimestamp(s?.start_time));
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 pb-24 flex flex-col items-center px-4">
      {/* Weather and Date Section */}
      <div className="w-full max-w-2xl bg-card/90 backdrop-blur-sm rounded-3xl shadow-lg border border-border/50 p-5 mt-6">
        <div className="flex justify-between items-center text-muted-foreground mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-senior-sm h-auto p-0 hover:text-primary transition-colors"
          >
            <LogOut size={18} />
            <span className="ml-2">로그아웃</span>
          </Button>
          {weather && (
            <div className="flex items-center gap-2">
              {weather.weathercode <= 3 ? (
                <Sun className="text-primary" size={24} />
              ) : (
                <CloudRain className="text-blue-500" size={24} />
              )}
              <span className="text-primary font-semibold text-senior-lg">{weather.temperature}°C</span>
            </div>
          )}
        </div>
        <h1 className="text-senior-2xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {today.getMonth() + 1}월 {today.getDate()}일 {["일", "월", "화", "수", "목", "금", "토"][today.getDay()]}요일
        </h1>
        {user?.user_metadata?.location_district && (
          <p className="text-senior-base text-foreground mt-2">서울특별시 {user.user_metadata.location_district}</p>
        )}
      </div>

      {/* Today's Schedule */}
      <section className="w-full max-w-2xl mt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full" />
          <h2 className="text-senior-xl font-bold text-secondary-foreground">오늘의 일정</h2>
        </div>

        {schedules.length === 0 ? (
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-border/50">
            <p className="text-senior-base text-muted-foreground">오늘은 일정이 없어요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-card/90 backdrop-blur-sm rounded-2xl p-4 border border-border/50 flex justify-between items-center hover:shadow-md transition-all"
              >
                <div>
                  {(schedule.schedule_time || schedule.start_time) && (
                    <p className="text-primary font-bold text-senior-lg">{getDisplayTime(schedule)}</p>
                  )}
                  <p className="text-foreground text-senior-base mt-1">{schedule.title}</p>
                </div>
                {user && schedule.user_id !== user.id && schedule.group_name && (
                  <div className="flex items-center gap-1 bg-accent/10 px-3 py-1 rounded-full text-senior-sm text-accent-foreground flex-shrink-0 ml-4">
                    <Users size={14} /> {schedule.group_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI Recommendations */}
      <section className="w-full max-w-2xl mt-8 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full" />
          <h2 className="text-senior-xl font-bold text-secondary-foreground">오늘 뭐 할까요?</h2>
        </div>

        {recommendations.length === 0 ? (
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-border/50">
            <p className="text-senior-base text-muted-foreground">추천 정보를 불러오는 중...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-card/90 backdrop-blur-sm rounded-2xl p-4 border border-border/50 flex items-center gap-4"
              >
                <div className="text-3xl flex-shrink-0">{rec.image}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-senior-lg font-semibold text-foreground truncate">{rec.title}</p>
                  <p className="text-senior-sm text-muted-foreground flex items-center gap-1">
                    <MapPin size={16} className="flex-shrink-0" />
                    <span className="truncate">{rec.location}</span>
                  </p>
                  {rec.data?.is_free !== undefined && (
                    <span className="text-senior-xs text-primary mt-1 inline-block">
                      {rec.data.is_free ? "무료" : "유료"}
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRecommendation(rec);
                    // 고정된 시간이 있는 이벤트는 날짜/시간 자동 설정
                    if (rec.type === "event" && rec.data?.start_date) {
                      const startDate = new Date(rec.data.start_date);
                      setAddScheduleDate(toLocalDateString(startDate));
                      const eventTime = rec.data.event_time;
                      if (eventTime) {
                        const match = eventTime.match(/(\d{1,2}):(\d{2})/);
                        if (match) {
                          setAddScheduleTime(`${match[1].padStart(2, "0")}:${match[2]}`);
                        }
                      }
                    } else {
                      setAddScheduleDate(toLocalDateString(new Date()));
                      setAddScheduleTime("");
                    }
                  }}
                  className="flex-shrink-0"
                >
                  일정 추가
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add to Schedule Dialog */}
      <Dialog
        open={!!selectedRecommendation}
        onOpenChange={(open) => !open && setSelectedRecommendation(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-senior-xl">일정 추가</DialogTitle>
            <DialogDescription className="text-senior-base">
              {selectedRecommendation?.title}을(를) 일정에 추가합니다
              {isEventWithFixedTime() && (
                <span className="block mt-2 text-senior-sm text-muted-foreground">
                  ⏰ 이 행사는 시간이 정해져 있어요
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-date" className="text-senior-lg">
                날짜
              </Label>
              <Input
                id="schedule-date"
                type="date"
                className="h-14 text-senior-base px-4"
                value={addScheduleDate}
                onChange={(e) => setAddScheduleDate(e.target.value)}
                disabled={isEventWithFixedTime()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-time" className="text-senior-lg">
                시간 {!isEventWithFixedTime() && "(선택)"}
              </Label>
              <Input
                id="schedule-time"
                type="time"
                className="h-14 text-senior-base px-4"
                value={addScheduleTime}
                onChange={(e) => setAddScheduleTime(e.target.value)}
                disabled={isEventWithFixedTime()}
              />
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

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAddSchedule}
        className="fixed bottom-28 right-6 bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center text-3xl shadow-lg hover:shadow-xl transition-shadow"
      >
        +
      </motion.button>
    </div>
  );
}
