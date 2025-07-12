import api, { getWithCache } from './api';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
}

export const calendarService = {
  async importFromUrl(url: string): Promise<CalendarEvent[]> {
    const response = await getWithCache('/calendar/import', { params: { url } });
    return response.data.events;
  }
};
