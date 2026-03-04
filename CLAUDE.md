# Figma + Claude Code Integration Project

## MCP Servers Configured

### 1. `figma` — Official Figma Remote MCP
- **URL:** `https://mcp.figma.com/mcp`
- **Auth:** OAuth (authenticate via `/mcp` command in Claude Code)
- **Tools:** `get_design_context`, `get_images`, `get_variables`, `generate_figma_design`, `generate_diagram`, `code_connect_mappings`
- **Special:** Code-to-Canvas (send generated code back to Figma as editable layers)
- **Limit:** 6 calls/month on free plan

### 2. `framelink-figma` — Framelink/GLips Figma Developer MCP
- **Package:** `figma-developer-mcp`
- **Auth:** Personal Access Token
- **Tools:** `get_figma_data`, `download_figma_images`
- **Best for:** Design-to-code with smart context reduction (simplifies Figma API responses for better AI accuracy)
- **Usage:** Paste a Figma file/frame URL and ask to implement the design

### 3. `figma-console` — Figma Console MCP (Southleft)
- **Package:** `figma-console-mcp`
- **Auth:** Personal Access Token
- **Tools:** 57+ tools including design system extraction, variable management, design parity checking, comment management
- **Best for:** Design system analysis, token extraction, design-code parity reports
- **Key tools:** `figma_get_design_system_kit`, `figma_get_variables`, `figma_check_design_parity`, `figma_generate_component_doc`

### 4. `figma-api` — Full Figma REST API MCP (Third Strand Studio)
- **Package:** `@thirdstrandstudio/mcp-figma`
- **Auth:** Personal Access Token
- **Tools:** 30 tools covering all Figma REST API endpoints
- **Best for:** Full API access (files, components, styles, comments, reactions, webhooks, analytics, teams, projects)

## Which Server to Use When

| Task | Server |
|------|--------|
| Implement a Figma design as code | `framelink-figma` |
| Send generated UI back to Figma | `figma` (official) |
| Extract design tokens/variables | `figma-console` |
| Audit design system consistency | `figma-console` |
| Get file/component metadata | `figma-api` |
| Post/read comments on designs | `figma-api` |
| Generate component documentation | `figma-console` |
| Check design-code parity | `figma-console` |
| Export images/assets | `framelink-figma` or `figma` |

## How to Use

1. **Paste a Figma URL** (file, frame, or component link) and describe what you want
2. Claude Code will automatically use the appropriate MCP server
3. For the official `figma` server, authenticate first: type `/mcp` → select figma → Authenticate

## Figma URL Format
- File: `https://www.figma.com/design/FILE_KEY/File-Name`
- Frame: `https://www.figma.com/design/FILE_KEY/File-Name?node-id=NODE_ID`
