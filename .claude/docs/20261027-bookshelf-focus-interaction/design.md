# Bookshelf focus interaction

## Goal

Make one book easy to inspect without losing the shelf or tower context.

## Variant B

- Keep every book at the same height and baseline.
- Move the focused book toward the viewer and enlarge it.
- Move nearby books sideways to create space.
- Use hover as a temporary desktop preview.
- Restore the centered book when hover ends.
- Open details only after a click.

## Variant C

- Keep horizontal movement for tower rotation.
- Keep vertical movement for changing the focused level.
- Pull the focused book out of the tower.
- Rotate the focused book toward the viewer.
- Use the same centered-book behavior on desktop and mobile.
- Add hover as a temporary desktop preview.

## State ownership

`BookshelfScene` owns the focused index and hover index.
The camera and book transforms consume that state each frame.
Each variant creates one scene and disposes it during a variant change.

## Constraints

- Keep the prototype route temporary.
- Keep the interaction available through four-direction gestures.
- Keep text in a fixed safe area.
- Do not add persistence or production data writes.

## Verification

- Check desktop hover and click behavior.
- Check horizontal and vertical gestures.
- Check a mobile viewport without hover.
- Run Astro diagnostics and the production build.
