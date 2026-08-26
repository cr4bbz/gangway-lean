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
- Räume sind als eigene Ressource formalisiert. Ein Plan darf weder Lehrkräfte noch Räume im selben Slot kollidieren lassen.
- Ein Lean-verifizierter Referenzplan zeigt eine vollständige Raum-/Lehrerzuweisung für zwei Beispiel-SuS.
- Der statische HTML-Planer kann beliebig viele Tagesbelegungen aufnehmen und sucht per Backtracking eine kollisionsfreie Lehrer-/Raumkombination.

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

## Räume

| Raum | Formale Nutzung |
|---|---|
| Englisch | bevorzugt Englisch |
| Biologie / Physik / Chemie | bevorzugt Biologie, Chemie und Physik |
| Kunst | vorhanden, aber noch kein Fach `Kunst` im Fachmodell |
| Deutsch | bevorzugt Deutsch |
| Geschichte / Geographie | bevorzugt Geschichte, Geographie und Politik |
| Einzelarbeit | flexibler Unterrichtsraum |
| Gruppenarbeit | flexibler Unterrichtsraum |
| Chillraum | derzeit kein regulärer Unterrichtsraum |

Die beiden Arbeitsräume sind bewusst als flexible Ausweichräume modelliert. Dadurch kann beispielsweise Mathematik geplant werden, obwohl kein eigener Mathematikraum angegeben ist. Fachräume werden im Browser-Planer zuerst versucht.

## Struktur

```text
GangwayLean/
  Domain.lean         Grundtypen: Tage, Blöcke, Slots, Fächer, Lehrkräfte, Tages-/Wochenwahl
  SchoolData.lean     Konkrete Gangway-Lehrkräfte, Fächer und Verfügbarkeiten
  Planning.lean       Lehreroptionen, Unterrichtsangebote, Abdeckung und Konflikte
  Rooms.lean          Räume, Raumkompatibilität und raumbewusste Planvalidierung
  Examples.lean       Verifizierte Basisbeispiele und Randfälle
  VerifiedPlans.lean  Lean-verifizierter Referenzstundenplan
planner/
  index.html          interaktive Oberfläche
  model.js            Browser-Spiegel des Lean-Datenmodells + Backtracking-Solver
  app.js              Eingabe, Plananzeige und Lean-Export
  styles.css          responsive Darstellung
GangwayLean.lean      Bibliotheks-Einstiegspunkt
```

## Planungsmodell

Eine `AttendanceChoice` beschreibt **einen Besuchstag eines SuS**: Tag, Block, Abschlussniveau und drei Fachwünsche. `WeeklyChoice` erzwingt daraus eine vollständige Montag-/Donnerstag-Deklaration mit jeweils genau einem gewählten Block und genau drei Slot-Fächern.

Ein `LessonOffering` beschreibt Fach, Lehrkraft und Unterrichtsmoment. `ScheduledLesson` ergänzt dieses Angebot um einen Raum. `scheduledPlanValid` verlangt:

1. jede Lehrkraft ist im Block anwesend,
2. jede Lehrkraft darf das Fach unterrichten,
3. jeder Raum ist für das Fach zugelassen,
4. keine Lehrkraft wird im selben Slot doppelt eingesetzt,
5. kein Raum wird im selben Slot doppelt eingesetzt.

`scheduledTimetableValidFor` prüft zusätzlich, ob alle übergebenen Wochenwahlen tatsächlich abgedeckt werden.

`GangwayLean/VerifiedPlans.lean` enthält mit `referencePlan` einen konkreten Plan, für den Lean per `decide` beweist:

```lean
example : scheduledTimetableValidFor referencePlan [alexWeekly, beaWeekly] = true := by
  decide
```

## Dynamischen HTML-Planer im Codespace starten

Im Repo-Root:

```bash
python3 -m http.server 8000 -d planner
```

Danach im Codespace unter **Ports** den Port `8000` öffnen.

Der Planer startet mit dem Lean-Referenzfall. Du kannst Belegungen hinzufügen oder entfernen, ESA/MSA, Tag, Block und drei Fächer auswählen und anschließend **Plan erzeugen** wählen.

Gleiche Fachwünsche im selben Slot werden zu einer gemeinsamen Lerngruppe gebündelt. Für jeden Unterrichtsmoment sucht der Browser per Backtracking gleichzeitig nach:

- einer qualifizierten und anwesenden Lehrkraft pro Lerngruppe,
- einem passenden Raum pro Lerngruppe,
- einer Kombination ohne Lehrer- oder Raumkollision.

Wenn keine Kombination existiert, zeigt der Planer den problematischen Unterrichtsmoment und die vorhandenen Kandidaten an.

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
- individuelle Förder-/Einzelarbeitsregeln,
- Optimierungsziele wie möglichst wenige Lehrerwechsel oder gleichmäßige Gruppengrößen,
- automatische Rückführung jedes Browserplans in einen CI-verifizierten Lean-Artefakt-Workflow.

## Build

Das Projekt ist auf Lean **4.30.0** festgelegt.

```bash
lake build
```

GitHub Actions führt denselben Build bei Pushes und Pull Requests aus.
