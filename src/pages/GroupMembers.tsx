import { Crown, ArrowLeft } from "lucide-react";
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
  is_head: boolean;
}

interface GroupMembersProps {
  groupId: string;
  groupName: string;
  onBack: () => void;
}

export default function GroupMembers({ groupId, groupName, onBack }: GroupMembersProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isUserHead, setIsUserHead] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [groupId]);

  const fetchMembers = async () => {
    try {
      // Get all members of this group
      const { data: memberData, error: memberError } = await supabase
        .from("family_members")
        .select("id, user_id, is_head")
        .eq("family_group_id", groupId);

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        setMembers([]);
        return;
      }

      // Check if current user is head
      const userMembership = memberData.find((m) => m.user_id === user?.id);
      setIsUserHead(userMembership?.is_head || false);

      // Get profile details
      const userIds = memberData.map((m) => m.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
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
          is_head: member.is_head,
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

  const handleSetAsHead = async (memberId: string) => {
    try {
      // 먼저 모든 멤버의 is_head를 false로 설정
      const { error: resetError } = await supabase
        .from("family_members")
        .update({ is_head: false })
        .eq("family_group_id", groupId);

      if (resetError) throw resetError;

      // 선택한 멤버를 가장으로 설정
      const { error: setError } = await supabase
        .from("family_members")
        .update({ is_head: true })
        .eq("id", memberId);

      if (setError) throw setError;

      toast.success("가장으로 지정되었습니다");
      fetchMembers();
    } catch (error: any) {
      console.error("가장 지정 오류:", error);
      toast.error("가장 지정에 실패했습니다");
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-gradient-to-br from-background via-background to-secondary/30 px-4">
      <section className="pt-8 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h2 className="text-senior-2xl font-bold text-secondary-foreground">
              {groupName}
            </h2>
            <p className="text-senior-sm text-muted-foreground">
              구성원 {members.length}명
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {members.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-senior-base text-muted-foreground">
                구성원 정보를 불러오는 중입니다...
              </p>
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
                        <h3 className="text-senior-lg font-semibold truncate">
                          {member.display_name}
                        </h3>
                        {member.user_id === user?.id && (
                          <span className="text-senior-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                            나
                          </span>
                        )}
                      </div>
                      {member.is_head && (
                        <div className="flex items-center gap-1 text-accent">
                          <Crown size={16} />
                          <span className="text-senior-sm">가장</span>
                        </div>
                      )}
                      {member.user_id !== user?.id && (
                        <p className="text-senior-sm text-primary cursor-pointer hover:underline mt-1">
                          캘린더 보기
                        </p>
                      )}
                    </div>
                  </div>

                  {isUserHead && !member.is_head && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetAsHead(member.id)}
                      className="gap-2 flex-shrink-0"
                    >
                      가장 지정
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {isUserHead && (
          <div className="mt-6 bg-gradient-to-r from-primary/5 to-accent/5 backdrop-blur-sm rounded-2xl p-4 border border-primary/20">
            <p className="text-senior-sm text-center">
              💡 가장은 다른 구성원을 가장으로 지정하거나 해제할 수 있습니다
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
