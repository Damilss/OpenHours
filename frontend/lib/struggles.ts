/**
 * Struggle tracking system.
 *
 * Each time a student asks for help, the system logs the topic they're
 * struggling with. Struggles are stored in localStorage keyed by class ID
 * so the teacher dashboard can read them.
 */

export interface Struggle {
  id: string;
  classId: string;
  studentName: string;
  topic: string;
  question: string;
  hintLevel: number; // 1 = concept reminder, 2 = leading question, 3 = partial breakdown
  timestamp: number;
}

export interface ClassStruggleSummary {
  classId: string;
  className: string;
  totalQuestions: number;
  topTopics: { topic: string; count: number }[];
  students: {
    name: string;
    struggles: Struggle[];
    avgHintLevel: number;
  }[];
}

const STORAGE_KEY = "open-hours-struggles";

// Simple keyword-based topic detection from the student's question
const TOPIC_PATTERNS: { pattern: RegExp; topic: string }[] = [
  { pattern: /recursion|recursive|base case/i, topic: "Recursion" },
  { pattern: /sort|sorting|bubble|merge|quick/i, topic: "Sorting Algorithms" },
  { pattern: /search|binary search|linear search/i, topic: "Search Algorithms" },
  { pattern: /loop|for loop|while|iteration/i, topic: "Loops & Iteration" },
  { pattern: /array|list|index/i, topic: "Arrays & Lists" },
  { pattern: /pointer|memory|allocation|malloc/i, topic: "Pointers & Memory" },
  { pattern: /tree|binary tree|bst|traversal/i, topic: "Trees" },
  { pattern: /graph|bfs|dfs|dijkstra/i, topic: "Graphs" },
  { pattern: /stack|queue|deque/i, topic: "Stacks & Queues" },
  { pattern: /big\s*o|complexity|runtime|time complexity/i, topic: "Time Complexity" },
  { pattern: /derivative|differentiat|chain rule|product rule/i, topic: "Derivatives" },
  { pattern: /integral|integrat|antiderivative/i, topic: "Integrals" },
  { pattern: /limit|continuity|epsilon/i, topic: "Limits & Continuity" },
  { pattern: /matrix|matrices|determinant|eigenvalue/i, topic: "Linear Algebra" },
  { pattern: /force|newton|friction|gravity|acceleration/i, topic: "Forces & Newton's Laws" },
  { pattern: /energy|kinetic|potential|conservation/i, topic: "Energy & Conservation" },
  { pattern: /wave|frequency|amplitude|oscillat/i, topic: "Waves & Oscillations" },
  { pattern: /circuit|resistor|voltage|current|ohm/i, topic: "Circuits" },
  { pattern: /momentum|collision|impulse/i, topic: "Momentum" },
  { pattern: /free body|diagram/i, topic: "Free Body Diagrams" },
];

export function detectTopic(question: string): string {
  for (const { pattern, topic } of TOPIC_PATTERNS) {
    if (pattern.test(question)) {
      return topic;
    }
  }
  return "General";
}

export function getAllStruggles(): Struggle[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addStruggle(struggle: Struggle): void {
  const all = getAllStruggles();
  all.push(struggle);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getStrugglesForClass(classId: string): Struggle[] {
  return getAllStruggles().filter((s) => s.classId === classId);
}

export function getClassSummary(
  classId: string,
  className: string
): ClassStruggleSummary {
  const struggles = getStrugglesForClass(classId);

  // Count topics
  const topicCounts = new Map<string, number>();
  for (const s of struggles) {
    topicCounts.set(s.topic, (topicCounts.get(s.topic) ?? 0) + 1);
  }
  const topTopics = Array.from(topicCounts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Group by student
  const studentMap = new Map<string, Struggle[]>();
  for (const s of struggles) {
    const list = studentMap.get(s.studentName) ?? [];
    list.push(s);
    studentMap.set(s.studentName, list);
  }
  const students = Array.from(studentMap.entries()).map(([name, stuStruggles]) => ({
    name,
    struggles: stuStruggles.sort((a, b) => b.timestamp - a.timestamp),
    avgHintLevel:
      stuStruggles.reduce((sum, s) => sum + s.hintLevel, 0) /
      stuStruggles.length,
  }));

  return {
    classId,
    className,
    totalQuestions: struggles.length,
    topTopics,
    students,
  };
}

export function getAllClassSummaries(): ClassStruggleSummary[] {
  const struggles = getAllStruggles();
  const classIds = new Set(struggles.map((s) => s.classId));

  const CLASS_NAMES: Record<string, string> = {
    "1": "CSC 101 — Fundamentals of CS",
    "2": "MATH 141 — Calculus I",
    "3": "PHYS 141 — General Physics I",
  };

  return Array.from(classIds).map((id) =>
    getClassSummary(id, CLASS_NAMES[id] ?? `Class ${id}`)
  );
}
