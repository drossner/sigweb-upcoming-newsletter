import {CalEvent, LatexEvent} from "~/util/types";

export function calEventToTexEvent(calEvent: CalEvent): LatexEvent {

    let name = calEvent.summary.substring(calEvent.summary.indexOf("-")+1)

    const id = name.replaceAll(" ","")
    const short = name.substring(
        name.lastIndexOf("(")+1 < 0? 0 : name.lastIndexOf("(")+1,
        name.lastIndexOf(")") < 0? 8 : name.indexOf(")")
    )
    // @ts-ignore
    const monthShort = monthNameShortMap[calEvent.startDate.toString().substring(5,7)]
    // @ts-ignore
    const monthLong = monthNameLongMap[calEvent.startDate.toString().substring(5,7)]
    // @ts-ignore
    let monthEndShort = monthNameShortMap[calEvent.endDate.toString().substring(5,7)]
    // @ts-ignore
    let monthEndLong = monthNameLongMap[calEvent.endDate.toString().substring(5,7)]
    if(monthShort === monthEndShort) monthEndShort = "" //no need to add

    const dayStart = calEvent.startDate.toString().substring(8,10)
    const dayEnd = calEvent.endDate.toString().substring(8,10)
    const year = calEvent.startDate.toString().substring(0,4)
    const location = calEvent.location
    const url = calEvent.contact
    const description = calEvent.description

    return {
        id: id,
        eventShortName: short,
        monthStartShort: monthShort,
        monthStartLong: monthLong,
        monthEndShort: monthEndShort,
        monthEndLong: monthEndLong,
        dayStart: dayStart,
        dayEnd: dayEnd,
        year: year,
        location: location,
        url: url,
        name: name.replace(/(?<=[0-9]*)(th|nd|rd)/, (it) => `\\textsuperscript{${it}}`),
        description: description
    }
}

const idSelector = "%EVENT_ID%"
const eventShortSelector = "%EVENT_SHORT%"
const monthShortBeginSelector = "%MONTH_SHORT_BEGIN%"
const monthLongBeginSelector = "%MONTH_LONG_BEGIN%"
const beginDaySelector = "%BEGIN_DAY%"
const monthShortEndSelector = "%MONTH_SHORT_END%"
const monthLongEndSelector = "%MONTH_LONG_END%"
const endDaySelector = "%END_DAY%"
const yearSelector = "%YEAR%"
const locationSelector = "%LOCATION%"
const urlSelector = "%URL%"
const descriptionSelector = "%DESCRIPTION%"
const nameSelector = "%EVENT_NAME%"

export function insertLatexEventIntoTableTemplate(event: LatexEvent, template: string): string {
    template = template.replace(idSelector, event.id)
    template = template.replace(eventShortSelector, event.eventShortName)
    template = template.replace(monthShortBeginSelector, event.monthStartShort)
    template = template.replace(beginDaySelector, event.dayStart)
    template = template.replace(monthShortEndSelector, event.monthEndShort)
    template = template.replace(endDaySelector, event.dayEnd)
    template = template.replace(yearSelector, event.year)
    template = template.replace(locationSelector, event.location)
    template = template.replace(urlSelector, event.url)
    return template
}

export function insertLatexEventIntoDetailsTemplate(event: LatexEvent, template: string): string {
    template = template.replace(nameSelector, event.name)
    template = template.replace(descriptionSelector, event.description)
    template = template.replace(beginDaySelector, event.dayStart)
    template = template.replace(endDaySelector, event.dayEnd)
    template = template.replace(yearSelector, event.year)
    template = template.replace(locationSelector, event.location)
    template = template.replace(yearSelector, event.year)
    template = template.replace(monthLongBeginSelector, event.monthStartLong)
    template = template.replace(monthLongEndSelector, event.monthEndLong)
    template = template.replace(idSelector, event.id)
    template = template.replace(urlSelector, event.url)
    return template
}

const monthNameLongMap = {
    "01": "January",
    "02": "February",
    "03": "March",
    "04": "April",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "August",
    "09": "September",
    "10": "October",
    "11": "November",
    "12": "December",
}

const monthNameShortMap = {
    "01": "Jan",
    "02": "Feb",
    "03": "Mar",
    "04": "Apr",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "Aug",
    "09": "Sept",
    "10": "Oct",
    "11": "Nov",
    "12": "Dec",
}