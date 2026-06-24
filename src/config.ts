// Site Configuration
// Rentra - Property Distribution Platform

export interface SiteConfig {
  language: string;
  siteTitle: string;
  siteDescription: string;
}

export const siteConfig: SiteConfig = {
  language: "en",
  siteTitle: "Rentra - Property Distribution Platform",
  siteDescription: "Rentra connects landlords, agents, and tenants to close rental deals faster. The structured marketplace for property listings.",
};

// Hero Section
export interface HeroConfig {
  backgroundText: string;
  heroImage: string;
  heroImageAlt: string;
  overlayText: string;
  brandName: string;
  navLinks: { label: string; href: string; submenu?: { label: string; href: string }[] }[];
}

export const heroConfig: HeroConfig = {
  backgroundText: "RENTRA",
  heroImage: "/hero-agent2.png",
  heroImageAlt: "Professional real estate agent",
  overlayText: "Find Your Perfect Home",
  brandName: "Rentra",

  navLinks: [
    {
      label: "Properties",
      href: "/listings",
      submenu: [
        { label: "Browse Properties", href: "/listings" },
        { label: "Search By Location", href: "/listings" },
        { label: "Book Inspection", href: "/book-inspection" },
      ]
    },
    { label: "How It Works", href: "#how-it-works" },
    { label: "About", href: "#about" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "#faq" },
  ],
};

// Intro Grid Section
export interface PortfolioImage {
  src: string;
  alt: string;
}

export interface IntroGridConfig {
  titleLine1: string;
  titleLine2: string;
  description: string;
  portfolioImages: PortfolioImage[];
  accentText: string;
}

export const introGridConfig: IntroGridConfig = {
  titleLine1: "The Property",
  titleLine2: "Marketplace",
  description: "Instead of houses hidden in WhatsApp statuses and scattered Telegram groups, Rentra puts listings into a structured marketplace where landlords list properties, agents promote them, and tenants find them easily.",
  portfolioImages: [
    { src: "/property-1.jpg", alt: "Modern luxury apartment interior" },
    { src: "/property-8.jpg", alt: "Beautiful modern house exterior" },
    { src: "/property-6.jpg", alt: "Cozy studio apartment" },
    { src: "/property-6.jpg", alt: "Luxury penthouse balcony view" },
    { src: "/property-5.jpg", alt: "Modern bedroom interior" },
  ],
  accentText: "Verified Listings - 2024",
};

// Featured Projects Section - How It Works
export interface Project {
  id: number;
  title: string;
  category: string;
  year: string;
  image: string;
  description: string;
}

export interface FeaturedProjectsConfig {
  subtitle: string;
  titleRegular: string;
  titleItalic: string;
  viewAllText: string;
  viewAllHref: string;
  viewProjectText: string;
  projects: Project[];
}

export const featuredProjectsConfig: FeaturedProjectsConfig = {
  subtitle: "How It Works",
  titleRegular: "Three Simple",
  titleItalic: "Steps",
  viewAllText: "Get Started Today",
  viewAllHref: "#",
  viewProjectText: "Learn More",
  projects: [
    {
      id: 1,
      title: "Landlords Post Properties",
      category: "Step 1",
      year: "",
      image: "/landlord.jpg",
      description: "Landlords post properties with photos, set rent price, and define agent commission. Once posted, agents can start promoting immediately.",
    },
    {
      id: 2,
      title: "Agents Promote Listings",
      category: "Step 2",
      year: "",
      image: "/agent.jpg",
      description: "Agents browse available listings, generate referral links, and promote properties to their network. Earn commission when deals close.",
    },
    {
      id: 3,
      title: "Tenants Find Homes",
      category: "Step 3",
      year: "",
      image: "/tenants.jpg",
      description: "Tenants search by location, filter by price and type, view verified listings, and book inspections. No more chasing agents.",
    },
  ],
};

// Services Section
export interface ServiceItem {
  iconName: string;
  title: string;
  description: string;
}

export interface ServicesConfig {
  subtitle: string;
  titleLine1: string;
  titleLine2Italic: string;
  description: string;
  services: ServiceItem[];
}

export const servicesConfig: ServicesConfig = {
  subtitle: "For Everyone",
  titleLine1: "Who Is Rentra",
  titleLine2Italic: "For?",
  description: "Rentra serves three key players in the rental ecosystem, making the process smoother for everyone involved.",
  services: [
    {
      iconName: "Home",
      title: "Landlords",
      description: "Post properties, upload photos, set rent prices and commission. Get maximum exposure through our agent network.",
    },
    {
      iconName: "Users",
      title: "Agents",
      description: "Browse listings, generate referral links, promote to tenants, and earn commission when deals close. Become a distribution partner.",
    },
    {
      iconName: "Search",
      title: "Tenants",
      description: "Search by location, filter by price and bedrooms, view verified listings, and book inspections directly.",
    },
    {
      iconName: "Shield",
      title: "Verified Listings",
      description: "All properties are verified to ensure quality. No more fake listings or wasted time on properties already taken.",
    },
  ],
};

// Why Choose Me Section
export interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

export interface FeatureCard {
  image: string;
  imageAlt: string;
  title: string;
  description: string;
}

export interface WhyChooseMeConfig {
  subtitle: string;
  titleRegular: string;
  titleItalic: string;
  statsLabel: string;
  stats: StatItem[];
  featureCards: FeatureCard[];
  wideImage: string;
  wideImageAlt: string;
  wideTitle: string;
  wideDescription: string;
}

export const whyChooseMeConfig: WhyChooseMeConfig = {
  subtitle: "Why Rentra",
  titleRegular: "The Better Way to",
  titleItalic: "Rent",
  statsLabel: "By The Numbers",
  stats: [
    { value: 3, suffix: "x", label: "Faster Deals" },
    { value: 100, suffix: "%", label: "Verified Listings" },
    { value: 24, suffix: "h", label: "Average Response" },
    { value: 0, suffix: "", label: "Hidden Fees" },
  ],
  featureCards: [
    {
      image: "/property-7.jpg",
      imageAlt: "Modern house",
      title: "Structured Marketplace",
      description: "No more WhatsApp chaos. All listings in one searchable platform with filters and verification.",
    },
    {
      image: "/property-8.jpg",
      imageAlt: "Penthouse view",
      title: "Agent Network",
      description: "Listings spread faster through our agent distribution network. More exposure means faster deals.",
    },
  ],
  wideImage: "/city-skyline.jpg",
  wideImageAlt: "City skyline",
  wideTitle: "The Future of Renting",
  wideDescription: "Clean. Simple. Functional. Rentra is infrastructure that helps the rental market operate better.",
};

// Testimonials Section
export interface Testimonial {
  id: number;
  name: string;
  role: string;
  image: string;
  quote: string;
}

export interface TestimonialsConfig {
  subtitle: string;
  titleRegular: string;
  titleItalic: string;
  testimonials: Testimonial[];
}

export const testimonialsConfig: TestimonialsConfig = {
  subtitle: "Success Stories",
  titleRegular: "What Our Users",
  titleItalic: "Say",
  testimonials: [
    {
      id: 1,
      name: "Chioma Adeyemi",
      role: "Landlord, Lagos",
      image: "/testimonial-1.jpg",
      quote:
        "Rentra helped me fill my vacant apartments in just 2 weeks. The agent network is incredible - my properties got exposure I never had before.",
    },
    {
      id: 2,
      name: "Emmanuel Okafor",
      role: "Real Estate Agent, Abuja",
      image: "/testimonial-2.jpg",
      quote:
        "As an agent, Rentra has transformed how I work. I can browse verified listings, share referral links, and track my commissions all in one place.",
    },
    {
      id: 3,
      name: "Sarah Johnson",
      role: "Tenant, Port Harcourt",
      image: "/testimonial-3.jpg",
      quote:
        "I found my dream apartment in 3 days. No more scrolling through WhatsApp statuses or getting ghosted by agents. Rentra just works.",
    },
    {
      id: 4,
      name: "Chioma Adeyemi",
      role: "Landlord, Lagos",
      image: "/testimonial-1.jpg",
      quote:
        "Rentra helped me fill my vacant apartments in just 2 weeks. The agent network is incredible - my properties got exposure I never had before.",
    },
  ],
};

// FAQ Section
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQConfig {
  subtitle: string;
  titleRegular: string;
  titleItalic: string;
  ctaText: string;
  ctaButtonText: string;
  ctaHref: string;
  faqs: FAQItem[];
}

export const faqConfig: FAQConfig = {
  subtitle: "Common Questions",
  titleRegular: "Frequently Asked",
  titleItalic: "Questions",
  ctaText: "Still have questions?",
  ctaButtonText: "Contact Us",
  ctaHref: "mailto:hello@rentra.com",
  faqs: [
    {
      id: "1",
      question: "What is Rentra?",
      answer: "Rentra is a property distribution platform that connects landlords, agents, and tenants to close rental deals faster. We provide structured marketplace infrastructure for the rental market.",
    },
    {
      id: "2",
      question: "Is Rentra a real estate agency?",
      answer: "No. Rentra is not a property owner, real estate agency, or landlord. We are infrastructure that helps the market operate better - think of us like how Airbnb connects travelers and hosts.",
    },
    {
      id: "3",
      question: "How do agents earn commission?",
      answer: "Agents browse available listings, generate unique referral links, and promote properties to tenants. When a tenant books an inspection through their link and eventually rents the property, the agent earns the commission set by the landlord.",
    },
    {
      id: "4",
      question: "Are listings verified?",
      answer: "Yes, all listings on Rentra are verified to ensure quality and accuracy. We verify property details, ownership, and availability to protect both tenants and agents from fake listings.",
    },
    {
      id: "5",
      question: "How much does it cost to use Rentra?",
      answer: "Rentra is free for tenants to search and browse listings. Landlords pay a small fee to list properties, and agents earn commission only when they successfully close deals. No hidden fees.",
    },
    {
      id: "6",
      question: "What areas does Rentra cover?",
      answer: "Rentra currently operates in major Nigerian cities including Lagos, Abuja, and Port Harcourt. We are expanding to more locations soon.",
    },
  ],
};

// Footer Section
export interface SocialLink {
  iconName: string;
  href: string;
  label: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterConfig {
  logoText: string;
  contactLabel: string;
  email: string;
  locationText: string;
  navigationLabel: string;
  navLinks: FooterLink[];
  socialLabel: string;
  socialLinks: SocialLink[];
  tagline: string;
  copyright: string;
  bottomLinks: FooterLink[];
}

export const footerConfig: FooterConfig = {
  logoText: "RENTRA",
  contactLabel: "Get in Touch",
  email: "hello@rentra.com",
  locationText: "Lagos, Nigeria\nAbuja, Nigeria\nPort Harcourt, Nigeria",
  navigationLabel: "Navigation",
  navLinks: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "For Landlords", href: "#services" },
    { label: "For Agents", href: "#services" },
    { label: "For Tenants", href: "#services" },
    { label: "FAQ", href: "#faq" },
  ],
  socialLabel: "Follow Us",
  socialLinks: [
    { iconName: "Instagram", href: "#", label: "Instagram" },
    { iconName: "Twitter", href: "#", label: "Twitter" },
    { iconName: "Linkedin", href: "#", label: "LinkedIn" },
    { iconName: "Mail", href: "mailto:hello@rentra.com", label: "Email" },
  ],
  tagline: "Making renting faster\nand more transparent.",
  copyright: "© 2024 Rentra. All rights reserved.",
  bottomLinks: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};
