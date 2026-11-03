import type {CalEvent} from './types'

interface Conference {
    title: string
    description: string
    start_date: string
    end_date: string
    website?: string
    url: string
    categories: {slug: string}[]
    venue?: {venue?: string}
}

function plainText(html: string): string {
    const document = new DOMParser().parseFromString(html, 'text/html')
    document.querySelectorAll('script, style, svg').forEach(node => node.remove())
    return (document.body.textContent || '').replace(/\s+/g, ' ').trim()
}

export function conferenceDescription(html: string): string {
    const document = new DOMParser().parseFromString(html, 'text/html')
    const heading = document.querySelector('h1')
    // SIGWEB's API includes the rendered event page. Keep introductory prose
    // between the title and Website/Venue sections, excluding navigation.
    if (heading) {
        const end = Array.from(document.querySelectorAll('h3')).find(node =>
            /^(website:?|venue)$/i.test(node.textContent?.trim() || ''))
        const range = document.createRange()
        range.setStartAfter(heading)
        if (end) range.setEndBefore(end)
        else range.setEnd(document.body, document.body.childNodes.length)
        const content = document.createElement('div')
        content.append(range.cloneContents())
        html = content.innerHTML
    }
    const text = plainText(html)
    // The calendar's date range precedes the actual prose in the rendered page.
    const date = '(?:January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{1,2},\\s+\\d{4}'
    return text.replace(new RegExp(`^${date}(?:\\s*[-–—]\\s*${date})?\\s*`), '').trim()
}

export function escapeLatex(text: string): string {
    const replacements: Record<string, string> = {
        '\\': '\\textbackslash{}', '&': '\\&', '%': '\\%', '$': '\\$',
        '#': '\\#', '_': '\\_', '{': '\\{', '}': '\\}',
        '~': '\\textasciitilde{}', '^': '\\textasciicircum{}',
    }
    return text.replace(/[\\&%$#_{}~^]/g, character => replacements[character])
}

export function conferenceEvent(event: Conference): CalEvent {
    const category = event.categories.find(({slug}) =>
        ['sigweb-sponsored', 'Conference', 'in-coop'].includes(slug))?.slug || ''
    return {
        summary: escapeLatex(plainText(event.title)),
        startDate: event.start_date.substring(0, 10),
        // Unlike iCalendar DTEND, the API's end_date is already inclusive.
        endDate: event.end_date.substring(0, 10),
        description: escapeLatex(conferenceDescription(event.description || '')),
        location: escapeLatex(plainText(event.venue?.venue || '')),
        contact: event.website || event.url,
        category: category === 'sigweb-sponsored' ? 'Conference' : category,
    }
}

export async function loadConferenceRange(endpoint: string, from: string, through: string): Promise<CalEvent[]> {
    const events: CalEvent[] = []
    let page = 1
    let totalPages = 1
    do {
        const url = new URL(endpoint)
        url.searchParams.set('start_date', `${from} 00:00:00`)
        // end_date filters by when the conference ends. Filter its start
        // instead, so a conference may continue beyond the selected range.
        const nextDay = new Date(`${through}T00:00:00Z`)
        nextDay.setUTCDate(nextDay.getUTCDate() + 1)
        url.searchParams.set('starts_before', `${nextDay.toISOString().substring(0, 10)} 00:00:00`)
        url.searchParams.set('per_page', '50')
        url.searchParams.set('page', String(page))
        let response: Response
        try {
            response = await fetch(url.toString())
        } catch {
            throw new Error('Could not reach the SIGWEB calendar. Check your connection and the website’s CORS settings.')
        }
        if (!response.ok) throw new Error(`Calendar request failed (${response.status}). Please try again.`)
        const data = await response.json()
        if (!Array.isArray(data.events) || !Number.isInteger(data.total_pages) || data.total_pages < 0) {
            throw new Error('The calendar returned an unexpected response.')
        }
        totalPages = data.total_pages
        for (const source of data.events) {
            const event = conferenceEvent(source)
            if (event.category && event.startDate >= from && event.startDate <= through) events.push(event)
        }
        page++
    } while (page <= totalPages)
    return events.sort((a, b) => a.startDate.localeCompare(b.startDate))
}
