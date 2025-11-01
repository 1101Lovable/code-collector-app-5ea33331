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
        const { data: familyMemberships, error: membershipError } = await supabase
          .from("family_members")
          .select("family_group_id")
          .eq("user_id", user.id);

        if (membershipError) throw membershipError;

        if (!familyMemberships || familyMemberships.length === 0) {
          setFamilyMembers([]);
          setLoading(false);
          return;
        }

        const familyGroupIds = familyMemberships.map((m) => m.family_group_id);

        // Get all members in these family groups
        const { data: members, error: membersError } = await supabase
          .from("family_members")
          .select("user_id")
          .in("family_group_id", familyGroupIds);

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
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);

        if (profilesError) throw profilesError;

        // Get latest mood for each user
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
        toast.error("가족 정보를 불러오는데 실패했습니다");
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyMembers();
  }, [user]);

  const handleMoodSelect = async (moodId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("mood_records").insert({
        user_id: user.id,
        mood: moodId,
      });

      if (error) throw error;

      setSelectedMood(moodId);
      const mood = moods.find((m) => m.id === moodId);
      toast.success(`${mood?.emoji} ${mood?.label}을(를) 선택하셨어요`, {
        description: "가족들에게 알려드릴게요",
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
    <div className="flex flex-col min-h-screen pb-24 px-6 pt-8">
      {/* Family Members Section */}
      <section className="mb-8">
        <h2 className="text-senior-xl mb-6 flex items-center gap-3">
          <Users className="text-primary" />
          우리 가족 소식
        </h2>

        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-senior-base text-muted-foreground">불러오는 중...</p>
          </Card>
        ) : familyMembers.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-senior-base text-muted-foreground mb-4">
              아직 가족 그룹이 없어요
            </p>
            <p className="text-senior-sm text-muted-foreground">
              설정에서 가족을 초대해보세요
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {familyMembers.map((member) => (
              <Card
                key={member.user_id}
                className={`p-6 shadow-md ${
                  member.user_id === user?.id ? "border-2 border-primary" : ""
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className="min-w-[80px] min-h-[80px] bg-secondary rounded-full flex items-center justify-center text-senior-3xl">
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
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-senior-lg">{member.display_name}</h3>
                      {member.user_id === user?.id && (
                        <span className="text-senior-sm bg-primary/20 px-3 py-1 rounded-full">
                          나
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-senior-2xl">
                        {getMoodEmoji(member.latest_mood)}
                      </span>
                      <div>
                        <p className="text-senior-base">
                          {member.latest_mood
                            ? moods.find((m) => m.id === member.latest_mood)?.label
                            : "기분 미기록"}
                        </p>
                        <p className="text-senior-sm text-muted-foreground">
                          {getTimeAgo(member.mood_time)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

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
              className={`h-[140px] ${
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
