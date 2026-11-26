import 'dart:io';

import 'package:test/test.dart';
import 'package:yaml/yaml.dart';

// Fitness test of the Dependency Rule (C-05, NFR-03, ADR-0003) until the
// use cases bring real behavior to test.
void main() {
  test(
    'should_depend_only_on_the_engine_when_the_application_pubspec_is_read',
    () {
      final pubspec =
          loadYaml(File('pubspec.yaml').readAsStringSync()) as YamlMap;

      final dependencies = (pubspec['dependencies'] as YamlMap).keys;

      expect(dependencies, ['hexablock_engine']);
    },
  );
}
