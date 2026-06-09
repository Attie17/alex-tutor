export const COURSE_PRICES_ZAR = {
  beginner: 399,
  work: 599,
  advanced: 999,
  bundle: 1499,
}

export const COURSE_ITEM_NAMES = {
  beginner: 'Learning to Work with Claude',
  work: 'Claude at Work',
  advanced: 'Mastering Claude',
  bundle: 'Claude Mastery Bundle (3 courses)',
}

export const BUNDLE_COURSES = ['beginner', 'work', 'advanced']

export function isValidCourseId(id) {
  return typeof id === 'string' && id in COURSE_PRICES_ZAR
}
