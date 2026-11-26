import 'dart:io';

import 'package:test/test.dart';
import 'package:yaml/yaml.dart';

// Fitness test of the Dependency Rule (C-05, ADR-0003, ADR-0007) until the
// adapters bring real behavior to test.
void main() {
  test('should_depend_on_no_flutter_or_app_package_when_the_adapters_pubspec_is_read', () {
    final pubspec =
        loadYaml(File('pubspec.yaml').readAsStringSync()) as YamlMap;

    final dependencies = (pubspec['dependencies'] as YamlMap).keys
        .cast<String>();

    expect(dependencies, isNot(contains('flutter')));
    expect(dependencies, isNot(contains('hexablock_app')));
    expect(
      dependencies,
      containsAll(<String>['hexablock_engine', 'hexablock_application']),
    );
  });
}
