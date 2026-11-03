# SIGWEB Upcoming Newsletter (Generator)

This repository houses the LaTeX template for "Upcoming Conferences" column of the 
[SIGWEB Newsletter](https://dl.acm.org/newsletter/sigweb), along with a small Web application to parse
iCal files to populate the template.

Important files:
- [public/templatex.tex](https://github.com/drossner/sigweb-upcoming-newsletter/blob/main/public/templatex.tex)
  contains the template with placeholders.
- [util/templateUtil.ts](https://github.com/drossner/sigweb-upcoming-newsletter/blob/main/util/templateUtil.ts)
  contains code to populate the template, check the
  [Index Page](https://github.com/drossner/sigweb-upcoming-newsletter/blob/main/pages/index.vue) as well.

The project is open for pull requests.

## Loading conferences

Choose **Events from** and **Events through**, then click **Load conferences**.
The app queries SIGWEB's public Events Calendar REST API and fetches all result
pages. The date range includes conferences starting on either selected date.
Click **Do the Magic** to generate the newsletter, then review and export it.

The API must allow the GitHub Pages origin through CORS. Configure the endpoint
in `app.config.ts` (`calendarApiUrl`).

Alternatively, enter an iCal URL and click **Load iCal**, or paste calendar text
into **Enter or load iCal from URL**, then click **Do the Magic**. Both import
paths use the selected date range. Loading conferences from the API switches
back to API data; editing the iCal text switches to that text. No file upload
or drop area is required. iCal URL loading also requires CORS permission.

## Developer How To

Based on [Nuxt3]((https://nuxt.com/docs/getting-started/introduction)) (static build) and [Vuetify](https://vuetifyjs.com/en/).

### Setup

Make sure to install the dependencies:

```bash
# yarn
yarn install

# npm
npm install

# pnpm
pnpm install
```

#### Development Server

Start the development server on `http://localhost:3000`

```bash
npm run dev
```

#### Production

Build the application for production:

```bash
npm run generate
```
Push it to Github-Pages:

```bash
npm run deploy
```