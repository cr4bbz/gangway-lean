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
- Lehrkräfte werden mit ihren Fachqualifikationen und ihrer Verfügbarkeit je Tag/Block modelliert.
- Alle hinterlegten Lehrkräfte können sowohl **ESA**- als auch **MSA**-SuS unterrichten.
- Reguläre Unterrichtsräume sind eigene planbare Ressourcen; Lehrer- und Raumkollisionen werden verhindert.
- **Einzelarbeitsraum und Gruppenraum werden nicht verplant.** SuS können sie im Verlauf einer Stunde unabhängig nutzen.
- Ein Lean-verifizierter Referenzplan zeigt eine vollständige Raum-/Lehrerzuweisung für zwei Beispiel-SuS.
- Der HTML-Planer kann synthetische Kohorten bis 100 SuS laden und sucht per Backtracking eine kollisionsfreie Lehrer-/Raumkombination.

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

## Räume und Raumsemantik

| Raum | Formale Nutzung |
|---|---|
| Englisch | **planbarer Unterrichtsraum**, bevorzugt für Englisch |
| Biologie / Physik / Chemie | **planbarer Unterrichtsraum**, bevorzugt für Naturwissenschaften |
| Kunst | **planbarer Unterrichtsraum** |
| Deutsch | **planbarer Unterrichtsraum**, bevorzugt für Deutsch |
| Geschichte / Geographie | **planbarer Unterrichtsraum**, bevorzugt für Geschichte, Geographie und Politik |
| Einzelarbeitsraum | **frei nutzbar, nicht verplanbar** |
| Gruppenraum | **frei nutzbar, nicht verplanbar** |
| Chillraum | **kein regulärer Unterrichtsraum** |

Die fünf regulären Unterrichtsräume sind grundsätzlich fachübergreifend nutzbar. Die Fachnamen steuern lediglich die Präferenzreihenfolge des Solvers. Dadurch kann zum Beispiel Mathematik in einem regulären Raum stattfinden, ohne Einzelarbeits- oder Gruppenraum zu blockieren.

In Lean ist diese Trennung explizit:

```lean
schedulableRooms = [.english, .science, .art, .german, .historyGeography]
independentlyUsableRooms = [.individualWork, .groupWork]
```

`preferredRooms` enthält ausschließlich `schedulableRooms`. Einzelarbeitsraum, Gruppenraum und Chillraum können daher weder vom Browser-Solver noch von einem Lean-validierten Plan als Unterrichtsraum vergeben werden.

## Struktur

```text
GangwayLean/
  Domain.lean         Grundtypen: Tage, Blöcke, Slots, Fächer, Lehrkräfte, Tages-/Wochenwahl
  SchoolData.lean     Konkrete Gangway-Lehrkräfte, Fächer und Verfügbarkeiten
  Planning.lean       Lehreroptionen, Unterrichtsangebote, Abdeckung und Konflikte
  Rooms.lean          Räume, planbare vs. frei nutzbare Räume und raumbewusste Validierung
  Examples.lean       Verifizierte Basisbeispiele und Randfälle
  VerifiedPlans.lean  Lean-verifizierter Referenzstundenplan
planner/
  index.html          interaktive Oberfläche
  model.js            Browser-Spiegel des Lean-Datenmodells + Backtracking-Solver
  app.js              Eingabe, Plananzeige und Lean-Export
  test-data.js        reproduzierbare synthetische Kohorten
  test-cohorts.js     automatische Kohorten- und Ressourcentests
  TESTDATA.md         Dokumentation der Lasttests
GangwayLean.lean      Bibliotheks-Einstiegspunkt
```

## Planungsmodell

Eine `AttendanceChoice` beschreibt **einen Besuchstag eines SuS**: Tag, Block, Abschlussniveau und drei Fachwünsche. `WeeklyChoice` erzwingt daraus eine vollständige Montag-/Donnerstag-Deklaration mit jeweils genau einem gewählten Block und genau drei Slot-Fächern.

Ein `LessonOffering` beschreibt Fach, Lehrkraft und Unterrichtsmoment. `ScheduledLesson` ergänzt dieses Angebot um einen planbaren Unterrichtsraum. `scheduledPlanValid` verlangt:

1. jede Lehrkraft ist im Block anwesend,
2. jede Lehrkraft darf das Fach unterrichten,
3. der zugewiesene Raum gehört zu `schedulableRooms`,
4. keine Lehrkraft wird im selben Slot doppelt eingesetzt,
5. kein planbarer Raum wird im selben Slot doppelt eingesetzt.

Die unabhängig nutzbaren Arbeitsräume erscheinen absichtlich nicht in diesen Konfliktbedingungen, weil der Stundenplan sie nie exklusiv reserviert.

`scheduledTimetableValidFor` prüft zusätzlich, ob alle übergebenen Wochenwahlen tatsächlich abgedeckt werden.

`GangwayLean/VerifiedPlans.lean` enthält mit `referencePlan` einen konkreten Plan, für den Lean per `decide` beweist:

```lean
example : scheduledTimetableValidFor referencePlan [alexWeekly, beaWeekly] = true := by
  decide
```

Zusätzliche `by decide`-Tests beweisen, dass Einzelarbeitsraum und Gruppenraum nicht planbar sind.

## Dynamischen HTML-Planer im Codespace starten

Im Repo-Root:

```bash
python3 -m http.server 8000 -d planner
```

Danach im Codespace unter **Ports** den Port `8000` öffnen.

Der Planer startet mit dem Lean-Referenzfall. Du kannst Belegungen hinzufügen oder entfernen, ESA/MSA, Tag, Block und drei Fächer auswählen und anschließend **Plan erzeugen** wählen. Über **Synthetische Kohorte laden** stehen reproduzierbare Testszenarien für 25, 50, 75 und 100 SuS zur Verfügung.

Gleiche Fachwünsche im selben Slot werden zu einer gemeinsamen Lerngruppe gebündelt. Für jeden Unterrichtsmoment sucht der Browser per Backtracking gleichzeitig nach:

- einer qualifizierten und anwesenden Lehrkraft pro Lerngruppe,
- einem der fünf regulären Unterrichtsräume,
- einer Kombination ohne Lehrer- oder Raumkollision.

Einzelarbeitsraum und Gruppenraum werden bei dieser Suche vollständig ignoriert und bleiben für die freie Nutzung verfügbar.

### Lean-Export

Ein erfolgreicher Browserplan kann unten als Lean-Code ausgegeben und kopiert werden. Der Export enthält die `AttendanceChoice`-Werte, den konkreten `ScheduledLesson`-Plan und `by decide`-Checks.

Wichtig: Der Browser validiert gegen eine JavaScript-Spiegelung der Lean-Regeln. **Formal verifiziert** ist ein neu erzeugter Browserplan erst, nachdem der exportierte Lean-Code ins Projekt übernommen wurde und `lake build` erfolgreich war. Der mitgelieferte `referencePlan` ist bereits Teil des regulären Lean-Builds.

## Noch nicht modelliert

Für einen vollständigen automatischen Schulplan fehlen insbesondere:

- reale bzw. pseudonymisierte SuS-Daten und ihre Wochenwahlen,
- Raumkapazitäten,
- Mindest-/Maximalgruppengrößen,
- Pausen oder abweichende Slotlängen,
- Prioritäten oder Erst-/Zweitwünsche,
- individuelle Regeln zur Nutzung von Einzelarbeitsraum und Gruppenraum,
- Optimierungsziele wie möglichst wenige Lehrerwechsel oder gleichmäßige Gruppengrößen,
- automatische Rückführung jedes Browserplans in einen CI-verifizierten Lean-Artefakt-Workflow.

## Build

Das Projekt ist auf Lean **4.30.0** festgelegt.

```bash
lake build
```

Zusätzlich können die Browser- und Kohortentests lokal ausgeführt werden:

```bash
node planner/test-model.js
node planner/test-cohorts.js
```

GitHub Actions führt Lean-Build, Browser-Modelltest und synthetische Kohortentests bei Pushes und Pull Requests aus.
