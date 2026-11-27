// TEMPORARY PHASE 2 MOCK DATA:
// Used only for Dashboard UI development and must be removed in Phase 5
// once real Firestore habit and log services are connected.
// All numbers below are fixed sample values (no streak or percentage calculations).

export const SAMPLE_HABITS = [
  {
    id: 'sample-wake-up-early',
    name: 'Wake up early',
    category: 'Routine',
    targetLabel: 'Before 6:00 AM',
    sampleTodayStatus: 'completed',
  },
  {
    id: 'sample-core-java',
    name: 'Core Java',
    category: 'Study',
    targetLabel: '60 minutes',
    sampleTodayStatus: 'completed',
  },
  {
    id: 'sample-dsa-practice',
    name: 'DSA practice',
    category: 'Study',
    targetLabel: '2 problems',
    sampleTodayStatus: 'pending',
  },
  {
    id: 'sample-exercise',
    name: 'Exercise',
    category: 'Fitness',
    targetLabel: '45 minutes',
    sampleTodayStatus: 'completed',
  },
  {
    id: 'sample-english-speaking',
    name: 'English speaking',
    category: 'Communication',
    targetLabel: '20 minutes',
    sampleTodayStatus: 'pending',
  },
  {
    id: 'sample-reading',
    name: 'Reading',
    category: 'Learning',
    targetLabel: '20 pages',
    sampleTodayStatus: 'pending',
  },
]

export const SAMPLE_SUMMARY = {
  sampleActiveCount: 6,
  sampleCompletedTodayCount: 3,
  sampleCompletionPercent: 50,
  sampleCurrentStreakDays: 5,
  sampleLongestStreakDays: 14,
}

export const SAMPLE_WEEKLY_VALUES = [
  { dayLabel: 'Mon', sampleCompleted: 5, sampleScheduled: 6 },
  { dayLabel: 'Tue', sampleCompleted: 6, sampleScheduled: 6 },
  { dayLabel: 'Wed', sampleCompleted: 4, sampleScheduled: 6 },
  { dayLabel: 'Thu', sampleCompleted: 6, sampleScheduled: 6 },
  { dayLabel: 'Fri', sampleCompleted: 5, sampleScheduled: 6 },
  { dayLabel: 'Sat', sampleCompleted: 4, sampleScheduled: 5 },
  { dayLabel: 'Sun', sampleCompleted: 3, sampleScheduled: 6 },
]
