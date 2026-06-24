# Julia Hantla — Portfolio

A warm, editorial portfolio for brand, content & creative strategy roles.
Built as a fast, dependency-free static site — no build step, deploys anywhere.

## Design language
Inspired by Julia's resume: warm off-white backgrounds, muted olive greens,
charcoal typography, with subtle sage-green and grey-blue accents. Elegant serif
(**Fraunces**) paired with a clean sans (**Inter**), generous whitespace, and
tasteful motion.

## Structure
```
index.html              Home — hero + interactive, draggable project grid
about.html              About — story, facts, "Currently into"
clients.html            Client wall
contact.html            Contact
projects/
  goons.html            01 · The Goons — brand identity
  bright-future.html    02 · Bright Future — editorial & motion
  unified-legacy.html   03 · Unified Legacy Advisors — brand identity
  intervals.html        04 · Intervals — photography
  capstone.html         05 · Capstone — brand strategy
assets/
  css/style.css         Design system + all styling
  js/main.js            Cursor, magnetic, drag-rearrange, parallax, reveals, transitions
  img/projects/         Project imagery & video
Julia_Hantla_Resume.pdf Linked from nav + contact
```

## Interactions
- Custom cursor, magnetic buttons, scroll reveals & line masks
- Draggable / rearrangeable project tiles (FLIP animation) with personality "Easter egg" tiles
- Hover image parallax, smooth page-transition veil, animated metric counters
- Fully responsive; respects `prefers-reduced-motion` and disables fancy bits on touch

## Run locally
Just open `index.html`, or serve the folder:
```
python3 -m http.server 8000
```
then visit http://localhost:8000

## Replacing placeholder content
- Swap copy directly in the HTML (project pages follow the same template).
- Drop real images into `assets/img/projects/` and update the `src` paths.
- Add a portrait by replacing the placeholder block in `about.html`.
- Update the LinkedIn `href="#"` links once the URL is ready.

## Deploy
Works on GitHub Pages (a `.nojekyll` file is included), Netlify, or Vercel with
zero configuration — it's plain HTML/CSS/JS.
