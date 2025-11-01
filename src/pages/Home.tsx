import { LogOut, Sun, CloudRain, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

interface WeatherData {
  temperature: number;
  weathercode: number;
}

interface FamilyMember {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  latest_mood: string | null;
  mood_time: string | null;
}

const moods = [
  { id: "good", emoji: "😊", label: "좋음" },
  { id: "okay", emoji: "🙂", label: "보통" },
  { id: "sad", emoji: "😥", label: "속상함" },
  { id: "sick", emoji: "🤒", label: "아파요" },
];

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

export default function Home({ onAddSchedule }: { onAddSchedule: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!user?.user_metadata?.location_district) return;

      const district = user.user_metadata.location_district;
      const coords = districtCoordinates[district] || { lat: 37.5665, lon: 126.978 };

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

    const fetchSchedules = async () => {
      if (!user) return;

      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from("schedules")
          .select("*")
          .eq("schedule_date", today)
          .order("schedule_time", { ascending: true });

        if (error) throw error;

        setSchedules(data || []);
      } catch (error) {
        console.error("일정을 가져오는데 실패했습니다:", error);
      }
    };

    const fetchFamilyMembers = async () => {
      if (!user) return;

      try {
        const { data: familyMemberships, error: membershipError } = await supabase
          .from("family_members")
          .select("family_group_id")
          .eq("user_id", user.id);

        if (membershipError) throw membershipError;

        if (!familyMemberships || familyMemberships.length === 0) {
          setFamilyMembers([]);
          return;
        }

        const familyGroupIds = familyMemberships.map((m) => m.family_group_id);

        const { data: members, error: membersError } = await supabase
          .from("family_members")
          .select("user_id")
          .in("family_group_id", familyGroupIds);

        if (membersError) throw membersError;

        if (!members || members.length === 0) {
          setFamilyMembers([]);
          return;
        }

        const userIds = members.map((m) => m.user_id);

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);

        if (profilesError) throw profilesError;

        const familyData: FamilyMember[] = await Promise.all(
          (profiles || []).map(async (profile) => {
            const { data: moodData } = await supabase
              .from("mood_records")
              .select("mood, recorded_at")
              .eq("user_id", profile.user_id)
              .order("recorded_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            return {
              user_id: profile.user_id,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              latest_mood: moodData?.mood || null,
              mood_time: moodData?.recorded_at || null,
            };
          })
        );

        setFamilyMembers(familyData);
      } catch (error: any) {
        console.error("Error fetching family members:", error);
      }
    };

    fetchWeather();
    fetchSchedules();
    fetchFamilyMembers();

    const channel = supabase
      .channel('schedule-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchSchedules();
        }
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

  const today = new Date();

  const formatTime = (time: string | null) => {
    if (!time) return "";
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour < 12 ? "오전" : "오후";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${period} ${displayHour}:${minutes}`;
  };

  const getMoodEmoji = (mood: string | null) => {
    if (!mood) return "❓";
    const moodData = moods.find((m) => m.id === mood);
    return moodData?.emoji || "❓";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 pb-24 flex flex-col items-center px-4">
      {/* Weather and Date Section */}
      <div className="w-full max-w-2xl bg-card/90 backdrop-blur-sm rounded-3xl shadow-lg border border-border/50 p-5 mt-6">
        <div className="flex justify-between items-center text-muted-foreground mb-3">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-senior-sm h-auto p-0 hover:text-primary transition-colors">
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
              <span className="text-primary font-semibold text-senior-lg">
                {weather.temperature}°C
              </span>
            </div>
          )}
        </div>
        <h1 className="text-senior-2xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {today.getMonth() + 1}월 {today.getDate()}일 {["일", "월", "화", "수", "목", "금", "토"][today.getDay()]}요일
        </h1>
        {user?.user_metadata?.location_district && (
          <p className="text-senior-base text-foreground mt-2">
            서울특별시 {user.user_metadata.location_district}
          </p>
        )}
      </div>

      {/* Today's Schedule */}
      <section className="w-full max-w-2xl mt-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-senior-xl font-bold text-secondary-foreground">
            오늘의 일정
          </h2>
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
                  {schedule.schedule_time && (
                    <p className="text-primary font-bold text-senior-lg">
                      {formatTime(schedule.schedule_time)}
                    </p>
                  )}
                  <p className="text-foreground text-senior-base mt-1">{schedule.title}</p>
                </div>
                {schedule.shared_with_family && schedule.user_id !== user?.id && (
                  <div className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full text-senior-sm text-foreground flex-shrink-0 ml-4">
                    <Users size={14} /> 가족
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Family Mood Section */}
      <section className="w-full max-w-2xl mt-8 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-senior-xl font-bold text-secondary-foreground">
            우리 가족 기분
          </h2>
        </div>

        {familyMembers.length === 0 ? (
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-border/50">
            <p className="text-senior-base text-muted-foreground">아직 가족 그룹이 없어요</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {familyMembers.slice(0, 4).map((member) => (
              <div
                key={member.user_id}
                className="bg-card/90 backdrop-blur-sm rounded-2xl p-4 border border-border/50 text-center"
              >
                <div className="text-4xl mb-2">{getMoodEmoji(member.latest_mood)}</div>
                <p className="text-senior-base font-semibold truncate">{member.display_name}</p>
                <p className="text-senior-xs text-muted-foreground">
                  {member.latest_mood ? moods.find((m) => m.id === member.latest_mood)?.label : "기록 없음"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

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
