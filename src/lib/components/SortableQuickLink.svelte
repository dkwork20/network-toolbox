<script lang="ts">
  import { useSortable } from "@dnd-kit-svelte/svelte/sortable";
  import { ExternalLink, Trash2, GripVertical, Edit3 } from "@lucide/svelte";

  interface Props {
    id: string;
    index: number;
    link: { title: string; url: string; desc: string };
    isEditing: boolean;
    onDelete: (id: string) => void;
  }

  let { id, index, link, isEditing, onDelete }: Props = $props();

  const { ref, handleRef, isDragging } = useSortable({
    id,
    index: () => index,
  });
</script>

<div class="relative select-none h-full" {@attach ref}>
  <div
    class={[
      "card p-4 bg-surface-50 dark:bg-surface-900 border border-surface-500/10 hover:shadow-md transition-shadow group h-full flex flex-col",
      { "opacity-50": isDragging.current },
    ]}
  >
    {#if isEditing}
      <button
        class="absolute top-2 right-2 btn-icon btn-icon-sm variant-filled-error z-10"
        onclick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
      >
        <Trash2 class="size-4" />
      </button>
      <div
        class="absolute top-2 left-2 cursor-move text-surface-400 z-10"
        {@attach handleRef}
      >
        <GripVertical class="size-4" />
      </div>
    {/if}

    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      class="block flex-1 {isEditing ? 'pointer-events-none opacity-60' : ''}"
    >
      <div class="font-bold truncate pr-6">{link.title}</div>
      <div class="text-xs text-surface-500 mt-1 truncate">{link.desc}</div>
      <div
        class="text-xs text-primary-500 mt-2 truncate opacity-50 flex items-center gap-1"
      >
        <ExternalLink class="size-3" />
        {new URL(link.url).hostname}
      </div>
    </a>
  </div>
</div>
