// Type declarations for missing modules
declare module 'jsdom' {
  export class JSDOM {
    constructor(html: string, options?: { url?: string });
    window: {
      document: Document;
    };
  }
}

declare module 'turndown' {
  export default class TurndownService {
    constructor(options?: {
      headingStyle?: string;
      bulletListMarker?: string;
      codeBlockStyle?: string;
      emDelimiter?: string;
      strongDelimiter?: string;
    });
    turndown(html: string): string;
  }
}

declare module '@mozilla/readability' {
  export class Readability {
    constructor(document: Document);
    parse(): {
      title: string;
      content: string;
      textContent: string;
      length: number;
      excerpt: string;
      byline: string;
      dir: string;
    } | null;
  }
}

declare module 'metascraper' {
  interface MetascraperOptions {
    html: string;
    url: string;
  }
  
  interface MetascraperResult {
    title?: string;
    description?: string;
    author?: string;
    date?: string;
    image?: string;
    url?: string;
  }
  
  function metascraper(rules: any[]): (options: MetascraperOptions) => Promise<MetascraperResult>;
  export default metascraper;
}

declare module 'metascraper-title' {
  function title(): any;
  export default title;
}

declare module 'metascraper-description' {
  function description(): any;
  export default description;
}

declare module 'metascraper-url' {
  function url(): any;
  export default url;
}

declare module 'metascraper-image' {
  function image(): any;
  export default image;
}

declare module 'metascraper-author' {
  function author(): any;
  export default author;
}

declare module 'metascraper-date' {
  function date(): any;
  export default date;
}