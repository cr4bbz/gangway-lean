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
- `WeeklyChoice` bündelt die unabhängige Block- und Fachwahl für Montag und Donnerstag.
- Lehrkräfte werden mit ihren Fachqualifikationen und ihrer Verfügbarkeit je Tag/Block modelliert.
- Alle hinterlegten Lehrkräfte können sowohl **ESA**- als auch **MSA**-SuS unterrichten.
- Die Planungslogik berechnet passende Lehrkräfte, prüft einzelne Tages- und Wochenwahlen und validiert konkrete Unterrichtsangebote gegen Lehrerqualifikation und Verfügbarkeit.

## Lehrkräfte

| Lehrkraft | Fächer |
|---|---|
| Zara | Biologie, Chemie |
| Agnes | Englisch, Deutsch |
| Pino | Geographie, Politik |
| Marianne | Englisch |
| Phil | Mathematik |
| Julian | Mathematik, Biologie |
| Vicky | Geschichte |
| Titus | Mathematik, Geschichte |
| Jan T. | Geschichte, Deutsch |
| Jan S. | Mathematik, Physik |

## Verfügbarkeit

| Tag | Block | Lehrkräfte |
|---|---|---|
| Montag | Vormittag | Agnes, Jan T., Zara, Titus, Jan S., Marianne, Pino |
| Montag | Nachmittag | Agnes, Vicky, Phil, Zara, Julian, Pino |
| Donnerstag | Vormittag | Phil, Vicky, Jan T., Titus, Jan S. |
| Donnerstag | Nachmittag | Julian, Marianne, Zara, Jan S. |

## Struktur

```text
GangwayLean/
  Domain.lean      Grundtypen: Tage, Blöcke, Slots, Fächer, Lehrkräfte, Tages-/Wochenwahl
  SchoolData.lean  Konkrete Gangway-Lehrkräfte, Fächer und Verfügbarkeiten
  Planning.lean    Prüfbarkeit, Lehreroptionen, Unterrichtsangebote und Konflikte
  Examples.lean    Verifizierte Beispiele und Randfälle
GangwayLean.lean   Bibliotheks-Einstiegspunkt
```

## Planungsmodell

Eine `AttendanceChoice` beschreibt **einen Besuchstag eines SuS**: Tag, Block, Abschlussniveau und drei Fachwünsche. `WeeklyChoice` erzwingt daraus eine vollständige Montag-/Donnerstag-Deklaration mit jeweils genau einem gewählten Block und genau drei Slot-Fächern.

Ein Unterrichtsangebot (`LessonOffering`) beschreibt, welche Lehrkraft in welchem Slot welches Fach anbietet. Ein gültiges Angebot verlangt zugleich Verfügbarkeit und Fachqualifikation. Ein Plan darf eine Lehrkraft im selben Slot nicht für zwei verschiedene Fächer einsetzen.

`choiceFeasible` und `weeklyChoiceFeasible` prüfen zunächst nur, ob für jeden Fachwunsch mindestens eine passende Lehrkraft verfügbar ist. `timetableValidFor` geht einen Schritt weiter: Ein konkreter Angebotsplan muss konfliktfrei und gültig sein und alle übergebenen Wochenwahlen abdecken.

Die aktuelle Einteilung in drei einstündige Slots folgt direkt aus dem Drei-Stunden-Block plus drei Fachwünschen. Falls die realen Unterrichtszeiten später Pausen oder andere Slotlängen enthalten, kann `slotWindow` angepasst werden, ohne das übrige Modell zu verändern.

## Noch nicht modelliert

Für einen vollständigen automatischen Schulplan fehlen noch insbesondere:

- reale SuS-Daten und ihre Wochenwahlen,
- Gruppengrößen und Raumkapazitäten,
- Räume,
- Mindest-/Maximalgruppengrößen,
- Pausen oder abweichende Slotlängen,
- Prioritäten oder Erst-/Zweitwünsche,
- Optimierungsziele, z. B. möglichst wenige Lehrerwechsel,
- ein globaler Solver, der aus vielen SuS-Wahlen selbständig einen optimalen Angebotsplan erzeugt.

Die jetzige Lean-Schicht definiert bereits die Bedingungen, gegen die ein solcher Solver später beweisbar geprüft werden kann.

## Build

Das Projekt ist auf Lean **4.30.0** festgelegt.

```bash
lake build
```

GitHub Actions führt denselben Build bei Pushes und Pull Requests aus.
