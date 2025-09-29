# ADR 2025-09-29：發行治理策略

## 背景
- 單一儲存庫包含 frontend、backend、shared、openapi，多方協作需共用版本節奏。
- `shared/` 與 `openapi/` 為 SSOT，契約與型別若不同步，將造成前後端漂移與回滾困難。
- 目前缺乏正式的版本分支策略、變更日誌樣板與 Release Manager 任務卡，難以滿足審計要求。

## 決策
- 採雙軌分支：`main` 作為穩定釋出線，`develop` 作為整合線；破壞性變更或大型功能将在 `release/x.y` 分支中完成硬化。
- 將 `shared`/`openapi` 認定為 SemVer 權威來源；先行決定其版本號，再同步 bump `backend`、`frontend`，最後更新最上層 `pharmacy-pos`。
- 每四個 minor 視為 LTS 版本，提供延伸支援與回歸測試封存。
- 推出標準化文件：集中式 `docs/CHANGELOG.md`、Release Manager 任務卡模板、CI 工件清單，並由 Release Manager 代理維運。

## 後果
- 發行節奏可預測，stakeholder 可提早規劃升級時程。
- 任務卡、changlog 與標籤資訊一致，可被審計與追溯。
- 必須投入額外維護成本（LTS 測試、CI 腳本、自動化 diff）。

## 風險與緩解
- **分支漂移**：`release/x.y` 分支久存會導致重複合併 → 依任務卡要求設定最長凍結期（建議 ≤ 2 週），逾期需人為評估是否重建分支。
- **自動化失敗**：CI 腳本若失效將阻擋釋出 → 每次變更需附 pipeline 成功證據，並在 Release 任務卡列出手動 fallback。
- **LTS 成本**：LTS 回歸測試增加時間 → 由 Release Manager 維護測試矩陣，納入季檢。

## 回滾策略
- 針對每個釋出標籤建立 `releases/vX.Y.Z` 標記；若需回滾，直接從該標籤建立 hotfix 分支並套用 `hotfix/*` 劇本。
- 如自動化腳本引發錯誤，立即切換至手動任務卡流程（手動執行 schema diff、契約測試並紀錄結果）。

## 待辦事項
1. 在 Issue/PR 中建立 Release Manager 任務卡樣板，涵蓋版本決策、SemVer 影響、CI 工件、風險/回滾資訊。
2. 補齊 `docs/CHANGELOG.md` 初版結構，分段記錄 shared/openapi/backend/frontend。
3. 設計 CI 腳本與自動化流程（schema diff、契約測試、coverage 報告、版本 bump）；於完成前先以待辦追蹤。
4. 更新貢獻指南或新增 release playbook，要求推送標籤前必附任務卡摘錄與測試證據。
## 自動化腳本補充
- 建立 `scripts/release/auto-release.ts`，作為 Release Manager 的單一路徑。指令會依序執行型別檢查、測試、契約 diff、版本建議與 coverage/LTS 驗證，並重用於 CI (`Release Tooling` workflow) 與本地流程。
- 如需略過某些步驟，可使用 `--skip-tests`、`--skip-type-check`、`--skip-collect`、`--skip-verify` 等參數；必要時加上 `--collect label=path` 補充產物。
- 相關輸出統一存放於 `artifacts/release/<batch>`，確保審計與回滾時有完整佐證。
