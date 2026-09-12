# Interactive prototype development

## Purpose

Visual design decisions in American Diesel Roster should be made from a running browser artifact when seeing the result is more informative than discussing it in prose.

## Boundary

A prototype iteration answers one presentation or interaction question with a small, runnable, uncommitted change. It may adjust localized HTML, CSS, rendering, or verified imagery. It must not alter authoritative collection facts, historical claims, locomotive genealogy, data semantics, dependencies, or unrelated architecture.

The human reviews the candidate in the browser. Silence is not acceptance. Until the human explicitly retains the result, its code is provisional and must not be committed or pushed.

## Retention

An accepted prototype defines the observable target, not the production architecture. Preserve suitable visual evidence, implement the retained result cleanly, and run the full repository verification before commit. Stable logic deserves automated acceptance coverage; subjective appearance may use a reference screenshot plus a hands-on browser check rather than brittle pixel assertions.
