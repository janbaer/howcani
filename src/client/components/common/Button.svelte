<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
import { link } from '../../lib/router.svelte';

type Variant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'icon'
  | 'icon-edit'
  | 'icon-delete'
  | 'mobile-icon'
  | 'mobile-user'
  | 'back'
  | 'cancel'
  | 'submit'
  | 'delete-action';

type Size = 'default' | 'sm' | 'lg';

let {
  variant = 'primary',
  size = 'default' as Size,
  href,
  disabled,
  class: className = '',
  children,
  ...rest
}: (HTMLButtonAttributes | HTMLAnchorAttributes) & {
  variant?: Variant;
  size?: Size;
  href?: string;
  disabled?: boolean;
  children?: Snippet;
} = $props();

const base = 'inline-flex items-center justify-center rounded-lg';
const disabledStyles = 'disabled:opacity-50 disabled:cursor-not-allowed';
const primaryColors = 'bg-primary font-mono font-medium text-primary-foreground hover:opacity-90 transition-opacity';
const dangerColors = 'bg-red-600 font-mono font-medium text-white hover:opacity-90 transition-opacity';
const mutedHover = 'hover:text-foreground hover:bg-muted transition-colors';

const variantStyles: Record<Variant, string> = {
  primary: `${base} ${primaryColors} ${disabledStyles}`,
  secondary: `${base} border border-border font-mono font-medium text-foreground hover:bg-muted transition-colors ${disabledStyles}`,
  ghost: `${base} text-muted-foreground ${mutedHover}`,
  danger: `${base} ${dangerColors} ${disabledStyles}`,
  icon: `flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground ${mutedHover}`,
  'icon-edit': `rounded-md p-1.5 text-muted-foreground ${mutedHover} active:bg-muted`,
  'icon-delete':
    'rounded-md p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 active:bg-red-500/10 transition-colors',
  'mobile-icon':
    'flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground/80 hover:text-primary-foreground transition-colors',
  'mobile-user':
    'flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground',
  back: `flex items-center gap-1.5 font-mono text-sm text-muted-foreground ${mutedHover}`,
  cancel: `${base} font-mono text-muted-foreground ${mutedHover} ${disabledStyles}`,
  submit: `${base} gap-2 ${primaryColors} ${disabledStyles}`,
  'delete-action': `${base} gap-2 ${dangerColors} ${disabledStyles}`,
};

const sizeStyles: Record<Size, string> = {
  default: 'px-4 py-2 text-sm',
  sm: 'px-4 py-1.5 text-xs',
  lg: 'px-6 py-2.5 text-sm',
};

const fixedSizeVariants = new Set<Variant>(['icon', 'icon-edit', 'icon-delete', 'mobile-icon', 'mobile-user', 'back']);

let classes = $derived(
  fixedSizeVariants.has(variant)
    ? `${variantStyles[variant]} ${className}`.trim()
    : `${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim(),
);
</script>

{#if href}
  <a
    {href}
    class="{classes}{disabled ? ' opacity-50 pointer-events-none' : ''}"
    aria-disabled={disabled || undefined}
    tabindex={disabled ? -1 : undefined}
    use:link
    {...rest}
  >
    {@render children?.()}
  </a>
{:else}
  <button class={classes} {disabled} {...rest}>
    {@render children?.()}
  </button>
{/if}
