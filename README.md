# DAYSTAR

DAYSTAR is a personal workspace for daily commitments, reflection, focus, goals, and planning. This copy was imported from `divineadeoti047-glitch/musical-crepe-787244` and is configured for this Netlify project.

## Device saving and private cloud access

The workspace saves in the current browser and works offline after one online visit. Clearing browser data can erase those records. Export a backup in Settings regularly.

In **Settings → Private cloud backup**, create an account, confirm its email, and sign in. **Save device copy to cloud** stores the complete current workspace privately for that account. On another device, sign in to the same account and choose **Restore cloud copy to device**. Uploads and restores replace a whole copy; they do not merge automatically. Signing in alone never uploads or replaces records. Reminders remain device-specific.

Signing out leaves local records on the device. On a shared device, export and delete local records separately. Cloud backups can be deleted independently from Settings.

The original site's browser records do not transfer automatically to this site's address. Export them from the original site's Settings, then restore that backup here. This project does not modify the original site.

## Development and verification

Install dependencies with `npm install`. Run `node --test tests/*.test.mjs` for API isolation, validation, and offline asset checks. Type-check with `npx tsc --noEmit --module nodenext --moduleResolution nodenext --target es2022 --skipLibCheck --types node netlify/functions/tasks.mts db/schema.ts db/index.ts`.

For local Netlify services, use `netlify dev --port 8889`. Static files are published from `public`; server-only code and dependency files are outside that directory. Netlify applies the checked-in database migrations during deployment. Private cloud backups require Netlify Identity and Netlify Database.

The browser Identity SDK is vendored under `public/vendor` from the pinned `@netlify/identity@2.0.0` ESM distribution, together with its browser compatibility modules. No third-party scripts need to load at runtime, including offline.
