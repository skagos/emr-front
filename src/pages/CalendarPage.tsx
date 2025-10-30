import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, LogIn, LogOut, Plus, Trash2, Edit2 } from 'lucide-react';

declare const gapi: any;

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  description?: string;
  location?: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<GoogleCalendarEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    summary: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });

  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
  const SCOPES = 'https://www.googleapis.com/auth/calendar';

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const initClient = () => {
      if (typeof gapi === 'undefined') {
        setIsLoading(false);
        return;
      }

      gapi.load('client:auth2', () => {
        gapi.client
          .init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
            scope: SCOPES,
          })
          .then(() => {
            const authInstance = gapi.auth2.getAuthInstance();
            setIsSignedIn(authInstance.isSignedIn.get());
            authInstance.isSignedIn.listen(setIsSignedIn);
            setIsLoading(false);

            if (authInstance.isSignedIn.get()) {
              fetchEvents();
            }
          })
          .catch((error: any) => {
            console.error('Error initializing Google API client:', error);
            setIsLoading(false);
          });
      });
    };

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = initClient;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      fetchEvents();
    }
  }, [currentDate, isSignedIn]);

  const fetchEvents = () => {
    if (typeof gapi === 'undefined' || !gapi.client.calendar) return;

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

    gapi.client.calendar.events
      .list({
        calendarId: 'primary',
        timeMin: startOfMonth.toISOString(),
        timeMax: endOfMonth.toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 250,
        orderBy: 'startTime',
      })
      .then((response: any) => {
        setEvents(response.result.items || []);
      })
      .catch((error: any) => {
        console.error('Error fetching calendar events:', error);
      });
  };

  const handleSignIn = () => {
    if (typeof gapi !== 'undefined' && gapi.auth2) {
      gapi.auth2.getAuthInstance().signIn();
    }
  };

  const handleSignOut = () => {
    if (typeof gapi !== 'undefined' && gapi.auth2) {
      gapi.auth2.getAuthInstance().signOut();
      setEvents([]);
      setSelectedDate(null);
    }
  };

  const openNewEventModal = () => {
    setEditingEvent(null);
    const defaultDate = selectedDate || new Date();
    setEventForm({
      summary: '',
      description: '',
      location: '',
      startDate: defaultDate.toISOString().split('T')[0],
      startTime: '09:00',
      endDate: defaultDate.toISOString().split('T')[0],
      endTime: '10:00',
    });
    setShowEventModal(true);
  };

  const openEditEventModal = (event: GoogleCalendarEvent) => {
    setEditingEvent(event);
    const startDateTime = event.start.dateTime || event.start.date;
    const endDateTime = event.end.dateTime || event.end.date;

    if (startDateTime && endDateTime) {
      const startDate = new Date(startDateTime);
      const endDate = new Date(endDateTime);

      setEventForm({
        summary: event.summary || '',
        description: event.description || '',
        location: event.location || '',
        startDate: startDate.toISOString().split('T')[0],
        startTime: event.start.dateTime ? startDate.toTimeString().slice(0, 5) : '',
        endDate: endDate.toISOString().split('T')[0],
        endTime: event.end.dateTime ? endDate.toTimeString().slice(0, 5) : '',
      });
    }
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.summary) return;

    const event = {
      summary: eventForm.summary,
      description: eventForm.description,
      location: eventForm.location,
      start: eventForm.startTime
        ? { dateTime: `${eventForm.startDate}T${eventForm.startTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
        : { date: eventForm.startDate },
      end: eventForm.endTime
        ? { dateTime: `${eventForm.endDate}T${eventForm.endTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
        : { date: eventForm.endDate },
    };

    try {
      if (editingEvent) {
        await gapi.client.calendar.events.update({
          calendarId: 'primary',
          eventId: editingEvent.id,
          resource: event,
        });
      } else {
        await gapi.client.calendar.events.insert({
          calendarId: 'primary',
          resource: event,
        });
      }
      setShowEventModal(false);
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventStart = event.start.dateTime || event.start.date;
      if (!eventStart) return false;
      const eventDate = new Date(eventStart);
      return isSameDay(eventDate, date);
    });
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const firstDay = firstDayOfMonth(currentDate);
    const today = new Date();

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square p-2 bg-gray-50" />
      );
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = isSameDay(date, today);
      const isSelected = selectedDate && isSameDay(date, selectedDate);

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`aspect-square p-2 border border-gray-200 cursor-pointer transition-all hover:bg-gray-50 ${
            isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
          } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate"
                title={event.summary}
              >
                {event.start.dateTime
                  ? new Date(event.start.dateTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'All day'}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-600">+{dayEvents.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Google Calendar...</p>
        </div>
      </div>
    );
  }

  if (!CLIENT_ID || !API_KEY) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Google Calendar Configuration Required</h3>
          <p className="text-gray-600 mb-4">Please add your Google Calendar API credentials to the environment variables.</p>
          <div className="text-left max-w-2xl mx-auto bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">Add these to your .env file:</p>
            <code className="text-sm text-gray-800 block">
              VITE_GOOGLE_CLIENT_ID=your_client_id_here<br />
              VITE_GOOGLE_API_KEY=your_api_key_here
            </code>
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect to Google Calendar</h3>
          <p className="text-gray-600 mb-6">Sign in with your Google account to view and edit your calendar</p>
          <button
            onClick={handleSignIn}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Google Calendar</h2>
          <p className="text-gray-600">View and manage your appointments</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <h3 className="text-xl font-bold text-white">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="flex justify-center mt-3">
                <button
                  onClick={goToToday}
                  className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors"
                >
                  Today
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="px-2 py-3 text-center text-sm font-semibold text-gray-700">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {renderCalendarDays()}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedDate
                  ? selectedDate.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Select a date'}
              </h3>
              <button
                onClick={openNewEventModal}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {selectedDate ? (
              selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map((event) => (
                    <div
                      key={event.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="font-semibold text-gray-900 mb-2">
                        {event.summary}
                      </div>
                      {event.start.dateTime ? (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <Clock className="w-3 h-3" />
                          {formatTime(event.start.dateTime)} - {formatTime(event.end.dateTime || event.start.dateTime)}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600 mb-2">All day event</div>
                      )}
                      {event.location && (
                        <div className="text-sm text-gray-700 mb-2">
                          {event.location}
                        </div>
                      )}
                      {event.description && (
                        <div className="text-sm text-gray-700 mt-2 pt-2 border-t border-gray-100">
                          {event.description}
                        </div>
                      )}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => openEditEventModal(event)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No events scheduled</p>
                  <button
                    onClick={openNewEventModal}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Event
                  </button>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Click on a date to view events</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingEvent ? 'Edit Event' : 'New Event'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={eventForm.summary}
                  onChange={(e) => setEventForm({ ...eventForm, summary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Event title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Event location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Event description"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEventModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {editingEvent ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
