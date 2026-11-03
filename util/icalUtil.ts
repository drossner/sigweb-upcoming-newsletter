import ical from 'ical.js/build/ical.min'
import {escapeLatex} from './calendarUtil'
import type {CalEvent} from './types'

export function parseICalendar(text: string, from: string, through: string): CalEvent[] {
    // The new website sometimes emits a style block before its calendar.
    const begin = text.indexOf('BEGIN:VCALENDAR')
    const end = text.lastIndexOf('END:VCALENDAR')
    if (begin < 0 || end < begin) throw new Error('Please enter a complete iCalendar calendar (BEGIN:VCALENDAR through END:VCALENDAR).')
    let calendar
    try {
        calendar = new ical.Component(ical.parse(text.substring(begin, end + 'END:VCALENDAR'.length)))
    } catch {
        throw new Error('Could not parse the iCal data. Please check the calendar text.')
    }
    return calendar.getAllSubcomponents('vevent').map((component: any): CalEvent => {
        const event = new ical.Event(component)
        if (!event.startDate) throw new Error('A calendar event has no start date.')
        const endDate = event.endDate.clone()
        if (event.startDate.isDate && endDate.compare(event.startDate) > 0) endDate.adjust(-1, 0, 0, 0)
        const category = component.getAllProperties('categories')
            .flatMap((property: any) => property.getValues())
            .find((value: string) => ['sigweb-sponsored', 'Conference', 'in-coop'].includes(value)) || ''
        return {
            summary: escapeLatex(event.summary || ''),
            startDate: event.startDate.toString().substring(0, 10),
            endDate: endDate.toString().substring(0, 10),
            description: escapeLatex(event.description || ''),
            location: escapeLatex(event.location || ''),
            contact: component.getFirstPropertyValue('url') || component.getFirstPropertyValue('contact') || '',
            category: category === 'sigweb-sponsored' ? 'Conference' : category,
        }
    }).filter((event: CalEvent) => event.category && event.startDate >= from && event.startDate <= through)
        .sort((a: CalEvent, b: CalEvent) => a.startDate.localeCompare(b.startDate))
}
