import { ChevronLeft, ChevronRight, Settings, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import FamilyManagement from "./FamilyManagement";
import { toLocalDateString } from "@/lib/utils";

const moods = [
  { id: "good", emoji: "😊", label: "행복" },
  { id: "okay", emoji: "😐", label: "보통" },
  { id: "bad", emoji: "😢", label: "나쁨" },
];

interface FamilyGroup {
  id: string;
  name: string;
  member_count: number;
}

interface FamilyMember {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  is_head: boolean;
  latest_mood?: string | null;
}

export default function GroupCalendar() {
  const { user } = useAuth();
  const [showManagement, setShowManagement] = useState(false);
  const [myGroups, setMyGroups] = useState<FamilyGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<FamilyGroup | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthSchedules, setMonthSchedules] = useState<{ [key: string]: any[] }>({});
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  useEffect(() => {
    fetchMyGroups();
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      fetchFamilyMembers();
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedMember) {
      fetchMemberSchedules();
    }
  }, [selectedMember, currentDate]);

  const fetchMyGroups = async () => {
    if (!user) return;

    try {
      // Get all family groups the user is a member of
      const { data: memberships, error: membershipError } = await supabase
        .from("family_members")
        .select("family_group_id")
        .eq("user_id", user.id);

      if (membershipError) throw membershipError;

      if (!memberships || memberships.length === 0) {
        setMyGroups([]);
        return;
      }

      const groupIds = memberships.map((m) => m.family_group_id);

      // Get group details
      const { data: groups, error: groupsError } = await supabase.from("family_groups").select("*").in("id", groupIds);

      if (groupsError) throw groupsError;

      // Get member count for each group
      const groupsWithCount = await Promise.all(
        (groups || []).map(async (group) => {
          const { count } = await supabase
            .from("family_members")
            .select("*", { count: "exact", head: true })
            .eq("family_group_id", group.id);

          return {
            id: group.id,
            name: group.name,
            member_count: count || 0,
          };
        }),
      );

      setMyGroups(groupsWithCount);
    } catch (error: any) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchFamilyMembers = async () => {
    if (!user || !selectedGroup) return;

    try {
      // Get all members of the selected group (including current user)
      const { data: members, error: membersError } = await supabase
        .from("family_members")
        .select("user_id, is_head")
        .eq("family_group_id", selectedGroup.id);

      if (membersError) throw membersError;

      if (!members || members.length === 0) {
        setFamilyMembers([]);
        return;
      }

      const userIds = members.map((m) => m.user_id);

      // Get profiles with mood from family_members
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Get latest mood for each user
      const profilesWithMood = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: memberData } = await supabase
            .from("family_members")
            .select("mood")
            .eq("user_id", profile.id)
            .eq("family_group_id", selectedGroup.id)
            .maybeSingle();

          return {
            ...profile,
            user_id: profile.id,
            mood: memberData?.mood || null,
          };
        }),
      );

      // Map members with profile data including mood
      const membersWithData = members.map((member) => {
        const profile = profilesWithMood?.find((p) => p.user_id === member.user_id);

        return {
          user_id: member.user_id,
          display_name: profile?.display_name || "Unknown",
          avatar_url: profile?.avatar_url || null,
          is_head: member.is_head,
          latest_mood: profile?.mood || null,
        };
      });

      setFamilyMembers(membersWithData);
    } catch (error: any) {
      console.error("Error fetching family members:", error);
    }
  };

  const fetchMemberSchedules = async () => {
    if (!selectedMember) return;

    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-${daysInMonth}`;

      const scheduleQuery = supabase
        .from("schedules")
        .select("*")
        .eq("user_id", selectedMember)
        .not("family_id", "is", null)
        .gte("schedule_date", startDate)
        .lte("schedule_date", endDate);

      const result: any = await scheduleQuery;
      const { data, error } = result;

      if (error) throw error;

      const schedulesByDate: { [key: string]: any[] } = {};
      data?.forEach((schedule) => {
        const day = parseInt(schedule.schedule_date.split("-")[2], 10);
        if (!schedulesByDate[day]) {
          schedulesByDate[day] = [];
        }
        schedulesByDate[day].push(schedule);
      });

      setMonthSchedules(schedulesByDate);
    } catch (error) {
      console.error("그룹 일정을 가져오는데 실패했습니다:", error);
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "오후" : "오전";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${ampm} ${displayHour}:${minutes}`;
  };

  const formatStartTimestamp = (ts: string | null) => {
    if (!ts) return "";
    const d = new Date(ts);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "오후" : "오전";
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${ampm} ${displayHour}:${m}`;
  };

  const getDisplayTime = (s: any) =>
    s?.schedule_time ? formatTime(s.schedule_time) : formatStartTimestamp(s?.start_time);
  const getMoodEmoji = (mood: string | null) => {
    if (!mood) return null;
    const moodData = moods.find((m) => m.id === mood);
    return moodData?.emoji || null;
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    setSelectedDate(null);
  };

  const selectedMemberData = familyMembers.find((m) => m.user_id === selectedMember);

  if (showManagement) {
    return <FamilyManagement onBack={() => setShowManagement(false)} />;
  }

  // View 3: Member's Calendar
  if (selectedMember && selectedGroup) {
    return (
      <div className="flex flex-col min-h-screen pb-24 bg-gradient-to-br from-background via-background to-secondary/30 px-4">
        {/* Header with back button */}
        <section className="pt-8 pb-4 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedMember(null);
                setMonthSchedules({});
                setSelectedDate(null);
              }}
            >
              <ArrowLeft size={24} />
            </Button>
            <h2 className="text-senior-xl font-bold text-secondary-foreground">
              {selectedMemberData?.display_name}님의 캘린더
            </h2>
          </div>
        </section>

        {/* Month Navigator */}
        <div className="pb-4 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <Button size="icon" variant="outline" onClick={prevMonth}>
              <ChevronLeft size={32} />
            </Button>

            <h2 className="text-senior-xl font-bold">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </h2>

            <Button size="icon" variant="outline" onClick={nextMonth}>
              <ChevronRight size={32} />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="pb-6 max-w-2xl mx-auto w-full">
          <Card className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
                <div
                  key={day}
                  className={`text-center text-senior-base py-3 ${
                    index === 0 ? "text-destructive" : index === 6 ? "text-primary" : ""
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {emptyDays.map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {days.map((day) => {
                const hasSchedule = monthSchedules[day] && monthSchedules[day].length > 0;
                const isToday =
                  day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();
                const isSelected = selectedDate === day;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground font-bold"
                        : isToday
                          ? "bg-accent border-accent text-accent-foreground font-bold"
                          : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-senior-sm mb-1">{day}</span>

                    {hasSchedule && (
                      <div className={`w-2 h-2 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {selectedDate && monthSchedules[selectedDate] && monthSchedules[selectedDate].length > 0 ? (
            <div className="mt-4 space-y-3">
              <h3 className="text-senior-lg font-bold">
                {currentDate.getMonth() + 1}월 {selectedDate}일 일정
              </h3>
              {monthSchedules[selectedDate].map((schedule) => (
                <Card key={schedule.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-senior-base font-semibold flex-1">{schedule.title}</h4>
                    {(schedule.schedule_time || schedule.start_time) && (
                      <span className="text-senior-sm text-muted-foreground flex-shrink-0 ml-2">
                        {getDisplayTime(schedule)}
                      </span>
                    )}
                  </div>
                  {schedule.description && (
                    <p className="text-senior-sm text-muted-foreground">{schedule.description}</p>
                  )}
                </Card>
              ))}
            </div>
          ) : selectedDate ? (
            <div className="mt-4 bg-card/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-border/50">
              <p className="text-senior-base text-muted-foreground">
                {currentDate.getMonth() + 1}월 {selectedDate}일에 일정이 없습니다
              </p>
            </div>
          ) : (
            <div className="mt-4 bg-gradient-to-r from-primary/5 to-accent/5 backdrop-blur-sm rounded-2xl p-4 border border-primary/20">
              <p className="text-senior-sm text-center">💚 그룹과 공유된 일정만 표시됩니다</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // View 2: Group Members
  if (selectedGroup) {
    return (
      <div className="flex flex-col min-h-screen pb-24 bg-gradient-to-br from-background via-background to-secondary/30 px-4">
        <section className="pt-8 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedGroup(null);
                setFamilyMembers([]);
              }}
            >
              <ArrowLeft size={24} />
            </Button>
            <div>
              <h2 className="text-senior-2xl font-bold text-secondary-foreground">{selectedGroup.name}</h2>
              <p className="text-senior-sm text-muted-foreground">구성원 {selectedGroup.member_count}명</p>
            </div>
          </div>

          <div className="space-y-3">
            {familyMembers.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-senior-base text-muted-foreground">다른 구성원이 없습니다</p>
              </Card>
            ) : (
              familyMembers.map((member) => (
                <Card
                  key={member.user_id}
                  className="p-4 cursor-pointer hover:bg-accent/5 transition-colors"
                  onClick={() => setSelectedMember(member.user_id)}
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
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-senior-lg font-semibold">{member.display_name}</h3>
                        {member.user_id === user?.id && (
                          <span className="text-senior-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">나</span>
                        )}
                        {member.is_head && (
                          <span className="text-senior-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                            👑 가장
                          </span>
                        )}
                      </div>
                      <p className="text-senior-sm text-muted-foreground">캘린더 보기</p>
                    </div>
                    {getMoodEmoji(member.latest_mood) && (
                      <div className="text-5xl flex-shrink-0">{getMoodEmoji(member.latest_mood)}</div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>
    );
  }

  // View 1: Group List
  return (
    <div className="flex flex-col min-h-screen pb-24 bg-gradient-to-br from-background via-background to-secondary/30 px-4">
      <section className="pt-8 pb-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-senior-2xl font-bold text-secondary-foreground">내 그룹</h2>
          <Button variant="outline" size="sm" onClick={() => setShowManagement(true)} className="gap-2">
            <Settings size={18} />
            그룹 관리
          </Button>
        </div>

        {myGroups.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-senior-base text-muted-foreground mb-4">아직 그룹이 없어요</p>
            <Button onClick={() => setShowManagement(true)} className="gap-2">
              <Users size={20} />
              그룹 만들기
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {myGroups.map((group) => (
              <Card
                key={group.id}
                className="p-6 cursor-pointer hover:bg-accent/5 transition-colors"
                onClick={() => setSelectedGroup(group)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-senior-xl font-bold mb-1">{group.name}</h3>
                    <p className="text-senior-sm text-muted-foreground">구성원 {group.member_count}명</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
