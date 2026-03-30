import { Actor } from 'apify';
import { PlaywrightCrawler, Dataset } from 'crawlee';

await Actor.init();

const input = await Actor.getInput();
const {
    startUrls = [],
    linkSelector = 'a[href]',
    maxPagesPerCrawl = 10,
    selectors,
    pageFunction,
    proxyConfiguration = { useApifyProxy: true },
} = input;

const proxy = await Actor.createProxyConfiguration(proxyConfiguration);

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

// Helper to extract emails from text using regex
function extractEmailsFromText(text) {
    if (!text) return [];
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];
    return [...new Set(matches)];
}

// Helper to extract phone numbers from text
function extractPhonesFromText(text) {
    if (!text) return [];
    const phonePatterns = [
        /\b0\d[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
        /\+353[\s.-]?\d[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
        /\b08\d[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
        /\b1\d{3}[\s.-]?\d{3}[\s.-]?\d{3}\b/g,
    ];
    
    const allMatches = [];
    for (const pattern of phonePatterns) {
        const matches = text.match(pattern) || [];
        allMatches.push(...matches);
    }
    
    return [...new Set(allMatches.map(p => p.replace(/\s+/g, ' ').trim()))];
}

const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: maxPagesPerCrawl > 1 ? maxPagesPerCrawl : undefined,
    proxyConfiguration: proxy,

    async requestHandler({ request, page, enqueueLinks, log }) {
        log.info(`Scraping ${request.url}`);

        let result = {
            url: request.url,
            title: null,
            description: null,
            emails: [],
            phoneNumbers: [],
            socialLinks: {},
            scannedPages: [],
            status: 'success',
            error: null,
        };

        try {
            if (pageFunction && typeof pageFunction === 'string' && pageFunction.trim().length > 0) {
                const fn = new AsyncFunction('request', 'page', 'log', pageFunction);
                const customResult = await fn(request, page, log);
                if (customResult && typeof customResult === 'object') {
                    result = { ...result, ...customResult };
                }
            } else if (selectors && typeof selectors === 'object' && Object.keys(selectors).length > 0) {
                for (const [key, selector] of Object.entries(selectors)) {
                    if (typeof selector !== 'string' || !selector.trim()) {
                        result[key] = null;
                        continue;
                    }
                    try {
                        const count = await page.locator(selector).count();
                        if (count === 0) {
                            result[key] = null;
                        } else if (count === 1) {
                            const text = await page.locator(selector).first().textContent();
                            result[key] = text?.trim() ?? null;
                        } else {
                            const texts = await page.locator(selector).allTextContents();
                            result[key] = texts.map((t) => t.trim()).filter(Boolean);
                        }
                    } catch (err) {
                        log.warning(`Failed to extract "${key}": ${err.message}`);
                        result[key] = null;
                    }
                }
            } else {
                // Default extraction with improved text gathering
                result.title = await page.title().catch(() => null);
                result.description = await page
                    .locator('meta[name="description"]')
                    .getAttribute('content')
                    .catch(() => null);

                // Wait for page to fully load
                try {
                    await page.waitForLoadState('load', { timeout: 10000 });
                } catch (e) {}
                
                try {
                    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
                } catch (e) {}

                // Wait for JavaScript to render content
                await page.waitForTimeout(5000);

                // Scroll to trigger lazy loading
                await page.evaluate(async () => {
                    await new Promise((resolve) => {
                        let totalHeight = 0;
                        const distance = 300;
                        const timer = setInterval(() => {
                            const scrollHeight = document.body?.scrollHeight || document.documentElement?.scrollHeight || 1000;
                            window.scrollTo(0, totalHeight);
                            totalHeight += distance;
                            if (totalHeight >= scrollHeight) {
                                clearInterval(timer);
                                resolve();
                            }
                        }, 200);
                        setTimeout(() => {
                            clearInterval(timer);
                            resolve();
                        }, 15000);
                    });
                });
                
                await page.waitForTimeout(3000);
                await page.evaluate(() => window.scrollTo(0, 0));

                // Extract text using multiple methods
                const extractionResults = await page.evaluate(() => {
                    const results = { sources: [], allText: [] };
                    
                    // Method 1: body innerText
                    try {
                        if (document.body) {
                            const text = document.body.innerText || '';
                            results.sources.push({ method: 'body.innerText', length: text.length });
                            results.allText.push(text);
                        }
                    } catch (e) {}
                    
                    // Method 2: documentElement
                    try {
                        const text = document.documentElement.innerText || '';
                        results.sources.push({ method: 'documentElement.innerText', length: text.length });
                        if (!results.allText.includes(text)) results.allText.push(text);
                    } catch (e) {}
                    
                    // Method 3: common containers
                    const containers = ['footer', '#SITE_FOOTER', '#site-footer', '.footer', '#footer', 'header', '#SITE_HEADER', '#site-header', 'main', '#PAGES_CONTAINER', '#site-root', '#root', '.content', '#content'];
                    for (const selector of containers) {
                        const el = document.querySelector(selector);
                        if (el) {
                            const text = el.innerText || '';
                            results.sources.push({ method: `querySelector(${selector})`, length: text.length });
                            if (!results.allText.includes(text)) results.allText.push(text);
                        }
                    }
                    
                    // Method 4: tree walker
                    try {
                        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
                        const texts = [];
                        let node;
                        while (node = walker.nextNode()) {
                            const text = node.textContent.trim();
                            if (text.length > 0) texts.push(text);
                        }
                        const combined = texts.join(' ');
                        results.sources.push({ method: 'treeWalker', length: combined.length });
                        if (!results.allText.includes(combined)) results.allText.push(combined);
                    } catch (e) {}
                    
                    // Method 5: all elements
                    try {
                        const elements = document.querySelectorAll('p, div, span, a, li, td, th, h1, h2, h3, h4, h5, h6');
                        const texts = [];
                        for (const el of elements) {
                            const text = el.innerText?.trim();
                            if (text && text.length > 0) texts.push(text);
                        }
                        const combined = texts.join(' ');
                        results.sources.push({ method: 'allElements', length: combined.length });
                        if (!results.allText.includes(combined)) results.allText.push(combined);
                    } catch (e) {}
                    
                    return results;
                }).catch(() => ({ sources: [], allText: [] }));

                const pageText = [...new Set(extractionResults.allText)].join(' ');
                
                // Emails from mailto links
                const mailtoLinks = await page.locator('a[href^="mailto:"]').all();
                const mailtoEmails = [];
                for (const link of mailtoLinks) {
                    try {
                        const href = await link.getAttribute('href');
                        if (href) {
                            const email = href.replace('mailto:', '').split('?')[0].trim();
                            if (email && email.includes('@')) mailtoEmails.push(email);
                        }
                    } catch (e) {}
                }

                const emailsFromText = extractEmailsFromText(pageText);
                result.emails = [...new Set([...mailtoEmails, ...emailsFromText])];

                // Phones from tel links
                const telLinks = await page.locator('a[href^="tel:"]').all();
                const telPhones = [];
                for (const link of telLinks) {
                    try {
                        const href = await link.getAttribute('href');
                        if (href) {
                            const phone = href.replace('tel:', '').trim();
                            if (phone) telPhones.push(phone);
                        }
                    } catch (e) {}
                }

                const phonesFromText = extractPhonesFromText(pageText);
                result.phoneNumbers = [...new Set([...telPhones, ...phonesFromText])];

                // Social links
                const socialPatterns = {
                    facebook: 'a[href*="facebook.com"]',
                    twitter: 'a[href*="twitter.com"], a[href*="x.com"]',
                    instagram: 'a[href*="instagram.com"]',
                    linkedin: 'a[href*="linkedin.com"]',
                    youtube: 'a[href*="youtube.com"]',
                    tiktok: 'a[href*="tiktok.com"]',
                };

                for (const [platform, pattern] of Object.entries(socialPatterns)) {
                    const links = await page.locator(pattern).all();
                    const hrefs = [];
                    for (const link of links) {
                        try {
                            const href = await link.getAttribute('href');
                            if (href) hrefs.push(href);
                        } catch (e) {}
                    }
                    const uniqueHrefs = [...new Set(hrefs)];
                    if (uniqueHrefs.length) result.socialLinks[platform] = uniqueHrefs;
                }

                // Internal links
                const allLinks = await page.locator('a[href]').all();
                const scannedHrefs = [];
                for (const link of allLinks) {
                    try {
                        const href = await link.getAttribute('href');
                        if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                            scannedHrefs.push(href);
                        }
                    } catch (e) {}
                }
                result.scannedPages = [...new Set(scannedHrefs)];

                log.info(`Found ${result.emails.length} emails and ${result.phoneNumbers.length} phones`);
            }
        } catch (err) {
            log.error(`Error processing ${request.url}: ${err.message}`);
            result.error = err.message;
            result.status = 'error';
        }

        await Dataset.pushData(result);

        if (linkSelector && typeof linkSelector === 'string' && linkSelector.trim().length > 0) {
            await enqueueLinks({ selector: linkSelector });
        }
    },

    async failedRequestHandler({ request, log }) {
        log.error(`Request ${request.url} failed too many times.`);
        await Dataset.pushData({
            url: request.url,
            title: null,
            description: null,
            emails: [],
            phoneNumbers: [],
            socialLinks: {},
            scannedPages: [],
            status: 'error',
            error: 'Request failed after retries',
        });
    },
});

await crawler.run(startUrls);
await Actor.exit();
