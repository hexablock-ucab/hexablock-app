#!/usr/bin/env node
/**
 * Generates, from docs/diagrams/class-model.json (the source of truth of the class model):
 *   - the PlantUML views docs/diagrams/class-diagram*.puml;
 *   - the sections of docs/domain-model.md between BEGIN GENERATED and END GENERATED markers;
 *   - the self-contained explorer docs/diagrams/class-explorer.html.
 * The PNG and SVG files are rendered from the .puml files with PlantUML (docs/diagrams/README.md).
 *
 * Usage: node tool/class-model/generate.mjs [--check] [--root <repo>]
 *   --check  writes nothing. It exits 1 and lists every generated file that differs from the
 *            repository, and every error in the model: an unknown relation target, a «bind» with
 *            the wrong number of arguments, a class not shown in full in exactly one view, or a
 *            computed warning (an outward dependency, an interface nothing implements, …).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** The type arguments of a type such as `IGameRules<A, B<C>, D>`: ['A', 'B<C>', 'D']. */
export function typeArgs(type) {
  const i = type.indexOf('<');
  if (i < 0) return [];
  const inner = type.slice(i + 1, type.lastIndexOf('>'));
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of inner) {
    if (ch === '<') depth += 1;
    if (ch === '>') depth -= 1;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/**
 * Generates every derived file from a parsed class model.
 * Returns { files: Map<path relative to the repository, text>, errors: string[], warnings: object[] }.
 */
export function generate(source, { domainModel, template, cytoscape } = {}) {
  const json = withConstructors(source);
  const classes = json.classes;
  const byName = new Map();
  const errors = [];
  for (const c of classes) {
    if (byName.has(c.name)) errors.push(`duplicate class ${c.name}`);
    byName.set(c.name, c);
  }
  for (const c of classes) {
    for (const r of c.relations) {
      const t = byName.get(r.target);
      if (!t) {
        errors.push(`${c.name}: unknown relation target ${r.target}`);
        continue;
      }
      const args = r.targetType ? typeArgs(r.targetType) : [];
      if (['realization', 'generalization', 'bind'].includes(r.type) && args.length && args.length !== t.typeParameters.length) {
        errors.push(`${c.name}: ${r.targetType} binds ${args.length} of ${t.typeParameters.length} parameters`);
      }
    }
  }
  // A broken model cannot be drawn; report what is wrong instead of generating half of it.
  if (errors.length) return { files: new Map(), errors, warnings: [] };

  // ---------------------------------------------------------------- warnings (same rules as the explorer)
  const LAYER_ORDER = { domain: 0, application: 1, adapters: 2, frameworks: 3 };
  const SPANISH = /(tablero|celda|pieza|ficha|jugada|movimiento|partida|juego|nivel|puntaje|puntuacion|estrella|color(es)?$|pila|bandeja|linea|ficha|reloj|semilla|estado|evento|regla|fabrica|constructor$|usuario|progreso|tiempo|deshacer|rehacer|pausa|ganad|perdid|[áéíóúñ])/i;
  function warningsOf(cs) {
    const out = [];
    const realized = new Set();
    for (const c of cs) for (const r of c.relations) if (r.type === 'realization' || (r.type === 'generalization' && c.kind === 'interface')) realized.add(r.target);
    const scopesWithBind = new Set(cs.filter((c) => c.relations.some((r) => r.type === 'bind')).map((c) => c.scope));
    for (const c of cs) {
      if (!c.traces.length) out.push({ rule: 'no-trace', cls: c.name, text: 'class without a requirement or rule' });
      if (c.stereotypes.includes('Value Object')) {
        const bad = c.attributes.filter((a) => a.visibility === 'public' && !a.readOnly).map((a) => a.name)
          .concat(c.operations.filter((o) => /^set[A-Z]/.test(o.name) || (o.returns === 'void' && !o.static)).map((o) => o.name + '()'));
        if (bad.length) out.push({ rule: 'vo-setter', cls: c.name, text: `value object with setter-like members: ${bad.join(', ')}` });
      }
      for (const r of c.relations) {
        const t = byName.get(r.target);
        if (t && LAYER_ORDER[c.layer] < LAYER_ORDER[t.layer]) out.push({ rule: 'outward-dependency', cls: c.name, text: `${c.layer} → ${t.layer}: ${r.type} to ${t.name}` });
      }
      if (c.kind === 'interface' && !realized.has(c.name)) out.push({ rule: 'interface-unrealized', cls: c.name, text: 'interface without implementation' });
      const words = [c.name, ...c.attributes.map((a) => a.name), ...c.operations.map((o) => o.name)];
      const es = words.filter((w) => SPANISH.test(w) && !/^(color|ColorId|ColorStack|ColorToken|constructor)$/i.test(w) && !/Color/.test(w));
      if (es.length) out.push({ rule: 'spanish-name', cls: c.name, text: `Spanish-looking name: ${es.join(', ')}` });
    }
    for (const s of new Set(cs.map((c) => c.scope))) if (s !== 'generic' && !scopesWithBind.has(s)) out.push({ rule: 'variant-without-bind', cls: s, text: `variant ${s} has no «bind»` });
    return out;
  }


  // ---------------------------------------------------------------- PlantUML
  const STYLE = {
    domain: { mark: '▲', spot: '#D4A300', fill: '#FFF4C2' },
    application: { mark: '■', spot: '#7E57C2', fill: '#ECE2F7' },
    input: { mark: '◄', spot: '#2E8B57', fill: '#DDF2E1' },
    output: { mark: '►', spot: '#2E8B57', fill: '#DDF2E1' },
    infra: { mark: '●', spot: '#2F6DB5', fill: '#DCEBFA' },
  };
  function styleOf(c) {
    if (c.port) return STYLE[c.port];
    if (c.layer === 'domain') return STYLE.domain;
    if (c.layer === 'application') return STYLE.application;
    return STYLE.infra;
  }
  const umlType = (t) => t.replace(/^(.*)\?$/, '$1 [0..1]');
  const ROLE = (r) => (r || '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

  function head(c) {
    const st = styleOf(c);
    const tp = c.typeParameters.length ? `<${c.typeParameters.map((p) => p.bound ? `${p.name} extends ${p.bound}` : p.name).join(', ')}>` : '';
    const kw = { class: 'class', interface: 'interface', abstract: 'abstract class', sealed: 'abstract class', enum: 'enum' }[c.kind];
    const stereo = c.stereotypes.length ? ' ' + c.stereotypes.join(' ') : '';
    return `${kw} ${c.name}${tp} << (${st.mark},${st.spot})${stereo} >> ${st.fill}`;
  }
  function attrLine(a) {
    return `  ${a.static ? '{static} ' : ''}${{ public: '+', private: '-', protected: '#', package: '~' }[a.visibility]}${a.derived ? '/' : ''}${a.name} : ${umlType(a.type)}${a.readOnly ? ' {readOnly}' : ''}`;
  }
  function opLine(o, c) {
    const abs = o.abstract && c.kind !== 'interface' ? '{abstract} ' : '';
    const ps = o.parameters.map((p) => `${p.name} : ${umlType(p.type)}`).join(', ');
    const ret = o.kind === 'constructor' || o.returns === 'void' ? '' : ` : ${umlType(o.returns)}`;
    const create = CREATES.has(o.kind) ? '«create» ' : '';
    return `  ${o.static ? '{static} ' : ''}${abs}${{ public: '+', private: '-', protected: '#', package: '~' }[o.visibility]}${create}${o.name}(${ps})${ret}`;
  }
  function classBlock(c, full) {
    if (!full) return `${head(c)}`;
    const lines = [head(c) + ' {'];
    if (c.kind === 'enum') c.literals.forEach((l) => lines.push('  ' + l));
    else {
      c.attributes.forEach((a) => lines.push(attrLine(a)));
      lines.push('  --');
      c.operations.forEach((o) => lines.push(opLine(o, c)));
    }
    lines.push('}');
    return lines.join('\n');
  }
  function relLine(c, r) {
    const t = r.target;
    const mult = r.multiplicity ? ` "${r.multiplicity}"` : '';
    const role = r.role ? ` : ${r.role}` : '';
    const bind = r.bindings && r.bindings.some((b) => b.parameter !== b.argument)
      ? `<${r.bindings.map((b) => `${b.parameter} -> ${b.argument}`).join(', ')}>` : '';
    switch (r.type) {
      case 'generalization': return `${c.name} --|> ${t}${bind ? ' : ' + bind : ''}`;
      case 'realization': return `${c.name} ..|> ${t}${bind ? ' : ' + bind : ''}`;
      case 'association': return `${c.name} -->${mult} ${t}${role}`;
      case 'aggregation': return `${c.name} o-->${mult} ${t}${role}`;
      case 'composition': return `${c.name} *-->${mult} ${t}${role}`;
      case 'dependency': return `${c.name} ..> ${t} : <<${r.label}>>`;
      case 'bind': return `${c.name} ..> ${t} : <<bind>>\\n${bind}`;
      default: throw new Error(r.type);
    }
  }
  // PlantUML cannot draw UML's `T > Bound` inside the template box, so a note gives it (README).
  function boundNote(c) {
    const bounded = c.typeParameters.filter((p) => p.bound);
    if (!bounded.length) return null;
    const text = bounded.map((p) => `${p.name} > ${p.bound}`.replace(/</g, '~<')).join('\n');
    return `note left of ${c.name} : ${text}`;
  }
  function patternNote(c) {
    if (!c.patterns.length) return null;
    const text = c.patterns.map((p) => `${p.pattern}: ${ROLE(p.role)}`).join('\\n');
    return `note right of ${c.name} : ${text}`;
  }

  const LEGEND = [
    'legend right',
    '  <b>Layer</b> (docs/diagrams/README.md)',
    '  <color:#D4A300>▲</color> domain   <color:#7E57C2>■</color> application',
    '  <color:#2E8B57>◄</color> input port   <color:#2E8B57>►</color> output port',
    '  <color:#2F6DB5>●</color> interface adapters and frameworks',
    '  A class without members belongs to another view.',
    '  Generated from class-model.json; do not edit by hand.',
    'endlegend',
  ].join('\n');

  function view(file, title, isFull, opts = {}) {
    const full = classes.filter(isFull);
    const shown = new Map(full.map((c) => [c.name, true]));
    if (!opts.noStubs) for (const c of full) for (const r of c.relations) if (!shown.has(r.target)) shown.set(r.target, false);
    const groups = new Map();
    for (const [n, isF] of shown) {
      const c = byName.get(n);
      const key = `${c.package} / ${c.folder}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push([c, isF]);
    }
    const out = [
      `@startuml ${file.replace('.puml', '')}`,
      `' Generated from docs/diagrams/class-model.json. Do not edit by hand: edit the model and regenerate.`,
      '!pragma layout smetana',
      'skinparam dpi 192',
      'left to right direction',
      'skinparam classAttributeIconSize 0',
      'skinparam shadowing false',
      'skinparam packageStyle folder',
      'skinparam defaultFontName Arial',
      'skinparam class {\n  FontSize 12\n  AttributeFontSize 11\n}',
      'skinparam note {\n  BackgroundColor #FFFFFF\n  BorderColor #999999\n  FontSize 10\n}',
      `title ${title}`,
      '',
    ];
    for (const [key, members] of groups) {
      out.push(`package "${key}" {`);
      for (const [c, isF] of members) out.push(classBlock(c, isF).split('\n').map((l) => '  ' + l).join('\n'));
      out.push('}');
    }
    out.push('');
    for (const [n, isF] of shown) if (!isF) out.push(`hide ${n} members`);
    for (const c of full) for (const r of c.relations) if (shown.has(r.target)) out.push(relLine(c, r));
    out.push('');
    for (const c of full) for (const n of [boundNote(c), patternNote(c)]) if (n) out.push(n);
    out.push('', LEGEND, '@enduml', '');
    return { file, text: out.join('\n'), full: full.map((c) => c.name) };
  }

  function overview() {
    // Packages only: one box per Dart package and scope (generic core or one variant), and the
    // dependencies between them, aggregated from every relation of the model.
    const out = [
      '@startuml class-diagram',
      `' Generated from docs/diagrams/class-model.json. Do not edit by hand: edit the model and regenerate.`,
      '!pragma layout smetana', 'skinparam dpi 192', 'skinparam shadowing false', 'skinparam packageStyle folder',
      'skinparam defaultFontName Arial', 'top to bottom direction',
      'title HexaBlock Suite — packages and their dependencies', '',
    ];
    const layers = [['frameworks', 'app'], ['adapters', 'hexablock_adapters'], ['application', 'hexablock_application'], ['domain', 'hexablock_engine']];
    const SC = ['generic', 'hexa-lines', 'hexa-fit', 'hexa-sort', 'hexa-merge'];
    // The composition root is the one class allowed to name every variant, so it gets its own box.
    const pid = (c) => (c.folder === 'composition' ? 'app_composition' : (c.package + '_' + c.scope).replace(/[^A-Za-z0-9]/g, '_'));
    const fill = { domain: '#FFF4C2', application: '#EFE6FA', adapters: '#E3EEFB', frameworks: '#E3EEFB' };
    for (const [layer, pkg] of layers) {
      const cs = classes.filter((c) => c.layer === layer);
      if (!cs.length) continue;
      out.push(`package "${pkg} (${layer})" as ${pkg} ${fill[layer]} {`);
      for (const sc of SC) {
        const n = cs.filter((c) => c.scope === sc && c.folder !== 'composition');
        if (!n.length) continue;
        const label = sc === 'generic' ? (layer === 'domain' ? 'core (generic engine)' : 'generic') : sc;
        out.push(`  package "${label}\\n${n.length} class${n.length === 1 ? "" : "es"}" as ${pid(n[0])} ${fill[layer]} {`, '  }');
      }
      if (layer === 'frameworks') out.push('  package "composition root\\n1 class" as app_composition #E3EEFB {', '  }');
      out.push('}');
    }
    const deps = new Map();
    for (const c of classes) for (const r of c.relations) {
      const t = byName.get(r.target);
      if (!t || pid(c) === pid(t)) continue;
      const k = `${pid(c)} ..> ${pid(t)}`;
      deps.set(k, (deps.get(k) || 0) + 1);
    }
    out.push('', ...[...deps.keys()].sort(), '',
      'legend right',
      '  Each box is a Dart package split into its generic part and its variants.',
      '  An arrow is a dependency: some class of the source uses, implements or creates one of the target.',
      '  Every arrow points inward (C-05). No generic box depends on a variant box; only the',
      '  composition root, which wires the app, names the variants.',
      '  Generated from class-model.json; do not edit by hand.',
      'endlegend', '@enduml', '');
    return { file: 'class-diagram.puml', text: out.join('\n'), full: [], deps: [...deps.keys()] };
  }

  const views = [
    overview(),
    view('class-diagram-engine-board.puml', 'Generic engine — geometry, board and errors (hexablock_engine)', (c) => c.scope === 'generic' && ['core/geometry', 'core/board', 'core/errors'].includes(c.folder)),
    view('class-diagram-engine-cycle.puml', 'Generic engine — game cycle, reusable rules, phases (State) and events (Observer)', (c) => c.scope === 'generic' && ['core/engine', 'core/rules', 'core/phases', 'core/events'].includes(c.folder)),
    view('class-diagram-engine-capabilities.puml', 'Generic engine — capabilities, undo history (Memento), randomness, pieces and time', (c) => c.scope === 'generic' && ['core/capabilities', 'core/memento', 'core/random', 'core/pieces', 'core/time'].includes(c.folder)),
    view('class-diagram-engine-progress.puml', 'Generic engine — scoring, progress and levels', (c) => c.scope === 'generic' && ['core/progress', 'core/levels'].includes(c.folder)),
    view('class-diagram-application.puml', 'Use cases — input ports, services and output ports (hexablock_application)', (c) => c.layer === 'application' && ['ports/input', 'services', 'ports/output'].includes(c.folder)),
    view('class-diagram-application-session.puml', 'Use cases — variant contract and neutral session data (hexablock_application)', (c) => c.layer === 'application' && !['ports/input', 'services', 'ports/output'].includes(c.folder)),
    view('class-diagram-adapters.puml', 'Interface adapters — generic (hexablock_adapters)', (c) => c.layer === 'adapters' && c.scope === 'generic'),
    view('class-diagram-frameworks.puml', 'Frameworks and drivers — generic (app)', (c) => c.layer === 'frameworks' && c.scope === 'generic'),
    ...['hexa-lines', 'hexa-fit', 'hexa-sort', 'hexa-merge'].map((v) => view(`class-diagram-${v}.puml`, `Variant ${v} — every layer, with its «bind» to the generic engine`, (c) => c.scope === v)),
  ].filter((v) => v.file === 'class-diagram.puml' || v.full.length);

  // ---------------------------------------------------------------- Markdown sections
  const mdType = (t) => t.replace(/\|/g, '\\|');
  function mdClass(c) {
    const stereo = c.stereotypes.filter((s) => s !== 'interface');
    const kind = c.kind === 'class' ? (stereo[0] ? stereo[0].toLowerCase() : 'class') : c.kind + (stereo.length ? ', ' + stereo.join(', ').toLowerCase() : '');
    const tp = c.typeParameters.length ? `<${c.typeParameters.map((p) => p.bound ? `${p.name} extends ${p.bound}` : p.name).join(', ')}>` : '';
    const L = [`#### \`${c.name}${tp}\` — ${kind}${c.port ? ` (${c.port} port)` : ''}`, ''];
    L.push(`${c.layer} · \`${c.package}\` · \`${c.folder}\`${c.patterns.length ? ' · ' + c.patterns.map((p) => `${p.pattern} (${ROLE(p.role)})`).join(', ') : ''} · Traces: ${c.traces.join(', ')}`, '');
    if (c.summary) L.push(c.summary, '');
    if (c.invariant) L.push(`- **Invariant:** ${c.invariant}`);
    if (c.literals.length) L.push(`- **Literals:** ${c.literals.map((l) => '`' + l + '`').join(', ')}`);
    if (c.attributes.length) L.push(`- **Attributes:** ${c.attributes.map((a) => '`' + attrLine(a).trim().replace(/ : /, ': ') + '`').join(', ')}`);
    if (c.operations.length) L.push(`- **Operations:** ${c.operations.map((o) => '`' + opLine(o, c).trim().replace(/\{static\} /, 'static ').replace(/\{abstract\} /, 'abstract ') + '`').join(', ')}`);
    const rels = c.relations.map((r) => {
      if (r.type === 'bind' || (r.bindings && r.bindings.some((b) => b.parameter !== b.argument))) return `${r.type} \`${r.targetType}\``;
      if (r.type === 'dependency') return `«${r.label}» \`${r.target}\``;
      return `${r.type} \`${r.target}\`${r.multiplicity ? ' [' + r.multiplicity + ']' : ''}${r.role ? ' ' + r.role : ''}`;
    });
    if (rels.length) L.push(`- **Relations:** ${rels.join('; ')}`);
    L.push('');
    return L.join('\n');
  }
  const SECTION_TITLES = {
    'hexablock_engine:generic': 'Generic engine (`hexablock_engine`, `core/`)',
    'hexablock_engine:hexa-lines': 'Hexa Lines (domain)', 'hexablock_engine:hexa-fit': 'Hexa Fit (domain)',
    'hexablock_engine:hexa-sort': 'Hexa Sort (domain)', 'hexablock_engine:hexa-merge': 'Hexa Merge (domain)',
    'hexablock_application:generic': 'Use cases (`hexablock_application`)',
    'hexablock_adapters:generic': 'Interface adapters, generic (`hexablock_adapters`)',
    'hexablock_adapters:hexa-lines': 'Hexa Lines (adapters)', 'hexablock_adapters:hexa-fit': 'Hexa Fit (adapters)',
    'hexablock_adapters:hexa-sort': 'Hexa Sort (adapters)', 'hexablock_adapters:hexa-merge': 'Hexa Merge (adapters)',
    'app:generic': 'Frameworks and drivers (`app`)', 'app:hexa-lines': 'Hexa Lines (app)', 'app:hexa-fit': 'Hexa Fit (app)',
    'app:hexa-sort': 'Hexa Sort (app)', 'app:hexa-merge': 'Hexa Merge (app)',
  };
  function reference() {
    const out = [];
    const keys = [...new Set(classes.map((c) => `${c.package}:${c.scope}`))];
    for (const k of keys) {
      out.push(`### ${SECTION_TITLES[k] || k}`, '');
      for (const folder of [...new Set(classes.filter((c) => `${c.package}:${c.scope}` === k).map((c) => c.folder))]) {
        out.push(`**Folder \`${folder}\`**`, '');
        classes.filter((c) => `${c.package}:${c.scope}` === k && c.folder === folder).forEach((c) => out.push(mdClass(c)));
      }
    }
    return out.join('\n');
  }
  function voTable() {
    const L = ['| Value object | Layer · scope | Invariant (checked when created) | Traces |', '|---|---|---|---|'];
    classes.filter((c) => c.stereotypes.includes('Value Object')).forEach((c) => L.push(`| \`${c.name}\` | ${c.layer} · ${c.scope} | ${mdType(c.invariant || '—')} | ${c.traces.join(', ')} |`));
    return L.join('\n');
  }
  function boundsTable() {
    const L = ['| Class | Type parameter | Bound | Why the bound is needed |', '|---|---|---|---|'];
    classes.forEach((c) => c.typeParameters.filter((p) => p.bound).forEach((p) => L.push(`| \`${c.name}\` | \`${p.name}\` | \`${mdType(p.bound)}\` | ${p.boundReason || '—'} |`)));
    return L.join('\n');
  }
  function paramsTable() {
    const L = ['| Class | Type parameters |', '|---|---|'];
    classes.filter((c) => c.typeParameters.length).forEach((c) => L.push(`| \`${c.name}\` | ${c.typeParameters.map((p) => '`' + p.name + (p.bound ? ' extends ' + mdType(p.bound) : '') + '`').join(', ')} |`));
    return L.join('\n');
  }
  function patternTable() {
    const by = new Map();
    classes.forEach((c) => c.patterns.forEach((p) => { if (!by.has(p.pattern)) by.set(p.pattern, []); by.get(p.pattern).push(`\`${c.name}\` (${ROLE(p.role)})`); }));
    const L = ['| Pattern | Participants (role) |', '|---|---|'];
    for (const [p, xs] of by) L.push(`| ${p} | ${xs.join(', ')} |`);
    return L.join('\n');
  }
  function bindTable() {
    const L = ['| Variant | Bound engine | TCell | TMove | TState |', '|---|---|---|---|---|'];
    classes.forEach((c) => c.relations.filter((r) => r.type === 'bind').forEach((r) => {
      const b = Object.fromEntries(r.bindings.map((x) => [x.parameter, x.argument]));
      L.push(`| ${c.scope} | \`${c.name}\` = \`${r.targetType}\` | \`${b.TCell}\` | \`${b.TMove}\` | \`${b.TState}\` |`);
    }));
    return L.join('\n');
  }
  function splice(text, key, body) {
    const re = new RegExp(`(<!-- BEGIN GENERATED ${key} -->)[\\s\\S]*?(<!-- END GENERATED ${key} -->)`);
    if (!re.test(text)) return text;
    return text.replace(re, `$1\n<!-- Generated from docs/diagrams/class-model.json. Edit the model, not this section. -->\n\n${body}\n\n$2`);
  }


  const files = new Map();
  const warnings = warningsOf(classes);
  for (const v of views) files.set(`docs/diagrams/${v.file}`, v.text);
  if (domainModel !== undefined) {
    let md = domainModel;
    md = splice(md, 'CLASS-REFERENCE', reference());
    md = splice(md, 'VALUE-OBJECTS', voTable());
    md = splice(md, 'BOUNDS', boundsTable());
    md = splice(md, 'TYPE-PARAMETERS', paramsTable());
    md = splice(md, 'PATTERNS', patternTable());
    md = splice(md, 'BINDS', bindTable());
    files.set('docs/domain-model.md', md);
  }
  if (template !== undefined) files.set('docs/diagrams/class-explorer.html', explorerPage(json, template, cytoscape));
  // Every class appears in full in exactly one view; the overview shows packages only.
  const fullCount = new Map();
  views.forEach((v) => v.full.forEach((n) => fullCount.set(n, (fullCount.get(n) || 0) + 1)));
  classes
    .filter((c) => fullCount.get(c.name) !== 1)
    .forEach((c) => errors.push(`${c.name} is shown in full in ${fullCount.get(c.name) || 0} views, not 1`));
  return { files, errors, warnings };
}

/** Operation kinds drawn with UML 2.5.1's «create»: the unnamed and the named constructors. */
const CREATES = new Set(['constructor', 'factory']);

/**
 * The model with the unnamed constructor of every value object, derived from its attributes:
 * one parameter per attribute that is neither static nor derived, in the order of the model.
 * A class may set `constructorVisibility` (for example "package" for a library-private one).
 */
export function withConstructors(json) {
  const classes = json.classes.map((c) => {
    if (!c.stereotypes.includes('Value Object') || c.operations.some((o) => o.kind === 'constructor')) return c;
    const ctor = {
      name: c.name,
      parameters: c.attributes.filter((a) => !a.static && !a.derived).map((a) => ({ name: a.name, type: a.type })),
      returns: c.name,
      visibility: c.constructorVisibility || 'public',
      static: false,
      abstract: false,
      kind: 'constructor',
    };
    return { ...c, operations: [ctor, ...c.operations] };
  });
  return { ...json, classes };
}

/** The explorer: the template with Cytoscape and the model inlined, one file that opens offline. */
export function explorerPage(json, template, cytoscape) {
  // Inside a script element, "</" would end it early.
  const data = JSON.stringify(json).replace(/<\//g, '<\\/');
  const lib = cytoscape.replace(/<\/script/gi, '<\\/script');
  const page = template.replace('/*CYTOSCAPE*/', () => lib).replace('/*MODEL*/', () => data);
  const [headPart, bodyPart] = page.split('<!--BODY-->');
  const banner = '<!-- Generated from docs/diagrams/class-model.json by tool/class-model/generate.mjs; do not edit by hand. Includes Cytoscape.js 3.30.2 (MIT, The Cytoscape Consortium). -->';
  const headClean = headPart.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '');
  return `<!doctype html>\n${banner}\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${headClean}</head>\n<body>\n${bodyPart}</body>\n</html>\n`;
}

/** Reads the inputs from a repository and generates its derived files. */
export function generateRepo(root) {
  const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
  const json = JSON.parse(read('docs/diagrams/class-model.json'));
  const mdPath = path.join(root, 'docs/domain-model.md');
  return generate(json, {
    domainModel: fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf8') : undefined,
    template: fs.readFileSync(path.join(HERE, 'explorer-template.html'), 'utf8'),
    cytoscape: fs.readFileSync(path.join(HERE, 'vendor/cytoscape.min.js'), 'utf8'),
  });
}

/** The generated files whose content differs from the files in the repository. */
export function differences(root, files) {
  const out = [];
  for (const [rel, text] of files) {
    const p = path.join(root, rel);
    if (!fs.existsSync(p)) out.push(`${rel} (missing)`);
    else if (fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n') !== text) out.push(rel);
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const root = path.resolve(args.includes('--root') ? args[args.indexOf('--root') + 1] : '.');
  const { files, errors, warnings } = generateRepo(root);
  const problems = [...errors, ...warnings.map((w) => `[${w.rule}] ${w.cls}: ${w.text}`)];
  if (args.includes('--check')) {
    const diff = differences(root, files);
    if (problems.length) console.error(`Class model errors:\n  ${problems.join('\n  ')}`);
    if (diff.length) console.error(`Generated files out of date; run node tool/class-model/generate.mjs and commit:\n  ${diff.join('\n  ')}`);
    if (problems.length || diff.length) process.exit(1);
    console.log(`Class model OK: ${files.size} generated files match docs/diagrams/class-model.json.`);
    return;
  }
  if (problems.length) {
    console.error(`Class model errors:\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
  for (const [rel, text] of files) fs.writeFileSync(path.join(root, rel), text);
  console.log(`Wrote ${files.size} files. Render the images with PlantUML: java -DPLANTUML_LIMIT_SIZE=30000 -jar plantuml.jar -tpng docs/diagrams/class-diagram*.puml (and again with -tsvg).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
