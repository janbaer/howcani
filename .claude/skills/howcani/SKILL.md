---
name: howcani
description: Use this skill whenever the user asks a question starting with "How can I". Search the howcani-mcp knowledge base first before answering.
---

## Instructions

Whenever the user asks a question starting with "How can I" (case-insensitive), ALWAYS search the howcani-mcp knowledge base first using `mcp__howcani-mcp__search_items` with username `jan` before providing any answer.

- If a matching item is found, return its answer.
- If not found, answer the question and offer to save the question and answer using the howcani-mcp server.

Use `jan` as the username for searching and creating new items.

**Important:** If the user asks follow-up questions or clarifications, DO NOT offer to save after each individual answer. Instead, keep combining all Q&A into one consolidated answer. Only offer to save once the user signals they are done. When saving:
- Use the **first question** as the title/question of the saved item
- The answer contains the full consolidated Q&A (original answer + all follow-up questions and answers)

When saving or displaying answers, use Markdown for formatting. Mark the user's questions like this: **User asked:** *question...*

Ask the user, which tags should be assigned, and if there is no suitable for the current question, make proposal for a new tag.

Always show the user a preview of the new item and ask the user if they want to make any changes.

## Requirements

- howcani-mcp server should be running and accessible.
- environment variable `HOWCANI_TOKEN` has to be set, e.g.:
  ```sh
  export HOWCANI_TOKEN=$(gopass show home/howcani/jan-token)
  ```
  The environment variable is only required for creating or updating items.
