import { SuggestionCard } from '../types';

const suggestionCards: SuggestionCard[] = [
  {
    id: '1',
    title: 'Take a 5-minute break',
    description: 'Step away from your screen and stretch',
    category: 'wellness',
    icon: 'Coffee',
    estimatedTime: 5,
  },
  {
    id: '2',
    title: 'Review your goals',
    description: 'Reflect on your progress and adjust plans',
    category: 'productivity',
    icon: 'Target',
    estimatedTime: 10,
  },
  {
    id: '3',
    title: 'Organize your workspace',
    description: 'Clear your desk for better focus',
    category: 'organization',
    icon: 'Folder',
    estimatedTime: 15,
  },
  {
    id: '4',
    title: 'Practice deep breathing',
    description: 'Reduce stress with mindful breathing',
    category: 'wellness',
    icon: 'Heart',
    estimatedTime: 3,
  },
  {
    id: '5',
    title: 'Send a thank you message',
    description: 'Strengthen your relationships',
    category: 'social',
    icon: 'MessageCircle',
    estimatedTime: 5,
  },
  {
    id: '6',
    title: 'Learn something new',
    description: 'Watch a short educational video',
    category: 'learning',
    icon: 'BookOpen',
    estimatedTime: 20,
  },
  {
    id: '7',
    title: 'Plan tomorrow',
    description: 'Set yourself up for success',
    category: 'planning',
    icon: 'Calendar',
    estimatedTime: 10,
  },
  {
    id: '8',
    title: 'Hydrate yourself',
    description: 'Drink a glass of water',
    category: 'health',
    icon: 'Droplets',
    estimatedTime: 1,
  },
];

export const getRandomSuggestions = (count: number = 5): SuggestionCard[] => {
  const shuffled = [...suggestionCards].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const getSuggestionsByCategory = (category: string): SuggestionCard[] => {
  return suggestionCards.filter(card => card.category === category);
};