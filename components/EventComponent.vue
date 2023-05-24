<template>

  <v-list-item>
    <v-list-item-title>{{ event.summary }}</v-list-item-title>
    <v-list-item-subtitle>{{ event.location }}</v-list-item-subtitle>
    <v-list-item-subtitle><a :href="event.contact">{{ event.contact }}</a></v-list-item-subtitle>
    <v-list-item-subtitle>{{ event.startDate }} – {{ event.endDate }}</v-list-item-subtitle>
    <v-list-item-subtitle>{{ event.category }}</v-list-item-subtitle>
    <span>{{ event.description}} </span>
  </v-list-item>

</template>

<script setup lang="ts">

import {CalEvent} from "~/util/types";

const props = defineProps<{
  event: CalEvent
}>()

</script>