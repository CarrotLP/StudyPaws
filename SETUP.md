# Haven — CI/CD setup (OTA auto-update)

Pushes to **master** that touch JS/asset files publish an **EAS Update (OTA)** to
the **`preview`** channel. Installed APKs (built on the `preview` channel)
download the update on cold start and apply it on the **next launch**.

The GitLab CI job that does this (`eas-update` in `.gitlab-ci.yml`) needs an
Expo access token to authenticate. Do the one-time setup below.

---

## 1. Create an Expo access token

1. Go to <https://expo.dev> and sign in (account: **justrene**).
2. Open **Account settings** → **Access Tokens**
   (direct link: <https://expo.dev/accounts/justrene/settings/access-tokens>).
3. Click **Create token**, give it a name (e.g. `gitlab-ci`), and **Create**.
4. **Copy the token now** — it is shown only once.

## 2. Add it as a GitLab CI/CD variable

1. In the GitLab project, go to **Settings** → **CI/CD**.
2. Expand **Variables** → **Add variable**.
3. Fill in:
   - **Key:** `EXPO_TOKEN`
   - **Value:** the token you copied
   - **Masked:** **Yes**
   - **Protected:** **Yes** (we only publish from the protected `master` branch)
   - Type: *Variable*; leave the rest as default.
4. **Add variable.**

The EAS CLI reads `EXPO_TOKEN` automatically — no extra config needed.

## 3. Verify

In **Settings → CI/CD → Variables** you should now see **`EXPO_TOKEN`** listed
with a **masked** value (shown as `••••••`). That's all — the next qualifying
push to `master` will run the `eas-update` job.

---

## How updates flow (and their limits)

- **Channel:** `preview`. The distributed APK listens on `preview`; the OTA job
  publishes to `preview`. These must stay in sync.
- **What auto-updates:** JS and assets only (screens in `app/`, code in `src/`,
  files in `assets/`). Changes there → OTA → phones update on next launch.
- **What does NOT auto-update:** native code / native config. The CI job
  **fails on purpose** if a commit changes `runtimeVersion` (in `app.json`) or
  the **major/minor** of `version` (in `package.json`), with the message
  *"Native or runtime change detected — OTA cannot apply this safely. Build a
  new APK instead."*

## runtimeVersion rule

`app.json` pins `"runtimeVersion": "1"`.

> **Increment this string ONLY when adding a native module or changing native
> config. Bumping the app `version` does NOT require changing `runtimeVersion`.**

OTA updates only reach builds whose `runtimeVersion` matches. So when you *do*
bump `runtimeVersion`, you must build and distribute a **new APK** on that
runtimeVersion before OTA updates will reach users again.

> **Note:** because we just changed `runtimeVersion` from the old
> `appVersion`-derived value (`0.1.0`) to the pinned `"1"`, any APK built before
> this change is on a different runtimeVersion and will **not** receive these OTA
> updates. Build and distribute a fresh `preview` APK
> (`eas build --platform android --profile preview`) so it listens on
> runtimeVersion `"1"` + channel `preview`.
