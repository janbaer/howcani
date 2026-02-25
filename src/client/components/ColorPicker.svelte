<script lang="ts">
interface Props {
  value: string;
  onChange: (color: string) => void;
}

const { value, onChange }: Props = $props();

// Preset color palette matching backend DEFAULT_COLORS
const PRESET_COLORS = [
  '0e8a16', // Green
  'ff5722', // Orange
  '2196f3', // Blue
  '9c27b0', // Purple
  'f44336', // Red
  '009688', // Teal
  'ff9800', // Amber
  '607d8b', // Blue Grey
  '4caf50', // Light Green
  'e91e63', // Pink
  '3f51b5', // Indigo
  '00bcd4', // Cyan
  'cddc39', // Lime
  'ffc107', // Yellow
  '795548', // Brown
  '9e9e9e', // Grey
];

let customHex = $state(value);
let validationError = $state('');

function selectColor(color: string) {
  customHex = color;
  validationError = '';
  onChange(color);
}

function handleCustomInput(e: Event) {
  const input = (e.target as HTMLInputElement).value.trim();
  customHex = input;

  // Validate hex format (6 chars, valid hex, no # prefix)
  const hexRegex = /^[0-9a-fA-F]{6}$/;

  if (!input) {
    validationError = '';
    return;
  }

  if (input.startsWith('#')) {
    validationError = 'Remove the # prefix';
    return;
  }

  if (input.length !== 6) {
    validationError = 'Must be exactly 6 characters';
    return;
  }

  if (!hexRegex.test(input)) {
    validationError = 'Invalid hex color (use 0-9, A-F)';
    return;
  }

  validationError = '';
  onChange(input.toLowerCase());
}
</script>

<div class="space-y-4">
  <!-- Preset color grid -->
  <div>
    <label class="form-label">Preset Colors</label>
    <div class="grid grid-cols-8 gap-2">
      {#each PRESET_COLORS as color}
        <button
          type="button"
          onclick={() => selectColor(color)}
          class="group relative flex h-11 w-11 items-center justify-center rounded-md border-2 transition-all hover:scale-110
            {value.toLowerCase() === color.toLowerCase() ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}"
          style="background-color: #{color}"
          aria-label="Select color {color}"
          title="#{color}"
        >
          {#if value.toLowerCase() === color.toLowerCase()}
            <svg class="h-5 w-5 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- Custom hex input -->
  <div>
    <label for="custom-color" class="form-label">
      Custom Hex Color
    </label>
    <div class="flex gap-2 items-start">
      <div class="flex-1">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">#</span>
          <input
            id="custom-color"
            type="text"
            value={customHex}
            oninput={handleCustomInput}
            placeholder="e.g., ff5722"
            maxlength="6"
            class="w-full rounded-lg border pl-7 pr-3 py-2 font-mono text-sm uppercase
              {validationError ? 'border-red-500 focus:ring-red-500' : 'border-input focus:ring-ring'}
              bg-background placeholder:text-muted-foreground placeholder:normal-case focus:outline-none focus:ring-2"
          />
        </div>
        {#if validationError}
          <p class="mt-1 font-mono text-xs text-red-500">{validationError}</p>
        {/if}
      </div>

      <!-- Color preview -->
      <div
        class="h-10 w-10 shrink-0 rounded-md border-2 border-border"
        style="background-color: #{validationError ? 'cccccc' : customHex}"
        aria-label="Color preview"
      ></div>
    </div>
  </div>

  <!-- Live preview with tag badge -->
  <div class="pt-2 border-t border-border">
    <p class="font-mono text-xs text-muted-foreground mb-2">Preview</p>
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-xs font-medium"
      style="background-color: #{value}20; color: #{value}"
    >
      <span class="h-2 w-2 rounded-full" style="background-color: #{value}"></span>
      example-tag
    </span>
  </div>
</div>

<style>
  /* Ensure color swatches are touch-friendly (44x44px minimum) */
  @media (max-width: 640px) {
    .grid-cols-8 {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
  }
</style>
