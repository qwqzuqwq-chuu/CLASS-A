import React, { useState, useMemo } from 'react';
import { Student, StudentGroup } from '../types';
import { soundFx } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Users, 
  Shuffle, 
  Copy, 
  Check, 
  Printer, 
  AlertCircle, 
  ArrowRightLeft,
  Sparkles,
  Layers,
  Download
} from 'lucide-react';

interface GroupGeneratorProps {
  students: Student[];
  onNavigateToRoster: () => void;
}

const COLOR_THEMES = [
  { bg: 'bg-indigo-50/70', border: 'border-indigo-200', text: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-700', chip: 'bg-white border-indigo-100 text-indigo-950', dot: 'bg-indigo-500' },
  { bg: 'bg-emerald-50/70', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700', chip: 'bg-white border-emerald-100 text-emerald-950', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-50/70', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700', chip: 'bg-white border-amber-100 text-amber-950', dot: 'bg-amber-500' },
  { bg: 'bg-sky-50/70', border: 'border-sky-200', text: 'text-sky-800', badge: 'bg-sky-100 text-sky-700', chip: 'bg-white border-sky-100 text-sky-950', dot: 'bg-sky-500' },
  { bg: 'bg-rose-50/70', border: 'border-rose-200', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-700', chip: 'bg-white border-rose-100 text-rose-950', dot: 'bg-rose-500' },
  { bg: 'bg-purple-50/70', border: 'border-purple-200', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-700', chip: 'bg-white border-purple-100 text-purple-950', dot: 'bg-purple-500' },
  { bg: 'bg-teal-50/70', border: 'border-teal-200', text: 'text-teal-800', badge: 'bg-teal-100 text-teal-700', chip: 'bg-white border-teal-100 text-teal-950', dot: 'bg-teal-500' },
  { bg: 'bg-orange-50/70', border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-700', chip: 'bg-white border-orange-100 text-orange-950', dot: 'bg-orange-500' },
  { bg: 'bg-cyan-50/70', border: 'border-cyan-200', text: 'text-cyan-800', badge: 'bg-cyan-100 text-cyan-700', chip: 'bg-white border-cyan-100 text-cyan-950', dot: 'bg-cyan-500' },
  { bg: 'bg-pink-50/70', border: 'border-pink-200', text: 'text-pink-800', badge: 'bg-pink-100 text-pink-700', chip: 'bg-white border-pink-100 text-pink-950', dot: 'bg-pink-500' },
  { bg: 'bg-lime-50/70', border: 'border-lime-200', text: 'text-lime-800', badge: 'bg-lime-100 text-lime-700', chip: 'bg-white border-lime-100 text-lime-950', dot: 'bg-lime-500' },
  { bg: 'bg-blue-50/70', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700', chip: 'bg-white border-blue-100 text-blue-950', dot: 'bg-blue-500' },
];

export const GroupGenerator: React.FC<GroupGeneratorProps> = ({
  students,
  onNavigateToRoster,
}) => {
  // Settings
  const [groupMode, setGroupMode] = useState<'bySize' | 'byCount'>('bySize');
  const [groupSize, setGroupSize] = useState<number>(4);
  const [groupCount, setGroupCount] = useState<number>(6);
  const [remainderDistribution, setRemainderDistribution] = useState<'evenly' | 'asExtraGroup'>('evenly');

  // Generated groups
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);

  // Calculate preview statistics
  const previewStats = useMemo(() => {
    const total = students.length;
    if (total === 0) return null;

    if (groupMode === 'bySize') {
      const size = Math.max(1, groupSize);
      if (remainderDistribution === 'evenly') {
        const numGroups = Math.max(1, Math.round(total / size));
        const minPerGroup = Math.floor(total / numGroups);
        const remainder = total % numGroups;
        return {
          numGroups,
          desc: remainder === 0
            ? `共 ${numGroups} 組，每組剛好 ${minPerGroup} 人`
            : `共 ${numGroups} 組，其中 ${remainder} 組 ${minPerGroup + 1} 人，其餘 ${minPerGroup} 人`,
        };
      } else {
        const baseGroups = Math.floor(total / size);
        const rem = total % size;
        const totalGroups = rem > 0 ? baseGroups + 1 : baseGroups;
        return {
          numGroups: totalGroups,
          desc: rem === 0
            ? `共 ${totalGroups} 組，每組 ${size} 人`
            : `共 ${totalGroups} 組，前 ${baseGroups} 組各 ${size} 人，第 ${totalGroups} 組 ${rem} 人`,
        };
      }
    } else {
      const count = Math.max(1, Math.min(total, groupCount));
      const minPerGroup = Math.floor(total / count);
      const remainder = total % count;
      return {
        numGroups: count,
        desc: remainder === 0
          ? `共 ${count} 組，每組 ${minPerGroup} 人`
          : `共 ${count} 組，其中 ${remainder} 組 ${minPerGroup + 1} 人，其餘 ${minPerGroup} 人`,
      };
    }
  }, [students.length, groupMode, groupSize, groupCount, remainderDistribution]);

  // Fisher-Yates shuffle
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // Run grouping
  const handleGenerateGroups = () => {
    if (students.length === 0) return;

    setIsShuffling(true);
    soundFx.playShuffle();

    setTimeout(() => {
      const shuffled: Student[] = shuffleArray<Student>(students);
      const total = shuffled.length;
      let calculatedGroups: StudentGroup[] = [];

      if (groupMode === 'bySize') {
        const size = Math.max(1, groupSize);
        if (remainderDistribution === 'evenly') {
          const numGroups = Math.max(1, Math.round(total / size));
          const buckets: Student[][] = Array.from({ length: numGroups }, (): Student[] => []);
          shuffled.forEach((student, i) => {
            buckets[i % numGroups].push(student);
          });
          calculatedGroups = buckets.map((members, idx) => ({
            id: `grp_${idx + 1}`,
            name: `第 ${idx + 1} 組`,
            color: COLOR_THEMES[idx % COLOR_THEMES.length].bg,
            accentColor: COLOR_THEMES[idx % COLOR_THEMES.length].border,
            members,
          }));
        } else {
          let idx = 0;
          let groupIdx = 0;
          while (idx < total) {
            const chunk: Student[] = shuffled.slice(idx, idx + size);
            calculatedGroups.push({
              id: `grp_${groupIdx + 1}`,
              name: `第 ${groupIdx + 1} 組`,
              color: COLOR_THEMES[groupIdx % COLOR_THEMES.length].bg,
              accentColor: COLOR_THEMES[groupIdx % COLOR_THEMES.length].border,
              members: chunk,
            });
            idx += size;
            groupIdx++;
          }
        }
      } else {
        const count = Math.max(1, Math.min(total, groupCount));
        const buckets: Student[][] = Array.from({ length: count }, (): Student[] => []);
        shuffled.forEach((student, i) => {
          buckets[i % count].push(student);
        });
        calculatedGroups = buckets.map((members, idx) => ({
          id: `grp_${idx + 1}`,
          name: `第 ${idx + 1} 組`,
          color: COLOR_THEMES[idx % COLOR_THEMES.length].bg,
          accentColor: COLOR_THEMES[idx % COLOR_THEMES.length].border,
          members,
        }));
      }

      setGroups(calculatedGroups);
      setIsShuffling(false);

      // Celebration confetti
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }
    }, 350);
  };

  // Format group results for sharing
  const handleCopyResults = () => {
    if (groups.length === 0) return;

    let text = `📋【課堂分組結果】共 ${groups.length} 組（全班 ${students.length} 人）\n`;
    text += `------------------------------------\n`;
    groups.forEach((grp) => {
      const names = grp.members
        .map((m) => (m.seatNumber ? `[${m.seatNumber}]${m.name}` : m.name))
        .join('、');
      text += `${grp.name} (${grp.members.length}人)：${names}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download grouped students as CSV with UTF-8 BOM
  const handleDownloadCSV = () => {
    if (groups.length === 0) return;
    const lines = ['組別,組內序號,座號,學生姓名'];
    groups.forEach((grp) => {
      grp.members.forEach((m, idx) => {
        const seat = m.seatNumber || '';
        const safeGroupName = grp.name.replace(/"/g, '""');
        const safeStudentName = m.name.replace(/"/g, '""');
        lines.push(`"${safeGroupName}","${idx + 1}","${seat}","${safeStudentName}"`);
      });
    });

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `課堂分組名單_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">尚未載入學生名單</h2>
        <p className="text-sm text-slate-500 mb-6">
          進行自動分組前，請先在「名單管理」中匯入或貼上學生名單。
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Controls & Configuration Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              課堂智慧自動分組
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              全班共 {students.length} 位學生，隨機洗牌並自動生成組別
            </p>
          </div>

          {/* Quick preset action buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-generate-groups"
              type="button"
              disabled={isShuffling}
              onClick={handleGenerateGroups}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>{groups.length > 0 ? '重新隨機分組' : '立即自動分組'}</span>
            </button>
          </div>
        </div>

        {/* Group Configuration Options */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Group Mode Selector */}
          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              分組方式
            </label>
            <div className="inline-flex w-full rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                id="btn-mode-by-size"
                type="button"
                onClick={() => setGroupMode('bySize')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  groupMode === 'bySize'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                依「每組人數」分組
              </button>
              <button
                id="btn-mode-by-count"
                type="button"
                onClick={() => setGroupMode('byCount')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  groupMode === 'byCount'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                依「總組數」分組
              </button>
            </div>
          </div>

          {/* Size / Count Stepper */}
          <div className="sm:col-span-4">
            {groupMode === 'bySize' ? (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  設定每組人數 (人)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="input-group-size"
                    type="number"
                    min={2}
                    max={students.length}
                    value={groupSize}
                    onChange={(e) => setGroupSize(Math.max(2, parseInt(e.target.value) || 2))}
                    className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 text-center focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <div className="flex gap-1">
                    {[3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setGroupSize(num)}
                        className={`px-2.5 py-1.5 text-xs rounded-lg border font-semibold transition-all ${
                          groupSize === num
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {num} 人
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  設定分成幾組 (組)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="input-group-count"
                    type="number"
                    min={2}
                    max={students.length}
                    value={groupCount}
                    onChange={(e) => setGroupCount(Math.max(2, parseInt(e.target.value) || 2))}
                    className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 text-center focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <div className="flex gap-1">
                    {[4, 5, 6, 8].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setGroupCount(num)}
                        className={`px-2.5 py-1.5 text-xs rounded-lg border font-semibold transition-all ${
                          groupCount === num
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {num} 組
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Remainder Distribution Option */}
          {groupMode === 'bySize' && (
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                多餘人數處理
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRemainderDistribution('evenly')}
                  className={`px-3 py-2 rounded-xl border font-semibold transition-all ${
                    remainderDistribution === 'evenly'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  平均分配至各組
                </button>
                <button
                  type="button"
                  onClick={() => setRemainderDistribution('asExtraGroup')}
                  className={`px-3 py-2 rounded-xl border font-semibold transition-all ${
                    remainderDistribution === 'asExtraGroup'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  獨立成為一組
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Bar */}
        {previewStats && (
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                預計分組規劃：<strong>{previewStats.desc}</strong>
              </span>
            </div>
            <span className="text-indigo-600 font-semibold">
              （點擊右上角「立即自動分組」執行）
            </span>
          </div>
        )}
      </div>

      {/* Visualized Results Container */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-700 mb-1">尚未執行分組</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            設定每組人數或總組數後，點擊「立即自動分組」按鈕，系統將以公平隨機演算法完成視覺化分組。
          </p>
          <button
            type="button"
            onClick={handleGenerateGroups}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-2"
          >
            <Shuffle className="w-4 h-4" />
            立即隨機分組
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Action Ribbon for Export & Copy */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs print:hidden">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">
                分組結果總覽
              </span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                共 {groups.length} 組
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-download-groups-csv"
                type="button"
                onClick={handleDownloadCSV}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 border border-indigo-200 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                下載分組 CSV
              </button>
              <button
                id="btn-copy-groups"
                type="button"
                onClick={handleCopyResults}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '已複製名單！' : '複製文字名單'}
              </button>
              <button
                id="btn-print-groups"
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                列印 / 存為 PDF
              </button>
            </div>
          </div>

          {/* Group Visual Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group, groupIdx) => {
              const theme = COLOR_THEMES[groupIdx % COLOR_THEMES.length];
              return (
                <div
                  key={group.id}
                  className={`rounded-2xl border ${theme.border} ${theme.bg} p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/5">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${theme.dot}`} />
                        <h3 className={`font-bold text-base ${theme.text}`}>
                          {group.name}
                        </h3>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${theme.badge}`}>
                        {group.members.length} 人
                      </span>
                    </div>

                    {/* Member chips */}
                    <div className="grid grid-cols-2 gap-2">
                      {group.members.map((member, mIdx) => (
                        <div
                          key={member.id}
                          className={`flex items-center gap-2 p-2 rounded-xl ${theme.chip} border shadow-2xs text-xs`}
                        >
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-500 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                            {member.seatNumber || mIdx + 1}
                          </span>
                          <span className="font-bold text-slate-800 truncate">
                            {member.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card footer info */}
                  <div className="mt-4 pt-2 border-t border-black/5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>組別編號 #{groupIdx + 1}</span>
                    <span>成員名額：{group.members.length} 位</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
