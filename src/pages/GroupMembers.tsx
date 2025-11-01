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
      // Get group details
      const { data: group, error: groupError } = await supabase
        .from("family_groups")
        .select("invite_code")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;

      // Get all profiles with this group code
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, is_family_head")
        .eq("family_group_code", group.invite_code);

      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        setMembers([]);
        return;
      }

      // Check if current user is head
      const userProfile = profiles.find((p) => p.user_id === user?.id);
      setIsUserHead(userProfile?.is_family_head || false);

      // Map to member format
      const membersData = profiles.map((profile) => ({
        id: profile.user_id,
        user_id: profile.user_id,
        display_name: profile.display_name || "Unknown",
        avatar_url: profile.avatar_url || null,
        is_head: profile.is_family_head,
      }));

      setMembers(membersData);
    } catch (error: any) {
      console.error("Error fetching members:", error);
      toast.error("구성원 정보를 불러오는데 실패했습니다");
    }
  };

  const handleToggleHead = async (memberId: string, currentIsHead: boolean) => {
    if (!isUserHead) {
      toast.error("가장만 역할을 변경할 수 있습니다");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_family_head: !currentIsHead })
        .eq("user_id", memberId);

      if (error) throw error;

      toast.success(
        currentIsHead ? "가장 역할이 해제되었습니다" : "가장으로 설정되었습니다"
      );
      fetchMembers();
    } catch (error: any) {
      console.error("Error updating member role:", error);
      toast.error("역할 변경에 실패했습니다");
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
          {members.map((member) => (
            <Card key={member.id} className="p-4">
              <div className="flex items-center justify-between">
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
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-senior-lg font-semibold">
                        {member.display_name}
                      </h3>
                      {member.user_id === user?.id && (
                        <span className="text-senior-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
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
                  </div>
                </div>

                {isUserHead && member.user_id !== user?.id && (
                  <Button
                    variant={member.is_head ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleToggleHead(member.id, member.is_head)}
                    className="flex-shrink-0"
                  >
                    <Crown size={16} />
                    {member.is_head ? "가장 해제" : "가장 지정"}
                  </Button>
                )}
              </div>
            </Card>
          ))}
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
