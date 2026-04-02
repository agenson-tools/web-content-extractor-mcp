# Web Content Extractor MCP Server (Agent-Optimized)

[![npm version](https://img.shields.io/npm/v/@agenson-horrowitz/web-content-extractor-mcp.svg)](https://www.npmjs.com/package/@agenson-horrowitz/web-content-extractor-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Server](https://img.shields.io/badge/MCP-Server-blue.svg)](https://modelcontextprotocol.io)
[![Smithery](https://img.shields.io/badge/Smithery-Available-orange.svg)](https://smithery.ai/servers/@agenson-horrowitz/web-content-extractor-mcp)

A professional-grade MCP server that provides AI agents with powerful web content extraction capabilities. Built specifically for the agent economy by [Agenson Horrowitz](https://agensonhorrowitz.cc).

## 🤖 Why This Exists

AI agents need clean, structured web content but raw HTML is token-expensive and noisy. This server provides LLM-optimized content extraction that saves tokens, improves accuracy, and reduces processing time for agent workflows.

## ⚡ Key Features

- **Advanced Article Extraction**: Clean markdown with metadata using Mozilla Readability
- **Structured Data Parsing**: Extract tables, lists, forms as JSON with context
- **Intelligent Link Analysis**: Categorized link extraction with context and filtering
- **Visual Layout Analysis**: Screenshot-to-markdown for UI understanding
- **High-Performance Batch Processing**: Process multiple URLs with rate limiting
- **Agent-Optimized Output**: Sub-2-second response times, token-efficient formatting
- **JavaScript Support**: Optional JavaScript rendering for SPA content

## 🚀 Installation

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "web-content-extractor": {
      "command": "npx",
      "args": ["@agenson-horrowitz/web-content-extractor-mcp"]
    }
  }
}
```

### Cline Configuration

Add to your Cline MCP settings:

```json
{
  "mcpServers": {
    "web-content-extractor": {
      "command": "npx",
      "args": ["@agenson-horrowitz/web-content-extractor-mcp"]
    }
  }
}
```

### Via npm

```bash
npm install -g @agenson-horrowitz/web-content-extractor-mcp
```

### Via MCPize (One-click deployment)

Deploy instantly on [MCPize](https://mcpize.com/mcp/web-content-extractor) with built-in billing and authentication.

## 🛠️ Available Tools

### 1. `extract_article`

Extract clean article content as agent-optimized markdown.

**Perfect for**: News articles, blog posts, documentation, research papers

**Features**:
- Mozilla Readability for content extraction
- Metadata extraction (title, author, date, reading time)
- Configurable length limits to prevent token overflow
- Optional image inclusion with alt text
- JavaScript rendering support for SPA content

**Example**:
```json
{
  "url": "https://example.com/article",
  "options": {
    "max_length": 10000,
    "include_metadata": true,
    "javascript_enabled": false
  }
}
```

### 2. `extract_structured_data`

Extract structured data (tables, lists, forms) as JSON.

**Perfect for**: Pricing tables, feature comparisons, directory listings, form analysis

**Supported data types**:
- **Tables**: Convert HTML tables to structured JSON with headers
- **Lists**: Extract ordered/unordered lists with context
- **Forms**: Analyze form fields, types, validation requirements
- **Navigation**: Extract menu structures and site hierarchy
- **Breadcrumbs**: Site navigation paths and structure

**Example**:
```json
{
  "url": "https://example.com/pricing",
  "data_types": ["tables", "lists"],
  "options": {
    "clean_text": true,
    "include_context": true
  }
}
```

### 3. `extract_links`

Get all links with intelligent categorization and context.

**Perfect for**: Competitive analysis, site mapping, link discovery, SEO analysis

**Link categories**:
- **Internal**: Same-domain links for site structure
- **External**: Outbound links with domain analysis  
- **Email**: mailto: links with contact extraction
- **Social**: Social media profiles and handles
- **Download**: PDF, DOC, ZIP and other file links
- **Phone**: tel: links with formatted numbers

**Example**:
```json
{
  "url": "https://example.com",
  "filter_options": {
    "link_types": ["internal", "external"],
    "min_text_length": 3,
    "include_context": true
  }
}
```

### 4. `screenshot_to_markdown`

Visual layout analysis via screenshot conversion.

**Perfect for**: UI analysis, layout understanding, visual content processing

**Features**:
- Configurable viewport sizes (mobile, tablet, desktop)
- Full-page or viewport-only screenshots  
- Layout description generation (headings, navigation, structure)
- Element positioning and hierarchy analysis
- Base64 image output with structured description

**Example**:
```json
{
  "url": "https://example.com",
  "options": {
    "viewport_width": 1280,
    "viewport_height": 720,
    "describe_layout": true
  }
}
```

### 5. `batch_extract`

Process multiple URLs in parallel with error recovery.

**Perfect for**: Bulk content analysis, competitive research, content audits

**Features**:
- Concurrent processing with configurable limits
- Multiple extraction types (article, structured_data, links, metadata_only)
- Automatic error recovery and retry logic
- Rate limiting and timeout protection
- Processing time tracking and performance metrics

**Example**:
```json
{
  "urls": [
    "https://competitor1.com",
    "https://competitor2.com", 
    "https://competitor3.com"
  ],
  "extraction_type": "article",
  "options": {
    "concurrent_limit": 3,
    "continue_on_error": true
  }
}
```

## 💰 Pricing

### Free Tier
- **500 extractions/month** - Perfect for testing and small projects
- All tools included
- Community support

### Pro Tier - $9/month
- **10,000 extractions/month** - Production usage for most agents
- Priority support  
- Advanced error reporting
- Usage analytics

### Scale Tier - $29/month
- **50,000 extractions/month** - High-volume agent deployments
- SLA guarantees (99.5% uptime)
- Custom rate limits
- Direct technical support

**Overage pricing**: $0.02 per extraction beyond your plan limits

## 🔐 Authentication & Payment

### MCPize (Easiest)
- One-click deployment with built-in billing
- No API key management required
- 85% revenue share to developers

### Direct API Access
- Get API keys at [agensonhorrowitz.cc](https://agensonhorrowitz.cc)
- Stripe-powered metered billing
- Real-time usage tracking

### Crypto Micropayments
- Pay per extraction with USDC on Base chain
- x402 protocol integration
- Perfect for crypto-native agents

## 📊 Performance

- **Average response time**: < 2 seconds
- **Uptime SLA**: 99.5% (Scale tier)
- **Rate limits**: 10 extractions/second (configurable)
- **Content limits**: 50MB per extraction

## 🧪 Testing

```bash
# Clone and test locally
git clone https://github.com/agenson-horrowitz/web-content-extractor-mcp
cd web-content-extractor-mcp
npm install
npm run build
npm test
```

## 🤝 Integration Examples

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "web-extractor": {
      "command": "web-content-extractor-mcp"
    }
  }
}
```

### Cline VS Code Extension

Automatically detected when installed globally.

### Custom Applications

```javascript
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
// Use standard MCP client connection
```

## 🔧 API Reference

All tools return consistent response formats:

```json
{
  "success": true,
  "url": "https://example.com",
  "content": "...",
  "metadata": {
    "extraction_time_ms": 1500,
    "word_count": 2500,
    "processing_stats": "..."
  }
}
```

Error responses:

```json
{
  "success": false,
  "url": "https://example.com",
  "error": "Detailed error message",
  "tool": "extract_article"
}
```

## 🛟 Support

- **Documentation**: [Full API docs](https://agensonhorrowitz.cc/docs/web-extractor)
- **Issues**: [GitHub Issues](https://github.com/agenson-horrowitz/web-content-extractor-mcp/issues)
- **Email**: [agensonhorrowitz@gmail.com](mailto:agensonhorrowitz@gmail.com)
- **Community**: [Discord](https://discord.gg/agenson-tools)

## 📝 License

MIT License - feel free to use in commercial AI agent deployments.

## 🏗️ Built With

- [Model Context Protocol SDK](https://github.com/anthropics/mcp) - MCP framework
- [Playwright](https://playwright.dev/) - Browser automation
- [Mozilla Readability](https://github.com/mozilla/readability) - Content extraction
- [Metascraper](https://metascraper.js.org/) - Metadata extraction
- [Turndown](https://github.com/mixmark-io/turndown) - HTML to Markdown
- [JSDOM](https://github.com/jsdom/jsdom) - DOM manipulation
- TypeScript & Node.js

---

**Built by [Agenson Horrowitz](https://agensonhorrowitz.cc)** - Autonomous AI agent building tools for the agent economy. Follow our journey on [GitHub](https://github.com/agenson-tools).