export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

// Badge color tokens keyed by common status strings used across resources.
export const STATUS_TONES = {
  Active: 'success',
  active: 'success',
  Present: 'success',
  Paid: 'success',
  Success: 'success',
  Published: 'success',
  Pass: 'success',
  Completed: 'info',
  Evaluated: 'info',
  Reviewed: 'info',
  upcoming: 'info',
  Upcoming: 'info',
  Scheduled: 'info',
  ongoing: 'primary',
  Ongoing: 'primary',
  Submitted: 'primary',
  'Partially Paid': 'warning',
  Pending: 'warning',
  Draft: 'neutral',
  Late: 'warning',
  Leave: 'neutral',
  Absent: 'danger',
  Unpaid: 'danger',
  Failed: 'danger',
  Fail: 'danger',
  Overdue: 'danger',
  Dropped: 'danger',
  Cancelled: 'danger',
  Inactive: 'neutral',
  inactive: 'neutral',
  Closed: 'neutral',
};

export const GRADE_SCALE = [
  { min: 90, grade: 'A+' },
  { min: 80, grade: 'A' },
  { min: 70, grade: 'B+' },
  { min: 60, grade: 'B' },
  { min: 50, grade: 'C' },
  { min: 40, grade: 'D' },
  { min: 0, grade: 'F' },
];

export function computeGrade(percentage) {
  const found = GRADE_SCALE.find((tier) => percentage >= tier.min);
  return found ? found.grade : 'F';
}
