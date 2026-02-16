---
name: "HowCanI: Create"
description: "Create a new item in the HowCanI knowledge base"
category: Tools
tags: [howcani, create, mcp]
---

Create a new item in the HowCanI knowledge base. Authentication is handled via the Authorization header configured in `.mcp.json`.

## Steps

1. **Parse input**: The argument after `/howcani-create` may contain the question/title. If not provided, ask the user.

2. **Collect details**: Ask the user for:
   - **Question/title** (if not already provided as argument)
   - **Answer/content**
   - **Tags** to assign (use `mcp__howcani-mcp__list_tags` with username "jan" to show available tags)

3. **Create the item**: Use `mcp__howcani-mcp__create_item` with:
   - `question`: the title/question
   - `answer`: the content
   - `tags`: array of tag names

4. **Confirm**: Show the created item to the user.
