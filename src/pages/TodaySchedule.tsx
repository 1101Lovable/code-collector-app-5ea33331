import { Calendar, MapPin, Plus, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TodayScheduleProps {
  onAddSchedule: () => void;
  userId: string;
}

export default function TodaySchedule({ onAddSchedule, userId }: TodayScheduleProps) {
  const navigate = useNavigate();
  
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
    <div className="flex flex-col min-h-screen pb-24">
      {/* Weather and Date Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 p-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-senior-sm"
          >
            <LogOut size={20} />
            로그아웃
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-senior-2xl mb-2">
              {today.getMonth() + 1}월 {today.getDate()}일{" "}
              {["일", "월", "화", "수", "목", "금", "토"][today.getDay()]}요일
            </h1>
            <p className="text-senior-lg text-muted-foreground">좋은 아침입니다! 😊</p>
          </div>
          <div className="text-center">
            <div className="text-senior-3xl">☀️</div>
            <p className="text-senior-xl mt-2">15°C</p>
          </div>
        </div>
      </section>

      {/* Today's Schedule */}
      <section className="px-6 pt-8">
        <h2 className="text-senior-xl mb-6 flex items-center gap-3">
          <Calendar className="text-primary" />
          오늘의 일정
        </h2>
        
        {schedules.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-senior-base text-muted-foreground">오늘은 일정이 없어요</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <Card key={schedule.id} className="p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-senior-lg text-primary mb-2">{schedule.time}</p>
                    <p className="text-senior-base">{schedule.title}</p>
                  </div>
                  {schedule.shared && (
                    <span className="text-senior-sm bg-accent/20 px-4 py-2 rounded-full whitespace-nowrap ml-4">
                      👨‍👩‍👧 가족 공유
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* AI Recommendations */}
      <section className="px-6 pt-8 pb-6">
        <h2 className="text-senior-xl mb-6 flex items-center gap-3">
          <Sparkles className="text-accent" />
          오늘 뭐 할까요? 💡
        </h2>
        
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="p-6 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
              <div className="flex items-center gap-6">
                <div className="text-senior-3xl min-w-[80px] min-h-[80px] bg-secondary rounded-2xl flex items-center justify-center">
                  {rec.image}
                </div>
                <div className="flex-1">
                  <p className="text-senior-lg mb-2">{rec.title}</p>
                  <p className="text-senior-base text-muted-foreground flex items-center gap-2">
                    <MapPin size={24} />
                    {rec.location}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Floating Action Button */}
      <Button
        size="xl"
        onClick={onAddSchedule}
        className="fixed bottom-28 right-6 rounded-full shadow-2xl w-20 h-20"
      >
        <Plus size={48} />
      </Button>
    </div>
  );
}
