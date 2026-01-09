import { withBase } from "./utils/helpers";

export type Image = {
    src: string;
    alt?: string;
    caption?: string;
};

export type Link = {
    text: string;
    href: string;
};

export type Hero = {
    eyebrowText?: string;
    title?: string;
    text?: string;
    image?: Image;
    actions?: Link[];
};

export type About = {
    title?: string;
    text?: string;
};

export type Blog = {
    description?: string;
};

export type ContactInfo = {
    title?: string;
    text?: string;
    email?: {
        text?: string;
        href?: string;
        email?: string;
    };
    socialProfiles?: {
        text?: string;
        href?: string;
    }[];
};

export type SiteConfig = {
    website: string;
    logo?: Image;
    title: string;
    description: string;
    image?: Image;
    headerNavLinks?: Link[];
    footerNavLinks?: Link[];
    socialLinks?: Link[];
    hero?: Hero;
    about?: About;
    contactInfo?: ContactInfo;
    blog?: Blog;
    postsPerPage?: number;
    recentPostLimit: number;
    projectsPerPage?: number;
};

const siteConfig: SiteConfig = {
    website: 'https://example.com',
    title: 'Caring Hearts',
    description: 'Care for children who think differently',
    image: {
        src: '/caring-hearts-preview.jpeg',
        alt: 'Caring Hearts - Care for children who think differently'
    },
    headerNavLinks: [
        {
            text: 'Home',
            href: withBase('/')
        },
        {
            text: 'Support Card',
            href: withBase('/support-card/')
        },
        {
            text: 'Help',
            href: withBase('/help/')
        },
        // new blog link
        {
            text: 'Blog',
            href: withBase('/blog/')
        }
    ],
    footerNavLinks: [
        {
            text: 'Contact',
            href: withBase('/contact')
        },
        {
            text: 'RSS Feed',
            href: withBase('/rss.xml')
        },
        {
            text: 'Sitemap',
            href: withBase('/sitemap-index.xml')
        }
    ],
    socialLinks: [
        {
            text: "LinkedIn",
            href: "https://www.linkedin.com/"
        },
        {
            text: "Peerlist",
            href: "https://www.peerlist.io/"
        },
        {
            text: "GitHub",
            href: "https://github.com/"
        }
    ],
    hero: {
        eyebrowText: 'Support & Resources',
        title: 'Caring Hearts',
        text: 'Supporting children who think differently',
        image: {
            src: '/assets/images/pixeltrue-space-discovery.svg',
            alt: 'A person sitting at a desk in front of a computer'
        },
        actions: [
            {
                text: 'Get Help',
                href: withBase('/help/')
            },
            {
                text: 'Learn More',
                href: withBase('/about-us/')
            }
        ]
    },
    about: {
        title: 'About',
        text: 'Caring Hearts is dedicated to supporting families and children with autism and neurodivergence. We provide accessible resources, practical guidance, and community connection to help children thrive.',
    },
    contactInfo: {
        title: 'Contact',
        text: "Hi! Whether you have a question, a suggestion, or just want to share your thoughts, I'm all ears. Feel free to get in touch through any of the methods below:",
        email: {
            text: "Drop me an email and I’ll do my best to respond as soon as possible.",
            href: "mailto:example@example.com",
            email: "example@example.com"
        },
        socialProfiles: [
            {
                text: "LinkedIn",
                href: "https://www.linkedin.com/"
            },
            {
                text: "Peerlist",
                href: "https://www.peerlist.io/"
            },
            {
                text: "GitHub",
                href: "https://github.com/"
            }
        ]
    },
    blog: {
        // make this descriptive so your blog listing page can show useful text
        description: "Articles, ideas and practical resources about supporting neurodivergent children — tips, how-tos, and stories."
    },
    postsPerPage: 2,
    recentPostLimit: 3
};

export default siteConfig;
