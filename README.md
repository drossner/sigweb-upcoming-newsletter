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