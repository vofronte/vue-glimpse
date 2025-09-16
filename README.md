<p align="center">
  <img src="icon.png" width="128" alt="VueGlimpse Logo">
</p>

<h1 align="center">VueGlimpse</h1>

<p align="center">
  <strong>Stop guessing where your variables come from. Instantly see their origin.</strong>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=vofronte.vue-glimpse" target="_blank">
    <img src="https://img.shields.io/visual-studio-marketplace/v/vofronte.vue-glimpse?style=flat-square&label=Marketplace&color=228d6a" alt="Visual Studio Marketplace Version">
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=vofronte.vue-glimpse" target="_blank">
    <img src="https://img.shields.io/visual-studio-marketplace/i/vofronte.vue-glimpse?style=flat-square&color=228d6a" alt="Installs">
  </a>
  <a href="https://opensource.org/licenses/MIT" target="_blank">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT">
  </a>
</p>

---

You're deep in a large **Vue or Nuxt** component. You see `<p>{{ user.name }}</p>` and you pause, asking yourself:

> "Where is `user` coming from? Is it a `prop`? A `ref`? From a Pinia store? Or just a local `const`?"

So you scroll. You jump to the `<script setup>`, find the variable, and jump back. A few lines later, the cycle repeats. Each jump is a small interruption, a tiny context switch that breaks your flow and drains your mental energy.

**VueGlimpse eliminates these jumps.** It gives you immediate, at-a-glance insight into your data's origin, right where you're working—inside your `<template>`.

<p align="center">
  <img src="https://github.com/vofronte/vue-glimpse/blob/main/media/demo.gif" alt="VueGlimpse in action">
</p>

## How It Solves Your Pain

-   🧠 **Reduces Cognitive Load:** Stop holding a mental map of your component's state. The editor does it for you.
-   ⚡ **Keeps You in the Flow:** Stay focused on your template logic without constant context switching. Make faster, more confident decisions.
-   🚀 **Speeds Up Onboarding & Code Reviews:** Jump into an unfamiliar component and instantly understand its data flow. No more codebase archeology.

## Features

-   **Future-Ready for Vue & Nuxt:** Built for the entire modern Vue ecosystem (Vue 3+, Nuxt 3+).
-   **At-a-glance Origin Indicators:** Subtle, intuitive icons tell you the source of your data.
-   **Compiler-Level Accuracy:** Powered by the official `@vue/compiler-sfc`, the same engine Vue and Nuxt use. This isn't a guess; it's the source of truth.
-   **Full Component API Visibility:** Correctly identifies `props`, `emits` (`defineEmits`, `$emit`), passthrough `attrs`/`slots` (`useAttrs`, `useSlots`, `$attrs`, `$slots`), `ref`, `reactive`, `computed`, and variables from store patterns.
-   **Blazing Fast:** Intelligent caching ensures analysis only runs when it's needed, not on every keystroke or tab switch.
-   **Zero Configuration:** Install it and it just works.

## The Legend: Your Guide to Data Origins

A simple, intuitive icon set helps you decode your template instantly.

| Icon | Origin                      | What It Means                                                |
| :--: | --------------------------- | ------------------------------------------------------------ |
|  ℗   | `prop` | Data passed down from a parent (`defineProps`). |
|  📥   | `attrs` / `slots` | Attributes or slots passed from a parent that are not declared as props. Available via `$attrs`, `$slots`, `useAttrs()`, or `useSlots()`. |
|  📤   | `emit` | An event sent to a parent component. Available via `defineEmits()` or the built-in `$emit`. |
|  🔹  | `ref` | A reactive primitive value (`ref()`). |
|  🔷  | `reactive` | A reactive object (`reactive()`). |
|  ⚡   | `computed` | A derived value that updates automatically (`computed()`). |
|  📦   | `store` / External State | State from a global store like Pinia or Vuex. |
|  ƒ   | `method` | A function you can call. |
|  •   | Local Variable | A simple, non-reactive `const` or `let`. |

## Installation

1.  Open **VS Code**.
2.  Go to the **Extensions** view (`Ctrl+Shift+X`).
3.  Search for `VueGlimpse`.
4.  Click **Install**.

## Requirements

For VueGlimpse to activate, your VS Code must recognize `.vue` files. This is typically provided by any popular Vue extension, such as:

-   [Vue Language Features (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
-   [Vetur](https://marketplace.visualstudio.com/items?itemName=octref.vetur)

You likely already have one of these installed.

## Configuration

The extension works out of the box. If you need to temporarily disable it, you can change the following setting in your `settings.json`:

```json
{
  "vueGlimpse.enabled": false
}
```

## Show Your Support

If you find VueGlimpse useful, please consider **[starring the repository on GitHub](https://github.com/vofronte/vue-glimpse)**! It helps the project gain visibility and lets me know you appreciate the work.

## Contributing

This extension is built for the community. If you have an idea or find a bug, please [open an issue](https://github.com/vofronte/vue-glimpse/issues).

## License

[MIT](LICENSE)
