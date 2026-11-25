import 'package:flutter/material.dart';

import 'home/home_screen.dart';

/// The root widget of HexaBlock Suite.
class HexaBlockApp extends StatelessWidget {
  const HexaBlockApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HexaBlock Suite',
      theme: ThemeData(colorSchemeSeed: Colors.indigo),
      home: const HomeScreen(),
    );
  }
}
