# Filled Icon Edge Baseline

`icon-fill-edge-baseline.json.gz` preserves the pre-feathering pixel capture
used to verify the original edge-softening change. It contains 24 cases at
each of DPR 1 and 2, including dimensions, RGBA pixels and PNG snapshots.

The embedded candidate records the original local archive SHA-256:
`c5abd221db17f94a898e7db6833e223c47ba98656b0591460697eae0af90ea33`.
That development archive had no committed revision; this is historical visual
evidence, not a claim of a reproducible release build.

The CI check loads this tracked fixture instead of depending on a developer's
temporary directory. Do not replace it with pixels from the renderer under test:
the assertions require actual edge falloff relative to the old hard edges,
without expanding transparent regions or changing distant interior pigment.
Explicit `ICON_EDGE_BASELINE` overrides and opt-in captures remain available
for investigative comparisons. Captures never overwrite this fixture by default.
