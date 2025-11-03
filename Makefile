# FastAPI Agent Chat - Makefile
# Compatible with WSL/Linux environments

.PHONY: help start stop restart build clean logs status test health shell redis
.DEFAULT_GOAL := help

# Variables
COMPOSE_FILE := docker-compose.yml
API_BASE := http://localhost

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)FastAPI Agent Chat - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

start: ## Build and start all services
	@echo "$(BLUE)🚀 Starting FastAPI Agent Chat...$(NC)"
	@docker compose -f $(COMPOSE_FILE) up -d --build
	@echo ""
	@echo "$(GREEN)✅ Started! Access the app at http://localhost$(NC)"
	@echo "$(YELLOW)Run 'make status' to check health$(NC)"

stop: ## Stop all services
	@echo "$(BLUE)🛑 Stopping FastAPI Agent Chat...$(NC)"
	@docker compose -f $(COMPOSE_FILE) down
	@echo "$(GREEN)✅ Stopped!$(NC)"

restart: ## Restart all services
	@echo "$(BLUE)🔄 Restarting FastAPI Agent Chat...$(NC)"
	@docker compose -f $(COMPOSE_FILE) down
	@docker compose -f $(COMPOSE_FILE) up -d --build
	@echo "$(GREEN)✅ Restarted!$(NC)"

build: ## Build Docker images
	@echo "$(BLUE)🔨 Building Docker images...$(NC)"
	@docker compose -f $(COMPOSE_FILE) build
	@echo "$(GREEN)✅ Built!$(NC)"

clean: ## Stop services and remove volumes
	@echo "$(BLUE)🧹 Cleaning up containers and volumes...$(NC)"
	@docker compose -f $(COMPOSE_FILE) down -v
	@docker system prune -f
	@echo "$(GREEN)✅ Cleaned!$(NC)"

logs: ## View logs from all services (follow mode)
	@echo "$(BLUE)📜 Viewing logs... (Ctrl+C to exit)$(NC)"
	@docker compose -f $(COMPOSE_FILE) logs -f

logs-backend: ## View logs from backend containers only
	@echo "$(BLUE)📜 Viewing backend logs... (Ctrl+C to exit)$(NC)"
	@docker compose -f $(COMPOSE_FILE) logs -f backend1 backend2 backend3

logs-nginx: ## View Nginx logs
	@echo "$(BLUE)📜 Viewing Nginx logs... (Ctrl+C to exit)$(NC)"
	@docker compose -f $(COMPOSE_FILE) logs -f nginx

logs-redis: ## View Redis logs
	@echo "$(BLUE)📜 Viewing Redis logs... (Ctrl+C to exit)$(NC)"
	@docker compose -f $(COMPOSE_FILE) logs -f redis

status: ## Show container status and health
	@echo "$(BLUE)📊 Container Status:$(NC)"
	@docker compose -f $(COMPOSE_FILE) ps
	@echo ""
	@echo "$(BLUE)Health Check:$(NC)"
	@curl -s $(API_BASE)/health 2>/dev/null | python3 -m json.tool 2>/dev/null || \
		curl -s $(API_BASE)/health || \
		echo "$(RED)⚠️  Service not responding$(NC)"

ps: ## Show running containers
	@docker compose -f $(COMPOSE_FILE) ps

test: ## Run automated tests
	@echo "$(BLUE)🧪 Running automated tests...$(NC)"
	@echo ""
	@$(MAKE) health-test || exit 1
	@echo ""
	@$(MAKE) chat-test || exit 1
	@echo ""
	@$(MAKE) stop-test || exit 1
	@echo ""
	@$(MAKE) list-test || exit 1
	@echo ""
	@echo "$(GREEN)==========================================$(NC)"
	@echo "$(GREEN)✅ All tests passed!$(NC)"
	@echo "$(GREEN)==========================================$(NC)"

health-test: ## Test 1: Health check
	@echo "$(YELLOW)Test 1: Health Check$(NC)"
	@echo "-------------------"
	@curl -s $(API_BASE)/health | grep -q "healthy" && \
		echo "$(GREEN)✅ Health check passed$(NC)" || \
		(echo "$(RED)❌ Health check failed$(NC)" && exit 1)

chat-test: ## Test 2: Start chat session
	@echo ""
	@$(YELLOW)Test 2: Starting Chat Session$(NC)"
	@echo "-----------------------------"
	@CHAT_ID="test-$$(date +%s)" && \
		echo "Chat ID: $$CHAT_ID" && \
		curl -s -X POST $(API_BASE)/api/v1/chat/$$CHAT_ID \
			-H "Content-Type: application/json" \
			-d '{"message": "Hello! Please tell me a very long story about a magical kingdom."}' \
			> /dev/null 2>&1 && \
		echo "$(GREEN)✅ Chat started successfully$(NC)" || \
		(echo "$(RED)❌ Chat start failed$(NC)" && exit 1)

stop-test: ## Test 3: Stop chat
	@echo ""
	@$(YELLOW)Test 3: Stopping Agent$(NC)"
	@echo "----------------------"
	@sleep 2
	@CHAT_ID="test-$$(date +%s)" && \
		curl -s -X POST $(API_BASE)/api/v1/chat/$$CHAT_ID \
			-H "Content-Type: application/json" \
			-d '{"message": "Test message"}' \
			> /dev/null 2>&1 && \
		sleep 1 && \
		stop_response=$$(curl -s -X POST $(API_BASE)/api/v1/stop/$$CHAT_ID) && \
		echo "$$stop_response" | grep -q "accepted" && \
		echo "$(GREEN)✅ Stop signal sent$(NC)" || \
		(echo "$(RED)❌ Stop failed$(NC)" && exit 1)

list-test: ## Test 4: List chats
	@echo ""
	@$(YELLOW)Test 4: Listing Chats$(NC)"
	@echo "---------------------"
	@chats=$$(curl -s $(API_BASE)/api/v1/chats) && \
		chat_count=$$(echo "$$chats" | grep -o '"chat_id"' | wc -l) && \
		echo "$(GREEN)✅ Found $$chat_count chat(s)$(NC)" || \
		(echo "$(RED)❌ List failed$(NC)" && exit 1)

health: ## Check health of all services
	@echo "$(BLUE)🏥 Health Check Report$(NC)"
	@echo "======================="
	@echo ""
	@echo "$(YELLOW)Containers:$(NC)"
	@docker compose -f $(COMPOSE_FILE) ps | grep -E "Up|healthy|unhealthy" || echo "No containers running"
	@echo ""
	@echo "$(YELLOW)API Health:$(NC)"
	@curl -s $(API_BASE)/health 2>/dev/null | python3 -m json.tool 2>/dev/null || \
		(echo "$(RED)⚠️  API not responding$(NC)" && exit 1)
	@echo ""
	@echo "$(YELLOW)Redis:$(NC)"
	@docker compose -f $(COMPOSE_FILE) exec -T redis redis-cli ping 2>/dev/null | grep -q PONG && \
		echo "$(GREEN)✅ Redis is healthy$(NC)" || \
		echo "$(RED)❌ Redis not responding$(NC)"

shell: ## Open shell in backend1 container
	@echo "$(BLUE)🔍 Opening shell in backend1...$(NC)"
	@docker compose -f $(COMPOSE_FILE) exec backend1 sh

shell-backend2: ## Open shell in backend2 container
	@echo "$(BLUE)🔍 Opening shell in backend2...$(NC)"
	@docker compose -f $(COMPOSE_FILE) exec backend2 sh

shell-backend3: ## Open shell in backend3 container
	@echo "$(BLUE)🔍 Opening shell in backend3...$(NC)"
	@docker compose -f $(COMPOSE_FILE) exec backend3 sh

shell-nginx: ## Open shell in nginx container
	@echo "$(BLUE)🔍 Opening shell in nginx...$(NC)"
	@docker compose -f $(COMPOSE_FILE) exec nginx sh

redis: ## Open Redis CLI
	@echo "$(BLUE)🔴 Opening Redis CLI... (Ctrl+D to exit)$(NC)"
	@docker compose -f $(COMPOSE_FILE) exec redis redis-cli

redis-monitor: ## Monitor Redis in real-time
	@echo "$(BLUE)📊 Monitoring Redis... (Ctrl+C to exit)$(NC)"
	@docker compose -f $(COMPOSE_FILE) exec redis redis-cli monitor

stats: ## Show Docker stats
	@docker stats $$(docker compose -f $(COMPOSE_FILE) ps -q)

up: ## Start services in background (alias for start)
	@$(MAKE) start

down: ## Stop services (alias for stop)
	@$(MAKE) stop

# Development commands
dev: ## Start in development mode (requires local Redis)
	@echo "$(BLUE)🛠️  Starting in development mode...$(NC)"
	@if ! command -v uv &> /dev/null; then \
		echo "$(RED)❌ uv not found. Install from https://astral.sh/uv/$(NC)"; \
		exit 1; \
	fi
	@if ! docker ps | grep -q redis; then \
		echo "$(YELLOW)Starting Redis...$(NC)"; \
		docker run -d -p 6379:6379 --name dev-redis redis:7-alpine; \
	fi
	@export REDIS_HOST=localhost && \
		export REDIS_PORT=6379 && \
		echo "$(GREEN)Starting FastAPI with auto-reload...$(NC)" && \
		uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-stop: ## Stop development Redis
	@echo "$(BLUE)Stopping development Redis...$(NC)"
	@docker stop dev-redis 2>/dev/null && docker rm dev-redis 2>/dev/null || true
	@echo "$(GREEN)✅ Done$(NC)"

# Utility commands
verify: ## Verify project structure
	@echo "$(BLUE)🔍 Verifying project structure...$(NC)"
	@echo ""
	@echo "$(YELLOW)Required files:$(NC)"
	@test -f $(COMPOSE_FILE) && echo "✅ docker compose.yml" || echo "❌ docker compose.yml missing"
	@test -f Dockerfile && echo "✅ Dockerfile" || echo "❌ Dockerfile missing"
	@test -f pyproject.toml && echo "✅ pyproject.toml" || echo "❌ pyproject.toml missing"
	@test -f nginx.conf && echo "✅ nginx.conf" || echo "❌ nginx.conf missing"
	@test -f app/main.py && echo "✅ app/main.py" || echo "❌ app/main.py missing"
	@test -d static && echo "✅ static/" || echo "❌ static/ missing"
	@echo ""

show-env: ## Show environment variables
	@echo "$(BLUE)Environment Configuration:$(NC)"
	@echo "REDIS_HOST=$${REDIS_HOST:-redis}"
	@echo "REDIS_PORT=$${REDIS_PORT:-6379}"
	@echo "REDIS_DB=$${REDIS_DB:-0}"
	@echo "HOST=$${HOST:-0.0.0.0}"
	@echo "PORT=$${PORT:-8000}"

# Docker management
docker-clean: ## Clean all Docker resources
	@echo "$(BLUE)🧹 Cleaning all Docker resources...$(NC)"
	@docker compose -f $(COMPOSE_FILE) down -v --remove-orphans 2>/dev/null || true
	@docker system prune -af --volumes
	@echo "$(GREEN)✅ Done$(NC)"

docker-info: ## Show Docker system info
	@echo "$(BLUE)🐳 Docker System Information$(NC)"
	@echo "========================="
	@docker version --format "Client: {{.Client.Version}}" 2>/dev/null || echo "Client: N/A"
	@docker version --format "Server: {{.Server.Version}}" 2>/dev/null || echo "Server: N/A"
	@echo ""
	@docker system df

# Quick demo
demo: stop start health
	@echo ""
	@echo "$(GREEN)========================================$(NC)"
	@echo "$(GREEN)🎉 FastAPI Agent Chat is ready!$(NC)"
	@echo "$(GREEN)========================================$(NC)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Open http://localhost in your browser"
	@echo "  2. Use Chat ID: test-chat-001"
	@echo "  3. Send a message and click 'Stop Agent'"
	@echo ""
	@echo "$(YELLOW)Useful commands:$(NC)"
	@echo "  make logs      - View all logs"
	@echo "  make status    - Check health"
	@echo "  make test      - Run tests"
	@echo "  make shell     - Access backend"
	@echo ""
