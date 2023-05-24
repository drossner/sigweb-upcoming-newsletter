<template xmlns="http://www.w3.org/1999/html">

  <div class="d-flex align-center justify-center flex-column h-screen">
    <a href="https://github.com/drossner/sigweb-upcoming-newsletter"><v-icon color="black" icon="mdi-github" class="position-sticky" size="x-large"></v-icon></a>
    <v-card class="main-container pa-8 ma-5 d-flex flex-column" style="gap: 1em">
      <h1>Export Settings</h1>
      <v-slide-y-transition group hide-on-leave="">
        <v-text-field key="1" hide-details prepend-inner-icon="mdi-web" label="Enter the iCal file URL" v-model="icalUrl" clearable=""></v-text-field>
        <v-textarea key="2" hide-details label="Enter or load ical from URL" v-model="icaltext"></v-textarea>
        <v-btn key="3" v-if="icalUrl != null && icalUrl.length > 0" @click="loadIcal">Load iCAL</v-btn>
        <v-divider key="4" class="ma-5"></v-divider>
        <v-text-field key="5" v-model="date" type="date" label="Use Events from" hide-details></v-text-field>
        <v-text-field key="52" v-model="author" label="Author" hide-details></v-text-field>
        <v-text-field key="53" v-model="position" label="Author Position" hide-details></v-text-field>
        <v-text-field key="54" v-model="doi" label="DOI" persistent-hint="true" hint="e.g. 10.1145/3583849.3583854"></v-text-field>

        <v-btn key="6" @click="parseIcal" v-if="date.length === 10 && icaltext.length > 0" color="primary">Do the Magic</v-btn>
        <!--<v-list v-if="events.length > 0">
          <EventComponent v-for="event in events" :event="event"></EventComponent>
        </v-list>-->
        <v-textarea key="7" v-if="events.length > 0" v-model="latexOutput"></v-textarea>
        <div key="8" v-if="events.length > 0" class="d-flex w-100" style="gap: 10px">
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
import  ical from "ical.js/build/ical.min"
import {CalEvent} from "~/util/types";
import EventComponent from "~/components/EventComponent.vue";
import {downloadZip} from "client-zip";
import {
  calEventToTexEvent,
  insertLatexEventIntoDetailsTemplate,
  insertLatexEventIntoTableTemplate
} from "~/util/templateUtil";


const icalUrl = ref(useAppConfig().iCalDefaultUrl)
const icaltext = ref("")
const date = ref(new Date().toISOString().substring(0,10)) //yyyy-mm-dd

const latexOutput = ref("")
const author = ref(useAppConfig().defaultAuthor)
const position = ref(useAppConfig().defaultPosition)
const doi = ref(useAppConfig().defaultDoi)

const overleafForm = ref(null)
const formInput = ref(null)
const bannerInput = ref(null)


const events = ref<CalEvent[]>([])

async function loadIcal() {
  const ical = await (fetch(icalUrl.value, { mode: 'cors'}).then(data => data.text()))
  icaltext.value = ical
}

async function parseIcal() {
  const calData = ical.parse(icaltext.value)
  const calAPI = new ical.Component(calData)
  const eventComponents = calAPI.getAllSubcomponents("vevent")
  events.value.splice(0, events.value.length)
  eventComponents.forEach(comp => {
    const event = handleEvent(comp)
    if(event.startDate > date.value) events.value.push(event)
  })
  events.value.sort((a,b) => a.startDate < b.startDate ? -1 : 1)
  await fillTemplate()
}

function handleEvent(eventComponent: any): CalEvent {
  const aEvent = new ical.Event(eventComponent)
  aEvent.contact = eventComponent.getFirstPropertyValue("contact")
  aEvent.category = eventComponent.getFirstPropertyValue("categories")
  return aEvent
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
  let template = await fetch("templatex.tex").then(data => data.text())

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
    min-width: 300px;
    width: 800px;
    margin: 0 auto;
  }
</style>