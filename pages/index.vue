<template>

  <div class="d-flex align-center justify-center flex-column mt-5">
    <a href="https://github.com/drossner/sigweb-upcoming-newsletter"><v-icon color="black" icon="mdi-github" class="position-sticky" size="x-large"></v-icon></a>
    <v-card class="main-container pa-6 ma-5 d-flex flex-column" style="gap: 1em">
      <h1>Export Settings</h1>
      <v-alert v-if="calendarError" type="error" role="alert">{{ calendarError }}</v-alert>
      <p v-if="calendarStatus" role="status">{{ calendarStatus }}</p>
      <v-slide-y-transition group hide-on-leave="">
        <v-text-field key="from" v-model="date" type="date" label="Events from" :disabled="loadingCalendar" hide-details></v-text-field>
        <v-text-field key="to" v-model="endDate" type="date" label="Events through" :disabled="loadingCalendar" hide-details></v-text-field>
        <v-btn key="load" @click="loadConferences" :loading="loadingCalendar" :disabled="!validRange">Load conferences</v-btn>
        <v-divider key="ical-divider" class="ma-5"></v-divider>
        <p key="ical-heading">Or import iCal data</p>
        <v-text-field key="ical-url" v-model="icalUrl" label="Enter the iCal file URL" prepend-inner-icon="mdi-web" clearable hide-details :disabled="loadingCalendar"></v-text-field>
        <v-btn key="load-ical" @click="loadIcal" :disabled="!icalUrl || loadingCalendar">Load iCal</v-btn>
        <v-textarea key="ical-text" v-model="icaltext" label="Enter or load iCal from URL" :disabled="loadingCalendar" hint="Paste calendar text here, or load it from a URL. The selected date range applies." persistent-hint></v-textarea>
        <v-divider key="4" class="ma-5"></v-divider>
        <v-text-field key="52" v-model="author" label="Author" hide-details></v-text-field>
        <v-text-field key="53" v-model="position" label="Author Position" hide-details></v-text-field>
        <v-text-field key="54" v-model="doi" label="DOI" persistent-hint hint="e.g. 10.1145/3583849.3583854"></v-text-field>

        <v-btn key="6" @click="generateNewsletter" :disabled="loadingCalendar || !validRange" v-if="events.length > 0 || (calendarSource === 'ical' && icaltext.trim())" color="primary">Do the Magic</v-btn>
        <v-textarea key="7" v-if="latexOutput" v-model="latexOutput"></v-textarea>
        <div key="8" v-if="latexOutput" class="d-flex flex-wrap w-100" style="gap: 10px">
          <v-btn @click="copyLatex">Copy LaTeX</v-btn>
          <v-btn @click="downloadZipFile">Download ZIP</v-btn>
          <v-btn @click="openInOverleaf">Open In Overleaf (Code)</v-btn>
        </div>
      </v-slide-y-transition>

    </v-card>
    <form ref="overleafForm" id="ol_form" action="https://www.overleaf.com/docs" method="post" target="_blank">
      <input ref="formInput" id="ol_encoded_snip" type="hidden" name="encoded_snip">
      <input ref="bannerInput" type="hidden" name="encoded_snip" value="New File -> From External URL -> https://drossner.github.io/sigweb-upcoming-newsletter/sigweb-banner.png">
      <input type="hidden" name="snip_name" value="upcoming-conferences.tex">
      <input type="hidden" name="snip_name" value="README.txt">
    </form>

  </div>

</template>

<script setup lang="ts">

import {useAppConfig} from "#app";
import {loadConferenceRange} from "~/util/calendarUtil";
import {parseICalendar} from "~/util/icalUtil";
import {CalEvent} from "~/util/types";
import {downloadZip} from "client-zip";
import {
  calEventToTexEvent,
  insertLatexEventIntoDetailsTemplate,
  insertLatexEventIntoTableTemplate
} from "~/util/templateUtil";


const loadingCalendar = ref(false)
const calendarError = ref("")
const calendarStatus = ref("")
const icalUrl = ref("")
const icaltext = ref("")
const calendarSource = ref<'api' | 'ical'>('api')
function localDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}
const today = new Date()
const date = ref(localDate(today))
const endDate = ref(localDate(new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())))
const validRange = computed(() => /^\d{4}-\d{2}-\d{2}$/.test(date.value) && /^\d{4}-\d{2}-\d{2}$/.test(endDate.value) && date.value <= endDate.value)

const latexOutput = ref("")
const author = ref(useAppConfig().defaultAuthor)
const position = ref(useAppConfig().defaultPosition)
const doi = ref(useAppConfig().defaultDoi)

const overleafForm = ref(null)
const formInput = ref(null)
const bannerInput = ref(null)


const events = ref<CalEvent[]>([])

watch([date, endDate], () => {
  events.value = []
  latexOutput.value = ""
  calendarStatus.value = ""
  calendarError.value = ""
})
watch([author, position, doi], () => { latexOutput.value = "" })
watch(icaltext, () => {
  calendarSource.value = 'ical'
  events.value = []
  latexOutput.value = ""
  calendarStatus.value = ""
  calendarError.value = ""
})

async function loadIcal() {
  if (!icalUrl.value || loadingCalendar.value) return
  loadingCalendar.value = true
  calendarError.value = ""
  calendarStatus.value = ""
  try {
    const response = await fetch(icalUrl.value)
    if (!response.ok) throw new Error(`Calendar request failed (${response.status}).`)
    const text = await response.text()
    parseICalendar(text, date.value, endDate.value)
    icaltext.value = text
    await nextTick()
    calendarSource.value = 'ical'
    calendarStatus.value = 'Loaded iCal data. Click Do the Magic to generate the newsletter.'
  } catch (error) {
    calendarError.value = error instanceof Error ? error.message : 'Could not load iCal data.'
  } finally {
    loadingCalendar.value = false
  }
}

async function loadConferences() {
  if (!validRange.value || loadingCalendar.value) return
  loadingCalendar.value = true
  calendarError.value = ""
  calendarStatus.value = ""
  events.value = []
  latexOutput.value = ""
  try {
    events.value = await loadConferenceRange(useAppConfig().calendarApiUrl, date.value, endDate.value)
    calendarSource.value = 'api'
    const count = events.value.length
    calendarStatus.value = count
      ? `Loaded ${count} conference${count === 1 ? '' : 's'}. Click Do the Magic to generate the newsletter.`
      : 'No sponsored or in-cooperation conferences found in this date range.'
    const missing = events.value.filter(event => !event.description).length
    if (missing) calendarStatus.value += ` ${missing} conference${missing === 1 ? ' has' : 's have'} no description; review the generated text before publication.`
  } catch (error) {
    calendarError.value = error instanceof Error ? error.message : 'Could not load conferences.'
  } finally {
    loadingCalendar.value = false
  }
}

async function generateNewsletter() {
  calendarError.value = ""
  latexOutput.value = ""
  try {
    if (calendarSource.value === 'ical') {
      events.value = []
      events.value = parseICalendar(icaltext.value, date.value, endDate.value)
      calendarStatus.value = events.value.length
        ? `Imported ${events.value.length} conference${events.value.length === 1 ? '' : 's'} from iCal. Review descriptions before publication.`
        : 'No sponsored or in-cooperation conferences found in this date range.'
    }
    if (!events.value.length) return
    await fillTemplate()
  } catch (error) {
    latexOutput.value = ""
    calendarError.value = error instanceof Error ? error.message : 'Could not generate the newsletter.'
  }
}

async function fillTemplate(){
  const tableSelector = "%TABLE_BEGIN"
  const templateSelector = "%TEMPLATE:"

  const coopTableSelector = "%TABLE_BEGIN"

  const contentSelector = "%DETAILS_START"
  const detailsTemplateSelector = "%TEMPLATE_START"
  const detailsTemplateEndSelector = "%TEMPLATE_END"
  /*
  %TABLE_BEGIN
    %TEMPLATE:\textbf{\hyperref[lab:%EVENT_ID%]{%EVENT_SHORT%}}  & %MONTH_SHORT% %BEGIN_DAY% -- %END_DAY%, %YEAR%   & %LOCATION%  & \url{%URL%}
  %TABLE_END
   */
  const response = await fetch("templatex.tex")
  if (!response.ok) throw new Error('Could not load the newsletter template. Please try again.')
  let template = await response.text()

  const tableBeginIndex = template.indexOf(tableSelector)
  const templateIndex = template.indexOf(templateSelector, tableBeginIndex)
  const entryTemplate = template.substring(templateIndex+templateSelector.length, template.indexOf("\n", templateIndex))

  const coopTableBeginIndex = template.indexOf(coopTableSelector)
  //entry template is equals :)

  const detailsBeginIndex = template.indexOf(contentSelector)
  const contentTemplateStartIndex = template.indexOf(detailsTemplateSelector, detailsBeginIndex)
  const contentTemplateEndIndex = template.indexOf(detailsTemplateEndSelector, contentTemplateStartIndex)
  const contentTemplate = template.substring(contentTemplateStartIndex+detailsTemplateSelector.length, contentTemplateEndIndex)

  let tableEntries = ""
  let coopTableEntries = ""
  let contentEntries = ""
  let coopContentEntries = ""

  events.value.forEach(it => {
    const texEvent = calEventToTexEvent(it)
    const tableEntry = insertLatexEventIntoTableTemplate(texEvent, entryTemplate)
    const detailsEntry = insertLatexEventIntoDetailsTemplate(texEvent, contentTemplate)
    if(it.category === "Conference") {
      tableEntries += "\n"
      tableEntries += tableEntry
      contentEntries += "\n\n"
      contentEntries += detailsEntry
    } else if(it.category === "in-coop") {
      coopTableEntries += "\n"
      coopTableEntries += tableEntry
      coopContentEntries += "\n\n"
      coopContentEntries += detailsEntry
    }
  })

  template = template.replace("%TABLE_CONTENT", tableEntries)
  template = template.replace("%TABLE_COOP_CONTENT", coopTableEntries)
  template = template.replace("%DETAILS_CONTENT", contentEntries)
  template = template.replace("%DETAILS_COOP_CONTENT", coopContentEntries)

  template = template.replaceAll("%AUTHOR%", author.value)
  template = template.replaceAll("%POSITION%", position.value)
  template = template.replaceAll("%DOI%", doi.value)

  template = template.replaceAll(/(%TEMPLATE_START)(.*)(%TEMPLATE_END)/gs, "")

  latexOutput.value = template

}

function copyLatex() {
  navigator.clipboard.writeText(latexOutput.value)
  alert("Copied LaTeX!")
}

async function downloadZipFile() {
  const blob = await createZip()

  // make and click a temporary link to download the Blob
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = "sigweb-upcoming.zip"
  console.log(link.href)
  link.click()
  link.remove()
}

async function openInOverleaf() {
  formInput.value.value = encodeURIComponent(latexOutput.value)
  overleafForm.value.submit()
}

async function createZip() {
  // define what we want in the ZIP
  const banner = await fetch("sigweb-banner.png")
  const tex = { name: "sigweb-upcoming.tex", lastModified: new Date(), input: latexOutput.value }

  // get the ZIP stream in a Blob
  const blob = await downloadZip([tex, banner]).blob()
  return blob
}

</script>

<style scoped>
  .main-container {
    min-width: 0;
    width: 800px;
    max-width: 100%;
  }
</style>
