# LSPD Department Portal

This is a Vite + React + Tailwind starter website for the Los Santos Police Department portal.

## Local setup

```bash
npm install
npm run dev
```

## Build for upload

```bash
npm run build
```

After building, upload the contents of the `dist` folder to the web root for:

`www.lspd.rcrp.com`

## Demo logins

Department:
- username: officer
- password: lspd123

Admin:
- username: admin
- password: admin123

## Important

This version uses demo client-side login and temporary in-browser state. For a real live department system, the next step is adding:
- database storage
- real authentication
- server-side admin protection
- persistent roster/forms
