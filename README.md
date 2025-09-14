# Vue Glimpse 👓

**Stop guessing where your variables come from. See their origin instantly.**

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/undefined_publisher.vue-glimpse?style=flat-square&label=Marketplace)](https://marketplace.visual-studio.com/items/itemName=undefined_publisher.vue-glimpse)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/undefined_publisher.vue-glimpse?style=flat-square)](https://marketplace.visual-studio.com/items/itemName=undefined_publisher.vue-glimpse)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

You're looking at a large component in your **Vue or Nuxt** project. You see `<p>{{ user.name }}</p>`. You pause. You ask yourself:

> "Where is `user` coming from? Is it a `prop`? A `ref`? From the Pinia store? Or just a local `const`?"

So you scroll. You jump to the `<script setup>` block, find the variable, and then jump back. A few lines later, you do it again for another variable. Each jump is a small interruption, a tiny context switch that breaks your flow and drains your mental energy.

**Vue Glimpse eliminates these jumps.** It gives you immediate, at-a-glance insight into your data's origin, right where you're working—inside your `<template>`.

![Vue Glimpse in action](https://raw.githubusercontent.com/vue-glimpse/media/main/demo.gif)

<!-- GIF -->

## How It Solves Your Pain

-   🧠 **Reduces Cognitive Load:** Stop holding a mental map of your component's state. The editor does it for you.
-   ⚡ **Boosts Your Flow State:** Stay focused on your template logic without constant context switching. Make faster, more confident decisions.
-   🚀 **Speeds Up Onboarding & Code Reviews:** Jump into an unfamiliar Vue or Nuxt component and instantly understand its data flow. No more codebase archeology.

## Features

-   **Future-Ready for Vue & Nuxt:** Built for the entire modern Vue ecosystem (Vue 3+, Nuxt 3+).
-   **At-a-glance Origin Indicators:** Subtle icons tell you the source of your data.
-   **Compiler-Level Accuracy:** Powered by the official `@vue/compiler-sfc`, the same engine Vue and Nuxt use. If the compiler knows about it, so does this extension.
-   **Comprehensive `<script setup>` Support:** Correctly identifies `props`, `ref`, `reactive`, `computed`, and variables from store patterns (like Pinia's `storeToRefs`).
-   **Zero Configuration:** Install it and it just works.

## The Legend: Your Guide to Data Origins

A simple, intuitive icon set helps you decode your template instantly.

| Icon | Origin                      | What It Means                                                |
| :--: | --------------------------- | ------------------------------------------------------------ |
|  ℗   | `prop`                      | Data passed down from a parent (`defineProps`).              |
|  🔹  | `ref`                       | A reactive primitive value (`ref()`).                        |
|  🔷  | `reactive`                  | A reactive object (`reactive()`).                            |
|  ⚡   | `computed`                  | A derived value that updates automatically (`computed()`).   |
|  📦   | `store` / External          | State from a global store like Pinia or Vuex.                |
|  ƒ   | `method`                    | A function you can call.                                     |
|  •   | Local Variable              | A simple, non-reactive `const` or `let`.                     |

## Installation

1.  Open **VS Code**.
2.  Go to the **Extensions** view (`Ctrl+Shift+X`).
3.  Search for `Vue Glimpse` (or `Nuxt Glimpse`).
4.  Click **Install**.

## Contributing

This extension is built for the community. If you have an idea or find a bug, please [open an issue](https://github.com/your-username/vue-glimpse/issues).

## License

[MIT](LICENSE)
