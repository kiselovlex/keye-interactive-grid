# Interactive Spreadsheet

A React-based interactive spreadsheet component with real-time editing, cell formatting, and data persistence capabilities. Built with modern web technologies and designed for performance with large datasets.

## 🚀 Live Demo

**Try the live application:** [https://keye-d9514.web.app](https://keye-d9514.web.app)

## Features

### Core Functionality

- **Data Display**: Renders tabular data in a grid format with column headers and row indices
- **Cell Selection**: Individual cell selection with both keyboard and mouse support
- **Range Selection**: Select multiple cells using click and drag or keyboard navigation
- **In-cell Editing**: Direct cell content editing with keyboard and mouse interaction
- **Cell Formatting**: Basic text formatting options (bold, italic, alignment)
- **Data Persistence**: Changes persist during sessions using Firestore backend
- **Keyboard Navigation**: Complete keyboard shortcut support for navigation and editing
- **Sorting**: Column-based data sorting functionality

### Technical Highlights

- **Performance Optimized**: Handles 1000+ rows efficiently using TanStack Virtual
- **Responsive Design**: Usable across different screen sizes with scrollable interface
- **TypeScript**: Full type safety throughout the application
- **Testing**: Unit tests for core functionality and components

## Setup and Running Instructions

### Prerequisites

- Node.js (v18 or higher)
- Yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd keye-interactive-grid
   ```

2. **Install dependencies**

   ```bash
   yarn
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory with the following Firebase configuration:

   ```
   VITE_FIREBASE_API_KEY=AIzaSyB6Jhh-DnSOMhmYLC0_T-pvKNkSfDx9ju8
   VITE_FIREBASE_AUTH_DOMAIN=keye-d9514.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=keye-d9514
   VITE_FIREBASE_STORAGE_BUCKET=keye-d9514.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=93061757190
   VITE_FIREBASE_APP_ID=1:93061757190:web:9d38851032edaab8a4c687
   ```

4. **Start the development server**

   ```bash
   yarn dev
   ```

5. **Open in browser**

   The application will automatically open at `http://localhost:3000`. If it doesn't open automatically, navigate to this URL manually in your browser.

## Deployment Instructions

### Prerequisites for Deployment

- Firebase CLI installed globally (`npm install -g firebase-tools`)
- Access to the Firebase project with deployment permissions
- Firebase account authentication

### Deployment Steps

1. **Install dependencies**

   ```bash
   yarn install
   ```

2. **Ensure environment variables are configured**

   Make sure your `.env` file is present in the root directory with the Firebase configuration values as specified in the setup instructions above.

3. **Build the project**

   ```bash
   yarn build
   ```

4. **Authenticate with Firebase**

   ```bash
   firebase login
   ```

   This will open your browser to authenticate with your Firebase account. You must be logged in with an account that has access to the Firebase project.

5. **Deploy to Firebase Hosting**
   ```bash
   firebase deploy --only hosting
   ```

The application will be deployed to Firebase Hosting and accessible via the provided hosting URL.

## Implementation Approach

### Development Strategy

The project was initially built using AI assistance to establish a proof of concept quickly, then iteratively improved with additional features and refinements. The focus was on core requirements and technical specifications first, with bonus features added progressively.

### Architecture Overview

- **Frontend Stack**: Built with React, Vite, and TypeScript for modern development experience
- **Component Structure**: Modular design with clear separation of concerns
- **State Management**: Local state management using React hooks and Context API
- **Event Handling**: Grid-level keyboard events with cell-level mouse events
- **Data Layer**: Firebase Firestore integration with custom adapter pattern
- **Performance**: Virtualization for handling large datasets efficiently

### Key Technical Decisions

- **Selection State Management**: Used React Context to pass selection values to cells, avoiding column recreation on selection changes
- **Data Transformation**: Implemented an adapter pattern to transform database format into table-friendly format
- **Formatting Persistence**: Separate Firestore collection for cell formatting metadata
- **Virtualization**: Applied row virtualization only (column virtualization omitted assuming similar column counts)

## Design Decisions and Assumptions

### Core Assumptions

- **Backend Data Immutability**: Assumed backend data format couldn't be changed, requiring client-side transformation
- **Table-First Approach**: Maintained table semantics while providing spreadsheet-like functionality
- **Column Count**: Assumed relatively consistent column counts across datasets
- **User Experience**: Prioritized Google Sheets-like interactions while maintaining table accessibility

### Technical Choices

- **Event Strategy**: Initially avoided event listeners but adopted them for improved user experience
- **Testing Strategy**: Focused on utility functions and key components rather than comprehensive coverage
- **Performance Trade-offs**: Prioritized functionality over perfect optimization in initial implementation

## Future Improvements

### Development Priorities

- **Code Quality**: Improve naming conventions, reduce redundancy, and enhance interface design
- **Dependencies Cleanup**: Remove unused shadcn/ui components that were added in bulk during initial setup
- **Performance**: Implement batch updates for cell ranges instead of individual updates
- **Data Layer**: Refactor the adapter pattern for better performance and maintainability
- **Testing**: Expand test coverage and review existing test implementations

### Feature Enhancements

- **Missing Bonus Features**: Add cell highlighting, formula support, column resizing, and undo/redo functionality
- **Enhanced Formatting**: Expand formatting options beyond basic text styling
- **User Experience**: Add visual cues for editability, instant value updates, and click-outside deselection
- **Accessibility**: Improve keyboard navigation and screen reader support

### Product Considerations

- **Google Sheets Parity**: Move closer to Google Sheets functionality while maintaining table semantics
- **User Guidance**: Add helpful hints and onboarding for new users
- **Real-time Updates**: Implement immediate visual feedback for better user experience

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **UI Components**: Custom components with shadcn/ui
- **Styling**: Tailwind CSS with custom utilities
- **State Management**: React hooks and Context API
- **Backend**: Firebase Firestore
- **Testing**: Vitest + React Testing Library
- **Virtualization**: TanStack Virtual
- **Development**: ESLint + TypeScript for code quality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is available under the MIT License.
