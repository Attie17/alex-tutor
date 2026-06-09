import { redirect } from 'next/navigation'
import { createClient, getCompletedSessions, getMessages, getUserPurchases } from '@/lib/supabase-server'
import { COURSES } from '@/lib/courses'
import TutorApp from './TutorApp'

export const dynamic = 'force-dynamic'

const VALID_COURSES = new Set(['beginner', 'work', 'advanced'])

export default async function LearnPage({ searchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login?redirect=/learn')
  }

  const params = await searchParams
  const requested = params?.course
  const recommended = user.user_metadata?.recommended_course
  const courseId = VALID_COURSES.has(requested)
    ? requested
    : (VALID_COURSES.has(recommended) ? recommended : 'beginner')

  // Completed sessions for all three courses — needed by the sidebar.
  const [beginnerDone, workDone, advancedDone, purchases] = await Promise.all([
    getCompletedSessions(user.id, 'beginner'),
    getCompletedSessions(user.id, 'work'),
    getCompletedSessions(user.id, 'advanced'),
    getUserPurchases(user.id),
  ])
  const initialCompletedByAll = { beginner: beginnerDone, work: workDone, advanced: advancedDone }

  // Current session = first uncompleted in the active course (1-based).
  const completedInActive = new Set(initialCompletedByAll[courseId])
  const totalSessions = COURSES[courseId].sessions.length
  let currentSession = 1
  for (let i = 1; i <= totalSessions; i++) {
    if (!completedInActive.has(i)) { currentSession = i; break }
  }

  const hasAnyProgress = Object.values(initialCompletedByAll).some(arr => arr.length > 0)
  const isOnboarding = !hasAnyProgress && !recommended && !requested

  const initialMessages = isOnboarding
    ? await getMessages(user.id, courseId, 0)
    : await getMessages(user.id, courseId, currentSession)

  return (
    <TutorApp
      userId={user.id}
      initialFirstName={user.user_metadata?.first_name || null}
      initialCourseId={courseId}
      initialSessionId={isOnboarding ? 0 : currentSession}
      initialMode={isOnboarding ? 'onboarding' : 'teaching'}
      initialMessages={initialMessages}
      initialCompletedByAll={initialCompletedByAll}
      purchasedCourses={purchases}
    />
  )
}
