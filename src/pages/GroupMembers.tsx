import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface GroupMember {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  is_creator: boolean;
  mood: string | null;
}

interface GroupMembersProps {
  groupId: string;
  groupName: string;
  onBack: () => void;
  showMood?: boolean;
}

export default function GroupMembers({ groupId, groupName, onBack, showMood = false }: GroupMembersProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<GroupMember[]>([]);

  useEffect(() => {
    fetchMembers();
  }, [groupId]);

  const fetchMembers = async () => {
    try {
      // Get the group info to know who created it
      const { data: groupData, error: groupError } = await supabase
        .from("family_groups")
        .select("created_by")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;

      // Get all members of this group
      const { data: memberData, error: memberError } = await supabase
        .from("family_members")
        .select("id, user_id")
        .eq("family_group_id", groupId);

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        setMembers([]);
        return;
      }

      // Get profile details including mood
      const userIds = memberData.map((m) => m.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, mood")
        .in("id", userIds);

      if (profileError) throw profileError;

      // Combine member data with profiles
      const membersWithProfiles = memberData.map((member) => {
        const profile = profiles?.find((p) => p.id === member.user_id);
        return {
          id: member.id,
          user_id: member.user_id,
          display_name: profile?.display_name || "Unknown",
          avatar_url: profile?.avatar_url || null,
          is_creator: member.user_id === groupData.created_by,
          mood: profile?.mood || null,
        };
      });

      // 현재 사용자를 맨 위로 정렬
      const sortedMembers = membersWithProfiles.sort((a, b) => {
        if (a.user_id === user?.id) return -1;
        if (b.user_id === user?.id) return 1;
        return 0;
      });

      setMembers(sortedMembers);
    } catch (error: any) {
      console.error("Error fetching members:", error);
      toast.error("구성원 정보를 불러오는데 실패했습니다");
    }
  };

  const getMoodEmoji = (mood: string | null) => {
    if (!mood) return null;
    const moods: { [key: string]: string } = {
      good: "😊",
      okay: "😑",
      bad: "😡",
    };
    return moods[mood] || null;
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-gradient-to-br from-background via-background to-secondary/30 px-4">
      <section className="pt-8 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h2 className="text-senior-2xl font-bold text-secondary-foreground">{groupName}</h2>
            <p className="text-senior-sm text-muted-foreground">구성원 {members.length}명</p>
          </div>
        </div>

        <div className="space-y-3">
          {members.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-senior-base text-muted-foreground">구성원 정보를 불러오는 중입니다...</p>
            </Card>
          ) : (
            members.map((member) => (
              <Card key={member.id} className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center text-3xl flex-shrink-0">
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
                        <h3 className="text-senior-lg font-semibold truncate">{member.display_name}</h3>
                        {member.user_id === user?.id && (
                          <span className="text-senior-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                            나
                          </span>
                        )}
                        {member.is_creator && (
                          <span className="text-senior-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                            👑 그룹장
                          </span>
                        )}
                      </div>
                      {member.user_id !== user?.id && (
                        <p className="text-senior-sm text-primary cursor-pointer hover:underline mt-1">캘린더 보기</p>
                      )}
                    </div>
                    {showMood && getMoodEmoji(member.mood) && (
                      <div className="text-5xl flex-shrink-0">{getMoodEmoji(member.mood)}</div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
