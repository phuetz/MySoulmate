import api from './api';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
}

export const calendarService = {
  async importFromUrl(url: string): Promise<CalendarEvent[]> {
    const response = await api.get('/calendar/import', { params: { url } });
    return response.data.events;
  }
};
