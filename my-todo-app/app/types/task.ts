export type Task = {
  id: number;
  title: string;
  is_completed: boolean;
  is_today: boolean;
  created_at: string;
  display_order: number;
};

export const TASK_SELECT =
  "id, title, is_completed, is_today, created_at, display_order" as const;

export const CONTAINER_ALL = "container-all";
export const CONTAINER_TODAY = "container-today";

/** Assign sequential display_order values (0 = top) within a column. */
export function withDisplayOrder(tasks: Task[]): Task[] {
  return tasks.map((task, index) => ({
    ...task,
    display_order: index,
  }));
}

export function splitByColumn(tasks: Task[]) {
  const backlog = tasks
    .filter((t) => !t.is_today)
    .sort((a, b) => a.display_order - b.display_order);
  const today = tasks
    .filter((t) => t.is_today)
    .sort((a, b) => a.display_order - b.display_order);
  return { backlog, today };
}

export function mergeColumns(backlog: Task[], today: Task[]): Task[] {
  return [
    ...withDisplayOrder(backlog.map((t) => ({ ...t, is_today: false }))),
    ...withDisplayOrder(today.map((t) => ({ ...t, is_today: true }))),
  ];
}
