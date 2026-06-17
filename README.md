# BigQuery Release Notes Hub & Twitter Share App

A modern, responsive web application that fetches official BigQuery release notes from the Google Cloud feed, categorizes updates, and enables quick drafts to Twitter/X for individual or compiled updates.

---

## 🚀 Key Features

* **Real-time Feed Syncing**: Fetches the official Google Cloud BigQuery Atom release notes XML feed dynamically.
* **Smart Update Splitting**: Splits composite daily updates into separate, digestible cards based on their update context (e.g. *Features*, *Announcements*, *Deprecations*, *Issues*, *General*).
* **High-End Dark Mode UI**: Rich glassmorphism theme styled with glowing gradient backdrops, responsive sidebar panels, stats charts, and clean animations.
* **Instant Filtering & Search**: Client-side filtering by category tab or keyword query.
* **Dynamic Tweet Composers**:
  * **Single Card Draft**: Compiles an optimized tweet with clear summary text, date details, links, and hashtags automatically formatted within Twitter's character limits.
  * **Multi-Select Draft**: Combines multiple checked release updates into a structured bulletin lists.
  * **Tweet Preview Modal**: Fully simulated Twitter post composer featuring an SVG circular progress meter that alerts users approaching the 280-character limit.

---

## 🛠 Tech Stack

* **Backend**: Python 3 (Flask, BeautifulSoup4, ElementTree)
* **Frontend**: HTML5, Vanilla CSS3 (Custom styling, no Tailwind), Vanilla JavaScript (ES6, state-driven UI)
* **Icons**: [Lucide Icons](https://lucide.dev/) (CDN)
* **Fonts**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (Google Fonts)

---

## 📂 Project Structure

```
├── .venv/                   # Python virtual environment (contains Flask, bs4, requests)
├── static/
│   ├── css/
│   │   └── styles.css       # Glassmorphism dark mode theme and animation layout
│   └── js/
│       └── app.js           # AJAX handlers, UI states, filters, and Tweet composers
├── templates/
│   └── index.html           # Dashboard layout structure & simulated Twitter modal
├── .gitignore               # Excludes python builds, caches, environments, and logs
├── app.py                   # Main Flask backend application server
└── README.md                # Project documentation and setup guide
```

---

## 💻 Setup & Installation

### Prerequisites
Make sure you have **Python 3.x** and **git** installed on your system.

### 1. Clone & Navigate
```bash
git clone https://github.com/<your-username>/Big-query-event-talks-app-cli.git
cd Big-query-event-talks-app-cli
```

### 2. Configure Virtual Environment
Create a virtual environment to isolate project dependencies:

**On Windows:**
```powershell
python -m venv .venv
.venv\Scripts\activate
```

**On macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies
Install the required packages in your active environment:
```bash
pip install flask requests beautifulsoup4
```

### 4. Start the Application
Run the Flask server:
```bash
python app.py
```
The application will boot up at **[http://127.0.0.1:5000](http://127.0.0.1:5000)**.

---

## 🐦 How to Tweet
1. Hover over any card and click the **Draft Tweet** button to open the composer for that single update.
2. Alternatively, check the boxes on the left side of multiple cards. A panel will appear in the sidebar displaying **"X updates selected"**. Click **Tweet Selected** to compile a combined summary tweet.
3. Review the text in the modal. Modify it if needed (ensuring the character counter stays positive), and click **Post to Twitter**. This opens a new browser window using Twitter's Secure Web Intent API pre-filled with your post.
