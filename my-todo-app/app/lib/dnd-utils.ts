import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  CONTAINER_ALL,
  CONTAINER_TODAY,
  mergeColumns,
  splitByColumn,
  withDisplayOrder,
  type Task,
} from "../types/task";

function findContainer(
  id: string | number,
  backlog: Task[],
  today: Task[],
): string | null {
  if (id === CONTAINER_ALL) return CONTAINER_ALL;
  if (id === CONTAINER_TODAY) return CONTAINER_TODAY;
  if (backlog.some((t) => t.id === id)) return CONTAINER_ALL;
  if (today.some((t) => t.id === id)) return CONTAINER_TODAY;
  return null;
}

/** Returns the next tasks array after a drag, or null if no change. */
export function applyDragEnd(tasks: Task[], event: DragEndEvent): Task[] | null {
  const { active, over } = event;
  if (!over) return null;

  const activeId = active.id;
  if (typeof activeId !== "number" || activeId < 0) return null;

  let { backlog, today } = splitByColumn(tasks);

  const activeContainer = findContainer(activeId, backlog, today);
  const overContainer = findContainer(over.id, backlog, today);
  if (!activeContainer || !overContainer) return null;

  if (activeContainer === overContainer) {
    const items = activeContainer === CONTAINER_ALL ? backlog : today;
    const oldIndex = items.findIndex((t) => t.id === activeId);
    const newIndex =
      over.id === activeContainer
        ? items.length - 1
        : items.findIndex((t) => t.id === over.id);

    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return null;

    const reordered = withDisplayOrder(arrayMove(items, oldIndex, newIndex));
    return mergeColumns(
      activeContainer === CONTAINER_ALL ? reordered : backlog,
      activeContainer === CONTAINER_TODAY ? reordered : today,
    );
  }

  const activeItems = activeContainer === CONTAINER_ALL ? backlog : today;
  const overItems = overContainer === CONTAINER_ALL ? backlog : today;
  const activeIndex = activeItems.findIndex((t) => t.id === activeId);
  if (activeIndex < 0) return null;

  const movedTask: Task = {
    ...activeItems[activeIndex],
    is_today: overContainer === CONTAINER_TODAY,
  };

  const newActiveItems = activeItems.filter((t) => t.id !== activeId);
  const newOverItems = [...overItems];

  const insertIndex =
    over.id === overContainer
      ? newOverItems.length
      : newOverItems.findIndex((t) => t.id === over.id);

  newOverItems.splice(
    insertIndex >= 0 ? insertIndex : newOverItems.length,
    0,
    movedTask,
  );

  if (activeContainer === CONTAINER_ALL) {
    return mergeColumns(
      withDisplayOrder(newActiveItems),
      withDisplayOrder(newOverItems),
    );
  }

  return mergeColumns(
    withDisplayOrder(newOverItems),
    withDisplayOrder(newActiveItems),
  );
}
