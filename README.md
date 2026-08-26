# gangway-lean

Formale Lean-4-Grundlage für die Planung des Unterrichts an der Gangway Schule.

## Modellierter Stand

- Unterrichtstage: **Montag** und **Donnerstag**.
- Pro Unterrichtstag wählen SuS genau einen Block:
  - Vormittag: **09:30–12:30**
  - Nachmittag: **13:00–16:00**
- Jeder Block besteht im Modell aus drei einstündigen Slots.
- Für einen gewählten Block werden drei Fachwünsche angegeben, jeweils einer pro Slot.
- Dasselbe Fach darf in allen drei Slots gewählt werden.
- Lehrkräfte werden mit ihren Fachqualifikationen und ihrer Verfügbarkeit je Tag/Block modelliert.
- Alle hinterlegten Lehrkräfte können sowohl **ESA**- als auch **MSA**-SuS unterrichten.
- Die Planungslogik kann für jeden Fachwunsch die verfügbaren und fachlich passenden Lehrkräfte berechnen und die grundsätzliche Durchführbarkeit einer Wahl prüfen.

## Struktur

```text
GangwayLean/
  Domain.lean      Grundtypen: Tage, Blöcke, Slots, Fächer, Lehrkräfte, SuS-Wahl
  SchoolData.lean  Konkrete Gangway-Lehrkräfte, Fächer und Verfügbarkeiten
  Planning.lean    Prüfbarkeit, Lehreroptionen, Unterrichtsangebote und Konflikte
  Examples.lean    Verifizierte Beispiele und Randfälle
GangwayLean.lean   Bibliotheks-Einstiegspunkt
```

## Wichtige Modellentscheidung

Eine `AttendanceChoice` beschreibt **einen Besuchstag eines SuS**: Tag, Block, Abschlussniveau und drei Fachwünsche. Dadurch kann ein SuS für Montag und Donnerstag unabhängig planen. Eine spätere Schicht kann daraus eine ganze Wochenwahl zusammensetzen.

Ein Unterrichtsangebot (`LessonOffering`) beschreibt dagegen, welche Lehrkraft in welchem Slot welches Fach anbietet. Ein gültiges Angebot verlangt zugleich Verfügbarkeit und Fachqualifikation. Ein Plan darf eine Lehrkraft im selben Slot nicht für zwei verschiedene Fächer einsetzen.

## Noch nicht modelliert

Die aktuelle Version ist bewusst ein belastbarer Kern. Für einen vollständigen Schulplan fehlen noch insbesondere:

- konkrete SuS und ihre Wochenwahlen,
- Gruppengrößen und Raumkapazitäten,
- Räume,
- Mindest-/Maximalgruppengrößen,
- Pausen oder abweichende Slotlängen,
- Optimierungsziele, z. B. möglichst wenige Lehrerwechsel oder möglichst viele erfüllte Erstwünsche,
- ein globaler Solver für viele SuS gleichzeitig.

Diese Punkte können auf dem vorhandenen Modell ergänzt werden, ohne die Grundbegriffe neu zu definieren.

## Build

```bash
lake build
```
