# Test shipping order with zero total amount
# PowerShell test script

Write-Host "=== Shipping Order Zero Amount Test ===" -ForegroundColor Green

# Set API base URL
$baseUrl = "http://localhost:5000/api"

# Test data: Create shipping order with zero total amount
$testData = @{
    sosupplier = "Test Supplier"
    items = @(
        @{
            did = "TEST001"
            dname = "Test Product 1"
            dquantity = 1
            dtotalCost = 0
        },
        @{
            did = "TEST002"
            dname = "Test Product 2"
            dquantity = 2
            dtotalCost = 0
        }
    )
    notes = "Test shipping order with zero total amount"
    status = "pending"
    paymentStatus = "unpaid"
} | ConvertTo-Json -Depth 3

Write-Host "Test Data:" -ForegroundColor Yellow
Write-Host $testData

try {
    Write-Host "`nCreating shipping order with zero total amount..." -ForegroundColor Blue
    
    # Send POST request to create shipping order
    $response = Invoke-RestMethod -Uri "$baseUrl/shipping-orders" -Method POST -Body $testData -ContentType "application/json"
    
    Write-Host "Success: Shipping order created!" -ForegroundColor Green
    Write-Host "Order ID: $($response.data._id)" -ForegroundColor Cyan
    Write-Host "Order Number: $($response.data.soid)" -ForegroundColor Cyan
    Write-Host "Total Amount: $($response.data.totalAmount)" -ForegroundColor Cyan
    
    # Verify total amount is zero
    if ($response.data.totalAmount -eq 0) {
        Write-Host "PASS: Total amount is indeed 0" -ForegroundColor Green
    } else {
        Write-Host "FAIL: Total amount is not 0, actual value: $($response.data.totalAmount)" -ForegroundColor Red
    }
    
    # Test updating shipping order while keeping total amount as 0
    Write-Host "`nTesting shipping order update..." -ForegroundColor Blue
    
    $updateData = @{
        notes = "Updated notes - total amount still 0"
        items = @(
            @{
                did = "TEST001"
                dname = "Test Product 1"
                dquantity = 1
                dtotalCost = 0
            }
        )
    } | ConvertTo-Json -Depth 3
    
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/shipping-orders/$($response.data._id)" -Method PUT -Body $updateData -ContentType "application/json"
    
    Write-Host "Success: Shipping order updated!" -ForegroundColor Green
    Write-Host "Updated Total Amount: $($updateResponse.data.totalAmount)" -ForegroundColor Cyan
    
    if ($updateResponse.data.totalAmount -eq 0) {
        Write-Host "PASS: Total amount remains 0 after update" -ForegroundColor Green
    } else {
        Write-Host "FAIL: Total amount is not 0 after update" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Test Failed: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Details: $errorBody" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green