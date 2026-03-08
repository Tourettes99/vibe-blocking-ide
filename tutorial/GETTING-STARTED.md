# How to Get Started with Vibe Blocking IDE

**A beginner-friendly guide to building apps by describing them.**

---

## What Is This?

Vibe Blocking IDE is a desktop app that turns your ideas into working applications. Instead of writing code, you describe what you want in plain English. An AI (powered by Google Gemini) reads your descriptions and generates all the code for you.

**Think of it like ordering food from a menu:** you tell the waiter what you want, and the kitchen makes it. You don’t need to know how to cook.

---

## What You’ll Need

1. **Windows PC** — The app runs on Windows.
2. **A free Google AI key** — Used to run the AI. See the next section for how to get one.

---

## Step 1: Get Your Free API Key

1. Open your browser and go to **[Google AI Studio](https://aistudio.google.com/)**.
2. Sign in with your Google account.
3. Click **“Get API key”** or **“Create API key”**.
4. Copy the key and keep it somewhere safe.

---

## Step 2: Install and Open the App

1. **Download** the installer (or the zip file) from the product page.
2. **Run the installer** and follow the prompts.
3. **Launch** Vibe Blocking IDE from your Start menu or desktop shortcut.

---

## Step 3: Enter Your API Key (First Time Only)

1. Click **Settings** in the left sidebar (gear icon).
2. Paste your API key into the **API Key** field.
3. *(Optional)* Set a PIN so your key is stored safely on your computer.
4. Close Settings when done.

---

## Step 4: Name Your Project

At the top of the screen, you’ll see **Project Name**. Type a name for your app, like `MyFirstApp` or `TodoList`. This is the folder name where your files will be saved.

---

## Step 5: Describe Your App (The Fun Part)

You’ll see **seven colored blocks**. Fill in the ones you care about — you don’t have to use every single one.

| Block | What to Write (in your own words) |
|-------|-----------------------------------|
| **Concept & Vision** | What is the app? Who is it for? What problem does it solve? |
| **UI & Layout** | How should it look? Colors, layout, navigation. |
| **Core Features** | What can the user do? Buttons, forms, lists, etc. |
| **Data & Backend** | What data does it need? Where is it stored? |
| **Auth & Users** | Logins? Different roles? Security? |
| **Platform & Config** | Where will it run? Web, mobile, desktop? |
| **Project Structure** | Optional: folder layout or starting from a template. |

**Tip:** Write like you’re explaining the app to a friend. No need for technical jargon.

**Example for a simple to-do app:**
- **Concept:** A simple to-do app for people who want to track daily tasks. Clean and easy to use.
- **UI:** White background, blue accents. One main list with checkboxes. Add a new task at the top.
- **Core Features:** Add tasks, check them off, delete completed ones.
- **Data:** Store tasks in the browser so they persist when you refresh.

---

## Step 6: Build Your App

1. Click the big **Build Vibe App** button.
2. Wait while the AI generates your code (usually 30 seconds to a couple of minutes).
3. When it’s done, your app appears in the **Preview** tab.

---

## Step 7: What Happens Next?

- **Preview tab** — See your app running right inside the IDE.
- **Files saved** — All generated files go to `Documents\VibeApps\<YourProjectName>\`.
- **Refine** — Want changes? Describe what to change in the refine box and click **Refine Build**.
- **Version history** — Click the version badge to see past builds and restore an older one.

---

## Optional: Project Structure

If you want a specific folder layout or to start from a template:

1. Scroll to the **Project Structure & Folders** block (sky blue).
2. Use **Quick add** to add presets like React/Vite or Node API.
3. Or type paths like `src/App.tsx` and click **Add**.
4. **Feed existing files** — Want to base your app on code you already have? Click **Upload files**, pick your files, and the AI will extend them.
5. **Scaffold command** — To start from something like a Vite template, enter e.g. `npx create-vite@latest . -- --template react`.

---

## Tips for Best Results

1. **Be specific** — “A dark-themed to-do list with red delete buttons” works better than “a to-do app.”
2. **Start small** — Begin with a simple app; add complexity later.
3. **Use Refine** — If the first build isn’t perfect, use the refine box to tweak it.
4. **Save often** — Use **Save Project** to keep your progress.

---

## Troubleshooting

| Problem | What to try |
|---------|-------------|
| Build fails | Check your API key in Settings. Make sure you have internet. |
| Preview is blank | For web apps, make sure you described UI and features. |
| “No API key” | Paste your key in Settings and save. |
| App crashes | Try reopening the app. Check if your key has usage limits. |

---

## Where to Go From Here

- **MCP Servers** tab — Add tools the AI can use (advanced).
- **Skills** tab — Add coding guidelines for the AI (advanced).
- **Load Project** — Open a saved project to continue working.

---

*Happy building. You’ve got this.*
