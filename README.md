<p align="center">
  <img src="icon.png" width="128" alt="VueGlimpse Logo">
</p>

<h1 align="center">VueGlimpse</h1>

<p align="center">
  <strong>Stop guessing where your template variables come from. Instantly see their origin.</strong>
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

<p align="center">
  <img src="https://github.com/vofronte/vue-glimpse/blob/main/media/demo.gif?raw=true" alt="VueGlimpse in action (demo)">
</p>

VueGlimpse is a VS Code extension for **Vue & Nuxt** that ends the constant scrolling and context-switching when working in large components. It shows you exactly where your template variables originate—be it `props`, `ref`, a `store`, or a local `const`—with subtle, at-a-glance icons. Stay in your flow and understand your component's data source instantly.

## Table of Contents

- [Why VueGlimpse?](#why-vueglimpse)
- [Features](#features)
- [The Legend: Icon Guide](#the-legend-icon-guide)
- [Getting Started](#getting-started)
- [Community](#community)

## Why VueGlimpse?

You're deep in a component, see `<p>{{ user.name }}</p>`, and ask yourself:

> "Where is `user` coming from? Is it a `prop`? A `ref`? From a Pinia store?"

Each question forces a jump to the `<script setup>`, breaking your concentration. VueGlimpse eliminates these interruptions.

-   🧠 **Reduces Cognitive Load:** Stop mapping your component's state in your head. The editor does it for you.
-   ⚡ **Keeps You in the Flow:** Stay focused on your template without constant context switching.
-   🚀 **Speeds Up Onboarding & Reviews:** Instantly understand an unfamiliar component's data flow.

## Features

-   **Future-Ready for Vue & Nuxt:** Built for the modern Vue ecosystem (Vue 3+, Nuxt 3+).
-   **At-a-glance Origin Indicators:** Subtle, intuitive icons tell you the source of your data.
-   **Compiler-Level Accuracy:** Powered by `@vue/compiler-sfc` for guaranteed correctness.
-   **Full Component API Visibility:** Identifies `props`, `emits`, `attrs`, `slots`, `ref`, `reactive`, `computed`, and store patterns.
-   **Blazing Fast:** Intelligent caching ensures analysis only runs when needed.
-   **Zero Configuration:** Install it and it just works.

## The Legend: Icon Guide

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

## Getting Started

### 1. Installation

1.  Open **VS Code**.
2.  Go to the **Extensions** view (`Ctrl+Shift+X`).
3.  Search for `VueGlimpse`.
4.  Click **Install**.

### 2. Requirements

VueGlimpse activates for `.vue` files. This requires a language support extension like [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (which you likely already have).

### 3. Configuration (Optional)

The extension works out of the box. To disable it, change this setting in your `settings.json`:

```json
{
  "vueGlimpse.enabled": false
}
```

## Community

-   ❤️ **Show Support:** If you find VueGlimpse useful, please **[star the repository on GitHub](https://github.com/vofronte/vue-glimpse)**!
-   🤝 **Contribute:** Have an idea or find a bug? Please [open an issue](https://github.com/vofronte/vue-glimpse/issues).

## License

[MIT](LICENSE)
