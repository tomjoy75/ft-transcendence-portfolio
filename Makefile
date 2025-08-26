all: up

up:
	docker compose up --build

down:
	docker compose down

clear:
	docker compose down -v

restart: down up

reset: clear up

.PHONY: all up down clear restart reset
