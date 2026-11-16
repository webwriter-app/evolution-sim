import { computed, signal } from "@lit-labs/signals";

export interface DndState<TItem> {
  item: TItem;
  originId: string;
}

export function createDndStore<TItem>() {
  const draggedItem = signal<DndState<TItem> | null>(null);
  const isDragging = computed(() => draggedItem.get() !== null);

  return {
    draggedItem,
    isDragging,
    startDrag(item: TItem, originId: string) {
      draggedItem.set({ item, originId });
    },
    endDrag() {
      draggedItem.set(null);
    },
    getDraggedItem() {
      return draggedItem.get();
    },
  };
}
