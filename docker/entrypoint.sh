#!/bin/sh
#
# A subida do container.
#
# Com `DATABASE_URL`, aplica as migrações pendentes antes de abrir a porta —
# banco atrasado em relação ao código é a primeira consulta falhando com um
# erro obscuro. Sem `DATABASE_URL`, sobe só o editor: conta, turma e lista
# nem aparecem, e o resto do produto funciona inteiro.

set -eu

cd /app/apps/web

if [ -z "${DATABASE_URL:-}" ]; then
  echo "rotamer: DATABASE_URL não está definida — subindo sem banco. O editor funciona; conta, turma e lista ficam desligadas."
else
  attempt=1
  # O Postgres do docker-compose já responde ao healthcheck quando este
  # script roda, mas um banco em outra máquina pode demorar a aceitar conexão.
  until node_modules/prisma/build/index.js migrate deploy; do
    if [ "${attempt}" -ge 10 ]; then
      echo "rotamer: o banco não respondeu depois de ${attempt} tentativas. Confira DATABASE_URL." >&2
      exit 1
    fi
    attempt=$((attempt + 1))
    echo "rotamer: banco ainda não respondeu, tentando de novo em 3 s (${attempt}/10)…"
    sleep 3
  done
fi

exec node server.js
