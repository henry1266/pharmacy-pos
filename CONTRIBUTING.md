# Contributing 指南

本專案採用單一事實來源（SSOT）維護客戶與銷售模組結構，提交任何變更前請先閱讀下列規範。

## 1. 編碼與換行

- **一律使用 UTF-8（無 BOM）** 儲存 Markdown、程式碼與設定檔，避免中文出現亂碼。
- 建議在編輯器中將預設編碼設定為 UTF-8，並關閉自動加上 BOM 的選項。
- Windows 環境若需檢視中文字元，請使用 `Get-Content -Encoding UTF8` 或先執行：

  ```powershell
  chcp 65001
  $OutputEncoding = [Console]::OutputEncoding = [Text.Encoding]::UTF8
  ```

- Git 設定建議：

  ```bash
  git config core.autocrlf false
  git config core.eol lf
  ```

  保持 LF 換行可減少跨平台差異。

## 2. Markdown 文件

- 中文文件（例如 `backend/modules/customers/README.md`）須以 UTF-8 儲存並確認在主要編輯器中顯示正常。
- 提交前建議執行 `pnpm run build` 或對應模組的建置指令，確保沒有因編碼造成的錯誤。
- 若新增說明文件，請在開頭註明適用範圍（後端、前端、shared 等），並確認中文未出現亂碼。

## 3. Shared / OpenAPI 同步流程

1. 更新 `shared/schemas/zod` 內的 Zod schema。
2. 執行 `pnpm --filter shared build`。
3. 執行 `pnpm --filter shared generate:openapi` 重新產生 `openapi/openapi.json`。
4. 相關模組需同步更新 README 或說明檔，並確認中文顯示正常。

## 4. 程式碼與測試

- 依模組執行必要的 build/test 指令：
  - 後端：`pnpm --filter @pharmacy-pos/backend run build`
  - 前端：視需求執行 `pnpm --filter @pharmacy-pos/frontend run build`
- 提交 PR 前請附上測試結果與主要變更說明。
- 若修改 README 或文件，建議附上截圖或說明以證明中文未發生亂碼。

## 5. PR Checklist

- [ ] 已確認所有檔案為 UTF-8（無 BOM）。
- [ ] 相關 build/test 指令皆通過。
- [ ] 涉及 Schema 的變更已重新產生 OpenAPI 並檢視。
- [ ] README、CONTRIBUTING 等中文內容在主要編輯器與終端機顯示正常。

若發現任何編碼或文件顯示問題，請在 PR 中標註並附上重現步驟，以便維護者協助處理。
