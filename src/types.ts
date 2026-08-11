export interface Card {
  id: string;
  name: string;
  setCode: string;
  setFolder: string;
  setLabel: string;
  number: string;
  image: string;
}

export interface CartLine {
  card: Card;
  qty: number;
}
