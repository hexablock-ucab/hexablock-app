import 'package:flutter/widgets.dart';

import 'hexablock_app.dart';

/// The only place that creates and wires the objects of the app.
///
/// Dependencies are wired by hand, with no dependency injection or state
/// management library (ADR-0003, ADR-0007). Adapters, use cases and view
/// models are created here as later tasks add them.
class CompositionRoot {
  const CompositionRoot();

  /// Builds the root widget with every dependency it needs.
  Widget buildApp() => const HexaBlockApp();
}
