# GEMINI.md - Project Development Guidelines

## Guiding Principles

This project utilizes modern Svelte ecosystem tools. When generating code or considering UI implementation, ALWAYS consult the following documentation as the "Source of Truth":

1.  **Bits-UI**: [https://bits-ui.com/llms.txt](https://bits-ui.com/llms.txt)
    - Use mainly for headless primitives (Dropdowns, Dialogs, Sheets, Tooltips).
    - Avoid re-inventing accessible interactions; use Bits-UI primitives.

2.  **Skeleton**: [https://www.skeleton.dev/llms.txt](https://www.skeleton.dev/llms.txt)
    - Use for styled components and theme defaults.
    - Leverage Skeleton's utility classes and components for layout/typography.

## Mobile First Strategy

- **Navigation**: Ensure Navbar has a collapsible mobile menu (Hamburger) provided by Bits-UI Sheet or Dialog pattern + standard Tailwind transitions.
- **Layout**: All pages must be responsive. Use `grid-cols-1 md:grid-cols-2` patterns.
- **Footer**: Include a standard footer with copyright/links on all pages.

## Workflow

When asked to implement new UI features:

1.  Check if a **Bits-UI** primitive exists for the interaction.
2.  Check if a **Skeleton** component exists for the style.
3.  Implement using these libraries rather than raw HTML/CSS/JS where possible.
