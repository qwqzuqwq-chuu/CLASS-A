import React from 'react';
import { ActiveTab } from '../types';
import { Sparkles, Users, UserCheck, Volume2, VolumeX, Maximize, Minimize, School } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  studentCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  studentCount,
  soundEnabled,
  onToggleSound,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              課堂抽籤與分組小幫手
              <span className="hidden md:inline-block text-[11px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                教師專用
              </span>
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              公平抽籤・刺激動畫音效・智慧隨機分組
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
          <button
            id="tab-picker"
            type="button"
            onClick={() => setActiveTab('picker')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'picker'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeTab === 'picker' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>隨機抽籤</span>
          </button>

          <button
            id="tab-groups"
            type="button"
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'groups'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'groups' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>自動分組</span>
          </button>

          <button
            id="tab-roster"
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'roster'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <UserCheck className={`w-4 h-4 ${activeTab === 'roster' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">名單管理</span>
            <span className="sm:hidden">名單</span>
            <span
              className={`text-xs px-1.5 py-0.2 rounded-full font-bold ${
                studentCount > 0
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {studentCount}
            </span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Toggle */}
          <button
            id="btn-toggle-sound"
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? '靜音' : '開啟音效'}
            title={soundEnabled ? '音效已開啟（點擊靜音）' : '音效已靜音（點擊開啟）'}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            id="btn-toggle-fullscreen"
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? '退出全螢幕' : '全螢幕投影模式'}
            title={isFullscreen ? '退出全螢幕 (Esc)' : '投影大螢幕模式'}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
