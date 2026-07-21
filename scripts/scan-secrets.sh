#!/usr/bin/env bash
# ADR-001 成功指標：前端 build 產物不得含 AI API key。
# 掃描 dist/，命中即以非 0 退出（供 CI / pre-ship 使用）。
set -euo pipefail

TARGET="${1:-dist}"

if [ ! -d "$TARGET" ]; then
  echo "scan-secrets: 目錄 '$TARGET' 不存在（尚未 build？）跳過。"
  exit 0
fi

# 常見金鑰樣式：sk-...、api_key/apikey= 後接長字串
PATTERN='(sk-[A-Za-z0-9]{20,}|api[_-]?key["'\'' :=]+[A-Za-z0-9_\-]{16,})'

if grep -rIEn "$PATTERN" "$TARGET" >/dev/null 2>&1; then
  echo "❌ scan-secrets: 在 $TARGET 發現疑似 API key："
  grep -rIEn "$PATTERN" "$TARGET" || true
  exit 1
fi

echo "✅ scan-secrets: $TARGET 未發現明文 API key。"
