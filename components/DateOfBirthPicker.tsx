import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  TextInput,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { Calendar, ChevronDown, Check, ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface DateOfBirthPickerProps {
  date: string; // YYYY-MM-DD format
  onDateChange: (date: string) => void;
  label?: string;
  disabled?: boolean;
}

export default function DateOfBirthPicker({
  date,
  onDateChange,
  label = "Date of Birth",
  disabled = false,
}: DateOfBirthPickerProps) {
  const theme = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(date ? new Date(date).getFullYear() : new Date().getFullYear() - 25);
  const [selectedMonth, setSelectedMonth] = useState(date ? new Date(date).getMonth() : 0);
  const [selectedDay, setSelectedDay] = useState(date ? new Date(date).getDate() : 1);
  const [yearInput, setYearInput] = useState(selectedYear.toString());
  const [showYearInput, setShowYearInput] = useState(false);

  // Generate years from 1900 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Select date of birth';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleDateSelect = () => {
    const dateString = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
    onDateChange(dateString);
    setShowDatePicker(false);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    // Adjust day if it doesn't exist in the new year/month combination
    const daysInMonth = getDaysInMonth(year, selectedMonth);
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    // Adjust day if it doesn't exist in the new month
    const daysInMonth = getDaysInMonth(selectedYear, month);
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  };

  const handleYearInputSubmit = () => {
    const year = parseInt(yearInput);
    if (year >= 1900 && year <= currentYear) {
      handleYearChange(year);
      setShowYearInput(false);
    } else {
      setYearInput(selectedYear.toString());
      setShowYearInput(false);
    }
  };

  const navigateDecade = (direction: 'prev' | 'next') => {
    const newYear = direction === 'prev' ? selectedYear - 10 : selectedYear + 10;
    if (newYear >= 1900 && newYear <= currentYear) {
      handleYearChange(newYear);
    }
  };

  const days = Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.onSurface }]}>
        {label}
      </Text>
      
      <TouchableOpacity
        style={[
          styles.pickerButton,
          { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
          },
          disabled && styles.disabledButton
        ]}
        onPress={() => !disabled && setShowDatePicker(true)}
        disabled={disabled}
      >
        <Calendar size={20} color={theme.colors.primary} />
        <Text style={[styles.pickerText, { color: theme.colors.onSurface }]}>
          {formatDate(date)}
        </Text>
        <ChevronDown size={20} color={theme.colors.onSurfaceVariant} />
      </TouchableOpacity>

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
                Select Date of Birth
              </Text>
            </View>

            {/* Year Selection */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Year
                </Text>
                <View style={styles.yearControls}>
                  <TouchableOpacity
                    style={[styles.decadeButton, { backgroundColor: theme.colors.surfaceVariant }]}
                    onPress={() => navigateDecade('prev')}
                  >
                    <ChevronLeft size={16} color={theme.colors.onSurface} />
                    <Text style={[styles.decadeText, { color: theme.colors.onSurface }]}>-10</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.yearInputButton, { backgroundColor: theme.colors.primary + '15' }]}
                    onPress={() => setShowYearInput(!showYearInput)}
                  >
                    <Text style={[styles.yearInputButtonText, { color: theme.colors.primary }]}>
                      Type Year
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.decadeButton, { backgroundColor: theme.colors.surfaceVariant }]}
                    onPress={() => navigateDecade('next')}
                  >
                    <Text style={[styles.decadeText, { color: theme.colors.onSurface }]}>+10</Text>
                    <ChevronRight size={16} color={theme.colors.onSurface} />
                  </TouchableOpacity>
                </View>
              </View>

              {showYearInput ? (
                <View style={styles.yearInputContainer}>
                  <TextInput
                    style={[styles.yearInput, { 
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.outline,
                      color: theme.colors.onSurface 
                    }]}
                    value={yearInput}
                    onChangeText={setYearInput}
                    placeholder="Enter year (1900-2024)"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    keyboardType="numeric"
                    maxLength={4}
                    onSubmitEditing={handleYearInputSubmit}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[styles.yearSubmitButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleYearInputSubmit}
                  >
                    <Check size={16} color={theme.colors.onPrimary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView 
                  style={styles.yearList} 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.yearListContent}
                >
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.yearOption,
                        selectedYear === year && { backgroundColor: theme.colors.primary + '15' },
                        { borderBottomColor: theme.colors.outlineVariant }
                      ]}
                      onPress={() => handleYearChange(year)}
                    >
                      <Text
                        style={[
                          styles.yearOptionText,
                          {
                            color: selectedYear === year ? theme.colors.primary : theme.colors.onSurface,
                            fontWeight: selectedYear === year ? '600' : '400',
                          }
                        ]}
                      >
                        {year}
                      </Text>
                      {selectedYear === year && (
                        <Check size={16} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Month Selection */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Month
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.monthList}
                contentContainerStyle={styles.monthListContent}
              >
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.monthOption,
                      selectedMonth === index && { backgroundColor: theme.colors.primary },
                      { borderColor: theme.colors.outline }
                    ]}
                    onPress={() => handleMonthChange(index)}
                  >
                    <Text
                      style={[
                        styles.monthOptionText,
                        {
                          color: selectedMonth === index ? theme.colors.onPrimary : theme.colors.onSurface,
                          fontWeight: selectedMonth === index ? '600' : '400',
                        }
                      ]}
                    >
                      {month.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Day Selection */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Day
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.dayList}
                contentContainerStyle={styles.dayListContent}
              >
                {days.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayOption,
                      selectedDay === day && { backgroundColor: theme.colors.primary },
                      { borderColor: theme.colors.outline }
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayOptionText,
                        {
                          color: selectedDay === day ? theme.colors.onPrimary : theme.colors.onSurface,
                          fontWeight: selectedDay === day ? '600' : '400',
                        }
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.surfaceVariant }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.onSurface }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleDateSelect}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.onPrimary }]}>
                  Select
                </Text>
              </TouchableOpacity>
            </View>
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
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
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
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    padding: 24,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  yearControls: {
    flexDirection: 'row',
    gap: 8,
  },
  decadeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  decadeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  yearInputButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  yearInputButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  yearInputContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  yearInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  yearSubmitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearList: {
    maxHeight: 120,
  },
  yearListContent: {
    paddingBottom: 8,
  },
  yearOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 2,
  },
  yearOptionText: {
    fontSize: 16,
  },
  monthList: {
    flexGrow: 0,
  },
  monthListContent: {
    gap: 8,
    paddingRight: 20,
  },
  monthOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  monthOptionText: {
    fontSize: 14,
  },
  dayList: {
    flexGrow: 0,
  },
  dayListContent: {
    gap: 8,
    paddingRight: 20,
  },
  dayOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayOptionText: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});