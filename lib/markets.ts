import { Market } from "@/src/components/Marketcard";
import { slugify } from "@/lib/slugify";

// Central market data store — in a real app this would come from an API/DB
export const MOCK_MARKETS: Market[] = [
  {
    id: "1",
    title: "US x Iran permanent peace deal by end of 2026?",
    image: "/img/test.png",
    eventId: "",
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
    eventId: "",
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
    eventId: "",
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
    eventId: "",
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
    eventId: "",
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
    eventId: "",
    options: [
      { label: "Yes", probability: 38 },
      { label: "No", probability: 62 },
    ],
  },
];

export function getMarketBySlug(slug: string): Market | undefined {
  return MOCK_MARKETS.find((m) => slugify(m.title) === slug);
}