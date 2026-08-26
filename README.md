# gangway-lean

Formale Lean-4-Grundlage und interaktiver Browser-Planer für den Unterricht an der Gangway Schule.

## Modellierter Stand

- Unterrichtstage: **Montag** und **Donnerstag**.
- Pro Unterrichtstag wählen SuS genau einen Block:
  - Vormittag: **09:30–12:30**
  - Nachmittag: **13:00–16:00**
- Jeder Block besteht im Modell aus drei einstündigen Slots.
- Für einen gewählten Block werden drei Fachwünsche angegeben, jeweils einer pro Slot.
- Dasselbe Fach darf in allen drei Slots gewählt werden.
- `WeeklyChoice` bündelt die unabhängige Block- und Fachwahl für Montag und Donnerstag.
- Lehrkräfte werden mit Fachqualifikation und Verfügbarkeit je Tag/Block modelliert.
- Alle hinterlegten Lehrkräfte können ESA- und MSA-SuS unterrichten.
- Reguläre Unterrichtsräume sind exklusive Stundenplanressourcen mit **SuS-Kapazität**.
- Einzelarbeitsraum und Gruppenraum werden **nicht verplant** und bleiben für unabhängige Nutzung frei.
- Der Pausenraum ist ebenfalls kein Unterrichtsraum.
- Zu große Fachgruppen werden nur geteilt, wenn zusätzliche passende Lehrkräfte und reguläre Räume gleichzeitig verfügbar sind.

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

## Räume, Kapazität und Semantik

Alle Kapazitäten zählen **nur SuS**. Lehrkräfte zählen nicht mit.

| Raum | Kapazität | Nutzung |
|---|---:|---|
| Englisch | 11 | planbarer Unterrichtsraum |
| Biologie / Physik / Chemie | 12 | planbarer Unterrichtsraum |
| Kunst | 8 | planbarer Unterrichtsraum |
| Deutsch | 11 | planbarer Unterrichtsraum |
| Geschichte / Geographie | 12 | planbarer Unterrichtsraum |
| Mathematik | 10 | planbarer Unterrichtsraum |
| Einzelarbeitsraum | 8 | frei nutzbar, nicht verplanbar |
| Gruppenraum | 14 | frei nutzbar, nicht verplanbar |
| Pausenraum | 6 | kein Unterrichtsraum |

Die sechs regulären Unterrichtsräume sind grundsätzlich fachübergreifend nutzbar. Ihre Namen steuern die Präferenz des Solvers, nicht eine harte Exklusivität. Mathematik bevorzugt also den Mathematikraum, kann bei Bedarf aber in einen anderen regulären Unterrichtsraum ausweichen.

In Lean ist die Trennung explizit:

```lean
schedulableRooms =
  [.english, .science, .art, .german, .historyGeography, .mathematics]

independentlyUsableRooms = [.individualWork, .groupWork]
```

`roomCapacity` enthält die oben genannten SuS-Grenzen. Einzelarbeitsraum, Gruppenraum und Pausenraum erscheinen niemals in `preferredRooms`.

## Kapazitätsbewusste Lerngruppen

`ScheduledLesson` enthält inzwischen nicht mehr nur Fach, Lehrkraft und Raum, sondern auch die tatsächlich zugeordneten SuS. Lean kann deshalb eine Gruppe formal ablehnen, wenn sie den Raum überfüllt.

Beispiel:

```lean
example : roomCapacity .mathematics = 10 := by decide
```

Ein verifiziertes Beispiel akzeptiert zehn SuS im Mathematikraum und weist dieselbe Gruppe mit elf SuS zurück.

Der Browser-Solver bildet bei Bedarf mehrere Gruppen für dasselbe Fach. Dafür müssen aber für jede Gruppe gleichzeitig vorhanden sein:

1. eine qualifizierte Lehrkraft,
2. ein regulärer Unterrichtsraum,
3. genügend Raumkapazität.

Ein Modelltest zeigt: 18 gleichzeitige Mathematik-SuS am Montagvormittag können auf zwei Gruppen verteilt werden. 25 sind dort nicht lösbar, weil nur zwei Mathematik-Lehrkräfte verfügbar sind und zwei reguläre Räume zusammen höchstens 24 SuS aufnehmen können.

## Struktur

```text
GangwayLean/
  Domain.lean
  SchoolData.lean
  Planning.lean
  Rooms.lean          Räume, Kapazitäten, Gruppenmitgliedschaft und Konflikte
  Examples.lean
  VerifiedPlans.lean  Lean-verifizierter kapazitätsbewusster Referenzplan
planner/
  index.html
  model.js            kapazitätsbewusster Backtracking-Solver
  app.js              UI, Gruppendarstellung und Lean-Export
  test-data.js        reproduzierbare synthetische Kohorten
  test-cohorts.js     Kapazitäts-/Kollisionstests
  TESTDATA.md         dokumentierte Lasttest-Ergebnisse
GangwayLean.lean
```

## Planvalidierung

Eine `ScheduledLesson` ist nur gültig, wenn:

1. die Lehrkraft anwesend ist,
2. die Lehrkraft das Fach unterrichten darf,
3. der Raum planbar ist,
4. `students.length ≤ roomCapacity room` gilt.

Für einen ganzen Plan gilt zusätzlich:

- keine Lehrkraft gleichzeitig in zwei Gruppen,
- kein Raum gleichzeitig für zwei Gruppen,
- kein SuS gleichzeitig in zwei Gruppen,
- jede Fachwahl wird nur dann als abgedeckt gezählt, wenn der betreffende SuS tatsächlich in der Gruppenliste steht.

`scheduledTimetableValidFor` prüft diese Bedingungen gegen vollständige Wochenwahlen.

## Synthetische Kohorten

Der Planner enthält reproduzierbare Szenarien für 25, 50, 75 und 100 eingeschriebene SuS. Die Abwesenheit wird pro Unterrichtstag deterministisch simuliert.

Mit den nun bekannten Kapazitäten ergibt sich ein wichtiger Unterschied zum früheren Modell:

| Szenario | Ergebnis |
|---|---|
| 25 SuS, 12 % absent | lösbar |
| 50 SuS, 12 % absent | lösbar |
| 75 SuS, ca. 10 % absent | Kapazitätsengpass |
| 75 SuS, 12 % absent | Kapazitätsengpass |
| 75 SuS, ca. 15 % absent | Kapazitätsengpass |
| 75 SuS, 12 % absent, 70 % vormittags | Kapazitätsengpass |
| 100 SuS, 12 % absent | mehrere Engpässe |

Das bedeutet **nicht**, dass 75 reale SuS grundsätzlich unplanbar sind. Die Fachwünsche sind synthetisch. Es bedeutet, dass die konkrete reproduzierbare Testverteilung die aktuelle Parallelkapazität überschreitet.

Im 75-SuS-/12-%-Szenario entstehen am Montagvormittag beispielsweise gleichzeitig 17 Bio- und 16 Physik-Wünsche. Dort ist jeweils nur eine passende Fachlehrkraft anwesend; ein regulärer Raum fasst maximal 12 SuS. Genau deshalb wird dieser Moment korrekt als unlösbar markiert.

Details stehen in `planner/TESTDATA.md`.

## Dynamischen HTML-Planer im Codespace starten

```bash
python3 -m http.server 8000 -d planner
```

Danach im Codespace unter **Ports** Port `8000` öffnen.

Über **Synthetische Kohorte laden** können die Lasttests direkt in der UI geladen werden. Jede Lerngruppenkarte zeigt nun auch:

- zugewiesenen Raum,
- Raumkapazität,
- aktuelle SuS-Zahl,
- die konkret zugeordneten SuS.

## Lean-Export

Ein erfolgreicher Browserplan kann als Lean-Code ausgegeben werden. Der Export enthält:

- alle `AttendanceChoice`-Werte,
- konkrete `ScheduledLesson`-Gruppen,
- Raum und Lehrkraft,
- die SuS-Liste jeder Gruppe,
- `by decide`-Checks für Planvalidität und Abdeckung.

Formal verifiziert ist ein Browserplan erst nach erfolgreichem:

```bash
lake build
```

## Noch nicht modelliert

- reale bzw. pseudonymisierte Wochenwahlen,
- Mindestgruppengrößen,
- individuelle Förder-/Einzelarbeitsregeln,
- Prioritäten oder Erst-/Zweitwünsche,
- Pausen oder abweichende Slotlängen,
- Optimierungsziele wie möglichst kleine Gruppen oder wenige Lehrerwechsel,
- dynamische Anwesenheitsänderungen am Unterrichtstag.

## Build und Tests

Das Projekt ist auf Lean **4.30.0** festgelegt.

```bash
lake build
node planner/test-model.js
node planner/test-cohorts.js
```

GitHub Actions führt Lean-Build, Browser-Modelltest und synthetische Kapazitätstests bei Pushes und Pull Requests aus.
