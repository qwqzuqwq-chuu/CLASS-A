import { Student } from '../types';

export interface SimulatedRosterScenario {
  id: string;
  title: string;
  tag: string;
  description: string;
  students: { name: string; seatNumber?: string }[];
}

export const SAMPLE_STUDENTS: string[] = [
  '陳冠宇', '林欣妤', '張庭瑋', '黃品睿', '李承翰',
  '王品翔', '劉恩碩', '吳采臻', '蔡承恩', '楊舒涵',
  '許哲銘', '鄭宇彤', '謝侑廷', '宋嘉芸', '葉宗佑',
  '蘇映璇', '潘奕廷', '江佳蓉', '曾博彥', '邱巧晴',
  '賴柏睿', '高雅涵', '鍾承諺', '石詠晴', '方浩宇',
  '盧芷瑩', '莊凱翔', '游沛凝', '顏辰宇', '周詩涵'
];

export const SIMULATED_ROSTERS: SimulatedRosterScenario[] = [
  {
    id: 'standard_30',
    title: '國高中常態班級名單',
    tag: '30 人完整班級',
    description: '標準 30 人班級名單，含 01～30 號座號，適合模擬日常課堂抽籤與 5～6 人分組。',
    students: SAMPLE_STUDENTS.map((name, idx) => ({
      name,
      seatNumber: String(idx + 1).padStart(2, '0'),
    })),
  },
  {
    id: 'lab_16',
    title: '分組實驗 / 專案研討小班',
    tag: '16 人小班',
    description: '16 人小班教學，非常適合 4 人一組的科學實驗或專案討論模擬。',
    students: [
      { name: '陳冠宇', seatNumber: '01' },
      { name: '林欣妤', seatNumber: '02' },
      { name: '張庭瑋', seatNumber: '03' },
      { name: '黃品睿', seatNumber: '04' },
      { name: '李承翰', seatNumber: '05' },
      { name: '王品翔', seatNumber: '06' },
      { name: '劉恩碩', seatNumber: '07' },
      { name: '吳采臻', seatNumber: '08' },
      { name: '蔡承恩', seatNumber: '09' },
      { name: '楊舒涵', seatNumber: '10' },
      { name: '許哲銘', seatNumber: '11' },
      { name: '鄭宇彤', seatNumber: '12' },
      { name: '謝侑廷', seatNumber: '13' },
      { name: '宋嘉芸', seatNumber: '14' },
      { name: '葉宗佑', seatNumber: '15' },
      { name: '蘇映璇', seatNumber: '16' },
    ],
  },
  {
    id: 'with_duplicates',
    title: '含重複姓名測試名單',
    tag: '含重複姓名 (20人)',
    description: '刻意包含重複名字（如 2位林欣妤、2位陳冠宇、2位張庭瑋），可立即體驗重複標記與一鍵去重功能。',
    students: [
      { name: '陳冠宇', seatNumber: '01' },
      { name: '林欣妤', seatNumber: '02' },
      { name: '張庭瑋', seatNumber: '03' },
      { name: '黃品睿', seatNumber: '04' },
      { name: '林欣妤', seatNumber: '05' }, // 重複
      { name: '李承翰', seatNumber: '06' },
      { name: '王品翔', seatNumber: '07' },
      { name: '陳冠宇', seatNumber: '08' }, // 重複
      { name: '劉恩碩', seatNumber: '09' },
      { name: '吳采臻', seatNumber: '10' },
      { name: '張庭瑋', seatNumber: '11' }, // 重複
      { name: '蔡承恩', seatNumber: '12' },
      { name: '楊舒涵', seatNumber: '13' },
      { name: '許哲銘', seatNumber: '14' },
      { name: '鄭宇彤', seatNumber: '15' },
      { name: '謝侑廷', seatNumber: '16' },
      { name: '宋嘉芸', seatNumber: '17' },
      { name: '葉宗佑', seatNumber: '18' },
      { name: '蘇映璇', seatNumber: '19' },
      { name: '潘奕廷', seatNumber: '20' },
    ],
  },
  {
    id: 'elective_45',
    title: '跨班選修 / 大班課名單',
    tag: '45 人大班級',
    description: '人數較多之跨班級選修課，測試快速隨機抽籤輪播與大組別自動分配。',
    students: [
      ...SAMPLE_STUDENTS,
      '洪子軒', '徐若瑄', '陸明軒', '彭若晴', '梁宇威',
      '郭子儀', '崔語心', '董恩齊', '簡佑嘉', '柯欣亞',
      '秦浩明', '白庭萱', '常勝宇', '康詩韻', '莫承澤'
    ].map((name, idx) => ({
      name,
      seatNumber: String(idx + 1).padStart(2, '0'),
    })),
  },
];

/**
 * Parse raw text (from clipboard or file content) into an array of Students
 * NOTE: Does NOT silently drop duplicates, so that duplicate names can be flagged and managed!
 */
export function parseStudentRoster(text: string): Student[] {
  if (!text || !text.trim()) return [];

  // Normalize line endings
  const lines = text.split(/\r\n|\n|\r/);
  const students: Student[] = [];

  const headerKeywords = ['姓名', 'name', '座號', 'seat', '學號', 'id', 'student', '學生', '編號'];

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    // Check if line looks like a header row
    const lower = line.toLowerCase();
    const isLikelyHeader = headerKeywords.some(kw => lower === kw || lower.startsWith(kw + ',') || lower.startsWith(kw + '\t'));
    if (isLikelyHeader && students.length === 0) {
      continue;
    }

    // Split by comma, tab, or multiple spaces if it looks like columns
    let parts: string[] = [];
    if (line.includes(',')) {
      parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
    } else if (line.includes('\t')) {
      parts = line.split('\t').map(p => p.trim().replace(/^["']|["']$/g, ''));
    } else if (line.includes('、')) {
      // Traditional Chinese punctuation list, e.g. 王小明、李大華
      const subNames = line.split('、').map(p => p.trim());
      for (const name of subNames) {
        if (name) {
          students.push({
            id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name,
          });
        }
      }
      continue;
    } else {
      // Try splitting by space if it's like "01 王小明" or single name
      const spaceParts = line.split(/\s+/);
      if (spaceParts.length >= 2 && /^\d+$/.test(spaceParts[0])) {
        const seatNumber = spaceParts[0];
        const name = spaceParts.slice(1).join(' ').trim();
        if (name) {
          students.push({
            id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name,
            seatNumber,
          });
        }
        continue;
      } else {
        parts = [line];
      }
    }

    // Handle columns
    if (parts.length === 1) {
      const name = parts[0];
      if (name) {
        students.push({
          id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name,
        });
      }
    } else if (parts.length >= 2) {
      let seatNumber: string | undefined = undefined;
      let name = '';

      if (/^\d+$/.test(parts[0])) {
        seatNumber = parts[0];
        name = parts[1];
      } else if (/^\d+$/.test(parts[1])) {
        seatNumber = parts[1];
        name = parts[0];
      } else {
        name = parts[0] || parts[1];
      }

      if (name) {
        students.push({
          id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name,
          seatNumber,
        });
      }
    }
  }

  return students;
}

/**
 * Format student roster back into text for copying or exporting
 */
export function formatRosterToCSV(students: Student[]): string {
  const lines = ['座號,姓名'];
  students.forEach((s, idx) => {
    const seat = s.seatNumber || String(idx + 1);
    lines.push(`${seat},${s.name}`);
  });
  return lines.join('\n');
}
