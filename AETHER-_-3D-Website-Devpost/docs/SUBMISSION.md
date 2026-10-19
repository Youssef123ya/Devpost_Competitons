# ÆTHER — a cosmogony in particles

**Live:** https://claude.ai/code/artifact/b99edfa6-9ec9-4bf5-b6d9-099c0e9c061d
**Source:** this repository

---

## Inspiration

Every atom in your body heavier than helium was forged inside a star. The iron in your blood was made in a supernova. That is not poetry — it is stellar nucleosynthesis, and it is the strangest true thing I know.

I wanted to run that fact forwards as a piece of visual music rather than explain it. Which led to the one constraint the whole project hangs on: **there is only one particle cloud in the entire site.** It never disappears, never reloads, never cuts to a new scene. It only ever rearranges itself into the next thing it is about to become — because that is literally what happened. The same matter, six times over.

Most "scrolly" 3D sites are a gallery of separate scenes wearing a scroll bar. I wanted the opposite: one continuous object, and a scroll position that is just a number the object is interpolating toward.

The second inspiration was a refusal. No models, no textures, no images, no audio files. If the story is that everything came from nothing, downloading a 40 MB GLB of a tree would be cheating.

---

## What it does

Scroll, and 147,456 particles pass through six states:

| | Chapter | What the cloud becomes |
|---|---|---|
| `00` | **Void** | Formless drift. Faint density knots — weather in the emptiness. |
| `01` | **Spark** | Ignition. A molten core inside a thin shell, pierced by flares. |
| `02` | **Bloom** | A five-armed spiral galaxy: bulge, disc, arms, globular halo. |
| `03` | **Helix** | Two antiparallel strands and their base pairs — matter keeping notes on itself. |
| `04` | **Arbor** | A recursively grown tree, solid trunk to particulate canopy. |
| `05` | **Æther** | The word itself. Matter organised well enough to name itself. |

Between every chapter the cloud tears itself apart into turbulence and reassembles, because nothing in the universe changes shape politely.

It opens on a single luminous nucleus behind the title. Pressing **Begin** blooms it outward into the void while the camera dollies back — the first thing you see is the thesis of the whole piece.

Alongside the scroll: drag to orbit, move the pointer to push a soft hole through the cloud, arrow keys or the chapter rail to jump. A generative soundtrack retunes itself continuously as you travel, and strikes a bell when a chapter locks in.

---

## How we built it

**Vanilla JavaScript, Three.js r160, and hand-written GLSL.** No framework, no bundler, no runtime npm dependencies.

**The six shapes are functions, not files.** Each form generator is a pure function that fills a `Float32Array` with `x, y, z, size-weight` per particle — a spiral galaxy from polar math, an L-system tree grown once and then dressed in particles, a double helix with discrete base pairs. The finale is the only place a rasteriser is involved: the word is drawn to an offscreen Canvas 2D once, and its lit pixels are harvested as particle coordinates.

**All six live on the GPU at once.** Every form is baked into a single `RGBA32F` `DataTexture`, 384 wide by 2304 tall, so particle `i` of form `f` sits at a known texel. The morph is then just a texture lookup in the vertex shader:

```glsl
vec4 slot(float f){
  return texture2D(uTargets, vec2(aUv.x, (f + aUv.y) / uFormCount));
}
```

Each vertex reads its own slot in form `A` and form `B` and mixes. **Changing chapter costs nothing** — no buffer re-uploads, no allocations, no hitch. Scroll position is one float, `uChapter`, that can sit anywhere between `0.0` and `5.0`.

**The dissolve.** Every particle carries a random delay, so the cloud comes apart in a wave instead of snapping. A `sin(π · t)` bell peaks mid-transition and drives a two-octave flow field that scatters everything, then lets it fall back into place.

**Choreography.** Each chapter keyframes camera radius, height, field of view and orbit speed, all interpolated by the same continuous chapter float. A shift-lens offset keeps the subject clear of the text card, and the orbit eases to face front for the finale so the word is readable.

**Grading is hand-rolled** — no `EffectComposer`. The scene renders into a half-float HDR buffer, then a bright-pass, three cascading gaussian mips, and a composite doing ACES tone mapping, vignette, film grain and chromatic aberration. About 140 lines.

**Sound is synthesised, not sampled.** Six oscillators, a brown-noise bed, and a convolution reverb whose impulse response is generated from decaying noise at load. Scroll position retunes the drone continuously (A1 → A2 across the six chapters) and opens the filter with your scroll velocity.

**Verified by rendering, not by reading.** I drove the site in headless Chrome with Puppeteer, capturing every chapter plus mid-transition frames at desktop and mobile viewports, and looked at the actual pixels. Every visual bug below was invisible in the source and obvious in a screenshot.

**One file at the end.** `build.js` inlines the CSS and all six JS modules into a self-contained 73 kB HTML page.

---

## Challenges we ran into

**Everything clipped to white.** The first full render was gorgeous in structure and unusable in practice — the galaxy core, the DNA strands and the finale word were all solid white slabs. Additive blending stacks thousands of particles per pixel, then bloom adds more, and ACES flattens anything above 1.0. My first correction overshot into near-black. It took three grading passes to learn the real lesson: with additive particles you are budgeting *total energy*, and exposure, point size, particle count and bloom threshold are all the same dial wearing different hats.

**The film grain moiréd.** A visible diagonal cross-hatch across every dark area. The cause was the classic `fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453)` hash — at high fragment coordinates it loses float precision and degenerates into a repeating pattern instead of noise. Replaced with a sin-free hash and it vanished.

**Chromatic aberration turned the stars into confetti.** Splitting the sharp particle buffer per channel offsets single-pixel stars into isolated red, green and blue dots. The fix was conceptual rather than numerical: apply the aberration to the **bloom only**. The blurred halo gives you the lens fringe; the sharp buffer stays sharp.

**The tree had no trunk.** I was distributing wood particles weighted by segment length, and the tree has roughly a thousand tiny twigs against one big trunk, so the twigs won. Weighting by volume instead (`length × radius²`) gave the trunk the density it physically deserves, and the tree suddenly read as a tree.

**Mobile cropped every subject.** Field of view in a perspective camera is *vertical*, so a tall phone viewport silently narrows the horizontal frame and cut the tree, the galaxy and the word in half. Fixed with an aspect-aware camera pullback.

**The entry screen was black.** The load-in animation started particles at six times their final radius — for the Void, that is a 370-unit sphere seen from 66 units away, so they were simply off-screen. Rebuilding the pre-entry state as a dense nucleus at the origin turned a bug into the best moment in the piece.

---

## Accomplishments that we're proud of

**Zero assets.** No models, no textures, no images, no audio files, no fonts beyond two from Google Fonts. Every shape and every sound is generated in the browser at runtime.

**The morph never touches the CPU.** Because all six targets are resident in one float texture, scrolling between chapters does not upload a single byte. That is what makes the transitions feel continuous rather than staged.

**60 fps at 1920 × 1080 on integrated graphics.** Measured on an Intel UHD 630 with no discrete GPU, sustained while scrolling — the worst case, mid-transition scatter with bloom at maximum. Trigonometric turbulence instead of simplex noise, bloom at half resolution and below, and no depth buffer anywhere (additive blending doesn't need sorting) all bought that.

**73 kB.** The entire experience is one HTML file plus Three.js from a CDN.

**The finale renders the site's own display face.** The giant particle word is rasterised in Cormorant Garamond — the same face as the wordmark and the chapter titles — so the ending reads as an echo rather than a third typeface showing up uninvited.

**It degrades honestly.** 147,456 particles on desktop and 43,264 on touch devices; a governor that scales resolution rather than dropping frames if frame time drifts past 28 ms; `prefers-reduced-motion` damping the scatter and the grain.

---

## What we learned

**Additive blending is an exposure problem, not a colour problem.** I kept trying to fix blown-out whites by changing hues. The answer was always energy budget.

**`sin()`-based GLSL hashes are a trap.** They look fine in a shader toy at 512 px and moiré at 1080p. Precision-safe hashes cost nothing extra.

**Post-processing effects belong on the data they were designed for.** Chromatic aberration is a lens phenomenon; applying it to sharp point sprites produces noise, applying it to a blurred halo produces the effect you actually wanted.

**Distribute particles by volume, not by length.** True for the tree, and it turned out to be true for the galaxy arms and the DNA strands too. Anywhere a shape has thickness, weighting by extent alone gives you a wireframe.

**Storing morph targets in a data texture is the whole trick.** It removes the one thing that makes scroll-driven particle work feel janky — the buffer upload on state change.

**Field of view is vertical.** Obvious in retrospect, invisible until a phone-shaped viewport cuts your hero in half.

**Look at the pixels.** Every single visual bug in this project — the clipping, the moiré, the confetti, the missing trunk, the black entry screen — was completely invisible in the source and completely obvious in a screenshot. Reading code cannot review a render.

---

## What's next for ÆTHER — a cosmogony in particles

- **A demo video.** The optional submission item I did not get to, and the one thing a still frame genuinely cannot convey: the transitions are the piece.
- **Test on hardware I don't own.** My performance number comes from one integrated Intel GPU. Discrete GPUs and real phones are unverified, and the touch-device particle budget is currently a guess rather than a measurement.
- **A WebGPU compute path.** The morph is already GPU-resident; moving the turbulence into a compute shader would open the door to a million particles and to real physics between chapters — collisions, gravity, actual orbital motion for the galaxy.
- **Let the finale be your word.** The last chapter rasterises text to particles at runtime, so it could just as easily be a name someone types, and the site could hand back a shareable link to their own ending.
- **Deep links per chapter.** Right now the whole journey is one URL. Each chapter deserves its own.
- **More timbre in the sound.** The drone retunes across chapters but keeps one voice. Spark should crackle; Arbor should breathe.
- **A readable mode.** The writing is a real part of this piece and it currently requires WebGL to reach. A text-and-stills fallback would let it exist for people whose devices or preferences rule the canvas out.

---

## Built with

`three.js` · `webgl2` · `glsl` · `javascript` · `html` · `css` · `web-audio-api` · `canvas-2d` · `float-data-textures` · `custom-shaders` · `aces-tone-mapping` · `procedural-generation` · `l-systems` · `puppeteer` · `google-fonts` · `claude` · `claude-code`

**Assets used: none.** Everything is generated at runtime.
