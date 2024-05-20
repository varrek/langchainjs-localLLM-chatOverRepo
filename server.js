require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs").promises;
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { GithubRepoLoader } = require("@langchain/community/document_loaders/web/github");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { ChatOllama } = require("@langchain/community/chat_models/ollama");
const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const { FaissStore } = require("@langchain/community/vectorstores/faiss");

const app = express();
const PORT = process.argv[2] || process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("public"));

let chain;

const getRepoName = (url) => {
  const parts = url.split("/");
  return parts[parts.length - 1].replace(".git", "");
};

const processGithubRepo = async (githubUrl) => {
  const repoName = getRepoName(githubUrl);
  const directory = path.join(__dirname, "data", repoName);

  if (await exists(directory)) {
    console.log(`[INFO] Loading existing data for ${repoName}...`);
    return loadChain(directory);
  }

  console.log(`[INFO] Processing new repository ${repoName}...`);

  const githubLoader = new GithubRepoLoader(githubUrl, {
    processSubmodules: true,
    recursive: true,
    branch: "main",
    accessToken: process.env.GITHUB_ACCESS_TOKEN,
  });

  const rawDocuments = await githubLoader.load();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 200,
  });
  const documents = await splitter.splitDocuments(rawDocuments);

  console.log("[INFO] Initializing models and DB...");

  const embeddings = new OllamaEmbeddings({ model: "all-minilm:l6-v2" });
  const model = new ChatOllama({ model: "llama3" });
  const vectorStore = new FaissStore(embeddings, {});

  console.log("[INFO] Embedding documents...");
  await vectorStore.addDocuments(documents);

  await fs.mkdir(directory, { recursive: true });
  await vectorStore.save(directory);

  return createChain(model, vectorStore);
};

const createChain = async (model, vectorStore) => {
  const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
    ["system", `You are an AI assistant specialized in answering questions about GitHub code repositories. Use the provided documents to help answer the user's questions. Here are some specific instructions to follow:
    1. Focus on providing clear, concise, and accurate information.
    2. If the question is about a specific file or function, try to locate and describe it.
    3. Explain the purpose and functionality of the code if asked.
    4. Provide examples or code snippets if they help clarify your explanation.
    5. If a question involves multiple parts, answer each part individually and clearly.
    6. If you don't know the answer from the provided context, be honest about it.
    7. Refer to code comments, documentation, and README files to provide better answers.
    8. Provide context from the nearest code if a specific snippet is requested.
    9. If the question is about installation or usage, refer to relevant sections in the documentation or README.
    10. When referencing code, include file paths and line numbers if available.`],
    ["system", "Context: {context}"],
    ["human", "{input}"],
  ]);
  const combineDocsChain = await createStuffDocumentsChain({
    prompt: questionAnsweringPrompt,
    llm: model,
  });

  chain = await createRetrievalChain({
    retriever: vectorStore.asRetriever(),
    combineDocsChain,
  });

  console.log("[INFO] Chain initialized.");
};

const loadChain = async (directory) => {
  const embeddings = new OllamaEmbeddings({ model: "all-minilm:l6-v2" });
  const model = new ChatOllama({ model: "llama3" });
  const loadedVectorStore = await FaissStore.load(directory, embeddings);

  return createChain(model, loadedVectorStore);
};

const exists = async (path) => {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
};

app.post("/process-repo", async (req, res) => {
  const { githubUrl } = req.body;
  console.log(`[INFO] Received request to process repository: ${githubUrl}`);
  await processGithubRepo(githubUrl);
  res.json({ message: "Repository processed and saved." });
});

app.post("/ask", async (req, res) => {
  const { question } = req.body;
  console.log(`[INFO] Received question: ${question}`);
  const stream = await chain.stream({ input: question });

  let answer = "";
  for await (const chunk of stream) {
    answer += chunk.answer ?? "";
  }

  console.log(`[INFO] Answer generated: ${answer}`);
  res.json({ answer });
});

app.listen(PORT, () => {
  console.log(`[INFO] Server is running on port ${PORT}`);
});
