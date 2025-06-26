import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { Calendar, Clock, ChevronDown, Check } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface DateTimePickerProps {
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  label?: string;
  disabled?: boolean;
}

export default function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  label = "Date & Time",
  disabled = false,
}: DateTimePickerProps) {
  const theme = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Generate calendar dates
  const generateCalendarDates = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const dates = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  // Generate time options
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = formatTime12Hour(timeString);
        times.push({ value: timeString, display: displayTime });
      }
    }
    return times;
  };

  const formatTime12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const isDateDisabled = (checkDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const handleDateSelect = (selectedDate: Date) => {
    const dateString = selectedDate.toISOString().split('T')[0];
    onDateChange(dateString);
    setShowDatePicker(false);
  };

  const handleTimeSelect = (timeValue: string) => {
    onTimeChange(timeValue);
    setShowTimePicker(false);
  };

  const calendarDates = generateCalendarDates();
  const timeOptions = generateTimeOptions();
  const today = new Date();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.onSurface }]}>
        {label}
      </Text>
      
      <View style={styles.pickerRow}>
        {/* Date Picker */}
        <TouchableOpacity
          style={[
            styles.pickerButton,
            styles.dateButton,
            { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
            disabled && styles.disabledButton
          ]}
          onPress={() => !disabled && setShowDatePicker(true)}
          disabled={disabled}
        >
          <Calendar size={16} color={theme.colors.primary} />
          <Text style={[styles.pickerText, { color: theme.colors.onSurface }]}>
            {formatDate(date)}
          </Text>
          <ChevronDown size={16} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* Time Picker */}
        <TouchableOpacity
          style={[
            styles.pickerButton,
            styles.timeButton,
            { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
            disabled && styles.disabledButton
          ]}
          onPress={() => !disabled && setShowTimePicker(true)}
          disabled={disabled}
        >
          <Clock size={16} color={theme.colors.primary} />
          <Text style={[styles.pickerText, { color: theme.colors.onSurface }]}>
            {formatTime12Hour(time)}
          </Text>
          <ChevronDown size={16} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                Select Date
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {monthNames[today.getMonth()]} {today.getFullYear()}
              </Text>
            </View>

            <View style={styles.calendarContainer}>
              {/* Day Headers */}
              <View style={styles.dayHeaders}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <Text key={day} style={[styles.dayHeader, { color: theme.colors.onSurfaceVariant }]}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {calendarDates.map((calDate, index) => {
                  const isCurrentMonth = calDate.getMonth() === today.getMonth();
                  const isSelected = calDate.toISOString().split('T')[0] === date;
                  const isToday = calDate.toDateString() === today.toDateString();
                  const disabled = isDateDisabled(new Date(calDate));

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.calendarDate,
                        isSelected && { backgroundColor: theme.colors.primary },
                        isToday && !isSelected && { borderColor: theme.colors.primary, borderWidth: 1 },
                        disabled && styles.disabledDate,
                      ]}
                      onPress={() => !disabled && isCurrentMonth && handleDateSelect(calDate)}
                      disabled={disabled || !isCurrentMonth}
                    >
                      <Text
                        style={[
                          styles.calendarDateText,
                          {
                            color: isSelected
                              ? theme.colors.onPrimary
                              : isCurrentMonth
                              ? theme.colors.onSurface
                              : theme.colors.onSurfaceVariant,
                            opacity: disabled ? 0.3 : isCurrentMonth ? 1 : 0.5,
                          }
                        ]}
                      >
                        {calDate.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={[styles.modalCloseText, { color: theme.colors.onSurface }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                Select Time
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Choose your preferred time
              </Text>
            </View>

            <ScrollView style={styles.timeList} showsVerticalScrollIndicator={false}>
              {timeOptions.map((timeOption) => (
                <TouchableOpacity
                  key={timeOption.value}
                  style={[
                    styles.timeOption,
                    time === timeOption.value && { backgroundColor: theme.colors.primary + '15' },
                    { borderBottomColor: theme.colors.outlineVariant }
                  ]}
                  onPress={() => handleTimeSelect(timeOption.value)}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      {
                        color: time === timeOption.value ? theme.colors.primary : theme.colors.onSurface,
                        fontWeight: time === timeOption.value ? '600' : '400',
                      }
                    ]}
                  >
                    {timeOption.display}
                  </Text>
                  {time === timeOption.value && (
                    <Check size={16} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={[styles.modalCloseText, { color: theme.colors.onSurface }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  dateButton: {
    flex: 2,
  },
  timeButton: {
    flex: 1.5,
  },
  pickerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    padding: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
  },
  calendarContainer: {
    paddingHorizontal: 20,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDate: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  calendarDateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  disabledDate: {
    opacity: 0.3,
  },
  timeList: {
    maxHeight: 300,
    paddingHorizontal: 20,
  },
  timeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 2,
  },
  timeOptionText: {
    fontSize: 16,
  },
  modalCloseButton: {
    margin: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
});