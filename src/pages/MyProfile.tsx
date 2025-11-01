import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, MapPin, Phone, Edit2, Save, UserX } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Format phone number for display
const formatPhoneNumber = (phone: string) => {
  if (!phone) return "";
  const numbers = phone.replace(/[^0-9]/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
};

interface Profile {
  display_name: string;
  phone_number: string;
  location_city: string;
  location_district: string;
  location_dong: string;
  avatar_url: string;
}

export default function MyProfile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      // If profile doesn't exist, create it
      if (!data) {
        const newProfile = {
          id: user.id,
          display_name: user.user_metadata?.display_name || "사용자",
          phone_number: user.user_metadata?.phone_number || "",
          location_city: user.user_metadata?.location_city || "",
          location_district: user.user_metadata?.location_district || "",
          location_dong: user.user_metadata?.location_dong || "",
          avatar_url: null,
        };

        const { error: insertError } = await supabase
          .from("profiles")
          .insert(newProfile);

        if (insertError) throw insertError;

        setProfile(newProfile);
        setEditedProfile(newProfile);
      } else {
        setProfile(data);
        setEditedProfile(data);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("프로필을 불러오는 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !editedProfile) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: editedProfile.display_name,
          location_city: editedProfile.location_city,
          location_district: editedProfile.location_district,
          location_dong: editedProfile.location_dong,
        })
        .eq("id", user.id);

      if (error) throw error;

      setProfile(editedProfile);
      setIsEditing(false);
      toast.success("프로필이 저장되었습니다");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("프로필 저장 중 오류가 발생했습니다");
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("로그인이 필요합니다");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '회원 탈퇴에 실패했습니다');
      }

      toast.success("회원 탈퇴가 완료되었습니다");
      await signOut();
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(error.message || "회원 탈퇴 중 오류가 발생했습니다");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-senior-lg text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-senior-lg text-muted-foreground">프로필을 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-senior-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            내 정보
          </h1>
        </div>

        <Card className="p-6 mb-6 backdrop-blur-sm bg-card/95 border-2">
          <div className="flex flex-col items-center mb-6">
            <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-senior-2xl bg-gradient-to-br from-primary/20 to-accent/20">
                {profile.display_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center w-full">
              {isEditing ? (
                <Input
                  value={editedProfile?.display_name || ""}
                  onChange={(e) => setEditedProfile(prev => prev ? {...prev, display_name: e.target.value} : null)}
                  className="text-senior-xl text-center h-12 mb-2"
                />
              ) : (
                <h2 className="text-senior-xl font-bold mb-2">{profile.display_name}</h2>
              )}
              
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Phone size={16} />
                <span className="text-senior-base">{formatPhoneNumber(profile.phone_number) || "등록된 전화번호 없음"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 mb-2 text-senior-base">
                <MapPin size={18} />
                거주지
              </Label>
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    placeholder="시/도"
                    value={editedProfile?.location_city || ""}
                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, location_city: e.target.value} : null)}
                    className="h-14 text-senior-base border-2"
                  />
                  <Input
                    placeholder="시/군/구"
                    value={editedProfile?.location_district || ""}
                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, location_district: e.target.value} : null)}
                    className="h-14 text-senior-base border-2"
                  />
                  <Input
                    placeholder="동/읍/면"
                    value={editedProfile?.location_dong || ""}
                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, location_dong: e.target.value} : null)}
                    className="h-14 text-senior-base border-2"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted/50 border-2">
                  <p className="text-senior-base">
                    {[profile.location_city, profile.location_district, profile.location_dong]
                      .filter(Boolean)
                      .join(" ") || "등록된 주소 없음"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {!isEditing ? (
          <Card 
            className="p-4 mb-4 transition-colors cursor-pointer hover:bg-accent/5 border-2 border-dashed"
            onClick={() => setIsEditing(true)}
          >
            <div className="flex items-center justify-center gap-2 text-primary">
              <Edit2 size={20} />
              <span className="text-senior-base font-semibold">정보 수정</span>
            </div>
          </Card>
        ) : (
          <div className="flex gap-3 mb-4">
            <Card 
              className="flex-1 p-4 transition-colors cursor-pointer hover:bg-accent/5 border-2"
              onClick={handleCancel}
            >
              <div className="flex items-center justify-center">
                <span className="text-senior-base font-semibold">취소</span>
              </div>
            </Card>
            <Card 
              className="flex-1 p-4 transition-colors cursor-pointer hover:bg-primary/90 bg-primary text-primary-foreground border-2 border-primary"
              onClick={handleSave}
            >
              <div className="flex items-center justify-center gap-2">
                <Save size={20} />
                <span className="text-senior-base font-semibold">저장</span>
              </div>
            </Card>
          </div>
        )}

        <Button
          onClick={signOut}
          variant="ghost"
          size="lg"
          className="w-full text-primary hover:text-primary hover:bg-primary/10 mb-4"
        >
          <LogOut className="mr-2" />
          로그아웃
        </Button>

        <Button
          onClick={() => setDeleteDialogOpen(true)}
          variant="ghost"
          size="lg"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <UserX className="mr-2" />
          회원 탈퇴
        </Button>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-senior-xl">회원 탈퇴</AlertDialogTitle>
            <AlertDialogDescription className="text-senior-base">
              정말로 회원 탈퇴를 하시겠습니까? 모든 데이터가 삭제되며 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-senior-base">취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "탈퇴 중..." : "회원 탈퇴"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
