import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { Calendar, Plus, Clock, Heart, Video, MessageCircle, Mic, X, Download } from 'lucide-react-native';
import { useAppState } from '@/context/AppStateContext';
import PremiumFeatureModal from '@/components/PremiumFeatureModal';
import { calendarService } from '@/services/calendarService';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'chat' | 'voice' | 'video' | 'date' | 'reminder';
  completed: boolean;
}

export default function CalendarScreen() {
  const { companion, isPremium, updateInteractions } = useAppState();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'chat'
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = () => {
    // Mock events for demonstration
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: `Morning Chat with ${companion.name}`,
        description: 'Start the day with a positive conversation',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        type: 'chat',
        completed: true
      },
      {
        id: '2',
        title: 'Virtual Date Night',
        description: 'Special romantic evening together',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: '19:00',
        type: 'date',
        completed: false
      },
      {
        id: '3',
        title: 'Voice Call Session',
        description: 'Weekly voice conversation',
        date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        time: '15:30',
        type: 'voice',
        completed: false
      }
    ];
    setEvents(mockEvents);
  };

  const handleAddEvent = () => {
    if (!isPremium && events.length >= 5) {
      setShowPremiumModal(true);
      return;
    }
    setNewEvent({
      title: '',
      description: '',
      date: selectedDate,
      time: '12:00',
      type: 'chat'
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title || '',
      description: newEvent.description || '',
      date: newEvent.date || '',
      time: newEvent.time || '',
      type: newEvent.type as CalendarEvent['type'] || 'chat',
      completed: false
    };

    setEvents([...events, event].sort((a, b) => 
      new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
    ));

    setShowEventModal(false);
    updateInteractions(1);
    Alert.alert('Success', `Event scheduled! ${companion.name} is looking forward to it.`);
  };

  const handleImportEvents = async () => {
    if (!importUrl) {
      Alert.alert('Error', 'Please enter a calendar URL');
      return;
    }
    try {
      const imported = await calendarService.importFromUrl(importUrl);
      const mapped = imported.map(evt => ({
        id: evt.id,
        title: evt.title,
        description: evt.description,
        date: evt.date,
        time: evt.time,
        type: 'reminder',
        completed: false,
      }));
      setEvents(prev => [...prev, ...mapped].sort((a, b) =>
        new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
      ));
      setShowImportModal(false);
      setImportUrl('');
      Alert.alert('Success', 'Events imported');
    } catch (err) {
      Alert.alert('Error', 'Failed to import events');
    }
  };

  const handleCompleteEvent = (eventId: string) => {
    setEvents(events.map(event => 
      event.id === eventId ? { ...event, completed: true } : event
    ));
    updateInteractions(2);
    Alert.alert('Great!', `${companion.name} enjoyed spending time with you!`);
  };

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'chat': return MessageCircle;
      case 'voice': return Mic;
      case 'video': return Video;
      case 'date': return Heart;
      case 'reminder': return Clock;
      default: return Calendar;
    }
  };

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'chat': return '#FF6B8A';
      case 'voice': return '#9C6ADE';
      case 'video': return '#4CAF50';
      case 'date': return '#FF1744';
      case 'reminder': return '#FFC107';
      default: return '#666666';
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date);
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const renderCalendar = () => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    const days = getDaysInMonth(currentDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <View style={styles.calendar}>
        <View style={styles.calendarHeader}>
          <Text style={styles.monthTitle}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
        </View>
        
        <View style={styles.weekDays}>
          {dayNames.map(day => (
            <Text key={day} style={styles.weekDay}>{day}</Text>
          ))}
        </View>
        
        <View style={styles.daysGrid}>
          {days.map((day, index) => {
            const dateString = day.toISOString().split('T')[0];
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isSelected = dateString === selectedDate;
            const isToday = dateString === new Date().toISOString().split('T')[0];
            const dayEvents = getEventsForDate(dateString);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  isSelected && styles.selectedDay,
                  isToday && styles.today,
                  !isCurrentMonth && styles.otherMonth
                ]}
                onPress={() => setSelectedDate(dateString)}
              >
                <Text style={[
                  styles.dayText,
                  isSelected && styles.selectedDayText,
                  isToday && styles.todayText,
                  !isCurrentMonth && styles.otherMonthText
                ]}>
                  {day.getDate()}
                </Text>
                {dayEvents.length > 0 && (
                  <View style={styles.eventDots}>
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <View 
                        key={i} 
                        style={[styles.eventDot, { backgroundColor: getEventColor(event.type) }]} 
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderEventsList = () => {
    const selectedEvents = getEventsForDate(selectedDate);
    const upcomingEvents = events.filter(event => 
      new Date(event.date + ' ' + event.time) > new Date() && !event.completed
    ).slice(0, 3);

    return (
      <ScrollView style={styles.eventsContainer}>
        <View style={styles.eventsHeader}>
          <Text style={styles.eventsTitle}>
            Events for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.importButton} onPress={() => setShowImportModal(true)}>
              <Download size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addEventButton} onPress={handleAddEvent}>
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {selectedEvents.length === 0 ? (
          <View style={styles.noEvents}>
            <Calendar size={48} color="#CCCCCC" />
            <Text style={styles.noEventsText}>No events scheduled</Text>
            <Text style={styles.noEventsSubtext}>
              Add an event to spend quality time with {companion.name}
            </Text>
          </View>
        ) : (
          selectedEvents.map(event => {
            const IconComponent = getEventIcon(event.type);
            return (
              <View key={event.id} style={styles.eventCard}>
                <View style={[styles.eventIconContainer, { backgroundColor: getEventColor(event.type) }]}>
                  <IconComponent size={20} color="#FFFFFF" />
                </View>
                <View style={styles.eventDetails}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDescription}>{event.description}</Text>
                  <Text style={styles.eventTime}>{formatTime(event.time)}</Text>
                </View>
                {!event.completed && (
                  <TouchableOpacity 
                    style={styles.completeButton}
                    onPress={() => handleCompleteEvent(event.id)}
                  >
                    <Text style={styles.completeButtonText}>Complete</Text>
                  </TouchableOpacity>
                )}
                {event.completed && (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>✓</Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        {upcomingEvents.length > 0 && (
          <View style={styles.upcomingSection}>
            <Text style={styles.upcomingTitle}>Upcoming Events</Text>
            {upcomingEvents.map(event => {
              const IconComponent = getEventIcon(event.type);
              return (
                <View key={event.id} style={styles.upcomingEvent}>
                  <IconComponent size={16} color={getEventColor(event.type)} />
                  <View style={styles.upcomingDetails}>
                    <Text style={styles.upcomingEventTitle}>{event.title}</Text>
                    <Text style={styles.upcomingEventTime}>
                      {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })} at {formatTime(event.time)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderEventModal = () => (
    <Modal
      visible={showEventModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule Event</Text>
            <TouchableOpacity onPress={() => setShowEventModal(false)}>
              <X size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Event Title</Text>
              <TextInput
                style={styles.formInput}
                value={newEvent.title}
                onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
                placeholder={`Time with ${companion.name}`}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={newEvent.description}
                onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
                placeholder="What would you like to do together?"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date</Text>
                <TextInput
                  style={styles.formInput}
                  value={newEvent.date}
                  onChangeText={(text) => setNewEvent({ ...newEvent, date: text })}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Time</Text>
                <TextInput
                  style={styles.formInput}
                  value={newEvent.time}
                  onChangeText={(text) => setNewEvent({ ...newEvent, time: text })}
                  placeholder="HH:MM"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Event Type</Text>
              <View style={styles.typeSelector}>
                {(['chat', 'voice', 'video', 'date', 'reminder'] as const).map(type => {
                  const IconComponent = getEventIcon(type);
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        newEvent.type === type && styles.selectedType
                      ]}
                      onPress={() => setNewEvent({ ...newEvent, type })}
                    >
                      <IconComponent size={20} color={newEvent.type === type ? "#FFFFFF" : getEventColor(type)} />
                      <Text style={[
                        styles.typeText,
                        newEvent.type === type && styles.selectedTypeText
                      ]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowEventModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveEvent}>
              <Text style={styles.saveButtonText}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderImportModal = () => (
    <Modal visible={showImportModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Import Calendar</Text>
            <TouchableOpacity onPress={() => setShowImportModal(false)}>
              <X size={24} color="#666666" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Calendar URL</Text>
              <TextInput
                style={styles.formInput}
                value={importUrl}
                onChangeText={setImportUrl}
                placeholder="https://example.com/calendar.ics"
              />
            </View>
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowImportModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleImportEvents}>
              <Text style={styles.saveButtonText}>Import</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
      </View>

      {renderCalendar()}
      {renderEventsList()}
      {renderEventModal()}
      {renderImportModal()}

      <PremiumFeatureModal
        visible={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        featureName="Unlimited Calendar Events"
        description="Schedule unlimited events and appointments with your AI companion."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  calendar: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  calendarHeader: {
    padding: 16,
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
  },
  weekDays: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedDay: {
    backgroundColor: '#FF6B8A',
    borderRadius: 8,
  },
  today: {
    borderWidth: 2,
    borderColor: '#FF6B8A',
    borderRadius: 8,
  },
  otherMonth: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    color: '#333333',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  todayText: {
    fontWeight: '600',
  },
  otherMonthText: {
    color: '#CCCCCC',
  },
  eventDots: {
    position: 'absolute',
    bottom: 2,
    flexDirection: 'row',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  eventsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  importButton: {
    backgroundColor: '#9C6ADE',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addEventButton: {
    backgroundColor: '#FF6B8A',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noEvents: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noEventsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  noEventsSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  eventIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 12,
    color: '#9C6ADE',
    fontWeight: '500',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  upcomingSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  upcomingEvent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  upcomingDetails: {
    marginLeft: 12,
  },
  upcomingEventTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  upcomingEventTime: {
    fontSize: 12,
    color: '#666666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  modalContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedType: {
    backgroundColor: '#FF6B8A',
  },
  typeText: {
    fontSize: 12,
    color: '#333333',
    marginLeft: 4,
  },
  selectedTypeText: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FF6B8A',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});