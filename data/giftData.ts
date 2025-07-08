export interface Gift {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  premium: boolean;
  category: 'common' | 'rare' | 'exclusive';
  effect: string;
}


export const getCategoryColor = (category: 'common' | 'rare' | 'exclusive'): string => {
  switch (category) {
    case 'common':
      return '#4CAF50'; // Green
    case 'rare':
      return '#9C6ADE'; // Purple
    case 'exclusive':
      return '#FF6B8A'; // Pink
    default:
      return '#4CAF50';
  }
};

export const getVirtualCurrencyPackages = () => [
  { id: '1', amount: 100, price: '€2.99', bonus: 0 },
  { id: '2', amount: 500, price: '€9.99', bonus: 50 },
  { id: '3', amount: 1000, price: '€19.99', bonus: 150 },
  { id: '4', amount: 2500, price: '€49.99', bonus: 500 },
  { id: '5', amount: 5000, price: '€99.99', bonus: 1500 }
];