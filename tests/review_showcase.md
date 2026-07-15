# Northstar — Product brief

## The problem

Strategy documents often begin as coherent prose and then fragment across chat windows, review tools, and copied prompts. The document stops being the shared object, and important reasoning becomes difficult to recover or revisit.

<!-- CMT:THREAD id=N7C4R status=open ref=prev=1 -->
<!-- CMT:MSG id=N7C4R role=H ts=2026-07-14T09:30:00.000Z
This is directionally right, but can we make the cost more concrete without inventing a metric?
-->
<!-- CMT:MSG id=N7C4R role=A ts=2026-07-14T09:34:00.000Z
Yes. Frame the cost as lost decision context and repeated reconciliation work; both are observable without claiming a number we cannot support.
-->
<!-- /CMT:THREAD id=N7C4R -->

## Product principle

Keep the document whole. Discussion should remain anchored to the text it is trying to improve, while every participant retains control over when an unfinished thought becomes a submitted turn.

<!-- CMT:THREAD id=Q9T2V status=open ref=prev=1 -->
<!-- CMT:MSG id=Q9T2V role=H ts=2026-07-14T10:05:00.000Z
Pressure-test “every participant.” Our first real workflow is one human and one file-editing agent, not live multi-user collaboration.
-->
<!-- /CMT:THREAD id=Q9T2V -->

## Experience

The primary view should feel like reading and discussing one calm document: rendered Markdown in the centre, quiet conversation markers beside relevant passages, and a focused thread rail that can hold a substantial exchange without obscuring the prose.

<!-- CMT:THREAD id=H4M8K status=open ref=prev=1 -->
<!-- CMT:MSG id=H4M8K role=D ts=2026-07-14T10:22:00.000Z
Could the rail also show that two other prompts are unfinished, without turning back into a dashboard?
-->
<!-- /CMT:THREAD id=H4M8K -->

## Deliberate boundary

Collaborative Review does not replace Markdown authoring. The native source editor remains the best place for substantial prose edits; review mode concentrates on reading, anchored discussion, and explicit draft or submit decisions over the same file.

<!-- CMT:THREAD id=R6W3A status=closed ref=prev=1 -->
<!-- CMT:MSG id=R6W3A role=H ts=2026-07-14T11:00:00.000Z
Please make it explicit that review mode is optional rather than taking over every Markdown file.
-->
<!-- CMT:MSG id=R6W3A role=A ts=2026-07-14T11:04:00.000Z
Added “native source editor remains” and kept the custom editor contribution opt-in.
-->
<!-- /CMT:THREAD id=R6W3A -->

## First success signal

A user can keep three meaningful discussions moving at different stages, understand exactly which passage each belongs to, and submit one prompt without disturbing the others.
