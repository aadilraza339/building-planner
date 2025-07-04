# Building Planner

A web application for selecting, drawing, and annotating building plans. This interactive tool allows users to create and modify building layouts with automatic measurement annotations.

![Building Planner Screenshot](https://www.parabuild.com/downloads/Parabuild-v7-Reference-Manual/lib/NewItem3377.png)

## Features

- **Drawing Tools:** Create lines, rectangles, and circles for building design
- **Selection Tool:** Select, move, resize, or delete shapes
- **Annotations:** Automatically shows dimensions of shapes (can be toggled on/off)
- **Persistent Storage:** Save and load your drawings using IndexedDB

## Tech Stack

- **Framework:** Vue.js 3
- **Build Tool:** Vite
- **Database:** IndexedDB for client-side storage
- **Dependencies:** UUID for unique shape identification

## Project Structure

- **src/App.vue** - Main application container
- **src/components/**
  - **DrawingCanvas.vue** - Canvas for drawing and manipulating shapes
  - **Toolbar.vue** - Tool selection sidebar
  - **StatusBar.vue** - Information display
  - **DrawingManager.vue** - Managing saved drawings
- **src/services/**
  - **DatabaseService.js** - IndexedDB interface for persistent storage

## Getting Started

### Prerequisites

- Node.js v14+ and npm

### Installation

```sh
# Clone the repository
git clone https://github.com/yourusername/building-planner.git
cd building-planner

# Install dependencies
npm install
```

### Development

```sh
# Start the development server
npm run dev
```

The application will be available at http://localhost:5173

### Build for Production

```sh
npm run build
```

This will generate a `dist` directory with optimized production assets.

## Usage Instructions

1. **Select a tool** from the toolbar on the left
2. **Drawing:**
   - For shapes (rectangle, circle), click and drag to define size
   - For lines, click at the start point and drag to the end point
3. **Selection:**
   - Use the select tool to click on a shape
   - Drag to move the selected shape
   - Use the corner handles to resize
4. **Annotations:**
   - Toggle annotations on/off with the annotation button
   - Annotations show dimensions in pixels
5. **Saving/Loading:**
   - Click the Save button to name and save your drawing
   - Click the Load button to select a previously saved drawing

## Keyboard Shortcuts

- **Ctrl+S / Cmd+S** - Open save dialog

## Architecture

The application follows a component-based architecture using Vue.js.

- **State Management:** Vue's Reactivity API manages application state
- **Event Communication:** Components communicate through props and events
- **Persistence:** IndexedDB provides client-side storage
- **Rendering:** HTML Canvas API for drawing operations

## Testing

The project includes comprehensive test cases using Vitest and Vue Test Utils. Tests cover both UI components and services.

### Test Structure

- **Unit Tests:**
  - **Component Tests:** Tests for Vue components like DrawingCanvas and Toolbar
  - **Service Tests:** Tests for services like DatabaseService
- **Mocks:** Custom mocks for dependencies like IndexedDB

### Running Tests

```sh
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run coverage
```

Final UI ScreenShot
![WhatsApp Image 2025-06-17 at 11 41 19 PM (1)](https://github.com/user-attachments/assets/1badaad3-5186-4606-a058-60664238d844)





