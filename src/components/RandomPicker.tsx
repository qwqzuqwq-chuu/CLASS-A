import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Student, DrawRecord } from '../types';
import { soundFx } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  RotateCcw, 
  History, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  HelpCircle,
  Trophy,
  AlertCircle
} from 'lucide-react';

interface RandomPickerProps {
  students: Student[];
  onNavigateToRoster: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  students,
  onNavigateToRoster,
  soundEnabled,
  onToggleSound,
}) => {
  // Settings
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);
  const [animationDuration, setAnimationDuration] = useState<'normal' | 'fast' | 'suspense'>('normal');

  // Drawn history & pool
  const [drawHistory, setDrawHistory] = useState<DrawRecord[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [displayStudent, setDisplayStudent] = useState<Student | null>(null);
  const [winnerStudent, setWinnerStudent] = useState<Student | null>(null);

  // Remaining pool for non-duplicate mode
  const drawnIds = new Set(drawHistory.map((d) => d.student.id));
  const availablePool = allowDuplicates
    ? students
    : students.filter((s) => !drawnIds.has(s.id));

  const animTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize display student
  useEffect(() => {
    if (!displayStudent && students.length > 0) {
      setDisplayStudent(students[0]);
    }
  }, [students, displayStudent]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  // Trigger celebration confetti
  const fireConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch {
      // fallback if canvas not available
    }
  }, []);

  // Start the random draw process
  const startDraw = useCallback(() => {
    if (isDrawing) return;
    if (availablePool.length === 0) return;

    setIsDrawing(true);
    setWinnerStudent(null);

    // Pick final winner in advance
    const pool = availablePool;
    const finalWinner = pool[Math.floor(Math.random() * pool.length)];

    // Configure animation steps
    let steps: number[];
    if (animationDuration === 'fast') {
      // Fast: ~1.2s
      steps = [40, 40, 40, 50, 60, 80, 110, 150, 200, 280];
    } else if (animationDuration === 'suspense') {
      // Suspense: ~3.5s
      steps = [
        35, 35, 35, 40, 40, 45, 50, 60, 70, 85, 100, 120, 150, 190, 240, 300, 380, 480
      ];
    } else {
      // Normal: ~2.2s
      steps = [40, 40, 45, 50, 60, 70, 85, 110, 150, 200, 280, 380];
    }

    let stepIndex = 0;

    const runStep = () => {
      if (stepIndex < steps.length - 1) {
        // Still rolling: pick a random student from all students to display
        const randomCandidate = students[Math.floor(Math.random() * students.length)];
        setDisplayStudent(randomCandidate);

        // Sound tick
        const progress = stepIndex / steps.length;
        soundFx.playTick(1.0 + progress * 0.4);

        if (stepIndex === Math.floor(steps.length * 0.6)) {
          soundFx.playSuspenseRiser();
        }

        const nextDelay = steps[stepIndex];
        stepIndex++;
        animTimerRef.current = setTimeout(runStep, nextDelay);
      } else {
        // Final landing on actual winner!
        setDisplayStudent(finalWinner);
        setWinnerStudent(finalWinner);
        setIsDrawing(false);

        // Record history
        const newRecord: DrawRecord = {
          id: `draw_${Date.now()}`,
          student: finalWinner,
          timestamp: Date.now(),
        };
        setDrawHistory((prev) => [newRecord, ...prev]);

        // Celebration sound & confetti
        soundFx.playFanfare();
        fireConfetti();
      }
    };

    runStep();
  }, [availablePool, isDrawing, students, animationDuration, fireConfetti]);

  // Spacebar shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isDrawing && availablePool.length > 0) {
        // Prevent default spacebar page scroll
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          startDraw();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startDraw, isDrawing, availablePool.length]);

  const handleResetPool = () => {
    setDrawHistory([]);
    setWinnerStudent(null);
  };

  const handleRemoveHistoryItem = (recordId: string) => {
    setDrawHistory((prev) => prev.filter((d) => d.id !== recordId));
  };

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">尚未載入學生名單</h2>
        <p className="text-sm text-slate-500 mb-6">
          請先上傳 CSV 檔案或貼上學生名單，即可開始進行課堂抽籤！
        </p>
        <button
          type="button"
          onClick={onNavigateToRoster}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all"
        >
          前往名單管理 / 載入範例名單
        </button>
      </div>
    );
  }

  const isPoolExhausted = !allowDuplicates && availablePool.length === 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Settings and Status Ribbon */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Duplicate mode toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            抽取模式
          </span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              id="btn-mode-no-duplicate"
              type="button"
              onClick={() => setAllowDuplicates(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !allowDuplicates
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              不重複抽取（推薦）
            </button>
            <button
              id="btn-mode-allow-duplicate"
              type="button"
              onClick={() => setAllowDuplicates(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                allowDuplicates
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              可重複抽取
            </button>
          </div>
        </div>

        {/* Speed / Suspense Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">動畫節奏：</span>
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setAnimationDuration('fast')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                animationDuration === 'fast'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              極速
            </button>
            <button
              type="button"
              onClick={() => setAnimationDuration('normal')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                animationDuration === 'normal'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              標準
            </button>
            <button
              type="button"
              onClick={() => setAnimationDuration('suspense')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                animationDuration === 'suspense'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              緊張刺激
            </button>
          </div>
        </div>

        {/* Pool Stat Counters */}
        <div className="flex items-center gap-2 text-xs">
          {!allowDuplicates ? (
            <>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-semibold">
                待抽候選：<strong className="font-bold">{availablePool.length}</strong> 人
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-medium">
                已抽出：{drawnIds.size} 人
              </span>
            </>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
              全班隨機：共 {students.length} 人參與
            </span>
          )}
        </div>
      </div>

      {/* Main Classroom Stage Display Card */}
      <div className="relative bg-gradient-to-b from-white to-slate-50 rounded-3xl border border-slate-200/90 shadow-lg p-6 sm:p-12 text-center overflow-hidden">
        {/* Background decorative glows */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Stage Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-600 text-xs font-semibold mb-6">
          {isDrawing ? (
            <span className="flex items-center gap-1.5 text-indigo-600">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              正在隨機抽取中...
            </span>
          ) : winnerStudent ? (
            <span className="flex items-center gap-1.5 text-emerald-600">
              <Trophy className="w-3.5 h-3.5" />
              恭喜抽出幸運學生！
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              準備就緒・點擊下方按鈕或按空白鍵抽籤
            </span>
          )}
        </div>

        {/* Big Name Presentation Display */}
        <div className="py-6 sm:py-10">
          {isPoolExhausted ? (
            <div className="max-w-md mx-auto p-6 bg-amber-50 border border-amber-200 rounded-2xl">
              <CheckCircle2 className="w-12 h-12 text-amber-600 mx-auto mb-2" />
              <h3 className="text-xl font-bold text-amber-900 mb-1">全班學生皆已抽過！</h3>
              <p className="text-xs text-amber-700 mb-4">
                在「不重複抽取」模式下，所有 {students.length} 位學生都已經被抽出了。
              </p>
              <button
                type="button"
                onClick={handleResetPool}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 mx-auto"
              >
                <RotateCcw className="w-4 h-4" />
                重置名單池重新抽取
              </button>
            </div>
          ) : (
            <div className="min-h-[140px] sm:min-h-[180px] flex flex-col items-center justify-center">
              {displayStudent && (
                <div
                  className={`transition-transform duration-100 ${
                    isDrawing
                      ? 'scale-95 opacity-90 blur-[0.3px]'
                      : winnerStudent
                      ? 'scale-105'
                      : 'scale-100'
                  }`}
                >
                  {/* Seat Number Tag */}
                  {displayStudent.seatNumber && (
                    <div className="mb-2">
                      <span className="inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-indigo-50 border border-indigo-200/80 text-indigo-700">
                        座號 {displayStudent.seatNumber}
                      </span>
                    </div>
                  )}

                  {/* High Contrast Classroom Display Name */}
                  <h2
                    className={`font-black tracking-tight select-none transition-colors ${
                      winnerStudent
                        ? 'text-5xl sm:text-7xl md:text-8xl text-indigo-600 drop-shadow-sm'
                        : isDrawing
                        ? 'text-4xl sm:text-6xl md:text-7xl text-slate-800'
                        : 'text-4xl sm:text-6xl md:text-7xl text-slate-700'
                    }`}
                  >
                    {displayStudent.name}
                  </h2>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary Draw Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            id="btn-start-draw"
            type="button"
            disabled={isDrawing || isPoolExhausted}
            onClick={startDraw}
            className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg sm:text-xl shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
              isDrawing || isPoolExhausted
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white hover:scale-[1.02] active:scale-[0.98] shadow-indigo-200'
            }`}
          >
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span>{isDrawing ? '抽籤中...' : winnerStudent ? '再抽一位' : '開始抽籤'}</span>
          </button>

          {/* Sound Quick Toggle Button */}
          <button
            id="btn-picker-sound"
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? '音效已開啟' : '音效已靜音'}
            className={`p-4 rounded-2xl border transition-colors flex items-center justify-center ${
              soundEnabled
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>

          {!allowDuplicates && drawHistory.length > 0 && (
            <button
              id="btn-reset-pool"
              type="button"
              onClick={handleResetPool}
              title="重置名單池"
              className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="hidden sm:inline">重置名單池</span>
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-4">
          提示：也可以直接按下鍵盤 <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-md font-mono text-[11px] font-bold">Space 空白鍵</kbd> 進行抽籤
        </p>
      </div>

      {/* Draw History Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              抽籤紀錄
            </h3>
            <span className="text-xs text-slate-400">
              (共抽出 {drawHistory.length} 次)
            </span>
          </div>

          {drawHistory.length > 0 && (
            <button
              type="button"
              onClick={() => setDrawHistory([])}
              className="text-xs text-slate-400 hover:text-red-600 transition-colors"
            >
              清除紀錄
            </button>
          )}
        </div>

        {drawHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            目前尚未有抽籤紀錄，點擊上方按鈕開始抽出幸運學生！
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {drawHistory.map((record, index) => (
              <div
                key={record.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 group hover:border-indigo-200 transition-all"
              >
                <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                  #{drawHistory.length - index}
                </span>
                {record.student.seatNumber && (
                  <span className="text-slate-400 font-mono">
                    [{record.student.seatNumber}]
                  </span>
                )}
                <span className="font-bold text-slate-800">
                  {record.student.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveHistoryItem(record.id)}
                  title="將此學生放回名單池"
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity ml-1"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
