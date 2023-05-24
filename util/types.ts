export interface CalEvent {
    summary: string
    startDate: any
    endDate: any
    description: string
    location: string
    contact: string
    category: string
}


// %TEMPLATE:\textbf{\hyperref[lab:%EVENT_ID%]{%EVENT_SHORT%}}  & %MONTH_SHORT_BEGIN% %BEGIN_DAY% -- %MONTH_SHORT_END% %END_DAY%, %YEAR%   & %LOCATION%  & \url{%URL%} \\
export interface LatexEvent {
    id: string
    eventShortName: string
    monthStartShort: string
    monthStartLong: string
    monthEndShort: string
    monthEndLong: string
    dayStart: string
    dayEnd: string
    year: string
    location: string
    url: string
    description: string
    name: string
}