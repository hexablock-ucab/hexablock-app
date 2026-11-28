# 0008 — Home, settings, themes, languages and the pause menu (E1)

- **Status:** Draft — specs waiting for a teammate's approval
- **Owner:** Valentina Maza
- **Branch / PR:** `feat/home-settings` · #<n>
- **Requirements:** FR-01, FR-09, FR-10, FR-17, FR-18, C-25, NFR-03, NFR-04, NFR-07
- **ADRs:** 0003 (one package per layer), 0007 (preferences and plain view models)

## Objective

The app opens on the home screen of the mockups, lists every registered game, opens the settings and keeps the player's choices of sound, language, theme and tile symbols between launches. It also offers the pause menu and the leave confirmation that the game screen will use.

## Problem

The skeleton (#25) shows only a placeholder text. Every game task (E3–E6) needs the home screen to reach its game, the themes and the translated strings. The mockups (`docs/ui/`, screens 01, 11, 16, 17), the design tokens (`docs/ui/tokens.json`) and the strings in both languages (`docs/ui/l10n/app_es.arb`, `app_en.arb`) already exist.

## Scope

- **In scope:**
  - **Use cases (`hexablock_application`):** `Preferences`, `LanguageCode`, `GetPreferencesUseCase`, `UpdatePreferencesUseCase`, `PreferencesService`, `IPreferencesRepository`, `VariantModule` (only what the home screen reads: `gameId` and `texts`), `VariantTexts` and `VariantRegistry`. `GameId` comes from task 0007.
  - **Adapters (`hexablock_adapters`):** `HomeViewModel` and `SettingsViewModel`.
  - **App:** the preferences driver over `shared_preferences`, the dark and light themes from the tokens, the ARB files wired to `gen-l10n`, the home, settings, pause menu and leave confirmation widgets, and the routes between them.
- **Out of scope:**
  - The game screen and the games themselves: E2–E6. The home screen opens a placeholder until each module is registered.
  - "Continue" (FR-19): it needs the saved game (FR-16, E7).
  - Account and sync status: E8.
  - Playing sounds: the audio task. E1 stores the two switches, and `PreferencesService` passes them to `IAudioOutput`.

## Specs

- **S1** (FR-01, NFR-04, C-20): Given a `VariantRegistry` with N modules, when the home screen opens, then it shows the suite name, a settings button and one card per module in registration order, with the module's translated name (`VariantTexts.nameKey`) and the variant color that the theme tokens give for its `gameId` (screen 01). The home code names no variant: with a test registry of 2 modules, it shows 2 cards.
- **S2** (FR-01, C-25): Given the home screen, when the player taps a card, then the route of that module opens; when the player taps settings, then the settings screen opens; the back button returns to home. Checked with widget tests.
- **S3** (FR-09, FR-10, FR-18): The settings screen (11) changes music on/off, effects on/off, language (Español, English), theme (dark, light, system) and symbols on the tiles on/off. Each change is applied at once and saved.
- **S4** (FR-09, FR-10, FR-18, NFR-02): Given saved preferences, when the app starts again, then it uses them. `SettingsViewModel` is tested with a fake `IPreferencesRepository` and no Flutter. The `shared_preferences` driver is tested with `SharedPreferences.setMockInitialValues`.
- **S5** (FR-10): Given the first launch, when the device language is Spanish or English, then the app uses it; otherwise it uses Spanish. Every text on screen comes from `app/lib/l10n/app_es.arb` and `app_en.arb`, the files of `docs/ui/l10n/` with the same keys.
- **S6** (FR-18, NFR-07a): The dark (default) and light themes take their colors, type and radii from `docs/ui/tokens.json`. The *system* option follows the device.
- **S7** (FR-17, CU-03): The pause menu (16) offers resume, restart, how to play, settings and quit. Quit opens the leave confirmation (17), which says what is lost and what is kept. Both widgets receive their actions as callbacks and know no variant, so the game screen of E2 can use them.
- **S8** (NFR-07b, NFR-07d, NFR-07e): Every screen of this task fits 360 × 780 in both languages without overflow. Every touch target is at least 48 × 48 dp. Checked with widget tests at that size.
- **S9** (NFR-03, C-23f): The view models and use cases import no Flutter, and their tests run without it. Test names follow `should_<result>_when_<condition>`.

## Allowed edit surfaces

- `packages/hexablock_application/lib/**` (only the classes of the scope), `packages/hexablock_application/test/**`
- `packages/hexablock_adapters/lib/src/presentation/{home,settings}_view_model.dart`, `packages/hexablock_adapters/test/**`
- `app/lib/**` except `app/lib/game/**`, `app/test/**`, `app/pubspec.yaml`, `app/l10n.yaml`
- `docs/domain-model.md` and `docs/diagrams/**` only through `docs/diagrams/class-model.json` and `node tool/class-model/generate.mjs` (open question 1)
- `odd/tasks/0008-home-settings-navigation.md`, `AI_USAGE.md`

## Tasks

- [ ] **T1** (S3, S4) Close open question 1 and, if agreed, update `class-model.json` and regenerate.
- [ ] **T2** (S3, S4, S9) Preferences: value objects, ports, service, view model, test first.
- [ ] **T3** (S1, S9) `VariantRegistry` and `HomeViewModel`.
- [ ] **T4** (S5, S6) Themes from the tokens and the ARB files with `gen-l10n`.
- [ ] **T5** (S1, S2, S3, S8) Home and settings screens, routes and widget tests.
- [ ] **T6** (S7, S8) Pause menu and leave confirmation.
- [ ] **T7** `log-ai-usage` entry.

## Verification

```bash
flutter pub get
dart format --output=none --set-exit-if-changed .
flutter analyze --fatal-infos --fatal-warnings
node tool/run-tests.mjs
node tool/check-coverage.mjs
node tool/check-architecture.mjs
node tool/check-test-names.mjs
node tool/class-model/generate.mjs --check
```

| Spec | Evidence | Verdict |
|---|---|---|
| S1 | | |
| S2 | | |
| S3 | | |
| S4 | | |
| S5 | | |
| S6 | | |
| S7 | | |
| S8 | | |
| S9 | | |

## Open questions

1. **Gaps between the domain model and ADR-0007 for preferences.**
   - `Preferences` holds music, effects and language, but ADR-0007 and FR-18 also keep the theme and the tile symbols. The proposal is to add `theme: ThemeChoice` (dark, light, system) and `symbolsOn: bool`.
   - The model has `SqlitePreferencesRepository` in the adapters, but ADR-0007 picks `shared_preferences`, and #25 places that plugin in `app/` as a driver. The proposal is a `SharedPreferencesRepository` in `app/lib/platform/` that implements `IPreferencesRepository`, in place of the SQLite one.
2. **Localization after Flutter 3.47.** The `flutter_localizations` delegates moved into `material_ui`. This task follows whatever #25 decides about `material_ui` (point 1 of its review).
3. **Language at first launch (S5).** The device language if it is Spanish or English, otherwise Spanish. Does the team agree?

## Next step

A teammate approves S1–S9 and answers the three open questions in the PR; T2 starts once #25 is merged.

## Log

- 2026-11-28 — Valentina Maza (verbatim): "ok perfect, nada continuemos sigamos avanzando TODO lo q pueda y me avisas cuando terminemos de hacer todo todo, y hago lo de la mac de mi papa"
- 2026-11-28 — Valentina Maza with Claude (Opus 5.5, claude.ai): draft of the task from the plan (E1: CU-01 to CU-03), the mockups 01, 11, 16 and 17, `docs/domain-model.md` §15 and ADR-0007. Specs only; no code until they are approved.
