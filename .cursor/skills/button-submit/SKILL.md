---
name: button-submit
description: >-
  Create and use the shared ButtonSubmit component for search/submit actions.
  Use when adding a search button, submit button, or action button with icon
  to any form or search UI. Located at src/shared/ButtonSubmit.tsx.
---

# ButtonSubmit Component

Shared search/submit button at `src/shared/ButtonSubmit.tsx`.

## Import

```tsx
import ButtonSubmit from "@/shared/ButtonSubmit";
```

## Variants

### `icon` (default) — Circle icon button
For inline usage inside form rows (e.g. next to a date picker on desktop).

```tsx
<ButtonSubmit onClick={handleSearch} />
```

Renders: `h-14 w-14 md:h-16 md:w-16` circle with search icon only.

### `full` — Full-width button with text + icon
For mobile/responsive layouts where the button spans full width.

```tsx
<ButtonSubmit variant="full" onClick={handleSearch} />
```

Renders: `h-14 w-full` pill with search icon + "Search" text.

### `compact` — Small button with text + icon
For compact UIs like mobile modals or toolbars.

```tsx
<ButtonSubmit variant="compact" onClick={handleSearch} />
```

Renders: `px-4 py-2.5` small rounded button with search icon + "Search" text.

## Props

| Prop       | Type                              | Default    | Description                |
|------------|-----------------------------------|------------|----------------------------|
| `variant`  | `"icon" \| "full" \| "compact"`  | `"icon"`   | Visual style variant       |
| `onClick`  | `() => void`                      | —          | Click handler              |
| `text`     | `string`                          | `"Search"` | Button label text          |
| `className`| `string`                          | `""`       | Additional CSS classes     |
| `loading`  | `boolean`                         | `false`    | Shows spinner, disables    |
| `disabled` | `boolean`                         | `false`    | Disables the button        |

## Responsive Pattern

Show `icon` on desktop (inside form row), `full` on mobile (below stacked fields):

```tsx
{/* Desktop: icon variant inside FlightDateRangeInput */}
<div className="hidden lg:block">
  <ButtonSubmit onClick={handleSearch} />
</div>

{/* Mobile: full-width variant below the form */}
<div className="lg:hidden p-4">
  <ButtonSubmit variant="full" onClick={handleSearch} />
</div>
```

## Re-export Pattern

If a local `ButtonSubmit.tsx` already exists and is imported elsewhere, re-export instead of rewriting all imports:

```tsx
// src/app/(client-components)/(HeroSearchForm)/ButtonSubmit.tsx
import ButtonSubmit from "@/shared/ButtonSubmit";
export default ButtonSubmit;
```

Or wrap with local defaults:

```tsx
import ButtonSubmitBase from "@/shared/ButtonSubmit";

const ButtonSubmit = ({ onClick }) => (
  <ButtonSubmitBase variant="compact" onClick={onClick} className="relative z-20" />
);
export default ButtonSubmit;
```

## Customizing Text

```tsx
<ButtonSubmit variant="full" text="Find Flights" onClick={handleSearch} />
```

## With Loading State

```tsx
<ButtonSubmit variant="full" loading={isSearching} onClick={handleSearch} />
```
