# AI Programming Learning Assistant

A web application that helps users learn JavaScript, React, Vue, Angular, and TypeScript programming concepts through AI-generated learning content, flashcards, exercises, and project ideas.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Setup and Running the Application](#setup-and-running-the-application)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Directory Structure](#directory-structure)
- [How it Works](#how-it-works)
- [Google Gemini API Integration](#google-gemini-api-integration)
- [Key Components](#key-components)

## Features

The application offers the following main features to support programming learning:

1.  **Learn Topic:**
    *   Users can enter a topic and select a technology (JavaScript, React, Vue, Angular, TypeScript).
    *   The AI will generate a detailed explanation of the topic, including code examples (if any) and formatted in Markdown.
    *   The content can be copied as Markdown.

2.  **Flashcards:**
    *   Generate a set of flashcards (question and answer) based on a selected topic and technology.
    *   Users can flip between the question and answer.
    *   Navigate through flashcards (Previous/Next).
    *   Mark flashcards as favorites.
    *   Copy flashcard content as Markdown.

3.  **Exercises:**
    *   Generate programming exercises based on technology, topic, difficulty (Beginner, Intermediate, Advanced, Expert), and the desired number of exercises.
    *   Each exercise includes a title, description, and problem statement (can include code).
    *   Users can request the AI to generate a simple hint or a detailed solution for each exercise.
    *   Mark exercises as favorites.
    *   Copy all exercise information (including hints/solutions if available) as Markdown.
    *   Exercise content, hints, and solutions are formatted (supports basic Markdown and code blocks).

4.  **Project Ideas:**
    *   Generate project ideas based on one or more selected technologies and an optional suggested topic.
    *   The idea includes a project name, a brief description, a list of main features, and additional suggested technologies.
    *   Users can request the AI to generate detailed step-by-step instructions to implement the project.
    *   Users can request the AI to generate additional improvement suggestions or feature extensions for the project.
    *   Mark project ideas as favorites.
    *   Copy all project information (including instructions/suggestions if available) as Markdown.
    *   Detailed instruction content is formatted (supports basic Markdown and code blocks).

## Technologies Used

*   **Frontend:**
    *   React (^19.1.0) with TypeScript
    *   Tailwind CSS (for UI styling)
    *   ESM.sh (to load JavaScript modules directly in the browser)
*   **AI Backend:**
    *   Google Gemini API (`@google/genai` SDK)
    *   Model used: `gemini-2.5-flash-preview-04-17`
*   **Syntax Highlighting:**
    *   highlight.js (for syntax highlighting of code blocks)
*   **Icons:**
    *   Heroicons
*   **Fonts:**
    *   JetBrains Mono (via Google Fonts)

## Setup and Running the Application

### Prerequisites

*   A modern web browser (Chrome, Firefox, Edge, Safari).
*   Internet connection (to load libraries from ESM.sh and call the API).

### Environment Variables

This application requires a Google Gemini API key.
*   `API_KEY`: Your API key.
    *   **IMPORTANT:** The application is designed to read this API key from the `process.env.API_KEY` environment variable. You must ensure this variable is set in the environment where the application's JavaScript code will be executed.
    *   For local development when the `index.html` file is served directly, accessing `process.env.API_KEY` in the traditional (Node.js) way is not possible because the code runs entirely client-side. The `services/geminiService.ts` file will currently throw an error if `process.env.API_KEY` is not found.
    *   For local development, you can temporarily replace `process.env.API_KEY` in `services/geminiService.ts` with your API key as a string. **However, never commit your API key directly into the source code.**
    *   When deploying the application (e.g., to Vercel, Netlify, or a custom server), you need to configure the `API_KEY` environment variable on that platform.

### Running the Application

1.  **Ensure API Key:** As mentioned above, the API key must be available to `services/geminiService.ts`.
2.  **Open `index.html`:**
    *   The simplest way is to open the `index.html` file directly in your web browser.
    *   Alternatively, use a live server extension in your code editor (e.g., "Live Server" in VS Code) to serve the `index.html` file. This helps handle relative paths correctly and provides a better development experience.

## Directory Structure (Overview)

```
.
├── index.html              # Main HTML entry point
├── index.tsx               # Main React application entry point (renders App.tsx)
├── App.tsx                 # Root React component, manages feature switching
├── metadata.json           # Application metadata
├── types.ts                # TypeScript type definitions
├── constants.ts            # Constants used throughout the application
├── services/
│   └── geminiService.ts    # Logic for interacting with the Gemini API
├── components/             # Reusable React components
│   ├── Navbar.tsx
│   ├── LearnTopic.tsx
│   ├── FlashcardGenerator.tsx
│   ├── ExerciseGenerator.tsx
│   ├── ProjectIdeaGenerator.tsx
│   ├── CodeBlock.tsx         # Component for displaying and highlighting code
│   ├── LoadingSpinner.tsx
│   └── ErrorMessage.tsx
└── README.md               # This file
```

## How it Works

The application is a Single-Page Application (SPA) built with React.

1.  **Select Feature:** The user selects a learning feature (Learn, Flashcards, Exercises, Project Ideas) from the navigation bar.
2.  **Display Component:** Based on the selected feature, a corresponding React component is rendered.
3.  **Input:** The user provides the necessary input, e.g., technology, topic, difficulty.
4.  **API Call:** When the user submits a request, the `services/geminiService.ts` module makes API calls to the Google Gemini API.
5.  **Content Generation:** The AI generates content as requested (explanations, flashcards, exercises, project ideas).
6.  **Display Results:** The generated content (JSON responses are parsed) is then displayed to the user. Code blocks are syntax-highlighted using `highlight.js`.

## Google Gemini API Integration

The `services/geminiService.ts` file encapsulates all interactions with the `@google/genai` SDK. It includes functions to:
*   Generate detailed learning content for a topic.
*   Generate flashcards (question/answer).
*   Generate programming exercises with customizable difficulty.
*   Provide solutions and hints for exercises.
*   Suggest project ideas with features, and optionally generate detailed implementation steps and extension suggestions.
*   Utilize the `gemini-2.5-flash-preview-04-17` model for text content generation.
*   Handle JSON parsing from API responses, including cleaning up potential ```markdown``` fences.
*   Adhere to Google GenAI API usage guidelines.

## Key Components

*   `App.tsx`: The main application shell, manages the display of the current feature.
*   `Navbar.tsx`: Navigation bar to switch between features.
*   `LearnTopic.tsx`: UI for generating and displaying learning content.
*   `FlashcardGenerator.tsx`: UI for generating and interacting with flashcards.
*   `ExerciseGenerator.tsx`: UI for generating exercises, hints, and solutions.
*   `ProjectIdeaGenerator.tsx`: UI for generating project ideas, details, and suggestions.
*   `CodeBlock.tsx`: Component for displaying and syntax-highlighting code snippets, with a copy-to-clipboard feature. It intelligently handles language detection and Markdown code blocks.
*   `LoadingSpinner.tsx` & `ErrorMessage.tsx`: Utility components for user feedback (loading state, error messages).

---

Hope you enjoy this application!
