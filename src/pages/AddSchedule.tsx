import { ArrowLeft, Calendar as CalendarIcon, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AddScheduleProps {
  onBack: () => void;
  onViewCalendar: () => void;
  scheduleToEdit?: any;
}

export default function AddSchedule({ onBack, onViewCalendar, scheduleToEdit }: AddScheduleProps) {
  const { user } = useAuth();
  const [shareWithFamily, setShareWithFamily] = useState(scheduleToEdit?.family_id ? true : false);
  const [title, setTitle] = useState(scheduleToEdit?.title || "");
  const [date, setDate] = useState(scheduleToEdit?.schedule_date || new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(scheduleToEdit?.schedule_time || "");
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!scheduleToEdit;

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("일정 내용을 입력해주세요");
      return;
    }

    if (!user) {
      toast.error("로그인이 필요합니다");
      return;
    }

    setIsSaving(true);

    try {
      // Parse time to create proper timestamps
      const startTime = time ? `${date}T${time}:00` : `${date}T00:00:00`;
      const endTime = time ? `${date}T${time}:00` : `${date}T23:59:59`;

      const scheduleData = {
        title: title.trim(),
        schedule_date: date,
        schedule_time: time || null,
        start_time: startTime,
        end_time: endTime,
        family_id: shareWithFamily ? user.id : null,
      };

      let error;
      if (isEditing) {
        const result = await supabase
          .from("schedules")
          .update(scheduleData)
          .eq("id", scheduleToEdit.id);
        error = result.error;
      } else {
        const result = await supabase.from("schedules").insert({
          ...scheduleData,
          user_id: user.id,
        });
        error = result.error;
      }

      if (error) throw error;

      toast.success(isEditing ? "일정이 수정되었어요!" : "일정이 추가되었어요!", {
        description: shareWithFamily ? "그룹들에게도 알려드렸어요" : undefined,
        duration: 3000,
      });

      setTimeout(() => {
        onBack();
      }, 1000);
    } catch (error) {
      console.error("일정 저장 오류:", error);
      toast.error("일정 저장에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
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
          <h1 className="text-senior-2xl">{isEditing ? "일정 수정" : "일정 추가"}</h1>
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
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        {/* Family Sharing Toggle */}
        <Card className="p-6 border-2 border-accent/30 bg-accent/5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Share2 className="text-accent" size={32} />
                <Label htmlFor="share" className="text-senior-lg cursor-pointer">
                  이 일정을 그룹에게 공유할까요?
                </Label>
              </div>
              <p className="text-senior-sm text-muted-foreground pl-11">그룹들이 일정을 함께 볼 수 있어요</p>
            </div>
            <Switch id="share" checked={shareWithFamily} onCheckedChange={setShareWithFamily} className="scale-150" />
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-6 space-y-4">
        <Button size="xl" onClick={onViewCalendar} variant="outline" className="w-full">
          <CalendarIcon />
          전체 캘린더 보기
        </Button>

        <Button size="xl" onClick={handleSave} className="w-full" disabled={isSaving}>
          {isSaving ? "저장 중..." : isEditing ? "일정 수정하기" : "일정 저장하기"}
        </Button>
      </div>
    </div>
  );
}
