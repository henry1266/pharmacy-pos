# Accounting2 API Endpoint Testing Script
# Test all refactored API endpoints

Write-Host "Starting Accounting2 API Endpoint Testing" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"
$testResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET"
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    Write-Host "   URL: $Url" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method $Method -ContentType "application/json" -ErrorAction Stop
        
        $result = @{
            Name = $Name
            Status = "SUCCESS"
            StatusCode = $response.StatusCode
            Details = "Normal response"
        }
        
        Write-Host "   SUCCESS: Status Code $($response.StatusCode)" -ForegroundColor Green
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $result = @{
            Name = $Name
            Status = if ($statusCode -eq 401) { "AUTH_REQUIRED (Expected)" } else { "ERROR" }
            StatusCode = $statusCode
            Details = if ($statusCode -eq 401) { "Correctly blocked unauthorized request" } else { $_.Exception.Message }
        }
        
        if ($statusCode -eq 401) {
            Write-Host "   AUTH_REQUIRED (Expected): $statusCode" -ForegroundColor Blue
        } else {
            Write-Host "   ERROR: $statusCode" -ForegroundColor Red
        }
    }
    
    $script:testResults += $result
    Write-Host ""
}

# 1. Test Account Management Endpoints
Write-Host "Testing Account Management Endpoints" -ForegroundColor Magenta
Test-Endpoint "Get All Accounts" "$baseUrl/api/accounting2/accounts"
Test-Endpoint "Account Statistics" "$baseUrl/api/accounting2/accounts/stats"
Test-Endpoint "Account Tree Structure" "$baseUrl/api/accounting2/accounts/tree"

# 2. Test Transaction Management Endpoints
Write-Host "Testing Transaction Management Endpoints" -ForegroundColor Magenta
Test-Endpoint "Get All Transactions" "$baseUrl/api/accounting2/transactions"
Test-Endpoint "Transaction Statistics" "$baseUrl/api/accounting2/transactions/stats"
Test-Endpoint "Transaction Groups" "$baseUrl/api/accounting2/transactions/groups"

# 3. Test Funding Tracking Endpoints
Write-Host "Testing Funding Tracking Endpoints" -ForegroundColor Magenta
Test-Endpoint "Funding Sources" "$baseUrl/api/accounting2/funding/sources"
Test-Endpoint "Funding Flow Analysis" "$baseUrl/api/accounting2/funding/flow"
Test-Endpoint "Funding Validation" "$baseUrl/api/accounting2/funding/validate"

# 4. Test Legacy Compatibility Endpoints
Write-Host "Testing Legacy Compatibility Endpoints" -ForegroundColor Magenta
Test-Endpoint "Legacy Accounts Endpoint" "$baseUrl/api/accounts"
Test-Endpoint "Legacy Categories Endpoint" "$baseUrl/api/categories"

# 5. Display Test Results Summary
Write-Host "Test Results Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

$testResults | ForEach-Object {
    Write-Host "$($_.Status) - $($_.Name)" -ForegroundColor White
    Write-Host "   Status Code: $($_.StatusCode)" -ForegroundColor Gray
    Write-Host "   Details: $($_.Details)" -ForegroundColor Gray
    Write-Host ""
}

# 6. Calculate Statistics
$successCount = ($testResults | Where-Object { $_.Status -eq "SUCCESS" -or $_.Status -like "*Expected*" }).Count
$totalCount = $testResults.Count

Write-Host "Test Completion Statistics" -ForegroundColor Green
Write-Host "Total Tests: $totalCount" -ForegroundColor White
Write-Host "Successful/Expected: $successCount" -ForegroundColor Green
Write-Host "Success Rate: $([math]::Round(($successCount / $totalCount) * 100, 2))%" -ForegroundColor Green

if ($successCount -eq $totalCount) {
    Write-Host "All endpoint tests passed! API integration successful!" -ForegroundColor Green
} else {
    Write-Host "Some endpoints need further investigation" -ForegroundColor Yellow
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API Endpoint Testing Complete" -ForegroundColor Green