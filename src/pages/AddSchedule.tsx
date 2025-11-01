import { ArrowLeft, Calendar as CalendarIcon, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toLocalDateString } from "@/lib/utils";

interface FamilyGroup {
  id: string;
  name: string;
}

interface AddScheduleProps {
  onBack: () => void;
  onViewCalendar: () => void;
  scheduleToEdit?: any;
}

export default function AddSchedule({ onBack, onViewCalendar, scheduleToEdit }: AddScheduleProps) {
  const { user } = useAuth();
  const [shareWithFamily, setShareWithFamily] = useState(scheduleToEdit?.family_id ? true : false);
  const [title, setTitle] = useState(scheduleToEdit?.title || "");
  const [date, setDate] = useState(scheduleToEdit?.schedule_date || toLocalDateString(new Date()));
  const [time, setTime] = useState(scheduleToEdit?.schedule_time || "");
  const [isSaving, setIsSaving] = useState(false);
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const isEditing = !!scheduleToEdit;

  useEffect(() => {
    fetchFamilyGroups();
  }, [user]);

  useEffect(() => {
    if (isEditing && scheduleToEdit?.id) {
      fetchExistingShares();
    }
  }, [scheduleToEdit?.id]);

  const fetchExistingShares = async () => {
    if (!scheduleToEdit?.id) return;

    try {
      const { data, error } = await supabase
        .from("schedule_family_shares")
        .select("family_group_id")
        .eq("schedule_id", scheduleToEdit.id);

      if (error) throw error;

      if (data && data.length > 0) {
        setSelectedGroupIds(data.map((share) => share.family_group_id));
      }
    } catch (error: any) {
      console.error("Error fetching existing shares:", error);
    }
  };

  const fetchFamilyGroups = async () => {
    if (!user) return;

    try {
      // Get all family groups the user is a member of
      const { data: memberships, error: membershipError } = await supabase
        .from("family_members")
        .select("family_group_id")
        .eq("user_id", user.id);

      if (membershipError) throw membershipError;

      if (!memberships || memberships.length === 0) {
        setFamilyGroups([]);
        return;
      }

      const groupIds = memberships.map((m) => m.family_group_id);

      // Get group details
      const { data: groups, error: groupsError } = await supabase
        .from("family_groups")
        .select("id, name")
        .in("id", groupIds);

      if (groupsError) throw groupsError;

      setFamilyGroups(groups || []);
    } catch (error: any) {
      console.error("Error fetching family groups:", error);
    }
  };

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
      // Ensure time is in HH:MM format (remove seconds if present from scheduleToEdit)
      const cleanTime = time ? time.split(":").slice(0, 2).join(":") : null;
      const startTime = cleanTime ? `${date}T${cleanTime}:00` : `${date}T00:00:00`;
      const endTime = cleanTime ? `${date}T${cleanTime}:00` : `${date}T23:59:59`;

      // Validate group selection if sharing
      if (shareWithFamily) {
        if (selectedGroupIds.length === 0) {
          toast.error("공유할 그룹을 최소 하나 선택해주세요");
          setIsSaving(false);
          return;
        }
        if (familyGroups.length === 0) {
          toast.error("그룹이 없어서 공유할 수 없어요");
          setIsSaving(false);
          return;
        }
      }

      const scheduleData = {
        title: title.trim(),
        schedule_date: date,
        schedule_time: cleanTime || null,
        start_time: startTime,
        end_time: endTime,
        shared_with_family: !!shareWithFamily,
      };

      let scheduleId;
      if (isEditing) {
        const { error } = await supabase
          .from("schedules")
          .update(scheduleData)
          .eq("id", scheduleToEdit.id);
        
        if (error) throw error;
        scheduleId = scheduleToEdit.id;

        // Delete existing shares
        await supabase
          .from("schedule_family_shares")
          .delete()
          .eq("schedule_id", scheduleId);
      } else {
        const { data, error } = await supabase.from("schedules").insert({
          ...scheduleData,
          user_id: user.id,
        }).select();
        
        if (error) throw error;
        scheduleId = data[0].id;
      }

      // Insert new shares if sharing is enabled
      if (shareWithFamily && selectedGroupIds.length > 0) {
        const sharesToInsert = selectedGroupIds.map((groupId) => ({
          schedule_id: scheduleId,
          family_group_id: groupId,
        }));

        const { error: sharesError } = await supabase
          .from("schedule_family_shares")
          .insert(sharesToInsert);

        if (sharesError) throw sharesError;
      }

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
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Share2 className="text-accent" size={32} />
                <Label htmlFor="share" className="text-senior-lg cursor-pointer">
                  이 일정을 그룹에게 공유할까요?
                </Label>
              </div>
              <p className="text-senior-sm text-muted-foreground pl-11">선택한 그룹이 일정을 함께 볼 수 있어요</p>
            </div>
            <Switch 
              id="share" 
              checked={shareWithFamily} 
              onCheckedChange={setShareWithFamily} 
              className="scale-150" 
            />
          </div>

          {/* Group Selection */}
          {shareWithFamily && familyGroups.length > 0 && (
            <div className="space-y-3 mt-4 pt-4 border-t border-border/50">
              <Label className="text-senior-base text-muted-foreground">공유할 그룹 선택 (여러 개 가능):</Label>
              <div className="space-y-2">
                {familyGroups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => {
                      setSelectedGroupIds((prev) =>
                        prev.includes(group.id)
                          ? prev.filter((id) => id !== group.id)
                          : [...prev, group.id]
                      );
                    }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedGroupIds.includes(group.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-accent/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-senior-base font-semibold">{group.name}</span>
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                        selectedGroupIds.includes(group.id)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}>
                        {selectedGroupIds.includes(group.id) && (
                          <div className="w-3 h-3 bg-primary-foreground rounded-sm"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {shareWithFamily && familyGroups.length === 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-senior-sm text-muted-foreground text-center">
                그룹이 없습니다. 먼저 그룹을 만들어주세요.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-6 mt-10">
        <Button size="xl" onClick={handleSave} className="w-full" disabled={isSaving}>
          {isSaving ? "저장 중..." : isEditing ? "일정 수정하기" : "일정 저장하기"}
        </Button>
      </div>
    </div>
  );
}
