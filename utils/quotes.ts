import { Quote } from '../types';

const motivationalQuotes: Quote[] = [
  {
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    category: "productivity"
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
    category: "persistence"
  },
  {
    text: "The future depends on what you do today.",
    author: "Mahatma Gandhi",
    category: "motivation"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "resilience"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: "passion"
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    category: "confidence"
  },
  {
    text: "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle",
    category: "hope"
  },
  {
    text: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins",
    category: "action"
  },
];

export const getRandomQuote = (): Quote => {
  const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
  return motivationalQuotes[randomIndex];
};

export const getQuotesByCategory = (category: string): Quote[] => {
  return motivationalQuotes.filter(quote => quote.category === category);
};