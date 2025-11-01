import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { LogIn, UserPlus, Phone } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const { signIn, signUp } = useAuth();

  // Convert phone number to email format for Supabase
  const phoneToEmail = (phoneNumber: string) => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
    return `${cleanPhone}@phone.local`;
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

    try {
      const email = phoneToEmail(cleanPhone);
      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password, displayName);

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
    <div className="flex min-h-screen items-center justify-center px-6 py-12 bg-gradient-to-br from-primary/10 to-accent/10">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Phone className="text-primary" size={40} />
            </div>
          </div>
          <h1 className="text-senior-2xl mb-3">
            {isLogin ? "로그인" : "회원가입"}
          </h1>
          <p className="text-senior-base text-muted-foreground">
            {isLogin ? "전화번호로 로그인하세요" : "전화번호로 가입하세요"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
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
              ⚠️ 하이픈(-) 없이 숫자만 입력하세요
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

          <Button type="submit" size="xl" className="w-full">
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
