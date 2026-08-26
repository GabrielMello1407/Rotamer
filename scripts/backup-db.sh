#!/usr/bin/env bash
#
# Backup do banco do Rotamer.
#
# Roda no VPS, uma vez por dia, pelo cron. Faz três coisas e nada mais: despeja
# o banco em formato próprio do Postgres, verifica que o arquivo é legível, e
# apaga o que passou da retenção.
#
# Dado de aluno perdido não se recupera com desculpa (D-11). Por isso o script
# falha alto: qualquer passo que não der certo aborta com código diferente de
# zero, e o cron manda o erro por e-mail em vez de seguir em silêncio.
#
#   ./scripts/backup-db.sh
#
# Variáveis:
#   DATABASE_URL   conexão do Postgres (a mesma do app)
#   BACKUP_DIR     onde guardar     (padrão: /var/backups/rotamer)
#   BACKUP_KEEP    dias de retenção (padrão: 30)
#   BACKUP_REMOTE  destino do rsync, opcional — backup na mesma máquina que o
#                  banco não é backup, é cópia

set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL não está definida}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/rotamer}"
BACKUP_KEEP="${BACKUP_KEEP:-30}"
BACKUP_REMOTE="${BACKUP_REMOTE:-}"

carimbo="$(date -u +%Y%m%dT%H%M%SZ)"
arquivo="${BACKUP_DIR}/rotamer-${carimbo}.dump"

mkdir -p "${BACKUP_DIR}"

# Formato custom (-Fc): comprimido, e o pg_restore consegue restaurar tabela a
# tabela a partir dele.
pg_dump --dbname="${DATABASE_URL}" --format=custom --no-owner --file="${arquivo}"

# Um arquivo que não abre não é backup. `pg_restore --list` lê o índice do
# despejo sem tocar em banco nenhum.
if ! pg_restore --list "${arquivo}" > /dev/null; then
  echo "backup ilegível, apagando: ${arquivo}" >&2
  rm -f "${arquivo}"
  exit 1
fi

tamanho="$(du -h "${arquivo}" | cut -f1)"
echo "backup ok: ${arquivo} (${tamanho})"

# Fora da máquina, quando houver destino configurado.
if [ -n "${BACKUP_REMOTE}" ]; then
  rsync --archive --quiet "${arquivo}" "${BACKUP_REMOTE}"
  echo "cópia enviada para ${BACKUP_REMOTE}"
fi

# Retenção. `-mtime +N` conta dias completos.
apagados="$(find "${BACKUP_DIR}" -name 'rotamer-*.dump' -type f -mtime "+${BACKUP_KEEP}" -print -delete | wc -l)"
echo "retenção: ${apagados} arquivo(s) além de ${BACKUP_KEEP} dias apagado(s)"
