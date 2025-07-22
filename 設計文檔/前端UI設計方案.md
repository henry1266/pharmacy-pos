# 前端UI設計方案

## 1. 產品表單包裝單位配置

### 1.1 產品編輯對話框擴展

在現有的 [`ProductFormDialog.tsx`](frontend/src/components/products/ProductFormDialog.tsx:1) 中新增包裝單位配置區塊：

```tsx
// 新增包裝單位配置組件
const PackageUnitsConfig: React.FC<{
  productId?: string;
  packageUnits: ProductPackageUnit[];
  onPackageUnitsChange: (units: ProductPackageUnit[]) => void;
}> = ({ productId, packageUnits, onPackageUnitsChange }) => {
  
  return (
    <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
        📦 包裝單位配置
      </Typography>
      
      {/* 啟用包裝模式開關 */}
      <FormControlLabel
        control={
          <Switch
            checked={packageUnits.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                // 初始化預設包裝單位
                onPackageUnitsChange([
                  { unitName: '個', unitValue: 1, priority: 1, isBaseUnit: true }
                ]);
              } else {
                onPackageUnitsChange([]);
              }
            }}
          />
        }
        label="啟用大包裝模式"
      />
      
      {packageUnits.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {/* 包裝單位列表 */}
          {packageUnits
            .sort((a, b) => b.priority - a.priority)
            .map((unit, index) => (
              <PackageUnitRow
                key={index}
                unit={unit}
                onUpdate={(updatedUnit) => {
                  const newUnits = [...packageUnits];
                  newUnits[index] = updatedUnit;
                  onPackageUnitsChange(newUnits);
                }}
                onDelete={() => {
                  const newUnits = packageUnits.filter((_, i) => i !== index);
                  onPackageUnitsChange(newUnits);
                }}
                canDelete={!unit.isBaseUnit}
              />
            ))}
          
          {/* 新增包裝單位按鈕 */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              const maxPriority = Math.max(...packageUnits.map(u => u.priority));
              const newUnit: ProductPackageUnit = {
                unitName: '',
                unitValue: 1,
                priority: maxPriority + 1,
                isBaseUnit: false
              };
              onPackageUnitsChange([...packageUnits, newUnit]);
            }}
            sx={{ mt: 1 }}
          >
            新增包裝單位
          </Button>
        </Box>
      )}
    </Box>
  );
};
```

### 1.2 包裝單位行組件

```tsx
const PackageUnitRow: React.FC<{
  unit: ProductPackageUnit;
  onUpdate: (unit: ProductPackageUnit) => void;
  onDelete: () => void;
  canDelete: boolean;
}> = ({ unit, onUpdate, onDelete, canDelete }) => {
  
  return (
    <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
      <Grid item xs={3}>
        <TextField
          label="單位名稱"
          value={unit.unitName}
          onChange={(e) => onUpdate({ ...unit, unitName: e.target.value })}
          size="small"
          fullWidth
          placeholder="如：盒、排、粒"
          disabled={unit.isBaseUnit}
        />
      </Grid>
      
      <Grid item xs={3}>
        <TextField
          label="包含數量"
          type="number"
          value={unit.unitValue}
          onChange={(e) => onUpdate({ ...unit, unitValue: parseInt(e.target.value) || 1 })}
          size="small"
          fullWidth
          disabled={unit.isBaseUnit}
          helperText={unit.isBaseUnit ? "基礎單位" : ""}
        />
      </Grid>
      
      <Grid item xs={2}>
        <TextField
          label="優先級"
          type="number"
          value={unit.priority}
          onChange={(e) => onUpdate({ ...unit, priority: parseInt(e.target.value) || 1 })}
          size="small"
          fullWidth
          helperText="數字越大越優先"
        />
      </Grid>
      
      <Grid item xs={2}>
        <Chip
          label={unit.isBaseUnit ? "基礎單位" : "包裝單位"}
          color={unit.isBaseUnit ? "primary" : "default"}
          size="small"
        />
      </Grid>
      
      <Grid item xs={2}>
        {canDelete && (
          <IconButton
            onClick={onDelete}
            size="small"
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </Grid>
    </Grid>
  );
};
```

## 2. 庫存顯示組件擴展

### 2.1 庫存列表顯示增強

擴展現有的 [`InventoryList.tsx`](frontend/src/components/products/InventoryList.tsx:1)：

```tsx
// 新增包裝顯示組件
const PackageInventoryDisplay: React.FC<{
  totalQuantity: number;
  packageUnits: ProductPackageUnit[];
  showBreakdown?: boolean;
}> = ({ totalQuantity, packageUnits, showBreakdown = true }) => {
  
  const displayResult = useMemo(() => {
    return convertToPackageDisplay(totalQuantity, packageUnits);
  }, [totalQuantity, packageUnits]);
  
  return (
    <Box>
      {/* 主要顯示 */}
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        {displayResult.displayText}
      </Typography>
      
      {/* 詳細分解（可選） */}
      {showBreakdown && displayResult.packageBreakdown.length > 1 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            詳細分解：
          </Typography>
          {displayResult.packageBreakdown.map((item, index) => (
            <Chip
              key={index}
              label={`${item.quantity}${item.unitName}`}
              size="small"
              variant="outlined"
              sx={{ ml: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
      )}
      
      {/* 基礎單位顯示 */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        基礎單位：{totalQuantity} {packageUnits.find(u => u.isBaseUnit)?.unitName || '個'}
      </Typography>
    </Box>
  );
};
```

### 2.2 庫存卡片更新

```tsx
// 更新庫存資訊卡片
<Card elevation={2} sx={{ borderRadius: 2 }}>
  <CardContent sx={{ p: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
      <InventoryIcon color="primary" fontSize="medium" />
      <Typography variant="subtitle1" color="text.secondary" fontWeight="medium" sx={{ ml: 1 }}>
        總庫存數量
      </Typography>
    </Box>
    
    {/* 使用包裝顯示組件 */}
    <PackageInventoryDisplay
      totalQuantity={currentStock}
      packageUnits={productPackageUnits}
      showBreakdown={true}
    />
  </CardContent>
</Card>
```

## 3. 庫存輸入組件

### 3.1 智能輸入框組件

```tsx
const PackageQuantityInput: React.FC<{
  value: number;  // 基礎單位數量
  onChange: (baseQuantity: number) => void;
  packageUnits: ProductPackageUnit[];
  label?: string;
  placeholder?: string;
}> = ({ value, onChange, packageUnits, label = "數量", placeholder }) => {
  
  const [inputMode, setInputMode] = useState<'package' | 'base'>('package');
  const [packageInput, setPackageInput] = useState('');
  const [baseInput, setBaseInput] = useState(value.toString());
  
  // 當基礎數量變化時，更新包裝顯示
  useEffect(() => {
    if (inputMode === 'package' && value > 0) {
      const display = convertToPackageDisplay(value, packageUnits);
      setPackageInput(display.displayText);
    }
    setBaseInput(value.toString());
  }, [value, packageUnits, inputMode]);
  
  const handlePackageInputChange = (input: string) => {
    setPackageInput(input);
    const baseQuantity = convertToBaseUnit(input, packageUnits);
    onChange(baseQuantity);
  };
  
  const handleBaseInputChange = (input: string) => {
    setBaseInput(input);
    const baseQuantity = parseInt(input) || 0;
    onChange(baseQuantity);
  };
  
  return (
    <Box>
      {/* 輸入模式切換 */}
      <Box sx={{ mb: 1 }}>
        <ToggleButtonGroup
          value={inputMode}
          exclusive
          onChange={(_, newMode) => newMode && setInputMode(newMode)}
          size="small"
        >
          <ToggleButton value="package">
            📦 包裝輸入
          </ToggleButton>
          <ToggleButton value="base">
            🔢 基礎單位
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      {/* 輸入框 */}
      {inputMode === 'package' ? (
        <TextField
          label={label}
          value={packageInput}
          onChange={(e) => handlePackageInputChange(e.target.value)}
          placeholder={placeholder || "如：1盒 5排 3粒"}
          fullWidth
          helperText="支援格式：1盒 5排 3粒 或 純數字"
        />
      ) : (
        <TextField
          label={`${label}（基礎單位）`}
          type="number"
          value={baseInput}
          onChange={(e) => handleBaseInputChange(e.target.value)}
          fullWidth
          helperText={`基礎單位：${packageUnits.find(u => u.isBaseUnit)?.unitName || '個'}`}
        />
      )}
      
      {/* 即時轉換顯示 */}
      {inputMode === 'base' && parseInt(baseInput) > 0 && (
        <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
          包裝顯示：{convertToPackageDisplay(parseInt(baseInput) || 0, packageUnits).displayText}
        </Typography>
      )}
    </Box>
  );
};
```

## 4. 庫存盤點界面

### 4.1 盤點建議組件

```tsx
const InventoryCountSuggestion: React.FC<{
  currentStock: number;
  packageUnits: ProductPackageUnit[];
  onCountUpdate: (newCount: number) => void;
}> = ({ currentStock, packageUnits, onCountUpdate }) => {
  
  const [countInput, setCountInput] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(true);
  
  const currentDisplay = convertToPackageDisplay(currentStock, packageUnits);
  
  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
        📋 庫存盤點建議
      </Typography>
      
      {showSuggestion && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            當前庫存：<strong>{currentDisplay.displayText}</strong>
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 1 }}>
            建議盤點順序：
          </Typography>
          
          {currentDisplay.packageBreakdown.map((item, index) => (
            <Chip
              key={index}
              label={`${item.quantity}${item.unitName}`}
              sx={{ mr: 1, mb: 1, bgcolor: 'white', color: 'text.primary' }}
            />
          ))}
          
          <Button
            size="small"
            onClick={() => setCountInput(currentDisplay.displayText)}
            sx={{ ml: 1, color: 'white', borderColor: 'white' }}
            variant="outlined"
          >
            使用建議值
          </Button>
        </Box>
      )}
      
      {/* 盤點輸入 */}
      <PackageQuantityInput
        value={parseInt(countInput) || 0}
        onChange={(baseQuantity) => {
          setCountInput(baseQuantity.toString());
          onCountUpdate(baseQuantity);
        }}
        packageUnits={packageUnits}
        label="實際盤點數量"
        placeholder="輸入實際盤點結果"
      />
      
      {/* 差異顯示 */}
      {countInput && parseInt(countInput) !== currentStock && (
        <Alert 
          severity={parseInt(countInput) > currentStock ? "info" : "warning"}
          sx={{ mt: 2 }}
        >
          <Typography variant="body2">
            盤點差異：{parseInt(countInput) - currentStock > 0 ? '+' : ''}
            {parseInt(countInput) - currentStock} 
            {packageUnits.find(u => u.isBaseUnit)?.unitName || '個'}
          </Typography>
        </Alert>
      )}
    </Paper>
  );
};
```

## 5. 響應式設計考量

### 5.1 移動端適配

```tsx
// 使用 Material-UI 的響應式斷點
const useStyles = makeStyles((theme) => ({
  packageDisplay: {
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.875rem',
      '& .MuiChip-root': {
        fontSize: '0.75rem',
        height: '24px'
      }
    }
  },
  packageInput: {
    [theme.breakpoints.down('sm')]: {
      '& .MuiToggleButtonGroup-root': {
        width: '100%',
        '& .MuiToggleButton-root': {
          flex: 1
        }
      }
    }
  }
}));
```

### 5.2 平板端優化

```tsx
// 平板端使用更緊湊的佈局
<Grid container spacing={1}>
  <Grid item xs={12} sm={6} md={4}>
    <PackageQuantityInput {...props} />
  </Grid>
  <Grid item xs={12} sm={6} md={8}>
    <PackageInventoryDisplay {...props} />
  </Grid>
</Grid>
```

## 6. 用戶體驗優化

### 6.1 輸入提示和驗證

```tsx
const PackageInputValidator = {
  validate: (input: string, packageUnits: ProductPackageUnit[]) => {
    const errors: string[] = [];
    
    // 檢查格式
    if (!/^(\d+[^\d\s]*\s*)*\d*$/.test(input.trim())) {
      errors.push('格式錯誤，請使用如：1盒 5排 3粒');
    }
    
    // 檢查單位是否存在
    const unitNames = packageUnits.map(u => u.unitName);
    const regex = /\d+([^\d\s]+)/g;
    let match;
    while ((match = regex.exec(input)) !== null) {
      if (!unitNames.includes(match[1])) {
        errors.push(`未知單位：${match[1]}`);
      }
    }
    
    return errors;
  }
};
```

### 6.2 快捷輸入按鈕

```tsx
const QuickInputButtons: React.FC<{
  packageUnits: ProductPackageUnit[];
  onQuickInput: (input: string) => void;
}> = ({ packageUnits, onQuickInput }) => {
  
  const quickInputs = [
    { label: '1盒', value: `1${packageUnits.find(u => u.priority === 3)?.unitName || '盒'}` },
    { label: '1排', value: `1${packageUnits.find(u => u.priority === 2)?.unitName || '排'}` },
    { label: '10粒', value: `10${packageUnits.find(u => u.isBaseUnit)?.unitName || '粒'}` }
  ];
  
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" color="text.secondary">
        快捷輸入：
      </Typography>
      {quickInputs.map((item, index) => (
        <Button
          key={index}
          size="small"
          variant="outlined"
          onClick={() => onQuickInput(item.value)}
          sx={{ ml: 1, minWidth: 'auto' }}
        >
          {item.label}
        </Button>
      ))}
    </Box>
  );
};
```

## 7. 總結

前端UI設計重點：

1. **直觀顯示**：清楚展示包裝分解結果
2. **靈活輸入**：支援包裝單位和基礎單位兩種輸入模式
3. **智能建議**：提供盤點建議和快捷輸入
4. **響應式設計**：適配不同設備尺寸
5. **用戶體驗**：提供即時驗證和轉換顯示

這樣的設計能夠大幅提升庫存管理的效率和準確性。