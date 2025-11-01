import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { LogIn, UserPlus, Phone } from "lucide-react";
import dailyCareLogo from "@/assets/daily-care-logo.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationDistrict, setLocationDistrict] = useState("");
  const [locationDong, setLocationDong] = useState("");
  const { signIn, signUp } = useAuth();

  // 시/도 목록
  const cities = [
    "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
    "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원도",
    "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도"
  ];

  // 시/도별 시/군/구 목록
  const districts: Record<string, string[]> = {
    "서울특별시": ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
    "부산광역시": ["강서구", "금정구", "기장군", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구"],
    "대구광역시": ["남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구"],
    "인천광역시": ["강화군", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "옹진군", "중구"],
    "광주광역시": ["광산구", "남구", "동구", "북구", "서구"],
    "대전광역시": ["대덕구", "동구", "서구", "유성구", "중구"],
    "울산광역시": ["남구", "동구", "북구", "울주군", "중구"],
    "세종특별자치시": ["세종시"],
    "경기도": ["가평군", "고양시", "과천시", "광명시", "광주시", "구리시", "군포시", "김포시", "남양주시", "동두천시", "부천시", "성남시", "수원시", "시흥시", "안san시", "안성시", "안양시", "양주시", "양평군", "여주시", "연천군", "오산시", "용인시", "의왕시", "의정부시", "이천시", "파주시", "평택시", "포천시", "하남시", "화성시"],
    "강원도": ["강릉시", "고성군", "동해시", "삼척시", "속초시", "양구군", "양양군", "영월군", "원주시", "인제군", "정선군", "철원군", "춘천시", "태백시", "평창군", "홍천군", "화천군", "횡성군"],
    "충청북도": ["괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군", "제천시", "증평군", "진천군", "청주시", "충주시"],
    "충청남도": ["계룡시", "공주시", "금산군", "논산시", "당진시", "보령시", "부여군", "서산시", "서천군", "아산시", "예산군", "천안시", "청양군", "태안군", "홍성군"],
    "전라북도": ["고창군", "군산시", "김제시", "남원시", "무주군", "부안군", "순창군", "완주군", "익산시", "임실군", "장수군", "전주시", "정읍시", "진안군"],
    "전라남도": ["강진군", "고흥군", "곡성군", "광양시", "구례군", "나주시", "담양군", "목포시", "무안군", "보성군", "순천시", "신안군", "여수시", "영광군", "영암군", "완도군", "장성군", "장흥군", "진도군", "함평군", "해남군", "화순군"],
    "경상북도": ["경산시", "경주시", "고령군", "구미시", "군위군", "김천시", "문경시", "봉화군", "상주시", "성주군", "안동시", "영덕군", "영양군", "영주시", "영천시", "예천군", "울릉군", "울진군", "의성군", "청도군", "청송군", "칠곡군", "포항시"],
    "경상남도": ["거제시", "거창군", "고성군", "김해시", "남해군", "밀양시", "사천시", "산청군", "양산시", "의령군", "진주시", "창녕군", "창원시", "통영시", "하동군", "함안군", "함양군", "합천군"],
    "제주특별자치도": ["서귀포시", "제주시"]
  };

  // Format phone number for display
  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("올바른 전화번호를 입력해주세요 (10-11자리)");
      return;
    }

    if (!password || password.length < 6) {
      toast.error("비밀번호는 최소 6자 이상이어야 해요");
      return;
    }

    if (!isLogin && !displayName) {
      toast.error("이름을 입력해주세요");
      return;
    }

    if (!isLogin && !gender) {
      toast.error("성별을 선택해주세요");
      return;
    }

    if (!isLogin && (!locationCity || !locationDistrict)) {
      toast.error("시/도와 시/군/구를 선택해주세요");
      return;
    }

    try {
      const formattedPhone = `+82${cleanPhone.slice(1)}`; // 010-1234-5678 -> +821012345678
      const { error } = isLogin
        ? await signIn(formattedPhone, password)
        : await signUp(formattedPhone, password, displayName, gender, locationCity, locationDistrict, locationDong, cleanPhone);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("전화번호 또는 비밀번호가 올바르지 않습니다");
        } else if (error.message.includes("already registered")) {
          toast.error("이미 가입된 전화번호입니다");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success(isLogin ? "로그인 성공!" : "회원가입 성공!");
      }
    } catch (error: any) {
      toast.error("오류가 발생했습니다");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12 bg-gradient-to-br from-primary/20 via-background to-accent/30">
      <Card className="w-full max-w-md p-8 shadow-2xl border-2 backdrop-blur-sm bg-card/95">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={dailyCareLogo} alt="Daily Care Logo" className="w-64 h-auto animate-fade-in" />
          </div>
          <h1 className="text-senior-2xl mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {isLogin ? "로그인" : "회원가입"}
          </h1>
          <p className="text-senior-base text-muted-foreground">
            {isLogin ? "전화번호로 로그인하세요" : "전화번호로 가입하세요"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <>
              <div className="space-y-3">
                <Label htmlFor="displayName" className="text-senior-lg">
                  이름
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="홍길동"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-16 text-senior-base px-6 border-2"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="gender" className="text-senior-lg">
                  성별
                </Label>
                <Select
                  value={gender}
                  onValueChange={setGender}
                >
                  <SelectTrigger className="h-16 text-senior-base px-6 border-2 bg-background">
                    <SelectValue placeholder="성별을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="남" className="text-senior-base py-3">
                      남
                    </SelectItem>
                    <SelectItem value="여" className="text-senior-base py-3">
                      여
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="locationCity" className="text-senior-lg">
                  시/도
                </Label>
                <Select
                  value={locationCity}
                  onValueChange={(value) => {
                    setLocationCity(value);
                    setLocationDistrict(""); // 시/도 변경 시 시/군/구 초기화
                  }}
                >
                  <SelectTrigger className="h-16 text-senior-base px-6 border-2 bg-background">
                    <SelectValue placeholder="시/도를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {cities.map((city) => (
                      <SelectItem key={city} value={city} className="text-senior-base py-3">
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="locationDistrict" className="text-senior-lg">
                  시/군/구
                </Label>
                <Select
                  value={locationDistrict}
                  onValueChange={setLocationDistrict}
                  disabled={!locationCity}
                >
                  <SelectTrigger className="h-16 text-senior-base px-6 border-2 bg-background">
                    <SelectValue placeholder={locationCity ? "시/군/구를 선택하세요" : "먼저 시/도를 선택하세요"} />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50 max-h-[300px]">
                    {locationCity && districts[locationCity]?.map((district) => (
                      <SelectItem key={district} value={district} className="text-senior-base py-3">
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="locationDong" className="text-senior-lg">
                  동/읍/면
                </Label>
                <Input
                  id="locationDong"
                  type="text"
                  placeholder="역삼동"
                  value={locationDong}
                  onChange={(e) => setLocationDong(e.target.value)}
                  className="h-16 text-senior-base px-6 border-2"
                />
              </div>
            </>
          )}

          <div className="space-y-3">
            <Label htmlFor="phone" className="text-senior-lg">
              전화번호
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="010-1234-5678"
              value={phone}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value);
                setPhone(formatted);
              }}
              maxLength={13}
              className="h-16 text-senior-base px-6 border-2"
            />
            <p className="text-senior-sm text-muted-foreground">
              숫자만 입력하세요
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="password" className="text-senior-lg">
              비밀번호
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-16 text-senior-base px-6 border-2"
            />
          </div>

          <Button type="submit" size="xl" className="w-full text-white font-normal">
            {isLogin ? (
              <>
                <LogIn />
                로그인
              </>
            ) : (
              <>
                <UserPlus />
                회원가입
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setIsLogin(!isLogin)}
            className="text-senior-base"
          >
            {isLogin ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
