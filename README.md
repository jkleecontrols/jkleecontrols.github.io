# jkleecontrols.github.io

Personal website of Jaekyung (Jackie) Lee — Ph.D. candidate, Autonomous Systems Lab, Texas A&M University.
Live at <https://jkleecontrols.github.io>. Plain static HTML/CSS served by GitHub Pages; no build step.

## Structure

```
index.html            About, news, research highlights, experience
research.html         Research projects (ICUAS 2025, RA-L 2025, AIAA 2024)
publications.html     Papers with links and BibTeX
cv.html               Full CV
projects.html         Earlier hardware/competition projects (index)
projects/*.html       One page per earlier project
blog.html             Personal notes
404.html              Not-found page; also redirects old URLs (post_*.html, CV/*.pdf, ...)

assets/css/site.css   All styles (light/dark theme tokens at the top)
assets/js/site.js     Theme toggle and mobile menu
images/profile/       Headshot
images/research/      Figures and videos for research.html (one folder per paper)
images/projects/      Media for projects/*.html (one folder per project)
images/blog/          Photos for blog.html
files/                CV and resume PDFs, files/papers/ for paper PDFs
```

## Updating

- **CV / resume**: replace `files/Jackie_Lee_CV.pdf` or `files/Jackie_Lee_Resume.pdf` (keep the file names so links keep working).
- **News**: edit the `<ul class="news">` list in `index.html`.
- **New paper**: add an `<li class="pub">` entry in `publications.html` (and optionally `index.html`, `cv.html`).
- **New project**: copy a page in `projects/`, put media in `images/projects/<name>/`, add a card in `projects.html`.
- File names: lowercase, hyphen-separated, no spaces.

Preview locally with `python3 -m http.server` and open <http://localhost:8000>.
