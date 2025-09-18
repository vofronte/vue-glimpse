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

VueGlimpse is a VS Code extension for **Vue & Nuxt** that ends the constant scrolling and context-switching when working in large components. It shows you exactly where your template variables originate—be it `props`, a `store`, or a computed property—with subtle, at-a-glance icons. It supports both **`<script setup>` (Composition API)** and the **Options API**, helping you stay in your flow and understand your component's data source instantly.

## Table of Contents

- [Why VueGlimpse?](#why-vueglimpse)
- [Features](#features)
- [The Legend: Icon Guide](#the-legend-icon-guide)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Community](#community)

## Why VueGlimpse?

You're deep in a component, see `<p>{{ user.name }}</p>`, and ask yourself:

> "Where is `user` coming from? Is it a `prop`? A `ref`? From a Pinia store? Or a `data` property?"

Each question forces a jump to the `<script>` block, breaking your concentration. VueGlimpse eliminates these interruptions.

-   🧠 **Reduces Cognitive Load:** Stop mapping your component's state in your head. The editor does it for you.
-   ⚡ **Keeps You in the Flow:** Stay focused on your template without constant context switching.
-   🚀 **Speeds Up Onboarding & Reviews:** Instantly understand any component's data flow, regardless of the API style.

## Features

-   **At-a-glance Origin Indicators:** Subtle icons in your template tell you the source of your data.
-   **Universal API Support:** Works seamlessly with both `<script setup>` and the Options API.
-   **Minimalist Hovers:** Instantly identify a variable's origin (`Prop`, `Ref`, etc.) on hover—no code, just context.
-   **Compiler-Level Accuracy:** Powered by `@vue/compiler-sfc` for guaranteed correctness where possible.
-   **Full API Visibility:** Identifies the entire Vue API surface, including stores and passthrough attributes.
-   **Blazing Fast:** Intelligent caching ensures zero performance impact.
-   **Configurable:** Toggle icons and hovers to fit your workflow.

## The Legend: Icon Guide

A simple, intuitive icon set helps you decode your template instantly.

| Icon | Origin                      | What It Means                                                |
| :--: | --------------------------- | ------------------------------------------------------------ |
|  ℗   | `prop`                      | Data passed down from a parent (`defineProps` or `props` option). |
|  📥   | `attrs` / `slots`           | Attributes or slots passed from a parent. Available via `$attrs`, `$slots`, etc. |
|  📤   | `emit`                      | An event sent to a parent component. Available via `defineEmits` or `$emit`. |
|  🔹  | `ref`                       | A reactive primitive value (`ref()` in `<script setup>`).      |
|  🔷  | `reactive`                  | A reactive object (`reactive()` or a `data()` property).         |
|  ⚡   | `computed`                  | A derived value that updates automatically (`computed` option or function). |
|  📦   | `store` / External State    | State from a global store like Pinia or Vuex.                |
|  ƒ   | `method`                    | A function you can call from the template (`methods` option or a function in `<script setup>`). |
|  •   | Local Variable              | A simple, non-reactive `const` or `let` in `<script setup>`. |

## Getting Started

### 1. Installation

1.  Open **VS Code**.
2.  Go to the **Extensions** view (`Ctrl+Shift+X`).
3.  Search for `VueGlimpse`.
4.  Click **Install**.

### 2. Requirements

VueGlimpse activates for `.vue` files. This requires a language support extension like [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (which you likely already have).

## Configuration

VueGlimpse is designed to work out of the box, but you can tailor its features to your workflow.

| Setting                   | Description                                                 | Default |
| ------------------------- | ----------------------------------------------------------- | :-----: |
| `vueGlimpse.enabled`        | Globally enables or disables all features (icons & hovers). | `true`  |
| `vueGlimpse.hovers.enabled` | Toggles the origin identifier tooltip on hover.             | `true`  |

To change a setting, add it to your `settings.json` file. For example, to disable hovers:
```json
{
  "vueGlimpse.hovers.enabled": false
}
```

## Community

-   ❤️ **Show Support:** If you find VueGlimpse useful, please **[star the repository on GitHub](https://github.com/vofronte/vue-glimpse)**!
-   🤝 **Contribute:** Have an idea or find a bug? Please [open an issue](https://github.com/vofronte/vue-glimpse/issues).

## License

[MIT](LICENSE)
