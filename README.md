# Ghaz.io — Personal Brand Website

> Ghazanfar Iqbal's personal brand site & home for *Bytes Beyond Borders*

---

## 🚀 Going Live — Complete Deployment Guide

### Step 1: Buy Your Domains

**Recommended registrar:** [Cloudflare Registrar](https://dash.cloudflare.com/sign-up) (cheapest renewals, ~$9-12/year)  
**Alternative:** [Namecheap](https://namecheap.com) (good UI, ~$12-15/year)

| Domain | Purpose | Priority |
|--------|---------|----------|
| `ghazanfariqbal.com` | Primary canonical site | Must have |
| `ghazonomics.com` | Redirect to main (or future content hub) | Recommended |
| `ghaz.io` | Short memorable URL | Nice to have |

**Steps:**
1. Go to [Cloudflare Registrar](https://dash.cloudflare.com/sign-up) and create an account
2. Search for each domain
3. Purchase with a credit/debit card
4. All three should cost ~$30-35/year total

---

### Step 2: Create a GitHub Repository

1. **Create a GitHub account** (if you don't have one): https://github.com/join

2. **Create a new repository:**
   - Go to https://github.com/new
   - Name: `ghaz-io` (or `ghazanfariqbal.com`)
   - Make it **Public** (required for free Vercel hosting)
   - Click "Create repository"

3. **Upload your files:**
   - On the repo page, click "uploading an existing file"
   - Drag the entire contents of this `ghaz-website-production/` folder
   - Make sure all files are included: `index.html`, `book-cover.png`, `images/` folder, `vercel.json`, `package.json`, `robots.txt`, `sitemap.xml`
   - Click "Commit changes"

**Alternatively, use the command line:**
```bash
cd ghaz-website-production
git init
git add .
git commit -m "Initial commit — ghaz.io personal site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ghaz-io.git
git push -u origin main
```

---

### Step 3: Deploy to Vercel (Free Hosting)

1. **Sign up for Vercel:** https://vercel.com/signup (use "Continue with GitHub")

2. **Import your project:**
   - Click "Add New → Project"
   - Select your `ghaz-io` repository
   - Framework Preset: **Other** (static site)
   - Leave all settings default
   - Click "Deploy"

3. **Wait ~30 seconds** — your site will be live at `ghaz-io.vercel.app`

---

### Step 4: Connect Your Custom Domains

1. In Vercel dashboard, go to your project → **Settings → Domains**

2. Add `ghazanfariqbal.com`:
   - Type the domain and click "Add"
   - Vercel will show you DNS records to set

3. **Update DNS at Cloudflare:**
   - Go to your Cloudflare dashboard → select the domain
   - Go to DNS → Records
   - Add the records Vercel shows you:
     - Type: `A`, Name: `@`, Value: `76.76.21.21`
     - Type: `CNAME`, Name: `www`, Value: `cname.vercel-dns.com`

4. **Repeat for other domains** (ghazonomics.com, ghaz.io):
   - Add them in Vercel with "Redirect to" → `ghazanfariqbal.com`

5. **SSL Certificate:** Auto-provisioned by Vercel within 5 minutes. No action needed.

6. **DNS propagation:** Takes 5-30 minutes. Your site will be live!

---

### Step 5: Post-Launch Checklist

#### Analytics (choose one):
**Option A — Plausible Analytics** (privacy-friendly, $9/mo):
- Sign up at https://plausible.io
- Add this before `</head>`:
```html
<script defer data-domain="ghazanfariqbal.com" src="https://plausible.io/js/script.js"></script>
```

**Option B — Google Analytics 4** (free):
- Go to https://analytics.google.com → Create property
- Add the provided `<script>` tag before `</head>`

#### Google Search Console:
1. Go to https://search.google.com/search-console
2. Add property → URL prefix → `https://ghazanfariqbal.com`
3. Verify via DNS (Cloudflare makes this easy)
4. Submit your sitemap: `https://ghazanfariqbal.com/sitemap.xml`

#### Favicon:
- Create a 32x32 and 180x180 icon (use your headshot or a "G" logo)
- Add to root folder and reference in `<head>`:
```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

#### Open Graph Image:
- Create a 1200x630px social share image
- Add to `<head>`:
```html
<meta property="og:image" content="https://ghazanfariqbal.com/og-image.jpg">
```

---

## 📁 Project Structure

```
ghaz-website-production/
├── index.html          ← Main website (single page)
├── book-cover.png      ← Bytes Beyond Borders front cover
├── images/
│   ├── headshot.jpg          ← Professional headshot (AWS tee)
│   ├── ganz-beach-sunset.jpg ← Ganz Beach, Balochistan (Ch.1)
│   ├── ganz-beach-cliffs.jpg ← Ganz Beach cliffs
│   ├── lahore-founders.jpeg  ← Founders Meetup Lahore keynote
│   ├── unicorn-day-panel.jpeg← AWS Unicorn Day 2025 panel
│   ├── antler-workshop.jpeg  ← Antler Malaysia workshop
│   ├── austrade-panel.jpeg   ← Austrade business exchange
│   ├── shegrows-panel.jpeg   ← SheGrows/UN ESCAP panel
│   ├── endeavor-awards.jpeg  ← Endeavor Malaysia Awards
│   ├── amazon-paloalto.jpeg  ← Amazon Palo Alto founders
│   ├── kurta-aws-pakistan.jpeg← Pakistan diaspora @ AWS KL
│   └── pickleball-event.jpeg ← Startup pickleball community
├── package.json        ← Project metadata for Vercel
├── vercel.json         ← Routing, redirects, caching
├── robots.txt          ← Search engine crawl permissions
├── sitemap.xml         ← Sitemap for SEO
└── README.md           ← This file
```

---

## 🔗 Built-in Short URLs (via vercel.json)

Once live, these redirect automatically:
- `ghazanfariqbal.com/book` → Amazon SG paperback
- `ghazanfariqbal.com/kindle` → Amazon Kindle edition
- `ghazanfariqbal.com/linkedin` → LinkedIn profile

---

## 🔮 Future Enhancements

- **Blog:** Embed Substack or add a `/blog` page with your Medium RSS
- **Newsletter signup:** Add Substack embed or ConvertKit form
- **Contact form:** Use [Formspree](https://formspree.io) (free tier, no backend)
- **Instagram feed:** Embed via [Elfsight](https://elfsight.com) widget
- **Book chapter previews:** Add a `/sample` page with first chapter
- **Speaking page:** Add `/speaking` with topics, photos, and booking info

---

## 🛠 Troubleshooting

| Issue | Fix |
|-------|-----|
| Images not loading | Check file names match exactly (case-sensitive on Vercel) |
| Domain not connecting | Wait 30 min for DNS propagation, check Vercel domain settings |
| SSL error | Vercel auto-provisions SSL; just wait 5-10 minutes |
| 404 on direct URL | `vercel.json` handles routing; ensure it's in the root |
| Slow loading | Images are large; consider compressing with TinyPNG before upload |

---

## 📝 Making Changes

1. Edit files in your GitHub repository (directly on github.com or locally)
2. Commit and push changes
3. Vercel auto-deploys within 30 seconds
4. Changes are live immediately

---

Built with stories and stubborn optimism. 🦁
