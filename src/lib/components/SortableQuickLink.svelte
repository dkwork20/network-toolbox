<script lang="ts">
  import { useSortable } from "@dnd-kit-svelte/svelte/sortable";
  import { ExternalLink, Trash2, GripVertical, Edit3 } from "@lucide/svelte";

  interface Props {
    id: string;
    index: number;
    link: { title: string; url: string; desc: string };
    isEditing: boolean;
    onDelete: (id: string) => void;
    disabled?: boolean;
  }

  let {
    id,
    index,
    link,
    isEditing,
    onDelete,
    disabled = false,
  }: Props = $props();

  /* eslint-disable svelte/state-referenced-locally */
  const { ref, handleRef, isDragging } = useSortable({
    id: () => id,
    index: () => index,
    disabled: () => disabled,
  });

  function isSafeHttpUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  function getHostnameLabel(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return "invalid-url";
    }
  }
</script>

<div class="relative select-none h-full" {@attach ref}>
  <div
    class={[
      "card p-4 bg-surface-50 dark:bg-surface-800 border border-surface-400/30 hover:border-primary-500/50 hover:shadow-md transition-all group h-full flex flex-col",
      { "opacity-50": isDragging.current },
    ]}
  >
    {#if isEditing}
      <button
        class="absolute top-2 right-2 btn-icon btn-icon-sm preset-filled-error-500 z-10"
        onclick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
      >
        <Trash2 class="size-4" />
      </button>
      <div
        class="absolute top-2 left-2 cursor-move text-surface-400 z-10 {disabled
          ? 'hidden'
          : ''}"
        {@attach handleRef}
      >
        <GripVertical class="size-4" />
      </div>
    {/if}

    <a
      href={isSafeHttpUrl(link.url) ? link.url : undefined}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={!isSafeHttpUrl(link.url)}
      class="block flex-1 {isEditing || !isSafeHttpUrl(link.url) ? 'pointer-events-none opacity-60' : ''}"
    >
      <div class="font-bold truncate pr-6 text-lg">{link.title}</div>
      <div class="text-sm text-surface-600 dark:text-surface-300 mt-1 truncate">
        {link.desc}
      </div>
      <div
        class="text-xs text-primary-600 dark:text-primary-400 mt-2 truncate opacity-80 flex items-center gap-1"
      >
        <ExternalLink class="size-3" />
        {getHostnameLabel(link.url)}
      </div>
    </a>
  </div>
</div>
