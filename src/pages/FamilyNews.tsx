import { Heart, Activity, Pill, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const moods = [
  { id: "good", emoji: "😊", label: "좋음", color: "senior-good" },
  { id: "okay", emoji: "🙂", label: "보통", color: "senior-neutral" },
  { id: "sad", emoji: "😥", label: "속상함", color: "senior-bad" },
  { id: "sick", emoji: "🤒", label: "아파요", color: "senior-sick" },
];

interface FamilyMember {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  latest_mood: string | null;
  mood_time: string | null;
}

export default function FamilyNews() {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch family members and their moods
  useEffect(() => {
    if (!user) return;

    const fetchFamilyMembers = async () => {
      try {
        // Get family groups the user belongs to
        const { data: memberships, error: membershipError } = await supabase
          .from("family_members")
          .select("family_group_id")
          .eq("user_id", user.id);

        if (membershipError) throw membershipError;

        if (!memberships || memberships.length === 0) {
          setFamilyMembers([]);
          setLoading(false);
          return;
        }

        const groupIds = memberships.map((m) => m.family_group_id);

        // Get all members in these family groups
        const { data: members, error: membersError } = await supabase
          .from("family_members")
          .select("user_id")
          .in("family_group_id", groupIds);

        if (membersError) throw membersError;

        if (!members || members.length === 0) {
          setFamilyMembers([]);
          setLoading(false);
          return;
        }

        const userIds = members.map((m) => m.user_id);

        // Get profiles
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, mood")
          .in("id", userIds);

        if (profilesError) throw profilesError;

        // Get mood from profiles
        const familyData: FamilyMember[] = (profiles || []).map((profile) => ({
          user_id: profile.id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          latest_mood: (profile as any).mood || null,
          mood_time: null,
        }));

        setFamilyMembers(familyData);
      } catch (error: any) {
        console.error("Error fetching family members:", error);
        toast.error("그룹 정보를 불러오는데 실패했습니다");
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyMembers();
  }, [user]);

  const handleMoodSelect = async (moodId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          mood: moodId,
          mood_updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setSelectedMood(moodId);
      const mood = moods.find((m) => m.id === moodId);
      toast.success(`${mood?.emoji} ${mood?.label}을(를) 선택하셨어요`, {
        description: "그룹들에게 알려드릴게요",
        duration: 3000,
      });

      // Refresh family members to show updated mood
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error("Error saving mood:", error);
      toast.error("기분 기록에 실패했습니다");
    }
  };

  const handleHealthRecord = (type: string) => {
    toast.info(`${type} 기록하기`, {
      description: "준비 중인 기능입니다",
      duration: 2000,
    });
  };

  const getMoodEmoji = (mood: string | null) => {
    if (!mood) return "❓";
    const moodData = moods.find((m) => m.id === mood);
    return moodData?.emoji || "❓";
  };

  const getTimeAgo = (timestamp: string | null) => {
    if (!timestamp) return "기록 없음";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}일 전`;
    if (diffHours > 0) return `${diffHours}시간 전`;
    if (diffMins > 0) return `${diffMins}분 전`;
    return "방금 전";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 pb-24 px-4 pt-6">
      {/* Family Members Section */}
      <section className="mb-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full" />
          <h2 className="text-senior-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            우리 그룹 소식
          </h2>
        </div>

        {loading ? (
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-border/50 shadow-sm">
            <p className="text-senior-base text-muted-foreground">불러오는 중...</p>
          </div>
        ) : familyMembers.length === 0 ? (
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-border/50 shadow-sm">
            <p className="text-senior-base text-muted-foreground mb-2">아직 그룹이 없어요</p>
            <p className="text-senior-sm text-muted-foreground">설정에서 그룹을 초대해보세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {familyMembers.map((member) => (
              <div
                key={member.user_id}
                className={`bg-card/90 backdrop-blur-sm rounded-2xl p-4 border transition-all hover:shadow-md ${
                  member.user_id === user?.id ? "border-primary/50 shadow-sm shadow-primary/10" : "border-border/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center text-3xl flex-shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-senior-lg truncate">{member.display_name}</h3>
                      {member.user_id === user?.id && (
                        <span className="text-senior-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                          나
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getMoodEmoji(member.latest_mood)}</span>
                      <div>
                        <p className="text-senior-sm">
                          {member.latest_mood ? moods.find((m) => m.id === member.latest_mood)?.label : "기분 미기록"}
                        </p>
                        <p className="text-senior-xs text-muted-foreground">{getTimeAgo(member.mood_time)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Mood Sharing Section */}
      <section className="mb-10 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full" />
          <h1 className="text-senior-2xl font-bold">오늘 기분은 어떠세요?</h1>
        </div>
        <p className="text-senior-sm text-muted-foreground mb-6">선택하신 기분은 그룹들에게 알려져요</p>

        <div className="grid grid-cols-2 gap-3">
          {moods.map((mood) => (
            <Button
              key={mood.id}
              variant="mood"
              size="xl"
              onClick={() => handleMoodSelect(mood.id)}
              className={`h-28 bg-card/80 backdrop-blur-sm border transition-all hover:scale-[1.02] ${
                selectedMood === mood.id
                  ? "border-primary/50 shadow-lg shadow-primary/20 bg-primary/5"
                  : "border-border/50 hover:border-primary/30"
              }`}
            >
              <span className="text-5xl mb-1">{mood.emoji}</span>
              <span className="text-senior-base">{mood.label}</span>
            </Button>
          ))}
        </div>
      </section>

      {/* Health Records Section */}
      <section className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full" />
          <h2 className="text-senior-xl font-bold">나의 건강 기록하기</h2>
        </div>

        <div className="space-y-3">
          <Button
            variant="health"
            size="lg"
            onClick={() => handleHealthRecord("혈압")}
            className="w-full justify-start bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all hover:shadow-md"
          >
            <Heart className="text-destructive" size={24} />
            <span className="text-senior-base">혈압 기록하기</span>
          </Button>

          <Button
            variant="health"
            size="lg"
            onClick={() => handleHealthRecord("혈당")}
            className="w-full justify-start bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all hover:shadow-md"
          >
            <Activity className="text-senior-bad" size={24} />
            <span className="text-senior-base">혈당 기록하기</span>
          </Button>

          <Button
            variant="health"
            size="lg"
            onClick={() => handleHealthRecord("약")}
            className="w-full justify-start bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all hover:shadow-md"
          >
            <Pill className="text-accent" size={24} />
            <span className="text-senior-base">오늘 드신 약</span>
          </Button>
        </div>

        <div className="mt-6 bg-gradient-to-r from-primary/5 to-accent/5 backdrop-blur-sm rounded-2xl p-4 border border-primary/20">
          <p className="text-senior-sm text-center">💚 건강 정보는 그룹과 자동으로 공유돼요</p>
        </div>
      </section>
    </div>
  );
}
