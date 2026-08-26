# Synthetische Planner-Testdaten

Die Testdaten simulieren Tagesbelegungen für eine Schule mit bis zu 100 eingeschriebenen SuS. Abwesenheit wird pro Unterrichtstag deterministisch erzeugt, damit CI und Browser immer dieselben Fälle sehen.

## Szenarien

| Szenario | Eingeschrieben | Abwesenheit | Besonderheit | Erwartung |
|---|---:|---:|---|---|
| `cohort-25` | 25 | 12 % | Smoke Test | lösbar |
| `cohort-50` | 50 | 12 % | mittlere Kohorte | lösbar |
| `cohort-75-low` | 75 | ca. 10 % | reale Größe, niedrige Abwesenheit | lösbar |
| `cohort-75-mid` | 75 | 12 % | reale Größe, mittlere Abwesenheit | lösbar |
| `cohort-75-high` | 75 | ca. 15 % | reale Größe, hohe Abwesenheit | lösbar |
| `cohort-75-morning-heavy` | 75 | 12 % | 70 % der Anwesenden vormittags | lösbar |
| `cohort-100` | 100 | 12 % | Wachstumstest | lösbar |
| `cohort-75-negative` | 75 | 12 % | absichtlich Chemie Donnerstagvormittag | unlösbar |

Bei 75 eingeschriebenen SuS ergeben sich derzeit:

- ca. 10 %: 67 Anwesende pro Tag, 134 Tagesbelegungen insgesamt,
- 12 %: 66 Anwesende pro Tag, 132 Tagesbelegungen insgesamt,
- ca. 15 %: 64 Anwesende pro Tag, 128 Tagesbelegungen insgesamt.

Die Abwesenheiten für Montag und Donnerstag werden getrennt bestimmt. Eine Tagesbelegung entspricht daher einem tatsächlich anwesenden SuS an genau einem Unterrichtstag.

## Warum die regulären Datensätze lösbar sein sollen

Die Fächer werden aus blockabhängigen Testpaletten gezogen, deren vollständige Parallelbelegung mit dem aktuellen Lehrer- und Raummodell möglich ist. Dadurch testen die Datensätze Skalierung, Gruppierung, Blockverteilung und Abwesenheit, ohne zufällige fachliche Unmöglichkeit einzubauen.

Der Negativtest injiziert dagegen bewusst einen Fachwunsch, der nicht erfüllt werden kann: Chemie am Donnerstagvormittag. CI erwartet dort einen Fehler und prüft, dass die Diagnose die fehlende Chemie-Lehrkraft sichtbar macht.

## Im Browser

Im Planner erscheint oberhalb der manuellen Belegungen ein Bereich **Synthetische Kohorte laden**. Szenario auswählen, `Testdaten laden` anklicken und der Plan wird unmittelbar berechnet.

## In CI / Codespace

```bash
node planner/test-cohorts.js
```

Der Test prüft für jedes Szenario:

- erwartete Lösbarkeit bzw. erwarteten Fehler,
- korrekte Anwesenheitszahlen,
- keine Lehrer-Doppelbelegung,
- keine Raum-Doppelbelegung,
- explizite Diagnose des Negativtests.

Die Messzeit des Solvers wird mit ausgegeben, ist aber derzeit bewusst kein harter CI-Grenzwert, damit Runner-Schwankungen keinen falschen Fehler erzeugen.
