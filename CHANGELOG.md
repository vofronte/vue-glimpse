# Changelog

## 0.1.1

### Patch Changes

- [`2750317`](https://github.com/vofronte/vue-glimpse/commit/275031781916604e31cb43a04ff9b0c7c249d712) Thanks [@vofronte](https://github.com/vofronte)! - refine ignore rules for extension packaging

## 0.1.0

### Minor Changes

- ✨ **Features**

  - **Full Component API Visibility:** Added support for `emits` (`defineEmits`, `$emit`), passthrough `attrs`/`slots` (`useAttrs`, `useSlots`, `$attrs`, `$slots`).
  - Introduced new icons: 📤 for emits and 📥 for passthroughs.

  🚀 **Improvements**

  - **Intelligent Caching:** Implemented a powerful caching mechanism for a massive performance boost.
  - **Professional CI/CD:** Migrated to a fully automated release pipeline using Changesets and GitHub Actions.

- 🎉 Initial release of VueGlimpse! Provides at-a-glance origin indicators for variables in Vue templates (`props`, `ref`, `reactive`, `computed`, `store`-patterns, `methods`, and local variables).
