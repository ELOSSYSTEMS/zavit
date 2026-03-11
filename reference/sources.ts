export type SourceConfig = {
    name: string;
    url: string;
    type: 'rss' | 'sitemap';
    rssUrl?: string;
    sitemapUrl?: string;
    selectors?: {
        item?: string;
        title?: string;
        link?: string;
        date?: string;
    };
};

export const SOURCES: SourceConfig[] = [
    // === TIER 1: Major Broadcasters ===
    {
        name: 'Ynet',
        url: 'https://www.ynet.co.il',
        type: 'rss',
        rssUrl: 'https://www.ynet.co.il/Integration/StoryRss2.xml',
    },
    {
        name: 'N12',
        url: 'https://www.mako.co.il/news',
        type: 'rss',
        rssUrl: 'https://rcs.mako.co.il/rss/31750a2610f26110VgnVCM1000005201000aRCRD.xml',
    },
    {
        name: 'Walla',
        url: 'https://news.walla.co.il',
        type: 'rss',
        rssUrl: 'https://rss.walla.co.il/feed/1?type=main',
    },
    {
        name: 'Walla Flashes',
        url: 'https://news.walla.co.il',
        type: 'rss',
        rssUrl: 'https://rss.walla.co.il/feed/22',
    },
    {
        name: 'Mako Homepage',
        url: 'https://www.mako.co.il',
        type: 'rss',
        rssUrl: 'https://storage.googleapis.com/mako-sitemaps/rssHomepage.xml',
    },
    {
        name: 'Mako Politics',
        url: 'https://www.mako.co.il',
        type: 'rss',
        rssUrl: 'https://rcs.mako.co.il/rss/news-military.xml',
    },
    {
        name: 'Haaretz',
        url: 'https://www.haaretz.co.il',
        type: 'rss',
        rssUrl: 'https://www.haaretz.co.il/cmlink/1.1617539',
    },
    {
        name: 'Maariv',
        url: 'https://www.maariv.co.il',
        type: 'rss',
        rssUrl: 'https://www.maariv.co.il/Rss/RssFeedsMivzakim',
    },
    {
        name: 'Israel Hayom',
        url: 'https://www.israelhayom.co.il',
        type: 'rss',
        rssUrl: 'https://www.israelhayom.co.il/rss.xml',
    },

    // === TIER 2: Sectorial ===
    {
        name: 'Makor Rishon',
        url: 'https://www.makorrishon.co.il',
        type: 'rss',
        rssUrl: 'https://www.makorrishon.co.il/feed/',
    },
    {
        name: 'Srugim',
        url: 'https://www.srugim.co.il',
        type: 'rss',
        rssUrl: 'https://www.srugim.co.il/feed',
    },
    {
        name: 'Davar',
        url: 'https://www.davar1.co.il',
        type: 'rss',
        rssUrl: 'https://www.davar1.co.il/feed/',
    },

    // === ENGLISH OUTLETS ===
    {
        name: 'Times of Israel',
        url: 'https://www.timesofisrael.com',
        type: 'rss',
        rssUrl: 'https://www.timesofisrael.com/feed/',
    },
    {
        name: 'Jerusalem Post',
        url: 'https://www.jpost.com',
        type: 'rss',
        rssUrl: 'https://www.jpost.com//rss/rssfeedsfrontpage.aspx',
    },
    {
        name: 'Jerusalem Post All News',
        url: 'https://www.jpost.com',
        type: 'rss',
        rssUrl: 'https://www.jpost.com//rss/rssallnews',
    },
    {
        name: 'Israel National News',
        url: 'https://www.israelnationalnews.com',
        type: 'rss',
        rssUrl: 'https://www.israelnationalnews.com/rss',
    },
    {
        name: 'Jewish News Syndicate',
        url: 'https://www.jns.org',
        type: 'rss',
        rssUrl: 'https://www.jns.org/feed/',
    },
];
