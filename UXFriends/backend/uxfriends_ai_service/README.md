# UXFriends AI Coach Service

Local FastAPI service for the frontend AI coach chat.

## Run

```bash
cd /Users/hendawiy/Documents/project/UXFriends/backend/uxfriends_ai_service
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
./run-local.sh
```

The frontend already points to `http://localhost:8001` by default through `VITE_AI_COACH_URL`.

## Default local model mode

The service now defaults to a local OpenAI-compatible model endpoint so it does not need an external API key during development. The recommended local path is Ollama.

```bash
export AI_PROVIDER="local"
export LOCAL_AI_BASE_URL="http://127.0.0.1:11434/v1"
export LOCAL_AI_MODEL="deepseek-r1:1.5b"
export LOCAL_AI_FALLBACK_MODELS="qwen2.5:3b-instruct,llama3.2:3b"
export LOCAL_AI_API_KEY="ollama"
export AI_REQUEST_TIMEOUT_SECONDS="30"
./run-local.sh
```

Start Ollama and pull the lighter local model first:

```bash
ollama pull deepseek-r1:1.5b
ollama serve
```

If you want an even safer fallback, you can also pull:

```bash
ollama pull qwen2.5:3b-instruct
ollama pull llama3.2:3b
```

The service short-circuits simple greetings and tries fallback local models before it gives up, so it no longer depends on `deepseek-r1:8b`.

If the local endpoint is unavailable, the service still runs and falls back to the built-in heuristic coach. You can confirm the current mode from:

```bash
curl http://127.0.0.1:8001/health
```

## Heuristic-only mode

If you want to run the rule-based coach only:

```bash
export AI_PROVIDER="heuristic"
./run-heuristic.sh
```

## Optional future DeepSeek mode

If you later want to switch from the local model to DeepSeek, use:

```bash
export AI_PROVIDER="deepseek"
export DEEPSEEK_API_KEY="your_deepseek_api_key"
export DEEPSEEK_MODEL="deepseek-chat"
export DEEPSEEK_BASE_URL="https://api.deepseek.com"
export AI_REASONING_EFFORT="medium"
```

The service uses the same chat path for both providers, so the frontend does not need to change when you switch from local to DeepSeek.
