import { Heart, Activity, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";

const moods = [
  { id: "good", emoji: "😊", label: "좋음", color: "senior-good" },
  { id: "okay", emoji: "🙂", label: "그저 그럼", color: "senior-neutral" },
  { id: "sad", emoji: "😥", label: "속상함", color: "senior-bad" },
  { id: "sick", emoji: "🤒", label: "아파요", color: "senior-sick" },
];

export default function FamilyNews() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId);
    const mood = moods.find((m) => m.id === moodId);
    toast.success(`${mood?.emoji} ${mood?.label}을(를) 선택하셨어요`, {
      description: "가족들에게 알려드릴게요",
      duration: 3000,
    });
  };

  const handleHealthRecord = (type: string) => {
    toast.info(`${type} 기록하기`, {
      description: "준비 중인 기능입니다",
      duration: 2000,
    });
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 px-6 pt-8">
      {/* Mood Sharing Section */}
      <section className="mb-12">
        <h1 className="text-senior-2xl mb-3">오늘 기분은 어떠세요?</h1>
        <p className="text-senior-base text-muted-foreground mb-8">
          선택하신 기분은 가족들에게 알려져요
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          {moods.map((mood) => (
            <Button
              key={mood.id}
              variant="mood"
              size="xl"
              onClick={() => handleMoodSelect(mood.id)}
              className={`min-h-[140px] ${
                selectedMood === mood.id ? "border-primary border-4 bg-secondary" : ""
              }`}
            >
              <span className="text-6xl mb-2">{mood.emoji}</span>
              <span className="text-senior-lg">{mood.label}</span>
            </Button>
          ))}
        </div>
      </section>

      {/* Health Records Section */}
      <section>
        <h2 className="text-senior-xl mb-6 flex items-center gap-3">
          <Activity className="text-primary" />
          나의 건강 기록하기
        </h2>
        
        <div className="space-y-4">
          <Button
            variant="health"
            size="lg"
            onClick={() => handleHealthRecord("혈압")}
            className="w-full justify-start"
          >
            <Heart className="text-destructive" size={32} />
            <span className="text-senior-lg">혈압 기록하기</span>
          </Button>
          
          <Button
            variant="health"
            size="lg"
            onClick={() => handleHealthRecord("혈당")}
            className="w-full justify-start"
          >
            <Activity className="text-senior-bad" size={32} />
            <span className="text-senior-lg">혈당 기록하기</span>
          </Button>
          
          <Button
            variant="health"
            size="lg"
            onClick={() => handleHealthRecord("약")}
            className="w-full justify-start"
          >
            <Pill className="text-accent" size={32} />
            <span className="text-senior-lg">오늘 드신 약</span>
          </Button>
        </div>

        <Card className="mt-8 p-6 bg-accent/10 border-accent">
          <p className="text-senior-base text-center">
            💚 건강 정보는 가족과 자동으로 공유돼요
          </p>
        </Card>
      </section>
    </div>
  );
}
