---
name: relationship-docs
description: Create or update clear relationship documentation using Mermaid diagrams and supporting tables. Use when the user asks for a relationship map, architecture map, file relationship document, system flow, component interaction explanation, data flow, request flow, dependency map, or any documentation where multiple files, services, layers, or concepts need to be shown together clearly.
---

# Relationship Docs

## Core Rule

When documenting relationships between files, systems, layers, services, workflows, or concepts, use both:

- A Mermaid diagram for the visual relationship.
- A table for precise responsibilities, inputs/outputs, and impact.

Do not rely on prose alone when the user asks for a clear map or relationship document.

## Recommended Structure

Use this order unless the existing document has a better local convention:

1. Short plain-language overview.
2. Mermaid flowchart or sequence diagram.
3. Supporting table.
4. Notes that separate current behavior from planned or future behavior.
5. Verification notes when file paths or runtime behavior are described.

## Diagram Guidance

Prefer `flowchart TD` for file, layer, and architecture relationships.

Prefer `sequenceDiagram` for request/response timing between browser, frontend, backend, model providers, and databases.

Label nodes with concrete file paths when files are the subject of the document. Label conceptual nodes clearly when the node is not a file, such as `Browser`, `Supabase/Postgres`, or `Model provider`.

Use solid arrows for current implemented behavior. Use dotted arrows with labels such as `planned`, `future`, or `optional` for work that is not implemented yet.

## Table Guidance

Pair the diagram with a table that includes the most useful columns for the task. Common columns:

- `Layer`
- `File`
- `Role`
- `Communicates with`
- `Input`
- `Output`
- `Impact`
- `Current or future`

Keep table rows grounded in real files when documenting a repository. If a file path is mentioned, verify it exists unless the row is explicitly marked as future.

## Accuracy Rules

Mark planned capabilities as planned. Do not imply that future work already exists.

Keep secrets and server-only responsibilities clear when explaining frontend/backend relationships.

For learning-oriented docs, define framework concepts in plain language before using framework-specific terms.

After editing, verify:

- Current file paths in the Mermaid diagram exist.
- The table does not contradict the diagram.
- Current and future behavior are visually and textually distinct.
