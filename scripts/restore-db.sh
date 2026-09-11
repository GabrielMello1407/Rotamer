#!/usr/bin/env bash
#
# Restauração do banco do Rotamer, a partir de um despejo do `backup-db.sh`.
#
# Serve para duas coisas: a emergência e o **ensaio**. Backup que nunca foi
# restaurado é backup que ninguém sabe se funciona — o ensaio é o que transforma
# arquivo guardado em garantia.
#
#   ./scripts/restore-db.sh /var/backups/rotamer/rotamer-20260825T030000Z.dump
#
# Por padrão restaura num banco de ensaio, não no banco de produção:
#
#   RESTORE_URL   destino          (padrão: o mesmo servidor, banco rotamer_ensaio)
#   DATABASE_URL  banco de origem  (só para descobrir o servidor)
#
# Para restaurar por cima da produção — depois de já ter perdido o banco — é
# preciso dizer isso em voz alta:
#
#   RESTORE_URL="${DATABASE_URL}" RESTORE_CONFIRMO=sim ./scripts/restore-db.sh arquivo.dump

set -euo pipefail

file="${1:-}"
if [ -z "${file}" ] || [ ! -f "${file}" ]; then
  echo "uso: ./scripts/restore-db.sh <arquivo.dump>" >&2
  exit 2
fi

: "${DATABASE_URL:?DATABASE_URL não está definida}"
RESTORE_URL="${RESTORE_URL:-${DATABASE_URL%/*}/rotamer_ensaio}"

if [ "${RESTORE_URL}" = "${DATABASE_URL}" ] && [ "${RESTORE_CONFIRMO:-}" != "sim" ]; then
  echo "recusado: isto apagaria o banco de produção." >&2
  echo "se é isso mesmo, repita com RESTORE_CONFIRMO=sim" >&2
  exit 3
fi

echo "restaurando ${file}"
echo "     em      ${RESTORE_URL}"

# `--clean --if-exists` derruba o que estiver lá antes de recriar; sem isso a
# restauração falha no meio com "já existe" e deixa o banco pela metade.
pg_restore \
  --dbname="${RESTORE_URL}" \
  --clean --if-exists --no-owner --exit-on-error \
  "${file}"

# As três contagens que dizem se o backup vale alguma coisa: contas,
# tentativas e batismos. Zero onde devia haver gente é o sinal de dump vazio.
echo "restaurado. O que veio:"
for table in Profile Attempt MoleculeName; do
  printf '  %-14s %s\n' "${table}" "$(psql "${RESTORE_URL}" -tAc "select count(*) from \"${table}\";")"
done
