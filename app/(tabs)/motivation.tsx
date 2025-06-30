import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  PanResponder,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  RefreshCw, 
  ChevronUp, 
  Sparkles,
  Quote,
  BookOpen,
  Leaf
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height - (Platform.OS === 'ios' ? 100 : 80);
const SWIPE_THRESHOLD = 80;

interface MotivationCard {
  type: 'quote' | 'learning' | 'wellbeing';
  title: string;
  content: string;
  emoji: string;
  isDefault?: boolean;
}

const defaultCards: MotivationCard[] = [
  // Quote Cards
  {
    type: 'quote',
    title: 'Daily Motivation',
    content: '"The way to get started is to quit talking and begin doing." - Walt Disney',
    emoji: '💪',
    isDefault: true
  },
  {
    type: 'quote',
    title: 'Daily Motivation',
    content: '"Success is not final, failure is not fatal: it is the courage to continue that counts." - Winston Churchill',
    emoji: '🔥',
    isDefault: true
  },
  {
    type: 'quote',
    title: 'Daily Motivation',
    content: '"The only way to do great work is to love what you do." - Steve Jobs',
    emoji: '❤️',
    isDefault: true
  },
  {
    type: 'quote',
    title: 'Daily Motivation',
    content: '"Believe you can and you\'re halfway there." - Theodore Roosevelt',
    emoji: '🌟',
    isDefault: true
  },
  {
    type: 'quote',
    title: 'Daily Motivation',
    content: '"Don\'t watch the clock; do what it does. Keep going." - Sam Levenson',
    emoji: '⏰',
    isDefault: true
  },

  // Learning Cards
  {
    type: 'learning',
    title: 'Quick Learning',
    content: 'Tip: Use the "Pomodoro Technique" - work for 25 minutes, then take a 5-minute break. This helps maintain focus and prevents burnout.',
    emoji: '🧠',
    isDefault: true
  },
  {
    type: 'learning',
    title: 'Quick Learning',
    content: 'Did you know? The word "serendipity" means finding something good without looking for it. Practice being open to unexpected opportunities today.',
    emoji: '✨',
    isDefault: true
  },
  {
    type: 'learning',
    title: 'Quick Learning',
    content: 'Emotional Intelligence Tip: Before reacting to criticism, pause and ask "What can I learn from this?" This shifts your mindset from defensive to growth-oriented.',
    emoji: '🎯',
    isDefault: true
  },
  {
    type: 'learning',
    title: 'Quick Learning',
    content: 'Memory Hack: The "Method of Loci" involves associating information with familiar places. Try linking your to-do list to rooms in your house.',
    emoji: '🏠',
    isDefault: true
  },
  {
    type: 'learning',
    title: 'Quick Learning',
    content: 'Communication Tip: Use the "Yes, and..." technique from improv. Instead of saying "but," try "and" to build on ideas rather than shut them down.',
    emoji: '🗣️',
    isDefault: true
  },

  // Wellbeing Cards
  {
    type: 'wellbeing',
    title: 'Wellness Nudge',
    content: 'Take 3 deep breaths right now. Inhale for 4 counts, hold for 4, exhale for 6. This activates your parasympathetic nervous system and reduces stress.',
    emoji: '🌱',
    isDefault: true
  },
  {
    type: 'wellbeing',
    title: 'Wellness Nudge',
    content: 'Check your posture right now. Roll your shoulders back, lift your chin, and take up space. Good posture instantly boosts confidence and energy.',
    emoji: '🧘‍♀️',
    isDefault: true
  },
  {
    type: 'wellbeing',
    title: 'Wellness Nudge',
    content: 'Hydration check! Your brain is 75% water. Drink a glass of water now to boost your focus and energy levels.',
    emoji: '💧',
    isDefault: true
  },
  {
    type: 'wellbeing',
    title: 'Wellness Nudge',
    content: 'Eye break time! Look at something 20 feet away for 20 seconds. This helps reduce digital eye strain and refocuses your vision.',
    emoji: '👀',
    isDefault: true
  },
  {
    type: 'wellbeing',
    title: 'Wellness Nudge',
    content: 'Gratitude moment: Think of 3 things you\'re grateful for right now. Gratitude practice rewires your brain for positivity and resilience.',
    emoji: '🙏',
    isDefault: true
  },
];

export default function MotivationScreen() {
  const theme = useTheme();
  const [cards, setCards] = useState<MotivationCard[]>(defaultCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState(true);
  
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Try to load AI content on mount, but don't block UI
    loadMotivationCards();
  }, []);

  const loadMotivationCards = async () => {
    if (!apiAvailable) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-motivation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'mixed' }),
      });

      if (!response.ok) {
        throw new Error('Failed to load motivation content');
      }

      const data = await response.json();
      
      let newCards: MotivationCard[] = [];
      
      if (data.cards && Array.isArray(data.cards)) {
        newCards = data.cards;
      } else if (data.type && data.content) {
        newCards = [data];
      } else if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed.cards) {
            newCards = parsed.cards;
          }
        } catch {
          newCards = parseTextToCards(data);
        }
      } else {
        newCards = parseTextToCards(JSON.stringify(data));
      }

      const validCards = newCards.filter(card => 
        card && card.content && card.content.trim().length > 0
      ).map(card => ({
        type: card.type || 'quote',
        title: card.title || getDefaultTitle(card.type || 'quote'),
        content: cleanContent(card.content),
        emoji: card.emoji || getDefaultEmoji(card.type || 'quote'),
        isDefault: false
      }));

      if (validCards.length > 0) {
        // Mix AI cards with default cards for variety
        const mixedCards = [...validCards, ...getRandomDefaultCards(3)];
        setCards(prev => [...prev, ...mixedCards]);
      }
    } catch (error) {
      console.error('Error loading motivation cards:', error);
      setError('Using offline content');
      setApiAvailable(false);
      
      // Add more default cards when API fails
      const additionalDefaults = getRandomDefaultCards(5);
      setCards(prev => [...prev, ...additionalDefaults]);
      
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getRandomDefaultCards = (count: number): MotivationCard[] => {
    const shuffled = [...defaultCards].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const parseTextToCards = (text: string): MotivationCard[] => {
    const cards: MotivationCard[] = [];
    
    // Try to parse JSON objects from text
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.content) {
          cards.push(parsed);
        }
      }
    } catch {
      // If JSON parsing fails, split by common delimiters
      const parts = text.split(/\n\n|\n---\n|\d+\./);
      parts.forEach((part, index) => {
        const trimmed = part.trim();
        if (trimmed.length > 20) {
          const types: ('quote' | 'learning' | 'wellbeing')[] = ['quote', 'learning', 'wellbeing'];
          cards.push({
            type: types[index % 3],
            title: getDefaultTitle(types[index % 3]),
            content: cleanContent(trimmed),
            emoji: getDefaultEmoji(types[index % 3])
          });
        }
      });
    }
    
    return cards;
  };

  const cleanContent = (content: string): string => {
    // Clean JSON formatting and unwanted characters
    return content
      .replace(/```json\s*|\s*```/g, '')
      .replace(/^\d+\.\s*/, '')
      .replace(/^["']|["']$/g, '')
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .trim();
  };

  const getDefaultTitle = (type: string): string => {
    switch (type) {
      case 'quote': return 'Daily Motivation';
      case 'learning': return 'Quick Learning';
      case 'wellbeing': return 'Wellness Nudge';
      default: return 'Inspiration';
    }
  };

  const getDefaultEmoji = (type: string): string => {
    switch (type) {
      case 'quote': return '💪';
      case 'learning': return '🧠';
      case 'wellbeing': return '🌱';
      default: return '✨';
    }
  };

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'quote':
        return <Quote size={20} color="#FFFFFF" />;
      case 'learning':
        return <BookOpen size={20} color="#FFFFFF" />;
      case 'wellbeing':
        return <Leaf size={20} color="#FFFFFF" />;
      default:
        return <Sparkles size={20} color="#FFFFFF" />;
    }
  };

  const getCardGradient = (type: string) => {
    switch (type) {
      case 'quote':
        return ['#667eea', '#764ba2'];
      case 'learning':
        return ['#f093fb', '#f5576c'];
      case 'wellbeing':
        return ['#4facfe', '#00f2fe'];
      default:
        return ['#a8edea', '#fed6e3'];
    }
  };

  const handleNextCard = () => {
    if (currentIndex < cards.length - 1) {
      // Animate to next card with smooth transition
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(currentIndex + 1);
        translateY.setValue(height);
        cardScale.setValue(0.8);
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(cardScale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Load more cards when reaching the end
      if (apiAvailable) {
        loadMotivationCards();
      } else {
        // Add more default cards
        const moreDefaults = getRandomDefaultCards(5);
        setCards(prev => [...prev, ...moreDefaults]);
      }
    }
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
    },
    onPanResponderGrant: () => {
      // Using extractOffset() instead of setOffset to avoid type errors
      translateY.extractOffset();
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy < 0) {
        translateY.setValue(gestureState.dy);
        // Add subtle scale effect during swipe
        const scale = 1 - Math.abs(gestureState.dy) / height * 0.1;
        cardScale.setValue(Math.max(scale, 0.9));
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      translateY.flattenOffset();
      
      if (gestureState.dy < -SWIPE_THRESHOLD && gestureState.vy < -0.5) {
        handleNextCard();
      } else {
        // Snap back to original position with ease-in-out animation
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(cardScale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
  });

  if (cards.length === 0 && loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>
            Loading inspiration...
          </Text>
        </View>
      </View>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={[styles.headerIcon, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <Sparkles size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>
                Daily Inspiration
              </Text>
              <Text style={styles.headerSubtitle}>
                Swipe up for more content
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadMotivationCards}
            disabled={loading}
          >
            <RefreshCw 
              size={20} 
              color="#FFFFFF" 
              style={{ opacity: loading ? 0.5 : 1 }}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Card Container */}
      <View style={styles.cardContainer} {...panResponder.panHandlers}>
        {currentCard && (
          <Animated.View
            style={[
              styles.cardWrapper,
              {
                opacity: opacity,
                transform: [
                  { translateY: translateY },
                  { scale: cardScale }
                ],
              },
            ]}
          >
            <LinearGradient
              colors={getCardGradient(currentCard.type) as unknown as readonly [string, string, ...string[]]}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTypeContainer}>
                  {getCardIcon(currentCard.type)}
                  <Text style={styles.cardType}>
                    {currentCard.title}
                  </Text>
                  {/* {currentCard.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Offline</Text>
                    </View>
                  )} */}
                </View>
                <Text style={styles.cardEmoji}>
                  {currentCard.emoji}
                </Text>
              </View>

              <View style={styles.cardContentContainer}>
                <Text style={styles.cardContent}>
                  {currentCard.content}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.progressIndicator}>
                  {cards.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((_, index) => {
                    const actualIndex = Math.max(0, currentIndex - 2) + index;
                    return (
                      <View
                        key={actualIndex}
                        style={[
                          styles.progressDot,
                          {
                            backgroundColor: actualIndex === currentIndex ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)',
                            width: actualIndex === currentIndex ? 12 : 6,
                            height: actualIndex === currentIndex ? 12 : 6,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}
      </View>

      {/* Bottom Hint */}
      <View style={styles.bottomHint}>
        <Animated.View
          style={[
            styles.swipeIndicator,
            {
              transform: [
                {
                  translateY: translateY.interpolate({
                    inputRange: [-100, 0],
                    outputRange: [20, 0],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          <ChevronUp size={16} color="rgba(255, 255, 255, 0.7)" />
          <Text style={styles.hintText}>
            Swipe up for next
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  errorBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 10,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 140 : 120,
    paddingBottom: 100,
  },
  cardWrapper: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    minHeight: CARD_HEIGHT - 200,
  },
  cardGradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  cardType: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  defaultBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  cardEmoji: {
    fontSize: 32,
  },
  cardContentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  cardContent: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'center',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardFooter: {
    alignItems: 'center',
    paddingTop: 20,
  },
  progressIndicator: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  progressDot: {
    borderRadius: 6,
  },
  bottomHint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  swipeIndicator: {
    alignItems: 'center',
    gap: 4,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});