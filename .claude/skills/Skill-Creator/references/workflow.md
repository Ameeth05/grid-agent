Workflow Patterns

Sequential Workflows

For complex tasks, break operations into clear, sequential steps. It is often helpful to give Manus an overview of the process towards the beginning of SKILL.md:

Markdown
name: skill-creator
description: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Manus's capabilities with specialized knowledge, workflows, or tool integrations.

Conditional Workflows

For tasks with branching logic, guide Manus through decision points:

Markdown
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter metadata (required)
│   │   ├── name: (required)
│   │   └── description: (required)
│   └── Markdown instructions (required)
└── Bundled Resources (optional)
    ├── scripts/          - Executable code (Python/Bash/etc.)
    ├── references/       - Documentation intended to be loaded into context as needed
    └── templates/        - Files used in output (templates, icons, fonts, etc.)