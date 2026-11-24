# Deployment keys, CLI & releasing

Revopush is **hosted (SaaS)**. The dashboard is at https://app.revopush.org and
the API/server URL the SDK talks to is `https://api.revopush.org`. There is no
supported self-hosted mode — never point the SDK or CLI at a custom server.

## Install / update the CLI

```bash
npm install -g @revopush/code-push-cli     # install
npm update  -g @revopush/code-push-cli     # update to latest
revopush -v                                # confirm version
```
Keep it current — older CLIs can lag server features. The binary is `revopush`.

## Who runs the CLI

Installing the CLI and `revopush -v` are fine for you to run. **Every other
`revopush` command on this page is for the user to run in their own terminal.**
They all act through the login session that `revopush login` stores on the
user's machine — that session is the user's account credential, and commands
like `release-react`, `promote` and `rollback` change what real devices
download. Give the user the exact command, filled in for their project, and
continue once they tell you the result. Don't run them yourself, and don't run
`revopush login`, `revopush whoami`, or `revopush access-key ...` either.

## Get a deployment key

The **user** gets the keys; the agent doesn't fetch them. Two ways — most users
do this in the dashboard:

**Dashboard (https://app.revopush.org):**
1. Sign up / log in (GitHub or Google).
2. Create an app. Each app gets **Staging** and **Production** deployments by
   default, each with its own key.
3. Apps are usually split per platform (one iOS app, one Android app), so you
   typically have a separate iOS key and Android key. Copy the right key per
   platform.

**CLI (optional — commands for the user to run in their own terminal):**
```bash
revopush register                 # first time — opens app.revopush.org to sign up
revopush login                    # browser login
revopush app add MyApp-iOS        # creates Staging + Production automatically
revopush app add MyApp-Android
revopush deployment ls MyApp-iOS -k   # list deployments WITH their keys (-k = show keys)
```
The key-listing command prints keys for whichever account is logged in on this
machine — one more reason it's the user's to run (see "Who runs the CLI").
You can also create extra deployments:
```bash
revopush deployment add MyApp-iOS QA
```

> Login is browser-based against `app.revopush.org`; there is no documented flag
> to target a different server. Don't ask the user for a server URL.

## Where the key values come from

The user gives you the keys. Ask for the iOS and the Android key (they are
different — one per platform app) and write each into its place below.

If the user doesn't have them at hand, write the placeholders
`YOUR_IOS_DEPLOYMENT_KEY` and `YOUR_ANDROID_DEPLOYMENT_KEY` instead, tell them
exactly which file each one is in, and say that a release will not reach a build
that still has a placeholder. `verification.md` flags any that remain.

Don't obtain keys by reading them from the machine (CLI output, config files,
keychain, env vars, other projects) — only the user knows which app and
deployment this build should point at.

## Where keys go

| Project type | iOS key | Android key |
|---|---|---|
| Bare RN | `Info.plist` → `CodePushDeploymentKey` (see `ios.md`) | `strings.xml` → `CodePushDeploymentKey` (see `android.md`) |
| Expo | config-plugin `ios.CodePushDeploymentKey` (see `expo.md`) | config-plugin `android.CodePushDeploymentKey` |

Always pair the key with the server URL `https://api.revopush.org`
(`CodePushServerURL` on iOS Info.plist; `CodePushServerUrl` for Android
strings.xml and the Expo plugin).

## Cut a release

Build the JS bundle and push it to a deployment (user-run — see "Who runs the
CLI"):

```bash
revopush release-react <appName> ios     -d Staging
revopush release-react <appName> android -d Staging
```
Useful flags: `-d <deployment>` (default `Staging`), `-t <targetBinaryVersion>`
(semver of the native app version this update targets, e.g. `1.2.0` or `~1.2.0`),
`-m` (mandatory), `-r <percent>` (staged rollout, default `100%`),
`--description "<notes>"`, `-x` (disabled).

## Promote and roll back

Promote a tested update from Staging to Production without rebuilding:
```bash
revopush promote <appName> Staging Production
revopush promote <appName> Staging Production -r 25 --des "gradual rollout"
```

Roll back a bad release:
```bash
revopush rollback <appName> Production              # to the previous release
revopush rollback <appName> Production -r v4        # to a specific label
```

## Inspect

```bash
revopush deployment ls <appName>             # deployments (add -k to show keys — user runs that one)
revopush deployment history <appName> Production
```

## Differential updates

You don't configure these. On the 2.x SDK line, the server automatically sends a
diff against the user's current bundle (falling back to the full bundle when
needed). Just use a current SDK against `api.revopush.org` — see `versions.md`.

> This skill's job is the **SDK integration**. Releasing is the CLI's job. If the
> user only wants to publish a release of an already-integrated app, they need
> the commands above — not the SDK wiring.
