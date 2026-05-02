# Project Structure

The repository is in early stages with no application code yet.

## Current Layout

```
KiroHacks/
├── .git/
├── .kiro/
│   └── steering/       # Kiro AI steering documents
├── README.md
└── LICENSE
```

## Expected Structure

As the project grows, organize around these concerns:

```
KiroHacks/
├── frontend/           # UI for student interaction
├── backend/            # API server, LLM integration, hint logic
│   ├── hints/          # Tiered hint generation logic
│   └── tracking/       # Help usage tracking per student
├── prompts/            # LLM system prompts and hint templates
└── README.md
```

## Conventions to Follow

- Keep hint logic isolated and testable — it's the core of the product
- LLM prompts should live in dedicated files, not hardcoded in business logic
- Never commit API keys or secrets; use environment variables (`.env`, never committed)
- Track hint level (1, 2, 3) as explicit state, not inferred from conversation history
