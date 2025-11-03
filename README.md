# FastAPI Agent Chat with Immediate Stop Functionality

A **refactored and simplified** multi-container FastAPI application featuring an AI agent with immediate stop capability using Redis as a signal bus. Built with Strands Agents SDK and modern Python best practices.

## 🎉 Recent Updates

### v0.3.0 - Configuration & AWS Bedrock (Latest)
- ✅ **Pydantic Settings** - Centralized configuration with type validation
- ✅ **AWS Bedrock Integration** - Using Amazon Nova Lite model
- ✅ **Ruff & Mypy** - Code quality tools configured
- ✅ **.env Configuration** - Environment-based settings
- ✅ **AWS Credentials Mounting** - Automatic AWS access in Docker

### v0.2.0 - Major Refactoring
- ✅ **Replace structlog with loguru** - Much simpler and cleaner logging
- ✅ **Better use of Strands SDK** - Leverage built-in features instead of reinventing wheels
- ✅ **FastAPI dependency injection** - Cleaner code with proper DI patterns
- ✅ **Removed unnecessary abstractions** - Simpler, more maintainable codebase
- ✅ **Modern Python patterns** - Type hints, Pydantic v2, async/await best practices

## 🏗️ Architecture

```
                    ┌─────────────┐
                    │   Client    │
                    │ (Browser)   │
                    └──────┬──────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │   Load Balancer (Nginx)      │
            │      Port: 80                │
            └─────────────┬────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ FastAPI     │  │ FastAPI     │  │ FastAPI     │
│ Backend 1   │  │ Backend 2   │  │ Backend 3   │
│ Port: 8000  │  │ Port: 8000  │  │ Port: 8000  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                         ▼
               ┌─────────────────┐
               │   Redis         │
               │  (Signal Bus)   │
               │  Port: 6379     │
               └─────────────────┘
```

## 🎯 Stop Strategy

The stop functionality works through a Redis-based signal bus:

1. **Stop Request**: Client sends `POST /api/v1/stop/{chat_id}`
2. **Signal Storage**: Backend writes `stop:{chat_id} = timestamp` to Redis
3. **Polling**: Agent polls Redis every 100ms for stop signals
4. **Immediate Halt**: When signal found, agent calls `agent.tool.stop()` and exits
5. **Cleanup**: Stop signal is removed from Redis after detection

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- make (for WSL: `sudo apt install make`)
- uv (optional, for local development)
- AWS credentials configured (for Bedrock model)

### 1. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your settings (use default values for quick start)
nano .env

# Configure AWS credentials (required for Bedrock)
aws configure
# Or manually create ~/.aws/credentials and ~/.aws/config
```

### 2. Install Dependencies (Local Development)

```bash
# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Sync dependencies (includes dev tools: ruff, mypy)
uv sync --extra dev
```

### 3. Start the Application

```bash
# Using Docker Compose (recommended)
make start

# Or run in background
make up

# Or run locally (requires Redis)
docker run -d -p 6379:6379 redis:7-alpine
uv run python -m app.main
```

### 4. Access the Application

- **Web Interface**: http://localhost
- **API Base URL**: http://localhost/api/v1
- **Health Check**: http://localhost/health

### 5. Test the Stop Functionality

1. Open http://localhost in your browser
2. Enter a Chat ID (e.g., `test-chat-001`)
3. Send a message like "Tell me a long story..."
4. While the agent is responding, click **Stop Agent**
5. The agent should stop within ~100ms

### 6. Verify Multi-Container Setup

```bash
# Check running containers
docker-compose ps

# View logs from all backends
docker-compose logs backend1 backend2 backend3

# Monitor Redis
docker-compose logs redis
```

## 📚 API Documentation

### Chat Endpoints

#### Start Chat (SSE)
```http
POST /api/v1/chat/{chat_id}
Content-Type: application/json

{
    "message": "Your message here"
}
```

**Response**: Server-Sent Events stream
- `data: [text chunk]` - Agent response
- `data: [STOPPED]` - Agent stopped by user
- `data: [DONE]` - Response complete
- `data: [ERROR]` - Error occurred

#### Get Chat Status
```http
GET /api/v1/chat/{chat_id}
```

#### List All Chats
```http
GET /api/v1/chats
```

#### Delete Chat
```http
DELETE /api/v1/chat/{chat_id}
```

### Stop Endpoints

#### Stop Single Chat
```http
POST /api/v1/stop/{chat_id}
```

**Response**:
```json
{
    "chat_id": "test-chat-001",
    "status": "accepted",
    "message": "Stop signal sent for chat test-chat-001. Agent will halt shortly."
}
```

#### Stop Multiple Chats
```http
POST /api/v1/stop/bulk
Content-Type: application/json

{
    "chat_ids": ["chat1", "chat2", "chat3"]
}
```

### Health Check
```http
GET /health
```

**Response**:
```json
{
    "status": "healthy",
    "redis": "connected"
}
```

## 🛠️ Local Development

### Project Structure

```
strands-test/
├── app/
│   ├── agent/
│   │   └── agent_core.py      # Agent with Bedrock model integration
│   ├── api/
│   │   ├── chat.py            # Chat endpoints with SSE streaming
│   │   └── stop.py            # Stop signal endpoints
│   ├── services/
│   │   └── redis_client.py    # Redis client for stop signals
│   ├── config.py              # Centralized Pydantic Settings ⭐
│   └── main.py                # FastAPI app with loguru
├── static/                    # Frontend HTML/JS
├── logs/                      # Application logs (production)
├── .env                       # Environment variables ⭐
├── .env.example               # Environment template
├── pyproject.toml             # Dependencies + Ruff/Mypy config ⭐
└── docker-compose.yml         # Multi-container with AWS mount ⭐
```

### Key Improvements

1. **Centralized Configuration**: Type-safe settings with Pydantic
   ```python
   from app.config import settings
   
   # All settings validated and typed
   print(f"Server: {settings.host}:{settings.port}")
   print(f"Model: {settings.bedrock_model_id}")
   print(f"Redis: {settings.redis_url}")
   ```

2. **AWS Bedrock Integration**: Using Amazon Nova Lite model
   ```python
   from strands.models import BedrockModel
   
   model = BedrockModel(
       model_id=settings.bedrock_model_id,  # amazon.nova-lite-v1:0
       region_name=settings.aws_region,
       temperature=settings.bedrock_temperature,
   )
   agent = Agent(model=model)
   ```

3. **Code Quality Tools**: Ruff and Mypy configured
   ```bash
   # Format code
   uv run ruff format app/
   
   # Check and fix issues
   uv run ruff check app/ --fix
   
   # Type check
   uv run mypy app/
   ```

4. **Environment-Based Config**: Single .env file
   ```bash
   # .env
   BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
   AWS_REGION=us-west-2
   REDIS_HOST=redis
   LOG_LEVEL=INFO
   ```

### Run Locally

```bash
# 1. Configure environment
cp .env.example .env

# 2. Set up AWS credentials
aws configure

# 3. Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# 4. Run the app
uv run python -m app.main

# Or with uvicorn for auto-reload
uv run uvicorn app.main:app --reload --port 8000
```

### Environment Configuration

All configuration is in `.env` file. See [CONFIGURATION.md](CONFIGURATION.md) for details.

**Quick reference:**
```bash
# Server
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS Bedrock
AWS_REGION=us-west-2
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
BEDROCK_TEMPERATURE=0.3

# Logging
LOG_LEVEL=INFO
```

### Available Bedrock Models

| Model ID | Description | Best For |
|----------|-------------|----------|
| `amazon.nova-lite-v1:0` | Fast & cost-effective (default) | General chat |
| `amazon.nova-micro-v1:0` | Ultra-fast | Quick responses |
| `amazon.nova-pro-v1:0` | High capability | Complex tasks |
| `anthropic.claude-sonnet-4-20250514-v1:0` | Claude Sonnet 4 | Advanced reasoning |

Change model by updating `.env`:
```bash
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0
```

## 📦 Docker Configuration

### Docker Compose Services

1. **nginx** - Load balancer (port 80)
   - Round-robin load balancing
   - No sticky sessions
   - SSE streaming support

2. **backend1, backend2, backend3** - FastAPI apps
   - Loads config from `.env` file ⭐
   - AWS credentials mounted from `~/.aws/` ⭐
   - Session directory persistence
   - Health checks enabled
   - Connected to Redis

3. **redis** - Signal bus
   - Port 6379 exposed
   - Persistence enabled
   - Memory limited to 256MB

### Key Changes in docker-compose.yml

**Using .env file** (instead of inline environment variables):
```yaml
backend1:
  env_file:
    - .env  # All variables from .env
  volumes:
    - ~/.aws:/root/.aws:ro  # AWS credentials (read-only)
    - ./data/sessions:/app/data/sessions  # Session persistence
```

**Benefits:**
- ✅ Single source of truth for configuration
- ✅ Automatic AWS Bedrock access
- ✅ Easier environment management
- ✅ Session data persists across restarts

## 🔧 Configuration

### Polling Interval

Modify `app/agent/stop_handler.py`:
```python
self._polling_interval = 0.1  # 100ms (default)
```

Lower values = more responsive stop but higher Redis load

### Redis Configuration

Modify `docker-compose.yml`:
```yaml
redis:
  command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### Nginx Load Balancing

Modify `nginx.conf`:
```nginx
upstream fastapi_backend {
    # Strategy: round_robin, least_conn, ip_hash
    least_conn;
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}
```

## 📊 Monitoring

### View Logs

```bash
# All services
make logs

# Specific service
make logs-backend
make logs-nginx
make logs-redis
```

### Check Health

```bash
# Check container status and health
make status

# Detailed health check
make health

# Check health of all backends
curl http://localhost/health
curl http://localhost/api/v1/health
```

### Monitor Redis

```bash
# Connect to Redis CLI
make redis

# View keys
KEYS *

# Monitor stop signals in real-time
make redis-monitor
```

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check logs
docker-compose logs backend1

# Rebuild without cache
docker-compose build --no-cache backend1
```

### Redis Connection Issues
```bash
# Check Redis is running
docker-compose exec redis redis-cli ping

# Check backend can reach Redis
docker-compose exec backend1 sh -c "apk add curl && curl -f http://redis:6379/ping || echo 'Connection failed'"
```

### SSE Not Working
1. Check Nginx config has `proxy_buffering off;`
2. Verify `Connection: keep-alive` headers
3. Check for proxies buffering responses

## 🎓 How It Works

### Stop Signal Flow

1. **Client Request** → Nginx (load balancer) → FastAPI Backend
2. Backend creates `AgentOrchestrator` with Strands Agent
3. Agent streams response via SSE, checking Redis for stop signals
4. Client can call `POST /api/v1/stop/{chat_id}` anytime
5. Stop endpoint writes `stop:{chat_id}` to Redis with 1-hour TTL
6. Agent's next iteration detects signal via `RedisClient.check_stop_signal()`
7. Agent yields `[STOPPED]` and terminates gracefully
8. Stop signal is consumed (deleted) from Redis using `GETDEL`

### Simplified Architecture

**Before Refactoring:**
- Custom stop signal polling with complex abstractions
- structlog with verbose configuration
- Manual session management with custom ChatSession class
- Redundant Redis operations

**After Refactoring:**
- Leverages Strands SDK's built-in `stop` tool
- Simple loguru configuration with colored output
- Uses Strands' `FileSessionManager` directly
- Atomic Redis operations (`GETDEL` for check-and-consume)
- FastAPI dependency injection for common checks
- ~40% less code, significantly more maintainable
7. Stop signal cleaned from Redis

## 🚀 Quick Commands Reference

```bash
make start       # Build and start all services
make stop        # Stop all services
make restart     # Restart all services
make logs        # View logs from all services
make logs-backend # View backend logs only
make status      # Show container status and health
make health      # Detailed health check
make test        # Run automated tests
make shell       # Open shell in backend1
make redis       # Open Redis CLI
make clean       # Stop services and remove volumes
make help        # Show all available commands
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please ensure:
- Code follows Python best practices (type hints, async/await)
- Use loguru for logging: `logger.info(f"field=<{value}> | message")`
- Leverage Strands SDK features instead of custom implementations
- Use FastAPI dependency injection for shared logic
- Tests added for new features
- Documentation updated
- Docker configurations tested

## 📚 Technology Stack

- **FastAPI** - Modern async web framework
- **Strands Agents SDK** - AI agent framework with built-in tools
- **AWS Bedrock** - Amazon Nova Lite model for AI inference ⭐
- **Redis** - Signal bus for distributed stop coordination
- **Loguru** - Simple and powerful logging
- **Pydantic Settings** - Type-safe configuration management ⭐
- **Ruff** - Fast Python linter and formatter ⭐
- **Mypy** - Static type checking ⭐
- **uv** - Fast Python package manager
- **Docker & Nginx** - Multi-container deployment with load balancing

## 🔍 What Was Refactored

### Latest (v0.3.0) - Configuration & AWS

#### 1. Configuration System (os.getenv → Pydantic Settings)
- **Before**: Scattered `os.getenv()` calls throughout code
- **After**: Centralized `app/config.py` with type validation
- **Benefit**: Type safety, auto-completion, single source of truth

#### 2. AWS Bedrock Integration
- **Before**: No AI model specified
- **After**: Amazon Nova Lite model with configurable settings
- **Benefit**: Production-ready AI inference with AWS

#### 3. Docker Configuration (.env file)
- **Before**: Inline environment variables in docker-compose.yml
- **After**: Single `.env` file with automatic AWS mounting
- **Benefit**: Easier config management, AWS credentials work seamlessly

#### 4. Code Quality Tools
- **Added**: Ruff (linter/formatter) + Mypy (type checker)
- **Configured**: In pyproject.toml with sensible defaults
- **Benefit**: Consistent code style, catch bugs early

### Previous (v0.2.0) - Simplification

#### 1. Logging (structlog → loguru)
- **Before**: 20+ lines of structlog configuration
- **After**: Simple, colorful loguru with 5 lines
- **Benefit**: Easier debugging, cleaner logs

#### 2. Redis Client
- **Before**: Generic key-value operations with JSON serialization
- **After**: Purpose-built for stop signals only
- **Benefit**: Simpler API, atomic operations with `GETDEL`

#### 3. Agent Orchestrator
- **Before**: Custom ChatSession class, manual session handling
- **After**: Direct use of Strands SDK's FileSessionManager
- **Benefit**: Leverages tested SDK features

#### 4. API Endpoints
- **Before**: Repeated Redis ping checks in every endpoint
- **After**: Single `verify_redis()` dependency
- **Benefit**: DRY principle, cleaner code

#### 5. Dependencies
- **Removed**: structlog, python-dateutil, asyncio-redis
- **Added**: loguru, pydantic-settings, boto3, ruff, mypy
- **Benefit**: Better tools, type safety, code quality
