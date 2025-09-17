# Contributing to VueGlimpse

First off, thank you for considering contributing to VueGlimpse! We're excited you're here. Every contribution, from a simple bug report to a new feature, is incredibly valuable to us.

This document provides guidelines to help you get started.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms. (We will add this file later, but the principle of respect and collaboration already applies).

## How Can I Contribute?

There are many ways to contribute, and all are welcome:

-   **Reporting Bugs:** If you find something that's not working as expected.
-   **Suggesting Enhancements:** If you have an idea for a new feature or an improvement to an existing one.
-   **Submitting Pull Requests:** If you're ready to contribute with your own code.

### Reporting Bugs

Before creating a bug report, please **check the existing issues** to see if someone has already reported it.

When submitting a bug report, please include the following:
1.  A clear and descriptive title (e.g., "Icons do not appear for destructured props").
2.  A step-by-step description of how to reproduce the bug.
3.  A minimal, reproducible code snippet from a `.vue` file that demonstrates the issue.
4.  What you expected to happen vs. what actually happened.
5.  Your environment details (VS Code version, VueGlimpse version, OS).

[> Open a new issue](https://github.com/vofronte/vue-glimpse/issues/new/choose)

### Suggesting Enhancements

We'd love to hear your ideas for making VueGlimpse better. When suggesting an enhancement, please explain:
1.  **The problem:** What is the problem you're trying to solve?
2.  **The proposed solution:** How do you envision this feature working?
3.  **Its value:** Why would this be a valuable addition for most users?

## Your First Code Contribution

Ready to write some code? Here’s how to get your development environment set up.

### Development Setup

1.  **Fork & Clone:** Fork the repository to your own GitHub account and then clone it to your local machine.
    ```bash
    git clone https://github.com/YOUR_USERNAME/vue-glimpse.git
    cd vue-glimpse
    ```
2.  **Install Dependencies:** We use `bun` for package management.
    ```bash
    bun install
    ```
3.  **Open in VS Code:** Open the project folder in Visual Studio Code.

4.  **Run the Extension:**
    *   Press `F5` or go to the "Run and Debug" view (`Ctrl+Shift+D`).
    *   Select "Run Extension" from the dropdown and click the green play button.
    *   This will open a new **[Extension Development Host]** window. Any changes you make to the source code will be reflected here after a quick reload (`Ctrl+R`).

    The project is set up to automatically re-compile on file changes, so your workflow should be smooth.

### Style Guides

#### Git Commit Messages

This project uses **Conventional Commits**. This is a strict requirement because our release process and changelog generation depend on it.

Your commit messages should be structured as follows:

```
<type>(<scope>): <subject>
```

-   **`<type>`:** Must be one of `feat`, `fix`, `refactor`, `perf`, `docs`, `chore`, `ci`, `style`, `test`.
-   **`<scope>` (optional):** The part of the codebase you changed (e.g., `parser`, `template`, `docs`, `release`).
-   **`<subject>`:** A short, imperative-tense description of the change.

**Examples:**
-   `feat(parser): add support for Options API`
-   `fix(template): correctly identify props in v-for loops`
-   `docs(readme): add new section for contributing`

We have `commitlint` set up, which will automatically check your commit messages.

#### Code Style

We use ESLint with the `@antfu/eslint-config` preset. A pre-commit hook is set up to automatically format your code, so you don't have to worry too much about it. Just write your code, and our tools will handle the rest upon commit.

You can also run the linter manually:
```bash
# Check for linting errors
bun lint

# Fix linting errors automatically
bun lint:fix
```

### Pull Request Process

1.  Ensure your code adheres to the style guides and that all tests pass.
2.  If you've added a new feature, make sure to update the `README.md` if necessary.
3.  Create your Pull Request, targeting the `main` branch.
4.  Make sure the PR title also follows the Conventional Commits format.
5.  In the PR description, link to the issue it resolves (e.g., `Fixes #123`).
6.  Be prepared to answer questions and make changes based on the code review.

Thank you again for your interest in contributing!
