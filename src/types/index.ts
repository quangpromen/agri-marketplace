export interface NavigationItem {
  title: string;
  href: string;
  description?: string;
  children?: NavigationItem[];
  badge?: string;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    facebook: string;
    zalo: string;
    youtube: string;
  };
  contact: {
    address: string;
    hotline: string;
    phoneDisplay: string;
    email: string;
    workingHours: string;
  };
}

export interface Service {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  iconName: string;
  features: string[];
  imageUrl: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  category: string;
  location: string;
  scale: string;
  year: string;
  summary: string;
  description: string;
  imageUrl: string;
  results: string[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  author: {
    name: string;
    role: string;
    avatarUrl: string;
  };
  publishedAt: string;
  readTime: string;
  imageUrl: string;
  tags: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatarUrl: string;
  expertise: string[];
  socials?: {
    facebook?: string;
    linkedin?: string;
    email?: string;
  };
}

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  organization: string;
  content: string;
  rating: number;
  avatarUrl: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: "chung" | "dich-vu" | "nong-san" | "hop-tac";
}

export interface MetricStat {
  id: string;
  value: string;
  label: string;
  suffix?: string;
  description: string;
}

export interface CoreFeature {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface HistoryMilestone {
  year: string;
  title: string;
  description: string;
}
