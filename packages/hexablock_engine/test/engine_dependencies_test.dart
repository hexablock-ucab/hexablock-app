import 'dart:io';

import 'package:test/test.dart';
import 'package:yaml/yaml.dart';

// Fitness test of the Dependency Rule (C-05, NFR-03, ADR-0003) until the
// domain model brings real behavior to test.
void main() {
  test(
    'should_declare_no_runtime_dependency_when_the_engine_pubspec_is_read',
    () {
      final pubspec =
          loadYaml(File('pubspec.yaml').readAsStringSync()) as YamlMap;

      final dependencies = pubspec['dependencies'];

      expect(dependencies, isNull);
    },
  );
}
