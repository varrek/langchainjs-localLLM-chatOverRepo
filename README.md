# GitHub Repository Chat Interface

This project provides a chat interface that allows users to ask questions about a GitHub repository. The backend processes the repository and uses LangChain for retrieval-based question answering. The frontend offers a user-friendly chat interface.

## Features

- Load and process GitHub repositories
- Embed documents for efficient retrieval
- Answer questions about the repository using embedded context
- Interactive chat interface

## Prerequisites

- Node.js (v14 or later)
- GitHub Personal Access Token

## Installation

1. **Clone the repository:**
   ```sh
   git clone <your-repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory with the following content:
   ```plaintext
   GITHUB_ACCESS_TOKEN=your_github_access_token_here
   ```

## Running the Example

1. **Start the server:**
   ```sh
   node server.js
   ```

2. **Open the frontend:**
   Navigate to `http://localhost:3000` in your web browser.

3. **Process a GitHub repository:**
   - Enter a GitHub repository URL in the input field and click "Process Repository".
   - Wait for the repository to be processed and saved.

4. **Ask questions:**
   - Once the repository is processed, enter a question in the input field and click "Ask".
   - The answer will be displayed in the chat window.

## Project Creation

This project was mostly created by [ChatGPT](https://chat.openai.com/), an AI language model developed by OpenAI.
Chat instructions that was used: https://chatgpt.com/share/1e87af70-8ba6-4f78-bf18-f17b939a6725

## Project Structure

```
<repository-directory>
├── node_modules/
├── public/
│   └── index.html
├── .env
├── package.json
├── server.js
└── README.md
```

## Frontend

The frontend is a simple HTML page with JavaScript for handling user interactions. It includes an input field for the GitHub URL, an input field for questions, and a chat window for displaying messages.

## Backend

The backend is built with Node.js and Express.js. It handles loading and processing GitHub repositories, embedding documents, and answering questions using LangChain.

## License

This project is licensed under the MIT License.
