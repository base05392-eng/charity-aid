# Charity Aid · المساعدات الخيرية
## Complete Setup & Build Guide (Windows, Android)

---

## What You Need Before Starting

| Tool | Purpose | Where to get it |
|---|---|---|
| Node.js (LTS) | Runs JavaScript tools | https://nodejs.org |
| EAS CLI | Builds your Android APK | Installed via npm (step below) |
| Expo Account | Free cloud build service | https://expo.dev (already signed up) |
| Android Phone | To install and test the app | Your device |

---

## Step 1 — Install Node.js

1. Go to **https://nodejs.org**
2. Click the big green **LTS** button to download
3. Run the installer — click Next on every screen, keep all defaults
4. When done, open **PowerShell** (search "PowerShell" in the Start menu)
5. Type this and press Enter to confirm it worked:
   ```
   node --version
   ```
   You should see something like `v20.11.0` — any number is fine.

---

## Step 2 — Install EAS CLI

In the same PowerShell window, run:

```
npm install -g eas-cli
```

Wait for it to finish (about 1 minute). Then confirm:

```
eas --version
```

You should see a version number like `9.x.x`.

---

## Step 3 — Get the Project Files

1. Download **charity-aid.zip** from the chat
2. Right-click the zip → **Extract All**
3. Choose a location — for example `C:\Users\YourName\Documents\charity-aid`
4. Click **Extract**

You should now have a folder called `charity-aid` containing files like `App.tsx`, `package.json`, etc.

---

## Step 4 — Open the Project in PowerShell

In PowerShell, navigate into the project folder:

```
cd C:\Users\YourName\Documents\charity-aid
```

> Replace `YourName` with your actual Windows username. You can also just type `cd ` (with a space), then drag the folder from File Explorer into the PowerShell window — it fills in the path automatically.

Confirm you're in the right place:

```
dir
```

You should see `App.tsx`, `package.json`, `src` folder listed.

---

## Step 5 — Install Dependencies

Run:

```
npm install
```

This downloads all the libraries the app needs. It will take 2–5 minutes and print a lot of text. This is normal. When it finishes you'll see your cursor again.

> If you see any **npm WARN** messages — ignore them. Only **errors** (npm ERR!) matter.

---

## Step 6 — Log In to Expo

```
eas login
```

Enter the email and password you used when signing up at expo.dev.

---

## Step 7 — Link Project to Your Expo Account

```
eas init
```

When asked **"Would you like to create a new EAS project?"** — press **Y** and Enter.

When asked for a project name — press Enter to accept the default (`charity-aid`).

This updates `app.json` with your personal project ID automatically.

---

## Step 8 — Build the APK

```
eas build --platform android --profile development
```

When asked **"Do you want to log in to your Expo account?"** — press **Y**.

When asked about credentials — press Enter to let EAS handle them automatically.

The build uploads your code to Expo's servers and compiles it. This takes **10–20 minutes** depending on the queue.

When it finishes you will see a message like:

```
✔ Build finished
https://expo.dev/accounts/yourname/projects/charity-aid/builds/xxxxxxxx
```

---

## Step 9 — Download and Install on Your Phone

1. Open the link from Step 8 on your **Android phone's browser**
   (easiest: copy the link, WhatsApp it to yourself, tap it on your phone)
2. Tap **Download** on the page
3. When the download finishes, tap the downloaded file to install
4. Android will warn **"Install from unknown sources"** — tap **Settings**, enable it for your browser, then go back and tap Install
5. The app installs and you will see the **Charity Aid** icon on your home screen

---

## Step 10 — First Launch

1. Open the app
2. You will be prompted to **set a 4-digit PIN** — this protects all admin actions
3. Enter your PIN, confirm it, tap **Create PIN**
4. You are now on the main Scan screen

---

## Using the App

### Scanning a Civil ID
1. Tap **Scan Civil ID · مسح الهوية**
2. Camera opens — frame the Kuwait Civil ID card inside the rectangle
3. Tap the white circle button to capture
4. The app reads the card automatically — a spinner shows while it processes
5. The **Review screen** appears with the parsed details — correct anything wrong
6. Tap **Confirm & Submit · تأكيد وإرسال**
7. The **Result Card** shows the beneficiary status

### Manual Entry
1. Tap **Enter Manually · إدخال يدوي** on the Scan screen
2. Fill in the Civil ID (12 digits), English name, Arabic name
3. Tap **Confirm & Submit**

### Starting a Distribution Round
1. Go to **Dashboard · لوحة التحكم**
2. Tap **Start New Round · بدء جولة جديدة**
3. Enter a round name (e.g. "Ramadan 2025")
4. Confirm — this resets all eligibility for non-blacklisted beneficiaries

### Exporting Data
1. Go to **Admin · المشرف**
2. Enter your PIN
3. Tap **Export as CSV**
4. File saves to your phone's Downloads folder

---

## Troubleshooting

### "npm install" fails with permission error
Run PowerShell **as Administrator**: right-click PowerShell → "Run as administrator", then try again.

### "eas build" says "not logged in"
Run `eas login` again and enter your credentials.

### Build fails with "out of memory" or similar
Wait a few minutes and try again — this is a temporary server issue on Expo's side.

### App installs but crashes immediately
Make sure you installed the **development** build (profile: development). If you accidentally ran a production build, run:
```
eas build --platform android --profile development
```

### Camera permission denied
Go to Android **Settings → Apps → Charity Aid → Permissions → Camera** and enable it.

### OCR reads the card wrong
This is normal for some ID cards — the Review screen lets you correct any field before submitting. Nothing is submitted automatically; you always confirm first.

---

## Rebuilding After Code Changes

If changes are made to the code, just run:

```
eas build --platform android --profile development
```

Again — no need to reinstall Node or redo any other step.

---

## File Structure Reference

```
charity-aid/
├── App.tsx                    ← App entry, first-launch PIN setup
├── app.json                   ← Expo config (Android permissions etc.)
├── eas.json                   ← Build profiles
├── package.json               ← Dependencies
└── src/
    ├── i18n/
    │   ├── en.json            ← All English strings
    │   └── ar.json            ← All Arabic strings
    ├── database/
    │   └── index.ts           ← SQLite schema + all queries
    ├── stores/
    │   ├── authStore.ts       ← PIN, biometric, session management
    │   ├── beneficiaryStore.ts← Beneficiary state & actions
    │   └── roundStore.ts      ← Distribution round state
    ├── utils/
    │   ├── parseCivilIdOcr.ts ← OCR text → CID, name EN, name AR
    │   ├── pinHash.ts         ← SHA-256 PIN hashing
    │   ├── avatarColor.ts     ← CID-based consistent avatar colors
    │   └── csvExport.ts       ← Export all data to CSV
    ├── components/
    │   ├── StatusPill.tsx     ← New / Eligible / Blocked / Blacklisted badge
    │   ├── AvatarCircle.tsx   ← Initials avatar with CID-based color
    │   ├── PinModal.tsx       ← 4-dot PIN entry + biometric button
    │   └── CollectionHistory.tsx ← Collapsible history accordion
    ├── navigation/
    │   └── index.tsx          ← Bottom tabs + stack navigators
    ├── screens/
    │   ├── ScanScreen.tsx     ← Home screen — scan or manual entry
    │   ├── CameraScreen.tsx   ← Camera viewfinder + ML Kit OCR
    │   ├── ReviewScreen.tsx   ← Confirm/correct OCR results
    │   ├── ResultCardScreen.tsx ← Full beneficiary card + actions
    │   ├── RegistryScreen.tsx ← Searchable/filterable beneficiary list
    │   ├── DashboardScreen.tsx← Metrics + round management
    │   └── AdminScreen.tsx    ← PIN-protected admin panel
    └── theme.ts               ← All colors in one place
```

---

*Built for Kuwait charity field operations. All data stored on-device. No internet required for scanning, collecting, or searching.*
