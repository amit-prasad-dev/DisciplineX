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
  {
    id: 'sample-mon',
    shortDay: 'Mon',
    fullDay: 'Monday',
    dateNumber: 23,
    sampleState: 'completed',
    isToday: false,
  },
  {
    id: 'sample-tue',
    shortDay: 'Tue',
    fullDay: 'Tuesday',
    dateNumber: 24,
    sampleState: 'completed',
    isToday: false,
  },
  {
    id: 'sample-wed',
    shortDay: 'Wed',
    fullDay: 'Wednesday',
    dateNumber: 25,
    sampleState: 'missed',
    isToday: false,
  },
  {
    id: 'sample-thu',
    shortDay: 'Thu',
    fullDay: 'Thursday',
    dateNumber: 26,
    sampleState: 'not_scheduled',
    isToday: false,
  },
  {
    id: 'sample-fri',
    shortDay: 'Fri',
    fullDay: 'Friday',
    dateNumber: 27,
    sampleState: 'pending',
    isToday: true,
  },
  {
    id: 'sample-sat',
    shortDay: 'Sat',
    fullDay: 'Saturday',
    dateNumber: 28,
    sampleState: 'upcoming',
    isToday: false,
  },
  {
    id: 'sample-sun',
    shortDay: 'Sun',
    fullDay: 'Sunday',
    dateNumber: 29,
    sampleState: 'upcoming',
    isToday: false,
  },
]

export const SAMPLE_ACTIVE_CHALLENGE = {
  id: 'sample-60-day-consistency',
  title: '60-Day Core Consistency',
  sampleElapsedDays: 18,
  durationDays: 60,
  startDateLabel: 'Nov 10, 2026',
  endDateLabel: 'Jan 8, 2027',
  successRuleText:
    'Complete all 6 scheduled daily habits for the day to count toward the challenge.',
  sampleStatusLabel: 'In progress',
}
