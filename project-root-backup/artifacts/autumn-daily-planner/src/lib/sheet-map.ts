// Which sheet a saved field lives on, so search results can open the right page.
const DAY_RULES: [RegExp, string][] = [
  [/^(rem-|weather|special|intention|listen|p-|appt-|brain|focus-proj)/, 'begin'],
  [/^(h-|side-)/, 'hours'],
  [/^(t-|proj-notes|waiting)/, 'tasks'],
  [/^(meal-|water-|grocery)/, 'nourish'],
  [/^(mv-|sleep-|rest|mood|move-note)/, 'move'],
  [/^(win|learn|grat-|joy|tom-|gentle)/, 'evening'],
];
const WEEK_RULES: [RegExp, string][] = [
  [/^(focus|top-|daynote-|notes)/, 'glance'],
  [/^t-/, 'tasks'],
  [/^(habit-|book-|passages|curi-)/, 'habits'],
  [/^(meal-|groceries)/, 'meals'],
  [/^rev-/, 'review'],
];
const DAY_LABELS: Record<string, string> = { begin: 'Begin gently', hours: 'The day by hour', tasks: 'Tasks & projects', nourish: 'Nourish', move: 'Move & rest', evening: 'Evening reflection' };
const WEEK_LABELS: Record<string, string> = { glance: 'Week at a glance', tasks: 'Tasks this week', habits: 'Habits & reading', meals: 'Meals & groceries', review: 'Weekly review' };

/** Fields that are settings or choices rather than words the person wrote. */
export function isWordsField(name: string): boolean {
  return !/(-pri|-moved|-mslot|-proj|-due|-doneon|^mood$|^rest$|^habits-set$|^focus-proj-)/.test(name);
}

export function locate(key: string): { href: string; where: string } | null {
  const [kind, id, ...rest] = key.split(':');
  const name = rest.join(':');
  if (kind === 'd') {
    const hit = DAY_RULES.find(([re]) => re.test(name));
    if (!hit) return null;
    return { href: `/day/${id}/${hit[1]}`, where: DAY_LABELS[hit[1]] };
  }
  if (kind === 'w') {
    const hit = WEEK_RULES.find(([re]) => re.test(name));
    if (!hit) return null;
    return { href: `/week/${id}/${hit[1]}`, where: WEEK_LABELS[hit[1]] };
  }
  if (kind === 'm') return { href: `/month/${id}`, where: 'Month page' };
  if (kind === 'proj') return { href: `/projects/${id}`, where: 'Projects' };
  if (kind === 'pj') return { href: `/projects/${id}`, where: 'Project task' };
  return null;
}
