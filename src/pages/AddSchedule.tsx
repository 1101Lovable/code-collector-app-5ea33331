import { ArrowLeft, Calendar as CalendarIcon, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";

interface AddScheduleProps {
  onBack: () => void;
  onViewCalendar: () => void;
}

export default function AddSchedule({ onBack, onViewCalendar }: AddScheduleProps) {
  const [shareWithFamily, setShareWithFamily] = useState(false);
  const [title, setTitle] = useState("");

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("일정 내용을 입력해주세요");
      return;
    }

    toast.success("일정이 추가되었어요!", {
      description: shareWithFamily ? "가족들에게도 알려드렸어요" : undefined,
      duration: 3000,
    });
    
    setTimeout(() => {
      onBack();
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft size={32} />
          </Button>
          <h1 className="text-senior-2xl">일정 추가</h1>
        </div>
      </header>

      {/* Form */}
      <div className="flex-1 px-6 pt-8 space-y-8">
        <div className="space-y-4">
          <Label htmlFor="title" className="text-senior-lg">
            무엇을 하시나요?
          </Label>
          <Input
            id="title"
            placeholder="예: 병원 가기, 친구 만나기"
            className="h-16 text-senior-base px-6 border-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <Label htmlFor="date" className="text-senior-lg">
            언제 하시나요?
          </Label>
          <Input
            id="date"
            type="date"
            className="h-16 text-senior-base px-6 border-2"
          />
        </div>

        <div className="space-y-4">
          <Label htmlFor="time" className="text-senior-lg">
            몇 시에 하시나요?
          </Label>
          <Input
            id="time"
            type="time"
            className="h-16 text-senior-base px-6 border-2"
          />
        </div>

        {/* Family Sharing Toggle */}
        <Card className="p-6 border-2 border-accent/30 bg-accent/5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Share2 className="text-accent" size={32} />
                <Label htmlFor="share" className="text-senior-lg cursor-pointer">
                  이 일정을 가족에게 공유할까요?
                </Label>
              </div>
              <p className="text-senior-sm text-muted-foreground pl-11">
                가족들이 일정을 함께 볼 수 있어요
              </p>
            </div>
            <Switch
              id="share"
              checked={shareWithFamily}
              onCheckedChange={setShareWithFamily}
              className="scale-150"
            />
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-6 space-y-4">
        <Button
          size="xl"
          onClick={onViewCalendar}
          variant="outline"
          className="w-full"
        >
          <CalendarIcon />
          전체 캘린더 보기
        </Button>
        
        <Button
          size="xl"
          onClick={handleSave}
          className="w-full"
        >
          일정 저장하기
        </Button>
      </div>
    </div>
  );
}
