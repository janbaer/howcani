# Requirements

This document lists what the project must do, one requirement per line with a stable ID (R1, R2, ...) that `docs/design.md` refers to.

- **R1** The system SHALL let users register with username, email and password, log in with username and password, and issue signed, expiring tokens.
- **R2** The system SHALL make items readable without authentication and allow only the authenticated owner to change them.
- **R3** The system SHALL let the owner create, edit and delete question-and-answer items with a markdown answer and tags.
- **R4** The system SHALL render answers as sanitized markdown.
- **R5** The system SHALL search items by free text over question and answer, ranked by relevance.
- **R6** The system SHALL filter items by tags, returning items that carry all selected tags, combinable with the text search.
- **R7** The system SHALL combine keyword and semantic ranking when embeddings are enabled.
- **R8** The system SHALL work fully without embeddings, and saving an item SHALL NOT depend on the embedding provider.
- **R9** The system SHALL show semantically related items for an item.
- **R10** The system SHALL list, per item and as an overview of groups, the items whose similarity meets the configured duplicate threshold.
- **R11** The system SHALL expose the knowledge base to AI clients via MCP under the same access rules as the API.
- **R12** The system SHALL refuse to start when `config.yaml` is missing or invalid, when `HOWCANI_JWT_SECRET` is unset, or when stored embeddings do not match the configured model.
- **R13** When backups are enabled, the system SHALL back up every user's data daily to JSON and prune backups after the configured retention.
- **R14** The system SHALL let a user restore their data from a backup file.
- **R15** The system SHALL be usable on desktop, tablet and mobile. *Check:* manual, item list, detail and edit dialog on each of the three.
- **R16** The system SHALL ship as a container image that runs as a non-root user and keeps its SQLite data on a mounted volume.
- **R17** The system SHALL create tags implicitly when an item uses them and let the owner rename, recolor and delete them; deleting a tag removes it from its items.
- **R18** The system SHALL let a user list and download only their own backup files.
- **R19** The system SHALL tell an open client when a newer version has been deployed.
