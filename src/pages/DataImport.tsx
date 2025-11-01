import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";

export default function DataImport() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    setImporting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('import-cultural-events', {
        body: {},
      });

      if (error) throw error;

      setResult(data);
      toast.success(`성공적으로 ${data.total}개의 이벤트를 가져왔습니다!`);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('데이터 가져오기 실패: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-6">문화행사 데이터 가져오기</h1>
          
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                서울시 문화행사 정보를 데이터베이스에 추가합니다.
              </p>
            </div>

            <Button
              onClick={handleImport}
              disabled={importing}
              size="lg"
              className="w-full"
            >
              {importing ? (
                <>
                  <Loader2 className="animate-spin" />
                  데이터 가져오는 중...
                </>
              ) : (
                <>
                  <Download />
                  데이터 가져오기
                </>
              )}
            </Button>

            {result && (
              <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200">
                <h3 className="font-semibold mb-2">가져오기 완료</h3>
                <div className="text-sm space-y-1">
                  <p>전체: {result.total}개</p>
                  <p>성공: {result.total - (result.errors || 0)}개</p>
                  {result.errors > 0 && <p className="text-red-600">실패: {result.errors}개</p>}
                </div>
              </Card>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
