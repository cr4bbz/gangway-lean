# Synthetische Planner-Testdaten

Die Testdaten simulieren Tagesbelegungen für bis zu 100 eingeschriebene SuS. Abwesenheit wird pro Unterrichtstag deterministisch erzeugt, damit CI und Browser immer dieselben Fälle sehen.

Seit der Einführung realer Raumkapazitäten sind die großen Szenarien bewusst **Kapazitäts-Stresstests**. Ein Fehlschlag bedeutet nicht, dass 75 reale SuS grundsätzlich unplanbar sind: Die Fachwünsche sind synthetisch. Er zeigt, dass genau diese reproduzierbare Fach- und Blockverteilung die vorhandene Parallelkapazität überschreitet.

## Raumkapazitäten

Alle Werte zählen ausschließlich SuS; Lehrkräfte zählen nicht mit.

| Raum | SuS | Planbar? |
|---|---:|---|
| Englisch | 11 | ja |
| Biologie / Physik / Chemie | 12 | ja |
| Kunst | 8 | ja |
| Deutsch | 11 | ja |
| Geschichte / Geographie | 12 | ja |
| Mathematik | 10 | ja |
| Einzelarbeit | 8 | nein, frei nutzbar |
| Gruppenarbeit | 14 | nein, frei nutzbar |
| Pausenraum | 6 | nein |

## Szenarien

| Szenario | Eingeschrieben | Abwesenheit | Erwartung mit Kapazitäten |
|---|---:|---:|---|
| `cohort-25` | 25 | 12 % | lösbar |
| `cohort-50` | 50 | 12 % | lösbar |
| `cohort-75-low` | 75 | ca. 10 % | Kapazitätsengpass |
| `cohort-75-mid` | 75 | 12 % | Kapazitätsengpass |
| `cohort-75-high` | 75 | ca. 15 % | Kapazitätsengpass |
| `cohort-75-morning-heavy` | 75 | 12 %, 70 % vormittags | Kapazitätsengpass |
| `cohort-100` | 100 | 12 % | mehrere Kapazitätsengpässe |
| `cohort-75-negative` | 75 | 12 % | zusätzlich absichtlich fachlich unlösbar |

Bei 75 eingeschriebenen SuS ergeben sich:

- ca. 10 %: 67 Anwesende pro Tag,
- 12 %: 66 Anwesende pro Tag,
- ca. 15 %: 64 Anwesende pro Tag.

## Beobachteter Engpass bei 75 SuS

Der 12-%-Datensatz erzeugt am Montagvormittag beispielsweise gleichzeitig:

- 17 Biologie-Wünsche bei nur einer anwesenden Bio-Lehrkraft,
- 16 Physik-Wünsche bei nur einer anwesenden Physik-Lehrkraft.

Da der größte reguläre Unterrichtsraum 12 SuS fasst, kann eine einzelne Lehrkraft diese Fachgruppe nicht auf zwei Räume aufteilen. Der Planner lehnt diesen Moment deshalb korrekt ab.

Das ist gerade der Zweck dieser Testdaten: nicht eine künstlich immer lösbare Verteilung zu erzeugen, sondern sichtbar zu machen, ab welcher Kombination aus Fachnachfrage, Lehrerzahl und Raumkapazität das System kippt.

## Automatische Gruppenaufteilung

Wenn mehrere geeignete Lehrkräfte verfügbar sind, darf der Solver eine Fachgruppe teilen. Ein eigener Modelltest prüft etwa:

- 18 gleichzeitige Mathematik-SuS am Montagvormittag werden auf zwei Gruppen verteilt,
- 25 gleichzeitige Mathematik-SuS sind dort nicht lösbar, weil nur zwei Mathe-Lehrkräfte verfügbar sind und zwei reguläre Räume zusammen höchstens 24 SuS aufnehmen können.

## In CI / Codespace

```bash
node planner/test-cohorts.js
```

Der Test prüft:

- die erwarteten Lösbarkeits-/Kapazitätszustände,
- jede erzeugte Gruppe gegen ihre Raumkapazität,
- keine Lehrer-Doppelbelegung,
- keine Raum-Doppelbelegung,
- keine Nutzung von Einzel- oder Gruppenarbeitsraum als Stundenplanraum,
- die absichtlich fehlende Chemie-Lehrkraft im Negativtest.
