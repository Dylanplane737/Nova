# Nova – Smart Web Launcher

A fun little web app I made. Search the web, explore topics, find images and videos, save useful sites, and maybe even get rickrolled.

---

## 🎮 Search Now

[**Click here to use Nova in your browser**](https://dylanplane737.github.io/Nova/)

No download needed — Nova runs online through GitHub Pages.

---

## ✨ Features

- **Web search** with paginated results.
- **Wikipedia summaries** and search suggestions.
- **Images and videos** from supported online sources.
- **Topic timelines** that pull dated details from Wikipedia summaries.
- **Maps** using OpenStreetMap, including location searches and nearby-place lookups.
- **Research Mode** with source filters and a stricter source-filter option.
- **Academic search** for scholarly publication records.
- **Citation tools** for creating MLA citations, saving them locally, and exporting a Works Cited list.
- **Home and bookmarks** for shortcuts and saved websites.
- **Customizable appearance** with themes, accent colors, font sizing, custom backgrounds, and **Nova Lite Mode** to disable blur, shadows, and heavy visual effects on lower-spec devices.
- **Connection Test** to check the browser connection signal, Wikipedia API reachability, and the Tiago and cl0q search providers, with clear results when browser security prevents verification.
- **Search history and backups**, managed from Settings.
- **Easter eggs**, including the Rickroll, Matrix, Flip, Portal-inspired cake joke, 42 reference, fake command warning, random greetings, and Konami-code achievement.
- **Offline play:** Nova Dash is a locally rendered mini-game. After Nova has been opened online and its app shell cached, Nova can reopen with a connection notice and the game when the device is offline.

Try typing exact phrases in Nova's search box: `the cake is a lie`, `42`, `hello world`, `sudo rm -rf /`, `easter egg`, or `nova dash`. Type `konami` for the hint, then enter ↑ ↑ ↓ ↓ ← → ← → B A, followed by Enter. Existing triggers include `rickroll`, `matrix`, and `flip`.

Nova uses third-party online services for search, summaries, media, maps, and academic records. Those services need an internet connection and may occasionally be unavailable. The first visit still needs internet so the app can load and cache itself; offline search results are not available.

---

## 💻 Run Locally

1. Click the green **Code** button on this repository.
2. Choose **Download ZIP**.
3. Unzip the downloaded project.

You can try opening `index.html` in your browser. Some online requests may not work from a local file, though. For the best local test, serve the project through a local web server and open its localhost address.

---

## 🔒 Local Data

Settings, bookmarks, search history, and saved citations are stored in your browser on your device. They are not automatically synced between browsers or devices. Export a backup from Settings if you need to move or keep a copy of your data.

Nova sends web search queries to external search providers. It tries search.tiago.zip first and uses cl0q.com if the first provider fails or returns no parseable results. The provider used for a search receives the query needed to return results. These independent services may have different coverage or availability. Avoid entering sensitive information into web searches.

---

## 📜 License

No license (all rights reserved). Feel free to play with Nova, but please don't redistribute it without permission.
