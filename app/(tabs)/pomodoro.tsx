import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Button, useTheme, Portal, Modal, TextInput } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { 
  startSession, 
  pauseSession, 
  resumeSession, 
  completeSession, 
  resetSession,
  updateTimeRemaining,
  updateSettings 
} from '../../store/slices/pomodoroSlice';
import { Play, Pause, Square, Settings, RotateCcw } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const TIMER_SIZE = Math.min(width * 0.7, 280);

export default function PomodoroScreen() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const timeScaleAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  
  const { 
    isRunning, 
    timeRemaining, 
    currentSessionType, 
    sessionsCompleted, 
    settings,
    sessions 
  } = useSelector((state: RootState) => state.pomodoro);

  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);

  // Start animations when timer is running
  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation;
    let rotateAnimation: Animated.CompositeAnimation;
    let timeAnimation: Animated.CompositeAnimation;
    let waveAnimation: Animated.CompositeAnimation;
    
    if (isRunning) {
      // Pulse animation
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      );
      
      // Rotation animation
      rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: true
        })
      );
      
      // Time scale animation
      timeAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(timeScaleAnim, {
            toValue: 1.03,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(timeScaleAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      );
      
      // Wave animation
      waveAnimation = Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true
        })
      );
      
      pulseAnimation.start();
      rotateAnimation.start();
      timeAnimation.start();
      waveAnimation.start();
    } else {
      // Reset animations when not running
      Animated.parallel([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(timeScaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
    
    return () => {
      pulseAnimation?.stop();
      rotateAnimation?.stop();
      timeAnimation?.stop();
      waveAnimation?.stop();
    };
  }, [isRunning, pulseAnim, rotateAnim, timeScaleAnim, waveAnim]);

  // Timer countdown effect
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        dispatch(updateTimeRemaining(timeRemaining - 1));
      }, 1000);
    } else if (timeRemaining === 0 && isRunning) {
      dispatch(completeSession());
      Alert.alert(
        'Session Complete!',
        `${currentSessionType === 'work' ? 'Work' : 'Break'} session finished!`,
        [{ text: 'OK' }]
      );
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, dispatch, currentSessionType]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    dispatch(startSession({}));
  };

  const handlePause = () => {
    dispatch(pauseSession());
  };

  const handleResume = () => {
    dispatch(resumeSession());
  };

  const handleStop = () => {
    dispatch(resetSession());
  };

  const handleSettings = () => {
    setTempSettings(settings);
    setIsSettingsVisible(true);
  };

  const handleSaveSettings = () => {
    dispatch(updateSettings(tempSettings));
    setIsSettingsVisible(false);
  };

  const getProgress = (): number => {
    const totalTime = currentSessionType === 'work' 
      ? settings.workDuration * 60 
      : (sessionsCompleted % settings.sessionsUntilLongBreak === 0 
          ? settings.longBreakDuration * 60 
          : settings.shortBreakDuration * 60);
    return (totalTime - timeRemaining) / totalTime;
  };

  const getSessionTypeColor = (): string => {
    return currentSessionType === 'work' ? theme.colors.primary : theme.colors.secondary;
  };

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(
      session => new Date(session.startTime).toDateString() === today
    );
    
    const workSessions = todaySessions.filter(s => s.type === 'work' && s.completed).length;
    const totalMinutes = todaySessions.reduce((acc, session) => acc + session.duration, 0);
    
    return { workSessions, totalMinutes };
  };

  const { workSessions, totalMinutes } = getTodayStats();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Title style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          Pomodoro Timer
        </Title>
        <TouchableOpacity onPress={handleSettings}>
          <Settings size={24} color={theme.colors.onBackground} />
        </TouchableOpacity>
      </View>

      {/* Session Type Indicator */}
      <View style={styles.sessionTypeContainer}>
        <Text style={[styles.sessionType, { color: getSessionTypeColor() }]}>
          {currentSessionType === 'work' ? 'Work Session' : 'Break Time'}
        </Text>
        <Text style={[styles.sessionCount, { color: theme.colors.onSurfaceVariant }]}>
          Session {sessionsCompleted + 1}
        </Text>
      </View>

      {/* Timer Circle with Animations */}
      <View style={styles.timerContainer}>
        <Animated.View 
          style={[
            styles.timerCircle,
            { 
              borderColor: getSessionTypeColor(),
              width: TIMER_SIZE,
              height: TIMER_SIZE,
              transform: [
                { scale: pulseAnim }
              ]
            }
          ]}
        >
          {/* Animated progress ring */}
          <Animated.View 
            style={[
              styles.progressRing, 
              { 
                transform: [
                  { rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [`${getProgress() * 360}deg`, `${getProgress() * 360 + 10}deg`]
                    }) 
                  }
                ] 
              }
            ]}
          >
            <View 
              style={[
                styles.progressFill,
                { backgroundColor: getSessionTypeColor() }
              ]} 
            />
          </Animated.View>
          
          {/* Timer content with animations */}
          <View style={styles.timerContent}>
            <Animated.Text 
              style={[
                styles.timeDisplay, 
                { 
                  color: theme.colors.onBackground,
                  transform: [{ scale: timeScaleAnim }] 
                }
              ]}
            >
              {formatTime(timeRemaining)}
            </Animated.Text>
            <Text style={[styles.timeLabel, { color: theme.colors.onSurfaceVariant }]}>
              {currentSessionType === 'work' ? 'Focus Time' : 'Break Time'}
            </Text>
          </View>
          
          {/* Wave animation at bottom of timer */}
          {isRunning && (
            <Animated.View 
              style={[
                styles.waveContainer,
                {
                  backgroundColor: getSessionTypeColor() + '40',
                  transform: [
                    { translateY: waveAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, -10, 0]
                      })
                    }
                  ]
                }
              ]}
            >
              <View style={[styles.wave, { backgroundColor: getSessionTypeColor() + '60' }]} />
            </Animated.View>
          )}
        </Animated.View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {!isRunning ? (
          <TouchableOpacity
            style={[styles.controlButton, styles.playButton, { backgroundColor: getSessionTypeColor() }]}
            onPress={handleStart}
          >
            <Play size={32} color={theme.colors.onPrimary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.controlButton, styles.pauseButton, { backgroundColor: theme.colors.surface }]}
            onPress={handlePause}
          >
            <Pause size={32} color={theme.colors.onSurface} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.controlButton, styles.stopButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleStop}
        >
          <Square size={32} color={theme.colors.onSurface} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.resetButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleStop}
        >
          <RotateCcw size={32} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Today's Stats */}
      <Card style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.statsTitle, { color: theme.colors.onSurface }]}>
            Today's Progress
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {workSessions}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Sessions
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {totalMinutes}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Minutes
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {Math.round((workSessions / 8) * 100)}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Goal
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Settings Modal */}
      <Portal>
        <Modal
          visible={isSettingsVisible}
          onDismiss={() => setIsSettingsVisible(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Title style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
            Pomodoro Settings
          </Title>
          
          <TextInput
            label="Work Duration (minutes)"
            value={tempSettings.workDuration.toString()}
            onChangeText={(text) => setTempSettings({ 
              ...tempSettings, 
              workDuration: parseInt(text) || 25 
            })}
            style={styles.settingsInput}
            mode="outlined"
            keyboardType="numeric"
          />
          
          <TextInput
            label="Short Break Duration (minutes)"
            value={tempSettings.shortBreakDuration.toString()}
            onChangeText={(text) => setTempSettings({ 
              ...tempSettings, 
              shortBreakDuration: parseInt(text) || 5 
            })}
            style={styles.settingsInput}
            mode="outlined"
            keyboardType="numeric"
          />
          
          <TextInput
            label="Long Break Duration (minutes)"
            value={tempSettings.longBreakDuration.toString()}
            onChangeText={(text) => setTempSettings({ 
              ...tempSettings, 
              longBreakDuration: parseInt(text) || 15 
            })}
            style={styles.settingsInput}
            mode="outlined"
            keyboardType="numeric"
          />
          
          <TextInput
            label="Sessions Until Long Break"
            value={tempSettings.sessionsUntilLongBreak.toString()}
            onChangeText={(text) => setTempSettings({ 
              ...tempSettings, 
              sessionsUntilLongBreak: parseInt(text) || 4 
            })}
            style={styles.settingsInput}
            mode="outlined"
            keyboardType="numeric"
          />

          <View style={styles.modalActions}>
            <Button 
              onPress={() => setIsSettingsVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSaveSettings}
              style={styles.modalButton}
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sessionTypeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sessionType: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sessionCount: {
    fontSize: 14,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerCircle: {
    borderWidth: 8,
    borderRadius: TIMER_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  progressRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: TIMER_SIZE / 2,
    overflow: 'hidden',
  },
  progressFill: {
    flex: 1,
    borderRadius: TIMER_SIZE / 2,
  },
  timerContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TIMER_SIZE * 0.3,
    borderBottomLeftRadius: TIMER_SIZE / 2,
    borderBottomRightRadius: TIMER_SIZE / 2,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    top: 10,
    left: -TIMER_SIZE * 0.2,
    width: TIMER_SIZE * 1.4,
    height: TIMER_SIZE * 0.3,
    borderRadius: TIMER_SIZE / 4,
    transform: [{ rotate: '-5deg' }],
  },
  timeDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 16,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 40,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  pauseButton: {},
  stopButton: {},
  resetButton: {},
  statsCard: {
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  settingsInput: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    minWidth: 80,
  },
});