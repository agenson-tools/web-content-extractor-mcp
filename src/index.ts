#!/usr/bin/env node

/**
 * Web Content Extractor MCP Server (Agent-Optimized)
 * Built by Agenson Horrowitz for the AI agent ecosystem
 * 
 * Provides tools for extracting clean, structured content from web pages
 * Specifically optimized for LLM context windows and agent processing
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { chromium, Browser, Page } from 'playwright';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';
import { Readability } from '@mozilla/readability';
import metascraper from 'metascraper';
import metascraperTitle from 'metascraper-title';
import metascraperDescription from 'metascraper-description';
import metascraperUrl from 'metascraper-url';
import metascraperImage from 'metascraper-image';
import metascraperAuthor from 'metascraper-author';
import metascraperDate from 'metascraper-date';

const server = new Server(
  {
    name: 'web-content-extractor',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Global browser instance for reuse
let browserInstance: Browser | null = null;

// Initialize metascraper
const scraper = metascraper([
  metascraperTitle(),
  metascraperDescription(),
  metascraperUrl(),
  metascraperImage(),
  metascraperAuthor(),
  metascraperDate()
]);

// Initialize Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**'
});

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'extract_article',
        description: 'Extract clean article content from any URL as agent-optimized markdown. Uses advanced content extraction to get main article text, metadata, and reading stats. Perfect for agents processing news, blogs, documentation.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to extract content from'
            },
            options: {
              type: 'object',
              properties: {
                include_metadata: { type: 'boolean', default: true, description: 'Include title, author, date, word count metadata' },
                max_length: { type: 'number', default: 50000, description: 'Maximum content length in characters (prevents token overflow)' },
                include_images: { type: 'boolean', default: false, description: 'Include image URLs and alt text in markdown' },
                remove_nav: { type: 'boolean', default: true, description: 'Remove navigation, sidebar, footer content' },
                javascript_enabled: { type: 'boolean', default: false, description: 'Enable JavaScript rendering for SPA content' }
              },
              additionalProperties: false
            }
          },
          required: ['url']
        }
      },
      {
        name: 'extract_structured_data',
        description: 'Extract structured data (tables, lists, key-value pairs) from any webpage as JSON. Perfect for agents that need to process data tables, pricing lists, feature comparisons, or any structured web content.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to extract structured data from'
            },
            data_types: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['tables', 'lists', 'forms', 'navigation', 'breadcrumbs', 'metadata']
              },
              default: ['tables', 'lists'],
              description: 'Types of structured data to extract'
            },
            options: {
              type: 'object',
              properties: {
                clean_text: { type: 'boolean', default: true, description: 'Clean and normalize extracted text' },
                include_context: { type: 'boolean', default: true, description: 'Include surrounding context for each data element' },
                javascript_enabled: { type: 'boolean', default: false, description: 'Enable JavaScript for dynamic content' }
              },
              additionalProperties: false
            }
          },
          required: ['url']
        }
      },
      {
        name: 'extract_links',
        description: 'Get all links from a webpage with intelligent categorization and context. Returns internal/external links, link text, and destination context. Essential for agents doing competitive analysis, site mapping, or link discovery.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to extract links from'
            },
            filter_options: {
              type: 'object',
              properties: {
                link_types: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['internal', 'external', 'email', 'tel', 'download', 'social']
                  },
                  default: ['internal', 'external'],
                  description: 'Types of links to extract'
                },
                min_text_length: { type: 'number', default: 1, description: 'Minimum link text length (filters noise)' },
                exclude_fragments: { type: 'boolean', default: true, description: 'Exclude anchor links (#section)' },
                include_context: { type: 'boolean', default: true, description: 'Include surrounding text context' }
              },
              additionalProperties: false
            }
          },
          required: ['url']
        }
      },
      {
        name: 'screenshot_to_markdown',
        description: 'Take a screenshot of a webpage and convert visual layout to structured markdown description. Perfect for agents that need to understand page layout, UI elements, or visual content when text extraction is insufficient.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to screenshot and analyze'
            },
            options: {
              type: 'object',
              properties: {
                viewport_width: { type: 'number', default: 1280, description: 'Viewport width in pixels' },
                viewport_height: { type: 'number', default: 720, description: 'Viewport height in pixels' },
                full_page: { type: 'boolean', default: false, description: 'Capture full page (vs. viewport only)' },
                wait_for_load: { type: 'number', default: 2000, description: 'Wait time in ms for page load' },
                describe_layout: { type: 'boolean', default: true, description: 'Generate markdown description of layout' },
                include_colors: { type: 'boolean', default: false, description: 'Include color information in description' }
              },
              additionalProperties: false
            }
          },
          required: ['url']
        }
      },
      {
        name: 'batch_extract',
        description: 'Process multiple URLs in parallel and return consolidated results. Highly efficient for agents that need to analyze multiple pages, compare content, or do batch research. Includes rate limiting and error recovery.',
        inputSchema: {
          type: 'object',
          properties: {
            urls: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 10,
              description: 'Array of URLs to process (max 10 for performance)'
            },
            extraction_type: {
              type: 'string',
              enum: ['article', 'structured_data', 'links', 'metadata_only'],
              default: 'article',
              description: 'Type of extraction to perform on all URLs'
            },
            options: {
              type: 'object',
              properties: {
                concurrent_limit: { type: 'number', default: 3, description: 'Maximum concurrent requests' },
                timeout_ms: { type: 'number', default: 30000, description: 'Timeout per URL in milliseconds' },
                continue_on_error: { type: 'boolean', default: true, description: 'Continue processing if some URLs fail' },
                include_timing: { type: 'boolean', default: false, description: 'Include processing time for each URL' }
              },
              additionalProperties: false
            }
          },
          required: ['urls']
        }
      }
    ]
  };
});

// Tool implementation handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'extract_article': {
        const { url, options = {} } = args as {
          url: string;
          options?: {
            include_metadata?: boolean;
            max_length?: number;
            include_images?: boolean;
            remove_nav?: boolean;
            javascript_enabled?: boolean;
          };
        };

        const result = await extractArticleContent(url, options);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'extract_structured_data': {
        const { url, data_types = ['tables', 'lists'], options = {} } = args as {
          url: string;
          data_types?: string[];
          options?: {
            clean_text?: boolean;
            include_context?: boolean;
            javascript_enabled?: boolean;
          };
        };

        const result = await extractStructuredData(url, data_types, options);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'extract_links': {
        const { url, filter_options = {} } = args as {
          url: string;
          filter_options?: {
            link_types?: string[];
            min_text_length?: number;
            exclude_fragments?: boolean;
            include_context?: boolean;
          };
        };

        const result = await extractLinks(url, filter_options);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'screenshot_to_markdown': {
        const { url, options = {} } = args as {
          url: string;
          options?: {
            viewport_width?: number;
            viewport_height?: number;
            full_page?: boolean;
            wait_for_load?: number;
            describe_layout?: boolean;
            include_colors?: boolean;
          };
        };

        const result = await screenshotToMarkdown(url, options);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'batch_extract': {
        const { urls, extraction_type = 'article', options = {} } = args as {
          urls: string[];
          extraction_type?: 'article' | 'structured_data' | 'links' | 'metadata_only';
          options?: {
            concurrent_limit?: number;
            timeout_ms?: number;
            continue_on_error?: boolean;
            include_timing?: boolean;
          };
        };

        const result = await batchExtract(urls, extraction_type, options);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            tool: name,
            url: (args as any).url || 'unknown'
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Helper functions

async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
  }
  return browserInstance;
}

async function extractArticleContent(url: string, options: any) {
  const startTime = Date.now();
  
  try {
    let html: string;
    let metadata: any = {};

    if (options.javascript_enabled) {
      // Use Playwright for JavaScript-enabled pages
      const browser = await getBrowser();
      const page = await browser.newPage();
      
      try {
        await page.goto(url, { waitUntil: 'networkidle' });
        html = await page.content();
      } finally {
        await page.close();
      }
    } else {
      // Simple fetch for static content
      const response = await fetch(url);
      html = await response.text();
    }

    // Extract metadata
    if (options.include_metadata !== false) {
      metadata = await scraper({ html, url });
    }

    // Use Readability for content extraction
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('Could not extract article content from this URL');
    }

    // Convert to markdown
    let content = turndownService.turndown(article.content);

    // Apply length limit
    if (options.max_length && content.length > options.max_length) {
      content = content.substring(0, options.max_length) + '\n\n[Content truncated...]';
    }

    // Calculate stats
    const wordCount = content.split(/\s+/).length;
    const readingTimeMinutes = Math.ceil(wordCount / 200); // Average reading speed

    return {
      success: true,
      url,
      metadata: {
        title: article.title || metadata.title || 'No title found',
        author: metadata.author || 'Unknown',
        published_date: metadata.date || null,
        description: metadata.description || null,
        image: metadata.image || null,
        word_count: wordCount,
        reading_time_minutes: readingTimeMinutes,
        extraction_time_ms: Date.now() - startTime
      },
      content,
      content_type: 'markdown'
    };

  } catch (error) {
    return {
      success: false,
      url,
      error: error instanceof Error ? error.message : 'Unknown error',
      extraction_time_ms: Date.now() - startTime
    };
  }
}

async function extractStructuredData(url: string, dataTypes: string[], options: any) {
  const startTime = Date.now();
  
  try {
    let html: string;

    if (options.javascript_enabled) {
      const browser = await getBrowser();
      const page = await browser.newPage();
      
      try {
        await page.goto(url, { waitUntil: 'networkidle' });
        html = await page.content();
      } finally {
        await page.close();
      }
    } else {
      const response = await fetch(url);
      html = await response.text();
    }

    const dom = new JSDOM(html, { url });
    const document = dom.window.document;
    const result: any = {
      success: true,
      url,
      extracted_data: {},
      extraction_time_ms: 0
    };

    // Extract tables
    if (dataTypes.includes('tables')) {
      const tables = Array.from(document.querySelectorAll('table')).map((table: Element, index) => {
        const rows = Array.from(table.querySelectorAll('tr')).map((row: Element) => {
          return Array.from(row.querySelectorAll('td, th')).map(cell => {
            const text = (cell as Element).textContent?.trim() || '';
            return options.clean_text ? cleanText(text) : text;
          });
        });

        return {
          table_index: index,
          rows,
          row_count: rows.length,
          column_count: rows[0]?.length || 0,
          context: options.include_context ? getElementContext(table as Element) : null
        };
      });

      result.extracted_data.tables = tables;
    }

    // Extract lists
    if (dataTypes.includes('lists')) {
      const lists = Array.from(document.querySelectorAll('ul, ol')).map((list: Element, index) => {
        const items = Array.from(list.querySelectorAll('li')).map(li => {
          const text = (li as Element).textContent?.trim() || '';
          return options.clean_text ? cleanText(text) : text;
        });

        return {
          list_index: index,
          type: (list as Element).tagName.toLowerCase(),
          items,
          item_count: items.length,
          context: options.include_context ? getElementContext(list as Element) : null
        };
      });

      result.extracted_data.lists = lists;
    }

    // Extract forms
    if (dataTypes.includes('forms')) {
      const forms = Array.from(document.querySelectorAll('form')).map((form: Element, index) => {
        const fields = Array.from(form.querySelectorAll('input, select, textarea')).map((field: Element) => ({
          name: (field as HTMLInputElement).name || '',
          type: (field as HTMLInputElement).type || field.tagName.toLowerCase(),
          required: (field as HTMLInputElement).required || false,
          placeholder: (field as HTMLInputElement).placeholder || ''
        }));

        return {
          form_index: index,
          action: (form as HTMLFormElement).action || '',
          method: (form as HTMLFormElement).method || 'get',
          fields,
          field_count: fields.length
        };
      });

      result.extracted_data.forms = forms;
    }

    result.extraction_time_ms = Date.now() - startTime;
    return result;

  } catch (error) {
    return {
      success: false,
      url,
      error: error instanceof Error ? error.message : 'Unknown error',
      extraction_time_ms: Date.now() - startTime
    };
  }
}

async function extractLinks(url: string, filterOptions: any) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    const baseUrl = new URL(url);
    const links = Array.from(document.querySelectorAll('a[href]')).map(link => {
      const href = (link as HTMLAnchorElement).href;
      const text = (link as Element).textContent?.trim() || '';
      
      if (!href || text.length < (filterOptions.min_text_length || 1)) {
        return null;
      }

      try {
        const linkUrl = new URL(href, baseUrl);
        
        // Categorize link
        let linkType = 'external';
        if (linkUrl.hostname === baseUrl.hostname) {
          linkType = 'internal';
        } else if (href.startsWith('mailto:')) {
          linkType = 'email';
        } else if (href.startsWith('tel:')) {
          linkType = 'tel';
        } else if (href.match(/\.(pdf|doc|zip|mp3|mp4|jpg|png)$/i)) {
          linkType = 'download';
        } else if (linkUrl.hostname.match(/(twitter|facebook|instagram|linkedin|youtube)\.com/)) {
          linkType = 'social';
        }

        // Filter by type
        if (filterOptions.link_types && !filterOptions.link_types.includes(linkType)) {
          return null;
        }

        // Exclude fragments if requested
        if (filterOptions.exclude_fragments && href.startsWith('#')) {
          return null;
        }

        return {
          url: linkUrl.toString(),
          text: cleanText(text),
          type: linkType,
          context: filterOptions.include_context ? getElementContext(link as Element) : null
        };
      } catch {
        return null; // Invalid URL
      }
    }).filter(Boolean);

    return {
      success: true,
      url,
      links,
      link_count: links.length,
      extraction_time_ms: Date.now() - startTime
    };

  } catch (error) {
    return {
      success: false,
      url,
      error: error instanceof Error ? error.message : 'Unknown error',
      extraction_time_ms: Date.now() - startTime
    };
  }
}

async function screenshotToMarkdown(url: string, options: any) {
  const startTime = Date.now();
  
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    
    try {
      await page.setViewportSize({
        width: options.viewport_width || 1280,
        height: options.viewport_height || 720
      });

      await page.goto(url, { waitUntil: 'networkidle' });
      
      if (options.wait_for_load) {
        await page.waitForTimeout(options.wait_for_load);
      }

      // Take screenshot (we'll return base64 for now, could save to file)
      const screenshot = await page.screenshot({
        fullPage: options.full_page || false,
        type: 'png'
      });

      let layout_description = '';
      if (options.describe_layout) {
        // Extract basic layout information
        const layoutInfo = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('h1, h2, h3, nav, main, aside, footer, .menu, .sidebar'));
          return elements.map(el => ({
            tag: el.tagName.toLowerCase(),
            text: el.textContent?.substring(0, 50).trim() || '',
            className: el.className || '',
            position: el.getBoundingClientRect()
          }));
        });

        layout_description = generateLayoutMarkdown(layoutInfo);
      }

      return {
        success: true,
        url,
        screenshot_base64: screenshot.toString('base64'),
        layout_description,
        viewport: {
          width: options.viewport_width || 1280,
          height: options.viewport_height || 720
        },
        extraction_time_ms: Date.now() - startTime
      };

    } finally {
      await page.close();
    }

  } catch (error) {
    return {
      success: false,
      url,
      error: error instanceof Error ? error.message : 'Unknown error',
      extraction_time_ms: Date.now() - startTime
    };
  }
}

async function batchExtract(urls: string[], extractionType: string, options: any) {
  const startTime = Date.now();
  const concurrentLimit = options.concurrent_limit || 3;
  const results: any[] = [];
  
  // Process URLs in batches to respect concurrent limit
  for (let i = 0; i < urls.length; i += concurrentLimit) {
    const batch = urls.slice(i, i + concurrentLimit);
    const batchPromises = batch.map(async (url) => {
      const urlStartTime = Date.now();
      
      try {
        let result;
        switch (extractionType) {
          case 'article':
            result = await extractArticleContent(url, {});
            break;
          case 'structured_data':
            result = await extractStructuredData(url, ['tables', 'lists'], {});
            break;
          case 'links':
            result = await extractLinks(url, {});
            break;
          case 'metadata_only':
            const response = await fetch(url);
            const html = await response.text();
            const metadata = await scraper({ html, url });
            result = {
              success: true,
              url,
              metadata,
              extraction_time_ms: Date.now() - urlStartTime
            };
            break;
          default:
            throw new Error(`Unknown extraction type: ${extractionType}`);
        }

        if (options.include_timing) {
          result.processing_time_ms = Date.now() - urlStartTime;
        }

        return result;
      } catch (error) {
        if (!options.continue_on_error) {
          throw error;
        }
        return {
          success: false,
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
          processing_time_ms: options.include_timing ? Date.now() - urlStartTime : undefined
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;

  return {
    success: true,
    extraction_type: extractionType,
    total_urls: urls.length,
    successful_extractions: successful,
    failed_extractions: failed,
    results,
    total_time_ms: Date.now() - startTime
  };
}

// Utility functions
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

function getElementContext(element: Element): string {
  const parent = element.parentElement;
  if (!parent) return '';
  
  const siblings = Array.from(parent.children);
  const index = siblings.indexOf(element);
  const prevText = siblings[index - 1]?.textContent?.trim().substring(0, 50) || '';
  const nextText = siblings[index + 1]?.textContent?.trim().substring(0, 50) || '';
  
  return `Previous: ${prevText} | Next: ${nextText}`;
}

function generateLayoutMarkdown(layoutInfo: any[]): string {
  let markdown = '# Page Layout Analysis\n\n';
  
  const headings = layoutInfo.filter(el => el.tag.match(/^h[1-6]$/));
  if (headings.length > 0) {
    markdown += '## Headings Structure\n';
    headings.forEach(h => {
      const level = '#'.repeat(parseInt(h.tag.charAt(1)));
      markdown += `${level} ${h.text}\n`;
    });
    markdown += '\n';
  }

  const navElements = layoutInfo.filter(el => el.tag === 'nav' || el.className.includes('menu'));
  if (navElements.length > 0) {
    markdown += '## Navigation Elements\n';
    navElements.forEach(nav => {
      markdown += `- ${nav.text}\n`;
    });
    markdown += '\n';
  }

  return markdown;
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Web Content Extractor MCP server running on stdio');
}

// Cleanup on exit
process.on('SIGINT', async () => {
  if (browserInstance) {
    await browserInstance.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (browserInstance) {
    await browserInstance.close();
  }
  process.exit(0);
});

if (require.main === module) {
  main().catch(console.error);
}