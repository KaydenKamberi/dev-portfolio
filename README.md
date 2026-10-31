# Kayden Kamberi – Web Developer

Personal portfolio for Kayden Kamberi, a freelance web developer in San Diego who takes on overflow work for web design agencies.

**Live site:** https://kaydenkamberi.github.io/dev-portfolio/

Plain HTML, CSS and a little JavaScript. No frameworks, no build step, nothing to install.

---

## Turn on GitHub Pages (step by step)

1. Push this project to the `dev-portfolio` repository on the `kaydenkamberi` GitHub account. `index.html` must sit at the top level of the repo (it already does).
2. Make sure your site files are on the `main` branch. If you're working on a different branch, open a pull request and merge it into `main` first.
3. On GitHub, open the repo: https://github.com/kaydenkamberi/dev-portfolio
4. Click **Settings** (the tab with the gear icon, top right of the repo).
5. In the left sidebar, under **Code and automation**, click **Pages**.
6. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
7. Under **Branch**, choose **main** and the folder **/ (root)**, then click **Save**.
8. Wait 1 to 2 minutes. Refresh the Pages settings screen and you'll see "Your site is live at https://kaydenkamberi.github.io/dev-portfolio/".
9. Open the link and check that all three project previews load and the "View live" buttons work.

From then on, every push to `main` updates the live site automatically within a minute or two. You can watch each deploy under the repo's **Actions** tab.

**Notes**

- The repo must be **public** for GitHub Pages on a free account.
- The empty `.nojekyll` file tells GitHub to serve the files as-is. Leave it in.
- If the page looks unstyled or a preview is blank, a path is probably starting with `/`. Every path in this project is relative (e.g. `assets/css/style.css`, `demo/marisol/`), which is what makes it work from the `/dev-portfolio/` subfolder.

---

## Adding or updating a demo

Each demo lives in its own folder under `demo/`, with its own `index.html`:

```
demo/tattoo/index.html
demo/barbershop/index.html
demo/marisol/index.html
```

After copying in new demo files, run the checker from the repo root. It looks for a name you give it (to make sure no old business name is left anywhere) and for asset paths that start with `/`, which break on GitHub Pages:

```bash
bash tools/check-demos.sh "Name To Find"
```

Fix anything it lists, then run it again until it says "All clear."

---

## Project structure

```
index.html              The whole portfolio (one page)
assets/css/style.css    Styles, theme colors, responsive layout
assets/js/main.js       Mobile menu, live previews
assets/img/og-image.png Image shown when the link is shared on social media
favicon.svg             Browser tab icon (+ favicon-32.png, apple-touch-icon.png)
robots.txt, sitemap.xml Search engine files
demo/                   The three demo sites shown in the Work section
tools/check-demos.sh    Checker for the demo folders
.nojekyll               Tells GitHub Pages to serve files as-is
```

## Preview locally

Open `index.html` in a browser, or for the most accurate result run a small local server from the folder **above** this one and visit `http://localhost:8000/dev-portfolio/`:

```bash
python3 -m http.server 8000
```
