export interface MockFeedback {
  id: string;
  name: string;
  email: string;
  category: "bug" | "feature" | "general" | "compliment";
  rating: number;
  message: string;
  createdAt: Date;
  status: "new" | "read" | "archived";
}

export const MOCK_FEEDBACK: MockFeedback[] = [
  { id: "fb_001", name: "Sarah Chen", email: "sarah@skinglow.co", category: "compliment", rating: 5, message: "The background removal is insanely accurate — saved us hours of Photoshop work. Our product listings look so much more professional now.", createdAt: new Date(Date.now() - 1000 * 60 * 30), status: "new" },
  { id: "fb_002", name: "Marcus Wright", email: "marcus@creativelabs.io", category: "feature", rating: 4, message: "Would love a batch export option so I can download all generated images at once instead of one by one. Otherwise the tool is fantastic.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), status: "new" },
  { id: "fb_003", name: "Priya Patel", email: "priya@urbanwear.in", category: "bug", rating: 3, message: "The Uncrop tool sometimes produces blurry edges when expanding a portrait image to 9:16. Happens most on photos with soft backgrounds. Please fix!", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8), status: "read" },
  { id: "fb_004", name: "James O'Brien", email: "james@craftgoods.com", category: "general", rating: 4, message: "Solid product overall. The caption generation is a nice bonus — didn't expect it to produce copy this good. Would like more tone options.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), status: "read" },
  { id: "fb_005", name: "Aiko Tanaka", email: "aiko@luxebeauty.jp", category: "feature", rating: 5, message: "Please add a Canva or Shopify integration. Being able to push generated images directly to our store would be a game changer for our workflow.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), status: "read" },
  { id: "fb_006", name: "Leo Fernandez", email: "leo@tropicalgear.mx", category: "compliment", rating: 5, message: "Switched from a $300/month studio subscription to OpusGen AI and the results are honestly comparable. The lighting consistency blows my mind.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72), status: "archived" },
];

export interface MockGeneration {
  id: string;
  prompt: string;
  status: "completed" | "processing" | "failed";
  images: string[];
  creditsUsed: number;
  aspectRatio: string;
  createdAt: Date;
  templateId?: string;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  plan: "free" | "basic" | "pro";
  credits: number;
  totalGenerations: number;
  joinedAt: Date;
  lastActive: Date;
  status: "active" | "suspended";
}

function picsumUrl(seed: string, w = 512, h = 512) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

export const MOCK_GENERATIONS: MockGeneration[] = [
  {
    id: "gen_001",
    prompt: "Skincare serum bottle on a white marble surface with soft natural light and rose petals",
    status: "completed",
    images: [
      picsumUrl("cosmetic1"),
      picsumUrl("cosmetic2"),
      picsumUrl("bottle1"),
      picsumUrl("bottle2"),
    ],
    creditsUsed: 4,
    aspectRatio: "1:1",
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    templateId: "luxury-shoot",
  },
  {
    id: "gen_002",
    prompt: "Running shoes on a dark moody background with dramatic side lighting and motion blur effect",
    status: "completed",
    images: [
      picsumUrl("shoe1"),
      picsumUrl("fashion1"),
      picsumUrl("fashion2"),
      picsumUrl("product1"),
    ],
    creditsUsed: 4,
    aspectRatio: "4:5",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "gen_003",
    prompt: "Leather handbag on a wooden table with warm afternoon sunlight coming through a window",
    status: "completed",
    images: [
      picsumUrl("bag1"),
      picsumUrl("product2"),
      picsumUrl("product3"),
      picsumUrl("product4"),
    ],
    creditsUsed: 4,
    aspectRatio: "1:1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    templateId: "lifestyle-scene",
  },
  {
    id: "gen_004",
    prompt: "Premium perfume bottle with golden accents on obsidian surface, volumetric light rays",
    status: "completed",
    images: [
      picsumUrl("fashion2"),
      picsumUrl("cosmetic1"),
      picsumUrl("bottle2"),
      picsumUrl("product3"),
    ],
    creditsUsed: 4,
    aspectRatio: "9:16",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    templateId: "dark-editorial",
  },
];

export const MOCK_CREDIT_BALANCE = 7;

export const MOCK_CURRENT_USER = {
  id: "user_001",
  name: "Sarah Chen",
  email: "sarah@skinglow.co",
  plan: "free" as const,
  credits: MOCK_CREDIT_BALANCE,
  totalGenerations: 18,
  avatar: picsumUrl("avatar1", 128, 128),
};

export interface Plan {
  id: "free" | "basic" | "pro";
  name: string;
  price: number;
  originalPrice?: number;
  credits: number;
  features: string[];
  cta: string;
  highlight: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    credits: 10,
    features: ["10 credits to start", "All 6 tools", "Standard quality", "JPG download", "8 templates"],
    cta: "Get started free",
    highlight: false,
  },
  {
    id: "basic",
    name: "Basic",
    price: 9.99,
    credits: 35,
    features: ["35 credits/month", "All 6 tools", "HD quality", "PNG + JPG download", "All templates", "Social captions"],
    cta: "Get Basic",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 18,
    originalPrice: 25,
    credits: 100,
    features: ["100 credits/month", "All 6 tools", "4K upscale", "Batch processing", "Priority queue", "Caption studio", "All templates"],
    cta: "Get Pro",
    highlight: true,
  },
];

export const MOCK_ADMIN_USERS: MockUser[] = [
  {
    id: "user_001",
    name: "Sarah Chen",
    email: "sarah@skinglow.co",
    plan: "pro",
    credits: 340,
    totalGenerations: 87,
    joinedAt: new Date("2025-03-15"),
    lastActive: new Date(Date.now() - 1000 * 60 * 15),
    status: "active",
  },
  {
    id: "user_002",
    name: "Marcus Wright",
    email: "marcus@creativelabs.io",
    plan: "basic",
    credits: 62,
    totalGenerations: 245,
    joinedAt: new Date("2025-02-28"),
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 3),
    status: "active",
  },
  {
    id: "user_003",
    name: "Priya Patel",
    email: "priya@urbanwear.in",
    plan: "free",
    credits: 5,
    totalGenerations: 15,
    joinedAt: new Date("2025-05-10"),
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    status: "active",
  },
  {
    id: "user_004",
    name: "James O'Brien",
    email: "james@craftgoods.com",
    plan: "basic",
    credits: 0,
    totalGenerations: 98,
    joinedAt: new Date("2025-01-20"),
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    status: "active",
  },
  {
    id: "user_005",
    name: "Aiko Tanaka",
    email: "aiko@luxebeauty.jp",
    plan: "pro",
    credits: 489,
    totalGenerations: 312,
    joinedAt: new Date("2025-01-05"),
    lastActive: new Date(Date.now() - 1000 * 60 * 30),
    status: "active",
  },
];

export const MOCK_ADMIN_STATS = {
  totalUsers: 1284,
  usersToday: 23,
  totalGenerations: 48920,
  generationsToday: 892,
  creditsConsumedThisMonth: 12450,
  activeSubscriptions: 187,
  monthlyRevenue: 12453,
  successRate: 97.4,
};
