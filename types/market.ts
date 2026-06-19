export interface Market {
  id: string;
  title: string;
  image: string;
  eventId: string;
  volume: string;
  options: {
    label: string;
    probability: number;
  }[];
}