import { Market } from "@/src/components/Marketcard";
import { slugify } from "@/lib/slugify";

// Central market data store — in a real app this would come from an API/DB
export const MOCK_MARKETS: Market[] = [
  {
    id: "1",
    title: "US x Iran permanent peace deal by end of 2026?",
    image: "/img/test.png",
    volume: "$260M Vol.",
    options: [
      { label: "Yes", probability: 42 },
      { label: "No", probability: 58 },
    ],
  },
  {
    id: "2",
    title: "Will Bitcoin hit new ATH in 2026?",
    image: "/img/test.png",
    volume: "$180M Vol.",
    options: [
      { label: "Yes", probability: 65 },
      { label: "No", probability: 35 },
    ],
  },
  {
    id: "3",
    title: "Will Ethereum outperform Bitcoin in 2026?",
    image: "/img/test.png",
    volume: "$95M Vol.",
    options: [
      { label: "Yes", probability: 48 },
      { label: "No", probability: 52 },
    ],
  },
  {
    id: "4",
    title: "Will Tesla reach $300 in 2026?",
    image: "/img/test.png",
    volume: "$120M Vol.",
    options: [
      { label: "Yes", probability: 57 },
      { label: "No", probability: 43 },
    ],
  },
  {
    id: "5",
    title: "Will AI replace 10%+ of software jobs by 2027?",
    image: "/img/test.png",
    volume: "$210M Vol.",
    options: [
      { label: "Yes", probability: 71 },
      { label: "No", probability: 29 },
    ],
  },
  {
    id: "6",
    title: "Will Apple release AR glasses by 2026?",
    image: "/img/test.png",
    volume: "$140M Vol.",
    options: [
      { label: "Yes", probability: 38 },
      { label: "No", probability: 62 },
    ],
  },
  {
    id: "7",
    title: "Will EU introduce crypto regulation overhaul in 2026?",
    image: "/img/test.png",
    volume: "$75M Vol.",
    options: [
      { label: "Yes", probability: 64 },
      { label: "No", probability: 36 },
    ],
  },
  {
    id: "8",
    title: "Will S&P 500 reach 6000 in 2026?",
    image: "/img/test.png",
    volume: "$300M Vol.",
    options: [
      { label: "Yes", probability: 59 },
      { label: "No", probability: 41 },
    ],
  },
  {
    id: "9",
    title: "Will SpaceX land humans on Mars by 2030?",
    image: "/img/test.png",
    volume: "$500M Vol.",
    options: [
      { label: "Yes", probability: 33 },
      { label: "No", probability: 67 },
    ],
  },
  {
    id: "10",
    title: "Will FIFA World Cup 2026 be held without major incidents?",
    image: "/img/test.png",
    volume: "$90M Vol.",
    options: [
      { label: "Yes", probability: 74 },
      { label: "No", probability: 26 },
    ],
  },
  {
    id: "11",
    title: "Will Nvidia become $5T company by 2027?",
    image: "/img/test.png",
    volume: "$220M Vol.",
    options: [
      { label: "Yes", probability: 44 },
      { label: "No", probability: 56 },
    ],
  },
  {
    id: "12",
    title: "Will global inflation stay below 3% in 2026?",
    image: "/img/test.png",
    volume: "$110M Vol.",
    options: [
      { label: "Yes", probability: 51 },
      { label: "No", probability: 49 },
    ],
  },
  {
    id: "13",
    title: "Will China GDP growth exceed 5% in 2026?",
    image: "/img/test.png",
    volume: "$130M Vol.",
    options: [
      { label: "Yes", probability: 46 },
      { label: "No", probability: 54 },
    ],
  },
  {
    id: "14",
    title: "Will Netflix reach 400M subscribers by 2027?",
    image: "/img/test.png",
    volume: "$160M Vol.",
    options: [
      { label: "Yes", probability: 39 },
      { label: "No", probability: 61 },
    ],
  },
  {
    id: "15",
    title: "Will OpenAI release AGI-level model by 2026?",
    image: "/img/test.png",
    volume: "$420M Vol.",
    options: [
      { label: "Yes", probability: 28 },
      { label: "No", probability: 72 },
    ],
  },
  {
    id: "16",
    title: "Will gold reach $3000 per oz in 2026?",
    image: "/img/test.png",
    volume: "$190M Vol.",
    options: [
      { label: "Yes", probability: 62 },
      { label: "No", probability: 38 },
    ],
  },
  {
    id: "17",
    title: "Will Japan raise interest rates again in 2026?",
    image: "/img/test.png",
    volume: "$85M Vol.",
    options: [
      { label: "Yes", probability: 58 },
      { label: "No", probability: 42 },
    ],
  },
  {
    id: "18",
    title: "Will US enter recession in 2026?",
    image: "/img/test.png",
    volume: "$240M Vol.",
    options: [
      { label: "Yes", probability: 47 },
      { label: "No", probability: 53 },
    ],
  },
  {
    id: "19",
    title: "Will electric cars surpass 50% global sales by 2030?",
    image: "/img/test.png",
    volume: "$175M Vol.",
    options: [
      { label: "Yes", probability: 69 },
      { label: "No", probability: 31 },
    ],
  },
  {
    id: "20",
    title: "Will TikTok still operate in US by 2027?",
    image: "/img/test.png",
    volume: "$200M Vol.",
    options: [
      { label: "Yes", probability: 54 },
      { label: "No", probability: 46 },
    ],
  },
  {
    id: "21",
    title: "Will AI-generated movies win Oscar by 2028?",
    image: "/img/test.png",
    volume: "$95M Vol.",
    options: [
      { label: "Yes", probability: 61 },
      { label: "No", probability: 39 },
    ],
  },
  {
    id: "22",
    title: "Will climate tech investments exceed $1T by 2027?",
    image: "/img/test.png",
    volume: "$310M Vol.",
    options: [
      { label: "Yes", probability: 73 },
      { label: "No", probability: 27 },
    ],
  },
  {
    id: "23",
    title: "Will India become 3rd largest economy by 2027?",
    image: "/img/test.png",
    volume: "$145M Vol.",
    options: [
      { label: "Yes", probability: 66 },
      { label: "No", probability: 34 },
    ],
  },
  {
    id: "24",
    title: "Will humanoid robots be commercially common by 2028?",
    image: "/img/test.png",
    volume: "$260M Vol.",
    options: [
      { label: "Yes", probability: 52 },
      { label: "No", probability: 48 },
    ],
  },
];

export function getMarketBySlug(slug: string): Market | undefined {
  return MOCK_MARKETS.find((m) => slugify(m.title) === slug);
}