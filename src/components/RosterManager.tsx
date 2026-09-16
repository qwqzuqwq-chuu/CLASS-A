import React, { useState, useRef, useMemo } from 'react';
import { Student } from '../types';
import { 
  parseStudentRoster, 
  formatRosterToCSV, 
  SIMULATED_ROSTERS, 
  SimulatedRosterScenario 
} from '../utils/parser';
import { 
  Upload, 
  ClipboardPaste, 
  FileText, 
  Trash2, 
  UserPlus, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Search,
  AlertCircle,
  AlertTriangle,
  Layers,
  CheckCheck
} from 'lucide-react';

interface RosterManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  onNavigateToPicker: () => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  students,
  onUpdateStudents,
  onNavigateToPicker,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newSeatNumber, setNewSeatNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Duplicate calculation
  const { duplicateNameCounts, duplicateNamesSet, totalDuplicatesCount } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of students) {
      const trimmed = s.name.trim();
      if (trimmed) {
        counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
      }
    }
    const dupesSet = new Set<string>();
    let extraCount = 0;
    counts.forEach((count, name) => {
      if (count > 1) {
        dupesSet.add(name);
        extraCount += (count - 1);
      }
    });
    return {
      duplicateNameCounts: counts,
      duplicateNamesSet: dupesSet,
      totalDuplicatesCount: extraCount,
    };
  }, [students]);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const parsed = parseStudentRoster(content);
        if (parsed.length > 0) {
          onUpdateStudents(parsed);
          setImportNotice(`成功匯入 ${parsed.length} 筆學生資料！`);
          setTimeout(() => setImportNotice(null), 4000);
        } else {
          setImportNotice('檔案解析未發現任何學生名字，請確認內容格式。');
          setTimeout(() => setImportNotice(null), 4000);
        }
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleImportText = () => {
    if (!pasteText.trim()) return;
    const parsed = parseStudentRoster(pasteText);
    if (parsed.length > 0) {
      onUpdateStudents(parsed);
      setPasteText('');
      setImportNotice(`成功匯入 ${parsed.length} 筆學生資料！`);
      setTimeout(() => setImportNotice(null), 4000);
    } else {
      setImportNotice('請確認貼上的文字包含學生姓名。');
      setTimeout(() => setImportNotice(null), 4000);
    }
  };

  const handleApplySimulatedRoster = (scenario: SimulatedRosterScenario) => {
    const newStudents: Student[] = scenario.students.map((item, idx) => ({
      id: `stu_sim_${scenario.id}_${idx + 1}`,
      name: item.name,
      seatNumber: item.seatNumber,
    }));
    onUpdateStudents(newStudents);
    setShowSimulatedModal(false);
    setImportNotice(`已套用「${scenario.title}」（共 ${newStudents.length} 位學生）！`);
    setTimeout(() => setImportNotice(null), 4000);
  };

  const handleRemoveDuplicates = () => {
    const seen = new Set<string>();
    const deduplicated: Student[] = [];
    let removed = 0;

    for (const stu of students) {
      const trimmed = stu.name.trim();
      if (!seen.has(trimmed)) {
        seen.add(trimmed);
        deduplicated.push(stu);
      } else {
        removed++;
      }
    }

    onUpdateStudents(deduplicated);
    setImportNotice(`已成功移除 ${removed} 筆重複的學生姓名，保留每位學生第一筆！`);
    setTimeout(() => setImportNotice(null), 4000);
  };

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStudentName.trim();
    if (!trimmed) return;

    const newStudent: Student = {
      id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      seatNumber: newSeatNumber.trim() || undefined,
    };

    onUpdateStudents([...students, newStudent]);
    setNewStudentName('');
    setNewSeatNumber('');
  };

  const handleDeleteSingle = (id: string) => {
    onUpdateStudents(students.filter((s) => s.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm('確定要清空目前所有的學生名單嗎？')) {
      onUpdateStudents([]);
    }
  };

  const handleCopyRoster = () => {
    const text = formatRosterToCSV(students);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    const text = formatRosterToCSV(students);
    const blob = new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `班級學生名單_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(query) || (s.seatNumber && s.seatNumber.includes(query));
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Notice if any */}
      {importNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-xs transition-all">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">{importNotice}</p>
        </div>
      )}

      {/* Feature 1: Simulated Rosters Quick Strip */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 border border-indigo-100/90 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                教學模擬名單庫
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                  快速體驗推薦
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                點選下方任一模擬情境名單，立即免手動輸入快速體驗課堂抽籤與自動分組功能
              </p>
            </div>
          </div>
        </div>

        {/* Preset Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SIMULATED_ROSTERS.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => handleApplySimulatedRoster(scenario)}
              className="text-left p-3 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-400 hover:shadow-xs hover:bg-indigo-50/20 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {scenario.title}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                    {scenario.tag}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                  {scenario.description}
                </p>
              </div>
              <span className="mt-2 text-[11px] font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                套用此名單 &rarr;
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Roster Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Import Box */}
        <div className="lg:col-span-6 space-y-6">
          {/* File Upload Zone */}
          <div
            id="file-drop-zone"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all bg-white ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".csv,.txt,.tsv"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-800 mb-1">
              上傳 CSV 或 TXT 學生名單
            </h2>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              支援包含「座號、姓名」或單純「姓名」之 CSV / TXT 檔案，可直接拖曳至此處
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                id="btn-browse-file"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                瀏覽電腦檔案
              </button>
              <button
                id="btn-load-sample"
                type="button"
                onClick={() => handleApplySimulatedRoster(SIMULATED_ROSTERS[0])}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                重置為 30 人班級名單
              </button>
            </div>
          </div>

          {/* Paste Input Box */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="paste-input-area" className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ClipboardPaste className="w-4 h-4 text-indigo-600" />
                貼上學生名單
              </label>
              <span className="text-[11px] text-slate-400">
                可從 Excel / Google 試算表直接複製貼上
              </span>
            </div>
            <textarea
              id="paste-input-area"
              rows={4}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="範例格式：
1 陳冠宇
2 林欣妤
或：
陳冠宇, 林欣妤, 張庭瑋
或每行一個名字"
              className="w-full p-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-mono transition-all"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                支援換行、逗號、頓號、空格分隔
              </span>
              <button
                id="btn-import-paste"
                type="button"
                onClick={handleImportText}
                disabled={!pasteText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                解析並匯入
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Single Add & Current Roster Display */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          {/* Quick Single Add Bar */}
          <form
            onSubmit={handleAddSingle}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-2"
          >
            <input
              type="text"
              id="input-seat-number"
              placeholder="座號 (選填)"
              value={newSeatNumber}
              onChange={(e) => setNewSeatNumber(e.target.value)}
              className="w-24 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <input
              type="text"
              id="input-student-name"
              placeholder="輸入學生姓名..."
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              id="btn-add-single-student"
              type="submit"
              disabled={!newStudentName.trim()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              新增
            </button>
          </form>

          {/* Feature 2: Duplicate Names Alert & Deduplicate Action Bar */}
          {duplicateNamesSet.size > 0 && (
            <div
              id="duplicate-warning-banner"
              className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 text-amber-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    偵測到重複學生姓名！
                    <span className="bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded-md font-extrabold text-[11px]">
                      {duplicateNamesSet.size} 個名字重複・共 {totalDuplicatesCount} 筆重複資料
                    </span>
                  </h4>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    重複姓名已在下方以黃底標記：
                    {Array.from(duplicateNamesSet).map((name) => (
                      <span
                        key={name}
                        className="inline-block font-bold underline decoration-amber-400 mx-1"
                      >
                        {name} ({duplicateNameCounts.get(name)}次)
                      </span>
                    ))}
                  </p>
                </div>
              </div>

              {/* Feature 2: One-click remove duplicates button */}
              <button
                id="btn-remove-duplicates"
                type="button"
                onClick={handleRemoveDuplicates}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer self-stretch sm:self-auto justify-center"
              >
                <CheckCheck className="w-4 h-4" />
                一次性移除重複姓名
              </button>
            </div>
          )}

          {/* Roster Header and Tools */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex-1 flex flex-col overflow-hidden min-h-[380px]">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  目前名單
                  <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold">
                    {students.length} 人
                  </span>
                  {duplicateNamesSet.size > 0 && (
                    <span className="bg-amber-100 text-amber-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
                      含 {duplicateNamesSet.size} 個重複姓名
                    </span>
                  )}
                </h3>
              </div>

              {/* Roster actions */}
              <div className="flex items-center gap-1.5">
                {students.length > 0 && (
                  <>
                    <button
                      id="btn-copy-roster"
                      type="button"
                      onClick={handleCopyRoster}
                      title="複製全部名單"
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      id="btn-download-csv"
                      type="button"
                      onClick={handleDownloadCSV}
                      title="下載名單 CSV"
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      id="btn-clear-roster"
                      type="button"
                      onClick={handleClearAll}
                      title="清空全部名單"
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Filter / Search Bar */}
            {students.length > 0 && (
              <div className="px-4 py-2 border-b border-slate-100 bg-white">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋學生名字或座號..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Student List View */}
            <div className="flex-1 overflow-y-auto p-4 max-h-[380px]">
              {students.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-50 text-amber-500" />
                  <p className="text-sm font-semibold text-slate-600">目前尚無學生名單</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mb-3">
                    請上傳 CSV、在左側文字框貼上名單，或點擊上方「模擬名單」快速載入。
                  </p>
                  <button
                    type="button"
                    onClick={() => handleApplySimulatedRoster(SIMULATED_ROSTERS[0])}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    載入 30 人模擬名單
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredStudents.map((stu, index) => {
                    const isDuplicate = duplicateNamesSet.has(stu.name.trim());
                    return (
                      <div
                        key={stu.id}
                        className={`group flex items-center justify-between p-2 rounded-xl transition-all text-xs border ${
                          isDuplicate
                            ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300/60'
                            : 'bg-slate-50 border-slate-200/80 hover:border-indigo-200 hover:bg-indigo-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className={`w-6 h-6 rounded-md border flex items-center justify-center font-mono font-bold text-[11px] shrink-0 ${
                              isDuplicate
                                ? 'bg-amber-100 border-amber-200 text-amber-800'
                                : 'bg-white border-slate-200 text-slate-500'
                            }`}
                          >
                            {stu.seatNumber || index + 1}
                          </span>
                          <span
                            className={`font-semibold truncate ${
                              isDuplicate ? 'text-amber-950 font-bold' : 'text-slate-800'
                            }`}
                          >
                            {stu.name}
                          </span>
                          {/* Duplicate indicator badge */}
                          {isDuplicate && (
                            <span
                              title="此姓名在名單中出現多次"
                              className="px-1 py-0.2 rounded text-[10px] font-bold bg-amber-200 text-amber-800 shrink-0"
                            >
                              重複
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSingle(stu.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity"
                          title="移除學生"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <div className="col-span-full py-8 text-center text-xs text-slate-400">
                      找不到符合「{searchQuery}」的學生
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Quick Action Banner */}
            {students.length > 0 && (
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  名單已備妥，可立即進行抽籤或分組
                </span>
                <button
                  type="button"
                  onClick={onNavigateToPicker}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  前往抽籤
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
