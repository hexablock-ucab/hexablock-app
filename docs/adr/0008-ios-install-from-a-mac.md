# ADR-0008: Install on iOS directly from a Mac, without a paid account

- **Status:** Accepted
- **Date:** 2026-11-25
- **Proposed by:** Eduard Velasco
- **Deciders:** Eduard Velasco, Ali Dahouk, Valentina Maza
- **Requirements:** C-16d, C-30

## Context

The app must be installable on iOS devices, through TestFlight or by direct installation from a Mac, besides the Android executable of the GitHub Release (C-16d, C-30). The professor tests the app on an iPhone.

TestFlight needs a paid Apple Developer Program membership. A free Apple account can install an app built in Xcode on a connected iPhone, but the installation expires after a few days and must be repeated.

## Decision

- The app is installed on iPhones directly from a team member's Mac with Xcode, using a free Apple account. No paid account and no TestFlight.
- An early test installation on an iPhone is done as soon as the app skeleton runs (task 0001), to find signing or build problems before the last weeks.
- The installation on the professor's phone is done in the week of the defense, so it has not expired when he tests it.
- The GitHub Release carries the Android APK (C-16d).

## Alternatives considered

| Option | Why not |
|---|---|
| TestFlight | Needs a paid membership the team does not have; C-30 accepts the installation from a Mac. |
| iOS only through the simulator | It does not install the app on a device, so it does not meet C-30. |

## Consequences

- The team depends on access to one Mac with Xcode; the early test installation checks that it works.
- The installation has to be repeated when it expires, and always just before the defense.
- The iOS build settings (bundle identifier, signing team) are part of task 0001.

## References

- Apple, *Running your app in Simulator or on a device* (Xcode documentation): https://developer.apple.com/documentation/xcode/running-your-app-in-simulator-or-on-a-device
