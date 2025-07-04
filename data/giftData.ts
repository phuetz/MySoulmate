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

export const gifts: Gift[] = [
  {
    id: '1',
    name: 'Virtual Rose',
    description: 'A beautiful digital rose that never wilts.',
    price: 50,
    imageUrl: 'https://images.pexels.com/photos/67636/rose-blue-flower-rose-blooms-67636.jpeg?auto=compress&cs=tinysrgb&w=600',
    premium: false,
    category: 'common',
    effect: 'Small boost to relationship score',
  },
  {
    id: '2',
    name: 'Teddy Bear',
    description: 'A cute teddy bear your companion can cuddle with.',
    price: 100,
    imageUrl: 'https://images.pexels.com/photos/1019471/stuffed-bear-teddy-white-1019471.jpeg?auto=compress&cs=tinysrgb&w=600',
    premium: false,
    category: 'common',
    effect: 'Small boost to relationship score',
  },
  {
    id: '3',
    name: 'Digital Chocolate Box',
    description: 'A box of virtual chocolates that your companion will adore.',
    price: 150,
    imageUrl: 'https://images.pexels.com/photos/65882/chocolate-dark-coffee-confiserie-65882.jpeg?auto=compress&cs=tinysrgb&w=600',
    premium: false,
    category: 'common',
    effect: 'Medium boost to relationship score',
  },
  {
    id: '4',
    name: 'Virtual Jewelry',
    description: 'Exquisite digital jewelry that your companion can wear.',
    price: 500,
    imageUrl: 'https://images.pexels.com/photos/688705/pexels-photo-688705.jpeg?auto=compress&cs=tinysrgb&w=600',
    premium: true,
    category: 'rare',
    effect: 'Large boost to relationship score',
  },
  {
    id: '5',
    name: 'Poem Collection',
    description: 'A beautiful collection of romantic poems.',
    price: 200,
    imageUrl: 'https://images.pexels.com/photos/372748/pexels-photo-372748.jpeg?auto=compress&cs=tinysrgb&w=600',
    premium: false,
    category: 'common',
    effect: 'Medium boost to relationship score',
  },
  {
    id: '6',
    name: 'Digital Perfume',
    description: 'A virtual scent that reminds your companion of you.',
    price: 300,
    imageUrl: 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=600',
    premium: false,
    category: 'rare',
    effect: 'Medium boost to relationship score',
  },
  {
    id: '7',
    name: 'Virtual Concert Tickets',
    description: 'Take your companion to a private virtual concert.',
    price: 1000,
    imageUrl: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=600',
    premium: true,
    category: 'exclusive',
    effect: 'Very large boost to relationship score',
  },
  {
    id: '8',
    name: 'Love Letter',
    description: 'A heartfelt digital love letter.',
    price: 75,
    imageUrl: 'https://images.pexels.com/photos/636244/pexels-photo-636244.jpeg?auto=compress&cs=tinysrgb&w=600',
    premium: false,
    category: 'common',
    effect: 'Small boost to relationship score',
  },
  {
    id: '9',
    name: 'Mood Ring',
    description: 'A digital ring that changes color based on your companion\'s mood.',
    price: 400,
    imageUrl: 'https://images.pexels.com/photos/8100784/pexels-photo-8100784.jpeg?auto=compress&cs=tinysrgb&w=600',
    premium: true,
    category: 'rare',
    effect: 'Large boost to relationship score and unlocks mood insights',
  },
  {
    id: '10',
    name: 'Private Island Getaway',
    description: 'A luxurious virtual vacation on a private island with your companion.',
    price: 2000,
    imageUrl: 'https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg?auto=compress&cs=tinysrgb&w=600',
    premium: true,
    category: 'exclusive',
    effect: 'Extreme boost to relationship score and unlocks special vacation memories',
  }
];

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