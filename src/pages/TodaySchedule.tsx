import { Calendar, MapPin, Plus, Sparkles, LogOut, Sun, CloudRain, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

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

export default function TodaySchedule({ onAddSchedule, userId }: TodayScheduleProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);

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

    fetchWeather();
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

  // Mock data
  const today = new Date();
  const schedules = [
    { id: 1, time: "오전 10:00", title: "복지관 방문", shared: false },
    { id: 2, time: "오후 2:00", title: "손주 만나는 날", shared: true },
  ];

  const recommendations = [
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
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary pb-24 flex flex-col items-center px-6">
      {/* Weather and Date Section */}
      <div className="w-full max-w-lg bg-card rounded-3xl shadow-md p-6 mt-6">
        <div className="flex justify-between items-center text-muted-foreground mb-2">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-senior-sm h-auto p-0">
            <LogOut size={20} />
            <span className="ml-2">로그아웃</span>
          </Button>
          {weather && (
            <div className="flex items-center gap-2">
              {weather.weathercode <= 3 ? (
                <Sun className="text-primary" size={26} />
              ) : (
                <CloudRain className="text-blue-500" size={26} />
              )}
              <span className="text-primary font-semibold text-senior-lg">
                {weather.temperature}°C
              </span>
            </div>
          )}
        </div>
        <h1 className="text-senior-3xl font-extrabold text-primary mt-1">
          {today.getMonth() + 1}월 {today.getDate()}일 {["일", "월", "화", "수", "목", "금", "토"][today.getDay()]}요일
        </h1>
        {user?.user_metadata?.location_district && (
          <p className="text-senior-lg text-foreground mt-2">
            서울특별시 {user.user_metadata.location_district}
          </p>
        )}
      </div>

      {/* Today's Schedule */}
      <section className="w-full max-w-lg mt-6">
        <h2 className="text-senior-2xl font-bold text-primary mb-3 flex items-center gap-2">
          <Calendar size={22} className="text-primary" />
          오늘의 일정
        </h2>

        {schedules.length === 0 ? (
          <Card className="p-8 text-center border-border">
            <p className="text-senior-base text-muted-foreground">오늘은 일정이 없어요</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-card rounded-2xl p-4 shadow-sm border border-border flex justify-between items-center"
              >
                <div>
                  <p className="text-primary font-bold text-senior-xl">{schedule.time}</p>
                  <p className="text-foreground text-senior-lg mt-1">{schedule.title}</p>
                </div>
                {schedule.shared && (
                  <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-full text-senior-sm text-foreground">
                    <Users size={14} /> 가족 공유
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI Recommendations */}
      <section className="w-full max-w-lg mt-8 pb-6">
        <h2 className="text-senior-2xl font-bold text-primary mb-3 flex items-center gap-2">
          ✨ 오늘 뭐 할까요? 💡
        </h2>

        <div className="flex flex-col gap-3">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="text-primary text-senior-3xl">
                {rec.image}
              </div>
              <div>
                <p className="text-senior-lg font-semibold text-foreground">{rec.title}</p>
                <p className="text-senior-base text-muted-foreground flex items-center gap-1">
                  <MapPin size={18} />
                  {rec.location}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAddSchedule}
        className="fixed bottom-28 right-10 bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center text-4xl shadow-lg hover:bg-primary/90"
      >
        +
      </motion.button>
    </div>
  );
}
