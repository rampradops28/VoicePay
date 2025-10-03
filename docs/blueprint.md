# **App Name**: Tamil VoicePay

## Core Features:

- Offline Voice Recognition: Utilize Vosk API for offline Tamil and English mixed-language speech recognition.
- Billing Command Parser: Parse voice commands to extract action, quantity, unit, item, and price using regex.
- Real-time Billing Updates: Dynamically update the bill table with item, quantity, unit, price, and total.
- PDF Invoice Generation: Generate PDF invoices with shop name, date, items, and totals, save locally, and enable sharing.
- Voice Authentication: Enable offline voice authentication using MFCC feature extraction and cosine similarity.
- Billing History Management: List and manage past bills, including viewing details, generating PDFs, and deleting bills.
- Smart Command Guidance: Tool to provide suggestions to the user to construct voice prompts so they match what the model expects, and will be most likely to generate the desired transaction.

## Style Guidelines:

- Primary color: Emerald green (#50C878) to reflect growth and reliability.
- Background color: Light green (#E8F8EF), a slightly desaturated version of the primary color to provide a gentle, clean backdrop.
- Accent color: Yellow-green (#BFFF00) for highlighting active elements.
- Headline font: 'Poppins', sans-serif, for a contemporary, precise feel.
- Body font: 'PT Sans', sans-serif, suitable for comfortably reading the numbers in the bills.
- Use Material Design icons related to commerce, finance, and voice recognition.
- Material Design components should be used
- Implement a ripple animation for the microphone button when recording voice.