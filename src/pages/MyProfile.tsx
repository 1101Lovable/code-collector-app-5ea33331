import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, User, MapPin, Phone, Smile, Edit2, Save } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  display_name: string;
  phone_number: string;
  location_city: string;
  location_district: string;
  location_dong: string;
  mood: string;
  avatar_url: string;
}

export default function MyProfile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);

  const moods = [
    { value: "great", label: "😊 아주 좋아요", emoji: "😊" },
    { value: "good", label: "🙂 좋아요", emoji: "🙂" },
    { value: "okay", label: "😐 그저 그래요", emoji: "😐" },
    { value: "bad", label: "😔 안 좋아요", emoji: "😔" },
    { value: "terrible", label: "😢 매우 안 좋아요", emoji: "😢" },
  ];

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
        .single();

      if (error) throw error;
      setProfile(data);
      setEditedProfile(data);
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
          mood: editedProfile.mood,
          mood_updated_at: new Date().toISOString(),
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

  const currentMood = moods.find(m => m.value === (isEditing ? editedProfile?.mood : profile.mood));

  return (
    <div className="min-h-screen pb-24 px-4 pt-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-senior-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            내 정보
          </h1>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="lg">
              <Edit2 className="mr-2" size={18} />
              수정
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" size="lg">
                취소
              </Button>
              <Button onClick={handleSave} size="lg">
                <Save className="mr-2" size={18} />
                저장
              </Button>
            </div>
          )}
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
                <span className="text-senior-base">{profile.phone_number || "등록된 전화번호 없음"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 mb-2 text-senior-base">
                <Smile size={18} />
                현재 기분
              </Label>
              {isEditing ? (
                <Select
                  value={editedProfile?.mood || ""}
                  onValueChange={(value) => setEditedProfile(prev => prev ? {...prev, mood: value} : null)}
                >
                  <SelectTrigger className="h-14 text-senior-base border-2">
                    <SelectValue placeholder="기분을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {moods.map((mood) => (
                      <SelectItem key={mood.value} value={mood.value} className="text-senior-base py-3">
                        {mood.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50 border-2">
                  <span className="text-senior-2xl">{currentMood?.emoji || "😐"}</span>
                  <span className="text-senior-base">{currentMood?.label || "설정 안 됨"}</span>
                </div>
              )}
            </div>

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

        <Button
          onClick={signOut}
          variant="destructive"
          size="xl"
          className="w-full"
        >
          <LogOut className="mr-2" />
          로그아웃
        </Button>
      </div>
    </div>
  );
}
