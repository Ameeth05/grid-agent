Output Patterns

Use these patterns when skills need to produce consistent, high-quality output.

Template Pattern

Provide templates for output format. Match the level of strictness to your needs.
For strict requirements (like API responses or data formats):

----

name: skill-creator
description: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Manus's capabilities with specialized knowledge, workflows, or tool integrations.

For flexible guidance (when adaptation is useful):

----

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

Examples Pattern

For skills where output quality depends on seeing examples, provide input/output pairs:

cloud-deploy/
├── SKILL.md (workflow + provider selection)
└── references/
    ├── aws.md (AWS deployment patterns)
    ├── gcp.md (GCP deployment patterns)
    └── azure.md (Azure deployment patterns)
feat(auth): implement JWT-based authentication

Add login endpoint and token validation middleware

fix(reports): correct date formatting in timezone conversion
Use UTC timestamps consistently across report generation

Follow this style: type(scope): brief description, then detailed explanation.
Examples help Manus understand the desired style and level of detail more clearly than descriptions alone.