# 商品更新測試腳本
# 用於驗證商品保存功能是否正常

Write-Host "=== 商品更新功能測試 ===" -ForegroundColor Green

# 檢查後端服務是否運行
Write-Host "檢查後端服務狀態..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://192.168.68.90:3000/api/products" -Method GET -TimeoutSec 5
    Write-Host "✓ 後端服務正常運行" -ForegroundColor Green
} catch {
    Write-Host "✗ 後端服務無法連接: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 測試資料
$testProductData = @{
    name = "測試商品更新"
    unit = "個"
    code = "TEST001"
    shortCode = "T001"
    purchasePrice = 50.0
    sellingPrice = 80.0
    description = "這是一個測試商品"
    minStock = 10
    productType = "product"
    barcode = "1234567890"
    category = ""
    supplier = ""
} | ConvertTo-Json -Depth 3

Write-Host "測試資料:" -ForegroundColor Yellow
Write-Host $testProductData

# 模擬 PUT 請求測試
Write-Host "`n測試商品更新 API..." -ForegroundColor Yellow
try {
    # 這裡需要一個實際存在的商品 ID
    $productId = "6847b8e41489ad43d1ff98a4"  # 從錯誤訊息中的 ID
    
    $headers = @{
        "Content-Type" = "application/json"
        # 如果需要認證，請添加 Authorization header
        # "Authorization" = "Bearer YOUR_TOKEN_HERE"
    }
    
    $response = Invoke-RestMethod -Uri "http://192.168.68.90:3000/api/products/$productId" -Method PUT -Body $testProductData -Headers $headers -TimeoutSec 10
    
    Write-Host "✓ 商品更新成功!" -ForegroundColor Green
    Write-Host "回應資料:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 3 | Write-Host
    
} catch {
    Write-Host "✗ 商品更新失敗:" -ForegroundColor Red
    Write-Host "錯誤詳情: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "HTTP 狀態碼: $statusCode" -ForegroundColor Red
        
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "錯誤回應內容: $errorBody" -ForegroundColor Red
        } catch {
            Write-Host "無法讀取錯誤回應內容" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== 測試完成 ===" -ForegroundColor Green