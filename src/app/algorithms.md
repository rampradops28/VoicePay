# Tamil VoicePay: Algorithms and Module Breakdown

This document provides a technical overview of the algorithms, data structures, and design patterns used in the key modules of the Tamil VoicePay application.

---

### 1. Voice Command Parsing

- **Module**: `src/lib/parser.ts`
- **Primary Function**: To convert natural language voice commands (in English, Tamil, or mixed) into structured, machine-readable actions.

- **Algorithm**: **Sequential Regex-based Extraction and String Manipulation**.
  - The algorithm processes command strings (e.g., "add tomato 2kg 50rs") in a specific, prioritized sequence to avoid ambiguity between numeric values like quantity and price.
  1.  **Normalization**: The input string is converted to lowercase. Tamil number words (e.g., "ஐந்து") are translated into digits ("5").
  2.  **Command Splitting**: The input is split by "and" (or "மற்றும்") to handle multiple chained commands in a single utterance.
  3.  **Action Identification**: Simple commands like "save bill" or "reset" are identified first using keyword matching.
  4.  **Price Extraction**: A regular expression searches for a price pattern (e.g., `50rs`, `50ரூ`, or a standalone number at the end of the string). Once found, the price is extracted and *removed* from the string.
  5.  **Quantity & Unit Extraction**: A second regex runs on the *remaining* string to find a quantity and unit (e.g., `2kg`, `2 kg`). This part is also extracted and removed.
  6.  **Item Identification**: The leftover text is cleaned of action words (like "add" or "சேர்") and matched against a dictionary (`groceryNameMapping`) to find the canonical item name.

- **Data Structure**: The parser outputs an array of `ParsedCommand` objects, e.g., `{ action: 'add', payload: { item: 'tomato', ... } }`.

---

### 2. State Management

- **Module**: `src/context/BillingContext.tsx`
- **Primary Function**: To provide a centralized, consistent state for the entire application.

- **Algorithm/Pattern**: **State Reducer Pattern (via `useReducer` hook)**.
  - A single `billingReducer` function manages all state transitions. Components dispatch actions (e.g., `{ type: 'ADD_ITEM', payload: ... }`) instead of modifying the state directly.
  - This pattern ensures that state updates are predictable, traceable, and easier to debug, which is critical for handling complex state involving a current bill, billing history, and user settings.

- **Persistence**:
  - The application state (owner name, history, settings) is persisted in the browser's **`localStorage`**.
  - A `useEffect` hook serializes the state to a JSON string and saves it whenever a change is detected. On application load, another `useEffect` hook reads from `localStorage` to "hydrate" the state, restoring the user's session.

---

### 3. Voice Recognition & Synthesis

- **Modules**: `src/components/VoiceInput.tsx`, `src/ai/flows/text-to-speech.ts`
- **Primary Function**: To convert speech-to-text for commands and provide text-to-speech for audio feedback.

- **Algorithms/APIs**:
  1.  **Speech-to-Text**: Utilizes the browser's built-in **Web Speech API (`SpeechRecognition`)**. This is a client-side API that requires an internet connection. The implementation is configured to process only the final, complete transcript to improve performance and reduce lag.
  2.  **Text-to-Speech (TTS)**: Uses a Genkit flow (`textToSpeechFlow`) that calls **Google's Gemini TTS model**.
      - The model generates raw PCM audio data, which is then encoded into a WAV format on the server.
      
      - The final audio is sent back to the client as a Base64-encoded Data URI, which can be played directly by the browser's `<audio>` element.

---

### 4. Smart Command Guidance

- **Module**: `src/ai/flows/voice-command-suggestions.ts`
- **Primary Function**: To provide real-time suggestions to help users construct valid voice commands.

- **Algorithm/Pattern**: **Generative AI with Prompt Engineering**.
  - A Genkit flow (`voiceCommandSuggestionsFlow`) calls a **Large Language Model (LLM)**.
  - **Prompt Engineering**: The LLM is given a carefully crafted prompt that includes:
    - Its role ("You are a helpful assistant...").
    - The exact syntax rules for all supported commands (add, remove, etc.).
    - Examples in English, Tamil, and mixed-language.
    - The user's partial command (`{{{partialCommand}}}`).
  - The LLM uses this context to generate a list of likely command completions, which are returned to the UI as suggestions.

---

### 5. Sales Analytics

- **Module**: `src/components/AnalyticsDashboard.tsx`
- **Primary Function**: To compute and display sales metrics based on the billing history.

- **Algorithm**: **Data Aggregation and Transformation (`useMemo` hook)**.
  - The `analytics` object is calculated within a `useMemo` hook, which ensures that these computations only re-run when the `history` data changes, preventing unnecessary recalculations on every render.
  1.  **Filtering**: The `history` array is filtered to include only bills created on the current day.
  2.  **Aggregation**:
      - `totalRevenue` and `totalBills` are calculated by iterating through the filtered bills.
      - `topSellingProducts` are determined by creating a hash map (`productSales`) where keys are product names. The algorithm iterates through every item in every bill, aggregating total revenue and quantity sold for each product.
  3.  **Sorting & Slicing**: The aggregated products are converted into an array, sorted in descending order by revenue, and sliced to get the top 5.
  4.  **Chart Data Preparation**: The `DailySalesChart` component groups the entire bill history by date to create a time-series dataset suitable for line charts.
