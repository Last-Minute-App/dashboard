# tiphop dashboard deployment

This repository publishes the same installable PWA built from the
`mobile-app` repository. The standalone Vite dashboard has been removed;
the build syncs the Expo mobile PWA into `dist/` so users see the same app at:

https://last-minute-app.github.io/dashboard/

## Build

From the combined workspace:

npm run build
```

`npm run build` expects this folder and `../mobile-app` to be siblings. It
runs `mobile-app`'s PWA export with `EXPO_PUBLIC_WEB_BASE_PATH=/dashboard`,
then copies `../mobile-app/dist-pwa` to this repo's `dist/`.

## Deployment

The GitHub Pages workflow checks out both repositories:

- `Last-Minute-App/dashboard`
- `Last-Minute-App/mobile-app`

It installs both projects, runs this repo's `npm run build`, and publishes
`dashboard/dist`.

Set `EXPO_PUBLIC_BACKEND_URL` in GitHub Actions variables if the API URL
changes. The default is the current Cloud Run API URL.
