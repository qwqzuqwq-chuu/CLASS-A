/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Student, ActiveTab } from './types';
import { SAMPLE_STUDENTS } from './utils/parser';
import { soundFx } from './utils/audio';
import { Navbar } from './components/Navbar';
import { RandomPicker } from './components/RandomPicker';
import { GroupGenerator } from './components/GroupGenerator';
import { RosterManager } from './components/RosterManager';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('picker');
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('classroom_students');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    // Default initial sample roster so the teacher sees an active, usable tool immediately
    return SAMPLE_STUDENTS.map((name, idx) => ({
      id: `stu_init_${idx + 1}`,
      name,
      seatNumber: String(idx + 1).padStart(2, '0'),
    }));
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => soundFx.isEnabled());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sync students to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('classroom_students', JSON.stringify(students));
    } catch {
      // ignore
    }
  }, [students]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // In iframes, fullscreen might be blocked, fallback gracefully
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.setEnabled(next);
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentCount={students.length}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'picker' && (
          <RandomPicker
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
          />
        )}

        {activeTab === 'groups' && (
          <GroupGenerator
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'roster' && (
          <RosterManager
            students={students}
            onUpdateStudents={setStudents}
            onNavigateToPicker={() => setActiveTab('picker')}
          />
        )}
      </main>

      {/* Classroom Footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 py-4 text-center text-xs text-slate-400 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>課堂學生抽籤與分組小幫手・適用於投影螢幕與智慧電子白板</span>
          <span>支援 CSV 匯入、快速複製與全螢幕投影</span>
        </div>
      </footer>
    </div>
  );
}
