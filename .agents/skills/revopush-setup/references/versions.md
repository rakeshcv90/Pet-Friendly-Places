# Version strategy & compatibility

See the Revopush 2.0 getting-started page
(https://docs.revopush.org/revopush20/getting-started#setup-mobile-client-sdk).
The guidance below was accurate as of this skill's `last-updated` date.

> **Heads-up on the docs:** some older docs pages (e.g. the original
> `intro/getting-started` and `intro/expo`) still list the 1.x SDK line
> (1.5.x/1.6.x) and have not yet been updated for the 2.x line. The 2.x guidance
> here is intentional and current — prefer it. When pages disagree, the **2.0**
> getting-started page and this table are the intended policy.

## Always use the 2.x SDK line

**Any new integration must use `@revopush/react-native-code-push` 2.x (2.5.x /
2.6.x).** The 2.x line adds **differential ("diff") updates** — the server sends
only the changed bytes against a base snapshot, cutting update payloads by ~10–20×.
`2.6.x` is functionally the same as the old `1.6` but with diff updates.

**Do not recommend the 1.x line (1.5.x / 1.6.x) for new setups** — it has no diff
updates and is superseded. The only time you don't use Revopush at all is React
Native below 0.76 (see the table).

## React Native → SDK version

| React Native | Use |
|---|---|
| **< 0.76** | **Not supported by Revopush.** Use Microsoft's original `react-native-code-push` (https://github.com/microsoft/react-native-code-push), or upgrade React Native. Stop the Revopush integration. |
| **0.76 – 0.82** | `@revopush/react-native-code-push@2.5.1` (the 2.5.x line). |
| **0.83+** | `@revopush/react-native-code-push@2.6.x` (latest 2.6 release). |

Install (bare RN), picking the row that matches the detected RN version:

```bash
# RN 0.76–0.82
npm install --save @revopush/react-native-code-push@2.5.1
# RN 0.83+
npm install --save @revopush/react-native-code-push@2.6.0   # or the latest 2.6.x
```

For Expo, **don't** rely on `npx expo install` auto-resolving these versions
(the packages aren't in Expo's compat metadata). Pin the 2.x SDK **and** the
SDK-matched config-plugin version explicitly per the table in `expo.md` (Expo
52–54 → SDK `2.5.1` + plugin `1.0.1`; Expo 55+ → SDK `2.6.0` + plugin `1.1.0`).

To check what's published / latest:
```bash
npm view @revopush/react-native-code-push version            # latest
npm view @revopush/react-native-code-push versions --json     # all (look for 2.5.x / 2.6.x)
```

> The exact RN→SDK boundaries shift as new versions ship. Treat the live 2.0 docs
> as authoritative; the table above is the current mapping, not a frozen contract.
> When unsure which 2.x release fits a given RN version, check the docs link at
> the top of this file.

## CLI version

Keep the Revopush CLI current — older CLIs can lag server features (including diff
support). Latest is published at
https://www.npmjs.com/package/@revopush/code-push-cli?activeTab=versions.

```bash
npm install -g @revopush/code-push-cli     # install
npm update  -g @revopush/code-push-cli     # update to latest
revopush -v                                # check installed version
npm view @revopush/code-push-cli version   # latest published
```

## Differential updates — why the 2.x client matters

Diff generation is **server-side**, and there is **no flag or SDK option to
"enable" it** — the server produces a diff against the client's current bundle
and falls back to the full bundle when needed. What the **2.x client SDK** adds is
the ability to *receive and apply* those diffs: the server only sends a diff to a
client that advertises diff support, so a 1.x client always gets the full bundle.

That's the whole reason to install a 2.x version: not a config step, just the
client capability. Install a 2.x SDK against `api.revopush.org` and diff updates
work automatically — nothing else to set.
