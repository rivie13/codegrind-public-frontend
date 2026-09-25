import { useCallback, useMemo, useState } from 'react';

const EXPERIENCE_OPTIONS = [
  { value: 'never', label: "Never coded", reassurance: "Perfect — we'll start from zero. One print, two clicks, first win." },
  { value: 'small', label: 'Built small projects', reassurance: "Solid — you'll move fast. We'll keep hand-holding light." },
  { value: 'large', label: 'Built large projects', reassurance: "Pro move — we'll stay Python-focused and keep hints minimal." },
];

const GOAL_OPTIONS = [
  { value: 'career', label: 'To start a new career in tech', reassurance: "Career switchers thrive here — follow lesson by lesson to get job-ready." },
  { value: 'upskill', label: 'To upskill for my current job', reassurance: "Upskill path is linear — bite-size lessons that stack to confidence." },
  { value: 'school', label: 'I need it for school', reassurance: "School must-haves made simple — just follow the path, week by week." },
  { value: 'build', label: 'To build my own projects', reassurance: "Builders love this — code powers towers, projects grow from there." },
  { value: 'fun', label: 'Just for fun', reassurance: "Fun first, mastery follows — quick wins keep the streak going." },
];

const TIME_OPTIONS = [
  { value: '0-3', label: '0–3 hours', reassurance: "Short sessions count — one activity per sitting still levels you up." },
  { value: '3-7', label: '3–7 hours', reassurance: "Sweet spot — enough to stack wins without burnout." },
  { value: '8-14', label: '8–14 hours', reassurance: "With that time you'll fly — linear paths turn hours into mastery." },
  { value: '15+', label: '15+ hours', reassurance: "Power learner — we'll keep the next win queued for you." },
];

const OBSTACLE_OPTIONS = [
  { value: 'motivation', label: 'Lack of motivation to keep going', reassurance: "Motivation follows wins — XP fills, SFX pops, next lesson unlocks." },
  { value: 'start', label: 'Not knowing where to start', reassurance: "Many learners feel this — you can't know what you don't know! All paths are linear — just follow lesson by lesson and course by course." },
  { value: 'projects', label: 'I get the basics, but struggle to build my own projects', reassurance: "Bridge the gap — every activity is a real prompt turned into a tower." },
  { value: 'time-money', label: 'No time or money to go back to school', reassurance: "No campus needed — learn real Python in minutes per session." },
];

const QUESTION_SETS = {
  preActivity: [
    { id: 'experience', title: "What's your experience with code?", options: EXPERIENCE_OPTIONS },
    { id: 'goal', title: 'Why do you want to learn to code?', options: GOAL_OPTIONS },
  ],
  betweenActivities: [
    { id: 'time', title: 'How much time per week will you dedicate to learning?', options: TIME_OPTIONS },
    { id: 'obstacle', title: 'What is your biggest obstacle to learning to code?', options: OBSTACLE_OPTIONS },
  ],
};

export function getReassurance(questionId, value) {
  const all = [...EXPERIENCE_OPTIONS, ...GOAL_OPTIONS, ...TIME_OPTIONS, ...OBSTACLE_OPTIONS];
  const opt = all.find((o) => o.value === value);
  return opt?.reassurance || 'Great — next win is queued.';
}

export default function useQualifierFunnel() {
  const [phase, setPhase] = useState('pre'); // pre | first_activity | between | done
  const [preIndex, setPreIndex] = useState(0);
  const [betweenIndex, setBetweenIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [pendingReassurance, setPendingReassurance] = useState(null);

  const currentPre = QUESTION_SETS.preActivity[preIndex] || null;
  const currentBetween = QUESTION_SETS.betweenActivities[betweenIndex] || null;

  const activeQuestion = useMemo(() => {
    if (pendingReassurance) return null;
    if (phase === 'pre') return currentPre;
    if (phase === 'between') return currentBetween;
    return null;
  }, [pendingReassurance, phase, currentPre, currentBetween]);

  const isFunnelActive = (phase === 'pre' || phase === 'between') && (!!activeQuestion || !!pendingReassurance);
  const experience = answers.experience || null;
  const isProLite = experience === 'large';

  const answer = useCallback((value) => {
    const q = phase === 'pre' ? currentPre : currentBetween;
    if (!q) return;
    const reassurance = getReassurance(q.id, value);
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    setPendingReassurance({ questionId: q.id, value, title: q.title, text: reassurance });
  }, [phase, currentPre, currentBetween]);

  const continueReassurance = useCallback(() => {
    const prevPhase = phase;
    const prevPreIndex = preIndex;
    const prevBetweenIndex = betweenIndex;
    setPendingReassurance(null);
    if (prevPhase === 'pre') {
      const nextPre = prevPreIndex + 1;
      if (nextPre < QUESTION_SETS.preActivity.length) {
        setPreIndex(nextPre);
      } else {
        setPhase('first_activity');
      }
    } else if (prevPhase === 'between') {
      const nextBetween = prevBetweenIndex + 1;
      if (nextBetween < QUESTION_SETS.betweenActivities.length) {
        setBetweenIndex(nextBetween);
      } else {
        setPhase('done');
      }
    }
  }, [phase, preIndex, betweenIndex]);

  const markActivityComplete = useCallback(() => {
    if (phase === 'first_activity' || phase === 'pre') {
      setPhase('between');
      setPendingReassurance(null);
    }
  }, [phase]);

  const progress = useMemo(() => {
    const total = QUESTION_SETS.preActivity.length + QUESTION_SETS.betweenActivities.length;
    const donePre = phase === 'pre' ? preIndex : QUESTION_SETS.preActivity.length;
    const doneBetween = phase === 'between' ? betweenIndex : phase === 'done' ? QUESTION_SETS.betweenActivities.length : phase === 'first_activity' ? 0 : 0;
    const done = donePre + doneBetween;
    return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
  }, [phase, preIndex, betweenIndex]);

  return {
    activeQuestion,
    pendingReassurance,
    answers,
    experience,
    isProLite,
    isFunnelActive,
    phase,
    progress,
    answer,
    continueReassurance,
    markActivityComplete,
  };
}

export { QUESTION_SETS };
