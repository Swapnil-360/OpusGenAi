type PlatformId = "instagram" | "facebook" | "twitter" | "linkedin" | "pinterest" | "tiktok";
type ToneId = "luxury" | "professional" | "casual" | "trendy" | "sales";

export const CAPTION_BANK: Record<PlatformId, Record<ToneId, (p: string) => string[]>> = {
  instagram: {
    luxury:       (p) => [`✨ Introducing: ${p}\n\nCrafted for those who appreciate the extraordinary. Every detail, meticulously considered.\n\n#LuxuryLifestyle #PremiumQuality #NewArrival`, `Where precision meets artistry. 🖤\n\n${p} — the new standard.\n\n#Luxury #Craftsmanship #Premium`],
    professional: (p) => [`Proud to introduce ${p}.\n\nEngineered for performance. Built to last.\n\n#Innovation #Quality #Professional`, `${p} — precision-crafted for results.\n\nLink in bio.\n\n#ProductLaunch #Quality`],
    casual:       (p) => [`okay we're obsessed 😍 introducing ${p}\n\nseriously can't stop staring at this one!! ✨\n\n#NewDrop #Obsessed #MustHave`, `meet your new fave 🥰 ${p} just dropped and it's everything\n\n#NewArrival #Aesthetic`],
    trendy:       (p) => [`POV: You just found the most aesthetic ${p} 🤩✨\n\nMain character energy only 💅\n\n#fyp #aesthetic #trendy #viral`, `the ${p} era has officially started 🔥✨\n\n#Trending #NewDrop #Viral`],
    sales:        (p) => [`⚡ LIMITED STOCK — Don't miss out!\n\n${p} is selling FAST.\n\n✅ Free shipping\n✅ 30-day returns\n\n👉 Shop link in bio\n\n#SaleAlert #LimitedEdition`, `🚨 Almost sold out!\n\n${p} — grab yours before it's gone.\n\n#Sale #LastChance`],
  },
  facebook: {
    luxury:       (p) => [`We're thrilled to present ${p} — a masterpiece of form and function.\n\n#LuxuryBrand #NewArrival`, `${p}: Where luxury meets innovation.\n\nNow available. #Premium`],
    professional: (p) => [`Excited to share our newest addition: ${p}.\n\nDesigned with precision and built to perform.\n\n→ [Link]`, `Introducing ${p} — built for professionals.\n\nLearn more: [Link]`],
    casual:       (p) => [`Hey everyone! We just dropped something exciting — meet ${p}! 🎉\n\nDrop your questions in the comments! ❤️`, `We think you're going to love ${p} as much as we do 😊\n\nTell us what you think! 👇`],
    trendy:       (p) => [`Everyone's talking about ${p} and honestly… the hype is real 🔥\n\n#Trending #HotRightNow`, `${p} is having a moment and we are HERE for it 🙌`],
    sales:        (p) => [`🚨 LIMITED TIME OFFER 🚨\n\n${p} is selling out FAST.\n\n✅ Free shipping ✅ 30-day returns\n\nClaim yours → [Link]`, `Flash sale on ${p} — ends tonight!\n\nDon't wait. → [Link]`],
  },
  twitter: {
    luxury:       (p) => [`Luxury redefined. ${p} — now available. 🖤\n\n#NewDrop #Luxury`, `Some things are worth waiting for. ${p} is here. ✨`],
    professional: (p) => [`Introducing ${p}. Precision-crafted for quality.\n\n→ [link] #ProductLaunch`, `${p} — engineered for performance. #Launch`],
    casual:       (p) => [`okay ${p} just dropped and it's SO good 😭 #MustHave`, `can't stop thinking about ${p} tbh 😍 #NewDrop`],
    trendy:       (p) => [`${p} just dropped and I'm not okay 🔥 #fyp #viral #newdrop`, `the ${p} girlies are winning today ✨ #Trending`],
    sales:        (p) => [`⚡ FLASH SALE: ${p} — limited stock → [link] #Sale`, `Last chance: ${p} 30% off today only → [link]`],
  },
  linkedin: {
    luxury:       (p) => [`Excited to announce the launch of ${p}.\n\nEvery detail has been thoughtfully designed.\n\n#ProductLaunch #Luxury`, `${p} represents our commitment to excellence.\n\n#Innovation #Quality`],
    professional: (p) => [`I'm proud to share our latest: ${p}.\n\nBuilt for real results.\n\n#B2B #ProductLaunch`, `Launching ${p} — engineered for those who demand the best.\n\n#Professional`],
    casual:       (p) => [`Really excited about this one — we just launched ${p}! 🎉\n\n#NewProduct`, `Thrilled to share something we've been working on: ${p} 🚀`],
    trendy:       (p) => [`The market was asking for something new. We built ${p}. 🚀\n\n#Innovation`, `${p} is here. Excited to see what you think. 💡`],
    sales:        (p) => [`Launching today: ${p}.\n\nEarly-bird pricing this week only.\n\n#B2B #Deal`, `${p} — introductory offer available now.\n\n#Launch #Offer`],
  },
  pinterest: {
    luxury:       (p) => [`${p} | Luxury Edition | Premium Materials | #Luxury #Style #Aesthetic`, `${p} | Elevated Living | Curated for You | #LuxuryHome`],
    professional: (p) => [`${p} | Professional Grade | Expert Quality | #Product #Design`, `${p} | Built to Perform | #ProGrade`],
    casual:       (p) => [`${p} 😍 | so obsessed | shop it! | #MustHave #Faves`, `${p} | cute finds | everyday faves | #Daily`],
    trendy:       (p) => [`${p} | Trending Now | aesthetic | viral | #Aesthetic #Trending`, `${p} | Hot Right Now | #Viral #TrendAlert`],
    sales:        (p) => [`${p} | LIMITED STOCK | Free Shipping | Shop Now | #Sale #Deal`, `${p} | Today Only | Big Savings | #Flash`],
  },
  tiktok: {
    luxury:       (p) => [`POV: you finally found the most luxurious ${p} ✨🖤 #luxury #fyp`, `the ${p} girlies will understand 💅✨ #luxury #premium #fyp`],
    professional: (p) => [`why ${p} is worth every penny 🙌 #product #review #fyp`, `testing ${p} so you don't have to ✅ #review #fyp`],
    casual:       (p) => [`okay but this ${p} tho 😍😍😍 #fyp #obsessed`, `not me talking about ${p} for the 5th time this week 💀 #fyp`],
    trendy:       (p) => [`${p} just dropped and I'm not okay 🔥 #fyp #viral #newdrop`, `the ${p} era has started 💅 #fyp #trend`],
    sales:        (p) => [`🚨 ${p} is on SALE and almost GONE 🚨 shop fast!! #fyp #sale`, `get ${p} before it sells out 😭 limited stock!! #fyp`],
  },
};

export const HASHTAG_SETS: Record<PlatformId, string[]> = {
  instagram: ["#LuxuryBrand", "#Premium", "#Craftsmanship", "#Editorial", "#Aesthetic", "#HighEnd", "#ProductPhotography", "#NewArrivals", "#ShopNow", "#MustHave", "#Trending"],
  facebook:  ["#NewProduct", "#ShopNow", "#Exclusive", "#BrandStory"],
  twitter:   ["#NewDrop", "#MustHave", "#Shop", "#ProductLaunch"],
  linkedin:  ["#ProductLaunch", "#Innovation", "#Ecommerce", "#B2B", "#StartupLife"],
  pinterest: ["#Style", "#Inspiration", "#Aesthetic", "#Curated", "#MoodBoard"],
  tiktok:    ["#fyp", "#foryou", "#viral", "#trending", "#aesthetic", "#NewDrop", "#MustHave"],
};

// Map generate page tone labels → ToneId
export const TONE_MAP: Record<string, ToneId> = {
  "Casual":        "casual",
  "Professional":  "professional",
  "Playful":       "trendy",
  "Luxury Brand":  "luxury",
  "Sales Focused": "sales",
};
