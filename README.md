# Gangway Lean

A small Lean 4 model for formalizing and checking the Gangway school timetable.

## Current assumptions

- Teaching days are Monday and Thursday.
- Each student chooses one block per teaching day:
  - morning: 09:30-12:30
  - afternoon: 13:00-16:00
- Each three-hour block is represented as three consecutive one-hour planning slots.
- A student chooses exactly three subject entries for the chosen block.
- Subject choices do **not** have to be distinct. A student may choose the same subject for all three slots.
- The same teacher may cover several consecutive slots when qualified and available.
- Every listed teacher can teach both ESA and MSA students.
- Student identifiers are abstract strings. Real student names are intentionally not hard-coded into the formal model.

## Teachers and subjects

| Teacher | Subjects |
| --- | --- |
| Zara | Biology, Chemistry |
| Agnes | English, German |
| Pino | Geography, Politics |
| Marianne | English |
| Phil | Mathematics |
| Julian | Mathematics, Biology |
| Vicky | History |
| Titus | Mathematics, History |
| Jan T. | History, German |
| Jan S. | Mathematics, Physics |

## Availability

| Day / block | Available teachers |
| --- | --- |
| Monday morning | Agnes, Jan T., Zara, Titus, Jan S., Marianne, Pino |
| Monday afternoon | Agnes, Vicky, Phil, Zara, Julian, Pino |
| Thursday morning | Phil, Vicky, Jan T., Titus, Jan S. |
| Thursday afternoon | Julian, Marianne, Zara, Jan S. |

## What Lean checks already

`GangwayLean/Timetable.lean` formalizes:

- days, blocks, three time slots, school levels, subjects, and teachers;
- teacher qualifications;
- teacher availability by day and block;
- candidate-teacher calculation for a requested subject;
- exact three-subject student requests with repetitions allowed;
- whether a complete student request is staffable;
- concrete three-slot teacher plans;
- grouped lessons and a first teacher double-booking check;
- block-level subject coverage gaps.

The executable specification contains proof checks for the current data. In particular, the model derives these staffing gaps:

| Block | Subjects with no available qualified teacher |
| --- | --- |
| Monday morning | none |
| Monday afternoon | Physics |
| Thursday morning | Biology, Chemistry, English, Geography, Politics |
| Thursday afternoon | German, Geography, Politics, History |

These are not scheduling failures in Lean. They are formal consequences of the current qualification and availability data and therefore useful constraints for later timetable optimization.

## Repeated-subject example

The model contains an MSA example request for Thursday afternoon with Mathematics in all three slots. Lean verifies that Julian can legally teach all three consecutive slots. This captures the rule that neither subjects nor teachers need to change between consecutive slots.

## Build

```bash
lake build
lake exe gangwayLean
```

The executable prints the currently derived coverage gaps and validates the repeated-Mathematics example.

## Next formalization layer

The natural next step is a solver-facing layer that takes many `StudentRequest`s at once and constructs grouped `Lesson`s while proving/checking:

1. every student receives exactly the three requested subject slots;
2. every lesson uses an available, qualified teacher;
3. a teacher is never assigned to two different simultaneous lessons;
4. compatible students can share one lesson;
5. room/capacity constraints can be added without changing the core domain model;
6. impossible request sets return an explicit explanation instead of silently producing a partial timetable.
