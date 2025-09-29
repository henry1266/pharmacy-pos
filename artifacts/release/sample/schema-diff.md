# Schema Diff 報告

- 基準 (base): HEAD~1
- 目標 (head): HEAD
- 產出時間: 2025-09-29T03:53:41.650Z

共發現 9 個檔案變更：

## openapi/openapi.json (M)
````diff
diff --git a/openapi/openapi.json b/openapi/openapi.json
index d31db90b..ef7935f4 100644
--- a/openapi/openapi.json
+++ b/openapi/openapi.json
@@ -22,6 +22,10 @@
     {
       "name": "Suppliers",
       "description": "Supplier management endpoints"
+    },
+    {
+      "name": "Purchase Orders",
+      "description": "Purchase order management endpoints"
     }
   ],
   "paths": {
@@ -1174,302 +1178,1802 @@
           }
         }
       }
-    }
-  },
-  "components": {
-    "schemas": {
-      "ApiResponse": {
-        "type": "object",
-        "properties": {
-          "success": {
-            "type": "boolean"
-          },
-          "message": {
-            "type": "string"
+    },
+    "/purchase-orders": {
+      "get": {
+        "summary": "List purchase orders",
+        "operationId": "listPurchaseOrders",
+        "tags": [
+          "Purchase Orders"
+        ],
+        "responses": {
+          "200": {
+            "description": "OK",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "allOf": [
+                    {
+                      "$ref": "#/components/schemas/ApiResponse"
+                    },
+                    {
+                      "type": "object",
+                      "properties": {
+                        "data": {
+                          "type": "array",
+                          "items": {
+                            "$ref": "#/components/schemas/PurchaseOrder"
+                          }
+                        }
+                      }
+                    }
+                  ]
+                },
+                "examples": {
+                  "purchaseOrders": {
+                    "summary": "Purchase order list",
+                    "value": {
+                      "success": true,
+                      "message": "OK",
+                      "data": [
+                        {
+                          "_id": "64f0a1b2c3d4e5f678901234",
+                          "poid": "PO-2025-0001",
+                          "orderNumber": "PO-2025-0001",
+                          "posupplier": "Acme Pharma",
+                          "supplier": {
+                            "_id": "64f0a1b2c3d4e5f678909999",
+                            "name": "Acme Pharma"
+                          },
+                          "items": [
+                            {
+                              "_id": "64f0a1b2c3d4e5f678901999",
+                              "did": "SKU-1001",
+                              "dname": "Vitamin C 500mg",
+                              "dquantity": 10,
+                              "dtotalCost": 2500,
+                              "unitPrice": 250
+                            }
+                          ],
+                          "totalAmount": 2500,
+                          "status": "pending",
+                          "paymentStatus": "���I",
+                          "createdAt": "2025-01-01T00:00:00.000Z",
+                          "updatedAt": "2025-01-01T00:00:00.000Z"
+                        }
+                      ],
+                      "timestamp": "2025-01-01T00:00:00.000Z"
+                    }
+                  }
+                }
+              }
+            }
           },
-          "data": {},
-          "timestamp": {
-            "type": "string",
-            "format": "date-time"
+          "500": {
+            "description": "Server error",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "$ref": "#/components/schemas/ErrorResponse"
+                }
+              }
+            }
           }
-        },
-        "required": [
-          "success"
-        ]
+        }
       },
-      "ErrorResponse": {
-        "type": "object",
-        "properties": {
-          "success": {
-            "type": "boolean",
-            "enum": [
-              false
-            ]
+      "post": {
+        "summary": "Create a purchase order",
+        "operationId": "createPurchaseOrder",
+        "tags": [
+          "Purchase Orders"
+        ],
+        "requestBody": {
+          "required": true,
+          "content": {
+            "application/json": {
+              "schema": {
+                "$ref": "#/components/schemas/PurchaseOrderCreateRequest"
+              }
+            }
+          }
+        },
+        "responses": {
+          "200": {
+            "description": "Created",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "allOf": [
+                    {
+                      "$ref": "#/components/schemas/ApiResponse"
+                    },
+                    {
+                      "type": "object",
+                      "properties": {
+                        "data": {
+                          "$ref": "#/components/schemas/PurchaseOrder"
+                        }
+                      }
+                    }
+                  ]
+                },
+                "examples": {
+                  "created": {
+                    "summary": "Created purchase order",
+                    "value": {
+                      "success": true,
+                      "message": "Created",
+                      "data": {
+                        "_id": "64f0a1b2c3d4e5f678901235",
+                        "poid": "PO-2025-0002",
+                        "orderNumber": "PO-2025-0002",
+                        "posupplier": "Acme Pharma",
+                        "items": [
+                          {
+                            "_id": "64f0a1b2c3d4e5f678902000",
+                            "did": "SKU-1002",
+                            "dname": "Pain Relief Tablets",
+                            "dquantity": 20,
+                            "dtotalCost": 4000,
+                            "unitPrice": 200
+                          }
+                        ],
+                        "totalAmount": 4000,
+                        "status": "pending",
+                        "paymentStatus": "���I",
+                        "createdAt": "2025-01-02T00:00:00.000Z",
+                        "updatedAt": "2025-01-02T00:00:00.000Z"
+                      },
+                      "timestamp": "2025-01-02T00:00:00.000Z"
+                    }
+                  }
+                }
+              }
+            }
           },
-          "message": {
-            "type": "string"
+          "400": {
+            "description": "Validation error",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "$ref": "#/components/schemas/ErrorResponse"
+                }
+              }
+            }
           },
-          "error": {
-            "type": "string"
+          "401": {
+            "description": "Unauthorized",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "$ref": "#/components/schemas/ErrorResponse"
+                }
+              }
+            }
           },
-          "errors": {
-            "type": "array",
-            "items": {
-              "type": "object",
-              "properties": {
-                "msg": {
-                  "type": "string"
-                },
-                "param": {
-                  "type": "string"
+          "500": {
+            "description": "Server error",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "$ref": "#/components/schemas/ErrorResponse"
+                }
+              }
+            }
+          }
+        }
+      }
+    },
+    "/purchase-orders/{id}": {
+      "get": {
+        "summary": "Get purchase order by ID",
+        "operationId": "getPurchaseOrderById",
+        "tags": [
+          "Purchase Orders"
+        ],
+        "parameters": [
+          {
+            "in": "path",
+            "name": "id",
+            "required": true,
+            "schema": {
+              "type": "string"
+            }
+          }
+        ],
+        "responses": {
+          "200": {
+            "description": "OK",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "allOf": [
+                    {
+                      "$ref": "#/components/schemas/ApiResponse"
+                    },
+                    {
+                      "properties": {
+                        "data": {
+                          "$ref": "#/components/schemas/PurchaseOrder"
+                        }
+                      }
+                    }
+                  ]
                 },
-                "location": {
-                  "type": "string"
+                "examples": {
+                  "purchaseOrder": {
+                    "summary": "Purchase order",
+                    "value": {
+                      "success": true,
+                      "message": "OK",
+                      "data": {
+                        "_id": "64f0a1b2c3d4e5f678901234",
+                        "poid": "PO-2025-0001",
+                        "orderNumber": "PO-2025-0001",
+                        "posupplier": "Acme Pharma",
+                        "items": [
+                          {
+                            "_id": "64f0a1b2c3d4e5f678901999",
+                            "did": "SKU-1001",
+                            "dname": "Vitamin C 500mg",
+                            "dquantity": 10,
+                            "dtotalCost": 2500,
+                            "unitPrice": 250
+                          }
+                        ],
+                        "totalAmount": 2500,
+                        "status": "pending",
+                        "paymentStatus": "���I",
+                        "createdAt": "2025-01-01T00:00:00.000Z",
+                        "updatedAt": "2025-01-01T00:00:00.000Z"
+                      },
+                      "timestamp": "2025-01-01T00:00:00.000Z"
+                    }
+                  }
                 }
-              },
-              "required": [
-                "msg"
-              ]
+              }
             }
           },
-          "details": {
-            "type": "object",
-            "additionalProperties": true
-          },
-          "statusCode": {
-            "type": "number"
+          "404": {
+            "description": "Not found",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "$ref": "#/components/schemas/ErrorResponse"
+                }
+              }
+            }
           },
-          "timestamp": {
-            "type": "string",
-            "format": "date-time"
+          "500": {
+            "description": "Server error",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "$ref": "#/components/schemas/ErrorResponse"
+                }
+              }
+            }
           }
-        },
-        "required": [
-          "success",
-          "message"
-        ]
+        }
       },
-      "SaleItem": {
-        "type": "object",
-        "properties": {
-          "product": {
-            "type": "string",
-            "minLength": 24,
-            "maxLength": 24
+      "put": {
+        "summary": "Update a purchase order",
+        "operationId": "updatePurchaseOrder",
+        "tags": [
+          "Purchase Orders"
+        ],
+        "parameters": [
+          {
+            "in": "path",
+            "name": "id",
+            "required": true,
+            "schema": {
+              "type": "string"
+            }
+          }
+        ],
+        "requestBody": {
+          "required": true,
+          "content": {
+            "application/json": {
+              "schema": {
+                "$ref": "#/components/schemas/PurchaseOrderUpdateRequest"
+              }
+            }
+          }
+        },
+        "responses": {
+          "200": {
+            "description": "Updated",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "allOf": [
+                    {
+                      "$ref": "#/components/schemas/ApiResponse"
+                    },
+                    {
+                      "properties": {
+                        "data": {
+                          "$ref": "#/components/schemas/PurchaseOrder"
+                        }
+                      }
+                    }
+                  ]
+                }
+              }
+            }
           },
-          "quantity": {
+          "400": {
+            "description": "Validation error",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "$ref": "#/components/schemas/ErrorResponse"
+                }
+              }
+            }
+          },
+          "401": {
+            "description": "Unauthorized",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "$ref": "#/components/schemas/ErrorResponse"
+                }
+              }
+            }
+          },
+          "404": {
+            "description": "Not found",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "$ref": "#/components/schemas/ErrorResponse"
+                }
+              }
+            }
+          },
+          "500": {
+            "description": "Server error",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "$ref": "#/components/schemas/ErrorResponse"
+                }
+              }
+            }
+          }
+        }
+      },
+      "delete": {
+        "summary": "Delete a purchase order",
+        "operationId": "deletePurchaseOrder",
+        "tags": [
+          "Purchase Orders"
+        ],
+        "parameters": [
+          {
+            "in": "path",
+            "name": "id",
+            "required": true,
+            "schema": {
+              "type": "string"
+            }
+          }
+        ],
+        "responses": {
+          "200": {
+            "description": "Deleted",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "$ref": "#/components/schemas/ApiResponse"
+                }
+              }
+            }
+          },
+          "404": {
+            "description": "Not found",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "$ref": "#/components/schemas/ErrorResponse"
+                }
+              }
+            }
+          },
+          "500": {
+            "description": "Server error",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "$ref": "#/components/schemas/ErrorResponse"
+                }
+              }
+            }
+          }
+        }
+      }
+    },
+    "/purchase-orders/supplier/{supplierId}": {
+      "get": {
+        "summary": "List purchase orders by supplier",
+        "operationId": "getPurchaseOrdersBySupplier",
+        "tags": [
+          "Purchase Orders"
+        ],
+        "parameters": [
+          {
+            "in": "path",
+            "name": "supplierId",
+            "required": true,
+            "schema": {
+              "type": "string"
+            }
+          }
+        ],
+        "responses": {
+          "200": {
+            "description": "OK",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "allOf": [
+                    {
+                      "$ref": "#/components/schemas/ApiResponse"
+                    },
+                    {
+                      "properties": {
+                        "data": {
+                          "type": "array",
+                          "items": {
+                            "$ref": "#/components/schemas/PurchaseOrder"
+                          }
+                        }
+                      }
+                    }
+                  ]
+                }
+              }
+            }
+          },
+          "404": {
+            "description": "Supplier not found",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "$ref": "#/components/schemas/ErrorResponse"
+                }
+              }
+            }
+          },
+          "500": {
+            "description": "Server error",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "$ref": "#/components/schemas/ErrorResponse"
+                }
+              }
+            }
+          }
+        }
+      }
+    },
+    "/purchase-orders/product/{productId}": {
+      "get": {
+        "summary": "List purchase orders by product",
+        "operationId": "getPurchaseOrdersByProduct",
+        "tags": [
+          "Purchase Orders"
+        ],
+        "parameters": [
+          {
+            "in": "path",
+            "name": "productId",
+            "required": true,
+            "schema": {
+              "type": "string"
+            }
+          }
+        ],
+        "responses": {
+          "200": {
+            "description": "OK",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "allOf": [
+                    {
+                      "$ref": "#/components/schemas/ApiResponse"
+                    },
+                    {
+                      "properties": {
+                        "data": {
+                          "type": "array",
+                          "items": {
+                            "$ref": "#/components/schemas/PurchaseOrder"
+                          }
+                        }
+                      }
+                    }
+                  ]
+                }
+              }
+            }
+          },
+          "404": {
+            "description": "Product not found",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "$ref": "#/components/schemas/ErrorResponse"
+                }
+              }
+            }
+          },
+          "500": {
+            "description": "Server error",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "$ref": "#/components/schemas/ErrorResponse"
+                }
+              }
+            }
+          }
+        }
+      }
+    },
+    "/purchase-orders/recent/list": {
+      "get": {
+        "summary": "List recent purchase orders",
+        "operationId": "getRecentPurchaseOrders",
+        "tags": [
+          "Purchase Orders"
+        ],
+        "parameters": [
+          {
+            "in": "query",
+            "name": "limit",
+            "required": false,
+            "schema": {
+              "type": "integer",
+              "minimum": 1,
+              "maximum": 100,
+              "default": 10
+            }
+          }
+        ],
+        "responses": {
+          "200": {
+            "description": "OK",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "allOf": [
+                    {
+                      "$ref": "#/components/schemas/ApiResponse"
+                    },
+                    {
+                      "properties": {
+                        "data": {
+                          "type": "array",
+                          "items": {
+                            "$ref": "#/components/schemas/PurchaseOrder"
+                          }
+                        }
+                      }
+                    }
+                  ]
+                }
+              }
+            }
+          },
+          "500": {
+            "description": "Server error",
+            "content": {
+              "application/json": {
+                "schema": {
+                  "$ref": "#/components/schemas/ErrorResponse"
+                }
+              }
+            }
+          }
+        }
+      }
+    }
+  },
+  "components": {
+    "schemas": {
+      "ApiResponse": {
+        "type": "object",
+        "properties": {
+          "success": {
+            "type": "boolean"
+          },
+          "message": {
+            "type": "string"
+          },
+          "data": {},
+          "timestamp": {
+            "type": "string",
+            "format": "date-time"
+          }
+        },
+        "required": [
+          "success"
+        ]
+      },
+      "ErrorResponse": {
+        "type": "object",
+        "properties": {
+          "success": {
+            "type": "boolean",
+            "enum": [
+              false
+            ]
+          },
+          "message": {
+            "type": "string"
+          },
+          "error": {
+            "type": "string"
+          },
+          "errors": {
+            "type": "array",
+            "items": {
+              "type": "object",
+              "properties": {
+                "msg": {
+                  "type": "string"
+                },
+                "param": {
+                  "type": "string"
+                },
+                "location": {
+                  "type": "string"
+                }
+              },
+              "required": [
+                "msg"
+              ]
+            }
+          },
+          "details": {
+            "type": "object",
+            "additionalProperties": true
+          },
+          "statusCode": {
+            "type": "number"
+          },
+          "timestamp": {
+            "type": "string",
+            "format": "date-time"
+          }
+        },
+        "required": [
+          "success",
+          "message"
+        ]
+      },
+      "SaleItem": {
+        "type": "object",
+        "properties": {
+          "product": {
+            "type": "string",
+            "minLength": 24,
+            "maxLength": 24
+          },
+          "quantity": {
+            "type": "number",
+            "minimum": 0.001,
+            "maximum": 999999
+          },
+          "price": {
+            "type": "number",
+            "minimum": 0,
+            "maximum": 999999.99
+          },
+          "unitPrice": {
+            "type": "number",
+            "minimum": 0,
+            "maximum": 999999.99
+          },
+          "discount": {
+            "type": "number",
+            "minimum": 0,
+            "maximum": 999999.99
+          },
+          "subtotal": {
+            "type": "number",
+            "minimum": 0,
+            "maximum": 9999999.99
+          },
+          "notes": {
+            "type": "string",
+            "maxLength": 500
+          }
+        },
+        "required": [
+          "product",
+          "quantity",
+          "price",
+          "subtotal"
+        ],
+        "additionalProperties": false
+      },
+      "SaleCreateRequest": {
+        "type": "object",
+        "properties": {
+          "saleNumber": {
+            "type": "string"
+          },
+          "customer": {
+            "type": "string",
+            "minLength": 24,
+            "maxLength": 24
+          },
+          "items": {
+            "type": "array",
+            "items": {
+              "type": "object",
+              "properties": {
+                "product": {
+                  "$ref": "#/definitions/SaleCreateRequest/properties/customer"
+                },
+                "quantity": {
+                  "type": "number",
+                  "minimum": 0.001,
+                  "maximum": 999999
+                },
+                "price": {
+                  "type": "number",
+                  "minimum": 0,
+                  "maximum": 999999.99
+                },
+                "unitPrice": {
+                  "type": "number",
+                  "minimum": 0,
+                  "maximum": 999999.99
+                },
+                "discount": {
+                  "type": "number",
+                  "minimum": 0,
+                  "maximum": 999999.99
+                },
+                "subtotal": {
+                  "type": "number",
+                  "minimum": 0,
+                  "maximum": 9999999.99
+                },
+                "notes": {
+                  "type": "string",
+                  "maxLength": 500
+                }
+              },
+              "required": [
+                "product",
+                "quantity",
+                "price",
+                "subtotal"
+              ],
+              "additionalProperties": false
+            },
+            "minItems": 1
+          },
+          "totalAmount": {
+            "type": "number",
+            "minimum": 0,
+            "maximum": 9999999.99
+          },
+          "discount": {
+            "type": "number",
+            "minimum": 0,
+            "maximum": 9999999.99
+          },
+          "paymentMethod": {
+            "type": "string",
+            "enum": [
+              "cash",
+              "card",
+              "credit_card",
+              "debit_card",
+              "transfer",
+              "mobile_payment",
+              "other"
+            ]
+          },
+          "paymentStatus": {
+            "type": "string",
+            "enum": [
+              "paid",
+              "pending",
+              "partial",
+              "cancelled"
+            ]
+          },
+          "status": {
+            "type": "string",
+            "enum": [
+              "completed",
+              "pending",
+              "cancelled"
+            ]
+          },
+          "notes": {
+            "type": "string",
+            "maxLength": 1000
+          },
+          "note": {
+            "type": "string",
+            "maxLength": 1000
+          },
+          "cashier": {
+            "$ref": "#/definitions/SaleCreateRequest/properties/customer"
+          },
+          "createdBy": {
+            "$ref": "#/definitions/SaleCreateRequest/properties/customer"
+          },
+          "date": {
+            "anyOf": [
+              {
+                "type": "string",
+                "format": "date-time"
+              },
+              {
+                "type": "string",
+                "format": "date-time"
+              }
+            ]
+          }
+        },
+        "required": [
+          "items",
+          "totalAmount",
+          "paymentMethod"
+        ],
+        "additionalProperties": false
+      },
+      "SaleUpdateRequest": {
+        "type": "object",
+        "properties": {
+          "saleNumber": {
+            "type": "string"
+          },
+          "customer": {
+            "type": "string",
+            "minLength": 24,
+            "maxLength": 24
+          },
+          "items": {
+            "type": "array",
+            "items": {
+              "type": "object",
+              "properties": {
+                "product": {
+                  "$ref": "#/definitions/SaleUpdateRequest/properties/customer"
+                },
+                "quantity": {
+                  "type": "number",
+                  "minimum": 0.001,
+                  "maximum": 999999
+                },
+                "price": {
+                  "type": "number",
+                  "minimum": 0,
+                  "maximum": 999999.99
+                },
+                "unitPrice": {
+                  "type": "number",
+                  "minimum": 0,
+                  "maximum": 999999.99
+                },
+                "discount": {
+                  "type": "number",
+                  "minimum": 0,
+                  "maximum": 999999.99
+                },
+                "subtotal": {
+                  "type": "number",
+                  "minimum": 0,
+                  "maximum": 9999999.99
+                },
+                "notes": {
+                  "type": "string",
+                  "maxLength": 500
+                }
+              },
+              "required": [
+                "product",
+                "quantity",
+                "price",
+                "subtotal"
+              ],
+              "additionalProperties": false
+            },
+            "minItems": 1
+          },
+          "totalAmount": {
+            "type": "number",
+            "minimum": 0,
+            "maximum": 9999999.99
+          },
+          "discount": {
+            "type": "number",
+            "minimum": 0,
+            "maximum": 9999999.99
+          },
+          "paymentMethod": {
+            "type": "string",
+            "enum": [
+              "cash",
+              "card",
+              "credit_card",
+              "debit_card",
+              "transfer",
+              "mobile_payment",
+              "other"
+            ]
+          },
+          "paymentStatus": {
+            "type": "string",
+            "enum": [
+              "paid",
+              "pending",
+              "partial",
+              "cancelled"
+            ]
+          },
+          "status": {
+            "type": "string",
+            "enum": [
+              "completed",
+              "pending",
+              "cancelled"
+            ]
+          },
+          "notes": {
+            "type": "string",
+            "maxLength": 1000
+          },
+          "note": {
+            "type": "string",
+            "maxLength": 1000
+          },
+          "cashier": {
+            "$ref": "#/definitions/SaleUpdateRequest/properties/customer"
+          },
+          "createdBy": {
+            "$ref": "#/definitions/SaleUpdateRequest/properties/customer"
+          },
+          "date": {
+            "anyOf": [
+              {
+                "type": "string",
+                "format": "date-time"
+              },
+              {
+                "type": "string",
+                "format": "date-time"
+              }
+            ]
+          },
+          "_id": {
+            "$ref": "#/definitions/SaleUpdateRequest/properties/customer"
+          }
+        },
+        "required": [
+          "_id"
+        ],
+        "additionalProperties": false
+      },
+      "SaleSearchQuery": {
+        "type": "object",
+        "properties": {
+          "saleNumber": {
+            "type": "string"
+          },
+          "customer": {
+            "type": "string"
+          },
+          "startDate": {
+            "type": "string",
+            "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
+          },
+          "endDate": {
+            "type": "string",
+            "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
+          },
+          "paymentMethod": {
+            "type": "string",
+            "enum": [
+              "cash",
+              "card",
+              "credit_card",
+              "debit_card",
+              "transfer",
+              "mobile_payment",
+              "other"
+            ]
+          },
+          "paymentStatus": {
+            "type": "string",
+            "enum": [
+              "paid",
+              "pending",
+              "partial",
+              "cancelled"
+            ]
+          },
+          "status": {
+            "type": "string",
+            "enum": [
+              "completed",
+              "pending",
+              "cancelled"
+            ]
+          },
+          "minAmount": {
+            "type": "number",
+            "minimum": 0
+          },
+          "maxAmount": {
+            "type": "number",
+            "minimum": 0
+          },
+          "cashier": {
+            "type": "string"
+          },
+          "createdBy": {
+            "type": "string"
+          }
+        },
+        "additionalProperties": false
+      },
+      "Customer": {
+        "type": "object",
+        "properties": {
+          "name": {
+            "type": "string",
+            "minLength": 1,
+            "maxLength": 100
+          },
+          "code": {
+            "type": "string"
+          },
+          "phone": {
+            "type": "string",
+            "pattern": "^[\\d\\s\\-+()]+$",
+            "minLength": 8,
+            "maxLength": 20
+          },
+          "email": {
+            "type": "string",
+            "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
+            "maxLength": 254
+          },
+          "address": {
+            "type": "string"
+          },
+          "idCardNumber": {
+            "type": "string",
+            "pattern": "^[A-Z][12]\\d{8}$"
+          },
+          "birthdate": {
+            "anyOf": [
+              {
+                "type": "string"
+              },
+              {
+                "type": "string",
+                "format": "date-time"
+              }
+            ]
+          },
+          "gender": {
+            "type": "string",
+            "enum": [
+              "male",
+              "female",
+              "other"
+            ]
+          },
+          "allergies": {
+            "type": "array",
+            "items": {
+              "type": "string"
+            }
+          },
+          "membershipLevel": {
+            "type": "string",
+            "enum": [
+              "regular",
+              "silver",
+              "gold",
+              "platinum"
+            ]
+          },
+          "medicalHistory": {
+            "type": "string"
+          },
+          "notes": {
+            "type": "string"
+          }
+        },
+        "required": [
+          "name"
+        ],
+        "additionalProperties": false
+      },
+      "CustomerCreateRequest": {
+        "type": "object",
+        "properties": {
+          "name": {
+            "type": "string",
+            "minLength": 1,
+            "maxLength": 100
+          },
+          "code": {
+            "type": "string"
+          },
+          "phone": {
+            "type": "string",
+            "pattern": "^[\\d\\s\\-+()]+$",
+            "minLength": 8,
+            "maxLength": 20
+          },
+          "email": {
+            "type": "string",
+            "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
+            "maxLength": 254
+          },
+          "address": {
+            "type": "string"
+          },
+          "idCardNumber": {
+            "type": "string",
+            "pattern": "^[A-Z][12]\\d{8}$"
+          },
+          "birthdate": {
+            "anyOf": [
+              {
+                "type": "string"
+              },
+              {
+                "type": "string",
+                "format": "date-time"
+              }
+            ]
+          },
+          "gender": {
+            "type": "string",
+            "enum": [
+              "male",
+              "female",
+              "other"
+            ]
+          },
+          "allergies": {
+            "type": "array",
+            "items": {
+              "type": "string"
+            }
+          },
+          "membershipLevel": {
+            "type": "string",
+            "enum": [
+              "regular",
+              "silver",
+              "gold",
+              "platinum"
+            ]
+          },
+          "medicalHistory": {
+            "type": "string"
+          },
+          "notes": {
+            "type": "string"
+          }
+        },
+        "required": [
+          "name"
+        ],
+        "additionalProperties": false
+      },
+      "CustomerUpdateRequest": {
+        "type": "object",
+        "properties": {
+          "name": {
+            "type": "string",
+            "minLength": 1,
+            "maxLength": 100
+          },
+          "code": {
+            "type": "string"
+          },
+          "phone": {
+            "type": "string",
+            "pattern": "^[\\d\\s\\-+()]+$",
+            "minLength": 8,
+            "maxLength": 20
+          },
+          "email": {
+            "type": "string",
+            "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
+            "maxLength": 254
+          },
+          "address": {
+            "type": "string"
+          },
+          "idCardNumber": {
+            "type": "string",
+            "pattern": "^[A-Z][12]\\d{8}$"
+          },
+          "birthdate": {
+            "anyOf": [
+              {
+                "type": "string"
+              },
+              {
+                "type": "string",
+                "format": "date-time"
+              }
+            ]
+          },
+          "gender": {
+            "type": "string",
+            "enum": [
+              "male",
+              "female",
+              "other"
+            ]
+          },
+          "allergies": {
+            "type": "array",
+            "items": {
+              "type": "string"
+            }
+          },
+          "membershipLevel": {
+            "type": "string",
+            "enum": [
+              "regular",
+              "silver",
+              "gold",
+              "platinum"
+            ]
+          },
+          "medicalHistory": {
+            "type": "string"
+          },
+          "notes": {
+            "type": "string"
+          }
+        },
+        "additionalProperties": false
+      },
+      "CustomerSearchQuery": {
+        "type": "object",
+        "properties": {
+          "search": {
+            "type": "string"
+          },
+          "wildcardSearch": {
+            "type": "string"
+          },
+          "page": {
             "type": "number",
-            "minimum": 0.001,
-            "maximum": 999999
+            "minimum": 1
           },
-          "price": {
+          "limit": {
             "type": "number",
-            "minimum": 0,
-            "maximum": 999999.99
+            "minimum": 1,
+            "maximum": 100
+          },
+          "sortBy": {
+            "type": "string"
+          },
+          "sortOrder": {
+            "type": "string",
+            "enum": [
+              "asc",
+              "desc"
+            ]
+          }
+        },
+        "additionalProperties": false
+      },
+      "CustomerQuickCreateRequest": {
+        "type": "object",
+        "properties": {
+          "name": {
+            "type": "string",
+            "minLength": 1,
+            "maxLength": 100
+          },
+          "birthdate": {
+            "anyOf": [
+              {
+                "type": "string"
+              },
+              {
+                "type": "string",
+                "format": "date-time"
+              }
+            ]
+          },
+          "idCardNumber": {
+            "type": "string",
+            "pattern": "^[A-Z][12]\\d{8}$"
+          },
+          "notes": {
+            "type": "string"
+          }
+        },
+        "required": [
+          "name",
+          "birthdate",
+          "idCardNumber"
+        ],
+        "additionalProperties": false
+      },
+      "Supplier": {
+        "type": "object",
+        "properties": {
+          "name": {
+            "type": "string",
+            "minLength": 1,
+            "maxLength": 100
+          },
+          "code": {
+            "type": "string",
+            "minLength": 1,
+            "maxLength": 50
+          },
+          "shortCode": {
+            "type": "string",
+            "minLength": 1,
+            "maxLength": 20
+          },
+          "contactPerson": {
+            "type": "string",
+            "minLength": 1,
+            "maxLength": 100
+          },
+          "phone": {
+            "type": "string",
+            "pattern": "^[\\d\\s\\-+()]+$",
+            "minLength": 8,
+            "maxLength": 20
+          },
+          "email": {
+            "type": "string",
+            "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
+            "maxLength": 254
+          },
+          "address": {
+            "type": "string",
+            "maxLength": 200
+          },
+          "taxId": {
+            "type": "string",
+            "pattern": "^\\d{8}$"
+          },
+          "paymentTerms": {
+            "type": "string",
+            "maxLength": 200
+          },
+          "notes": {
+            "type": "string",
+            "maxLength": 500
+          },
+          "isActive": {
+            "type": "boolean"
+          }
+        },
+        "required": [
+          "name"
+        ],
+        "additionalProperties": false
+      },
+      "SupplierCreateRequest": {
+        "type": "object",
+        "properties": {
+          "name": {
+            "type": "string",
+            "minLength": 1,
+            "maxLength": 100
+          },
+          "code": {
+            "type": "string",
+            "minLength": 1,
+            "maxLength": 50
+          },
+          "shortCode": {
+            "type": "string",
+            "minLength": 1,
+            "maxLength": 20
+          },
+          "contactPerson": {
+            "type": "string",
+            "minLength": 1,
+            "maxLength": 100
+          },
+          "phone": {
+            "type": "string",
+            "pattern": "^[\\d\\s\\-+()]+$",
+            "minLength": 8,
+            "maxLength": 20
+          },
+          "email": {
+            "type": "string",
+            "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
+            "maxLength": 254
+          },
+          "address": {
+            "type": "string",
+            "maxLength": 200
+          },
+          "taxId": {
+            "type": "string",
+            "pattern": "^\\d{8}$"
+          },
+          "paymentTerms": {
+            "type": "string",
+            "maxLength": 200
+          },
+          "notes": {
+            "type": "string",
+            "maxLength": 500
+          },
+          "isActive": {
+            "type": "boolean"
+          }
+        },
+        "required": [
+          "name"
+        ],
+        "additionalProperties": false
+      },
+      "SupplierUpdateRequest": {
+        "type": "object",
+        "properties": {
+          "name": {
+            "type": "string",
+            "minLength": 1,
+            "maxLength": 100
+          },
+          "code": {
+            "type": "string",
+            "minLength": 1,
+            "maxLength": 50
+          },
+          "shortCode": {
+            "type": "string",
+            "minLength": 1,
+            "maxLength": 20
+          },
+          "contactPerson": {
+            "type": "string",
+            "minLength": 1,
+            "maxLength": 100
+          },
+          "phone": {
+            "type": "string",
+            "pattern": "^[\\d\\s\\-+()]+$",
+            "minLength": 8,
+            "maxLength": 20
           },
-          "unitPrice": {
-            "type": "number",
-            "minimum": 0,
-            "maximum": 999999.99
+          "email": {
+            "type": "string",
+            "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
+            "maxLength": 254
           },
-          "discount": {
-            "type": "number",
-            "minimum": 0,
-            "maximum": 999999.99
+          "address": {
+            "type": "string",
+            "maxLength": 200
           },
-          "subtotal": {
-            "type": "number",
-            "minimum": 0,
-            "maximum": 9999999.99
+          "taxId": {
+            "type": "string",
+            "pattern": "^\\d{8}$"
+          },
+          "paymentTerms": {
+            "type": "string",
+            "maxLength": 200
           },
           "notes": {
             "type": "string",
             "maxLength": 500
+          },
+          "isActive": {
+            "type": "boolean"
           }
         },
-        "required": [
-          "product",
-          "quantity",
-          "price",
-          "subtotal"
-        ],
         "additionalProperties": false
       },
-      "SaleCreateRequest": {
+      "SupplierSearchQuery": {
         "type": "object",
         "properties": {
-          "saleNumber": {
+          "search": {
             "type": "string"
           },
-          "customer": {
-            "type": "string",
-            "minLength": 24,
-            "maxLength": 24
+          "active": {
+            "type": "boolean"
           },
-          "items": {
-            "type": "array",
-            "items": {
-              "type": "object",
-              "properties": {
-                "product": {
-                  "$ref": "#/definitions/SaleCreateRequest/properties/customer"
-                },
-                "quantity": {
-                  "type": "number",
-                  "minimum": 0.001,
-                  "maximum": 999999
-                },
-                "price": {
-                  "type": "number",
-                  "minimum": 0,
-                  "maximum": 999999.99
-                },
-                "unitPrice": {
-                  "type": "number",
-                  "minimum": 0,
-                  "maximum": 999999.99
-                },
-                "discount": {
-                  "type": "number",
-                  "minimum": 0,
-                  "maximum": 999999.99
-                },
-                "subtotal": {
-                  "type": "number",
-                  "minimum": 0,
-                  "maximum": 9999999.99
-                },
-                "notes": {
-                  "type": "string",
-                  "maxLength": 500
-                }
-              },
-              "required": [
-                "product",
-                "quantity",
-                "price",
-                "subtotal"
-              ],
-              "additionalProperties": false
-            },
-            "minItems": 1
+          "page": {
+            "type": "integer",
+            "minimum": 1
           },
-          "totalAmount": {
-            "type": "number",
-            "minimum": 0,
-            "maximum": 9999999.99
+          "limit": {
+            "type": "integer",
+            "minimum": 1,
+            "maximum": 100
           },
-          "discount": {
-            "type": "number",
-            "minimum": 0,
-            "maximum": 9999999.99
+          "sortBy": {
+            "type": "string",
+            "maxLength": 50
           },
-          "paymentMethod": {
+          "sortOrder": {
             "type": "string",
             "enum": [
-              "cash",
-              "card",
-              "credit_card",
-              "debit_card",
-              "transfer",
-              "mobile_payment",
-              "other"
+              "asc",
+              "desc"
             ]
+          }
+        },
+        "additionalProperties": false
+      },
+      "PurchaseOrder": {
+        "type": "object",
+        "properties": {
+          "_id": {
+            "type": "string",
+            "pattern": "^[0-9a-fA-F]{24}$"
           },
-          "paymentStatus": {
+          "poid": {
             "type": "string",
-            "enum": [
-              "paid",
-              "pending",
-              "partial",
-              "cancelled"
-            ]
+            "minLength": 1,
+            "maxLength": 64
           },
-          "status": {
+          "orderNumber": {
             "type": "string",
-            "enum": [
-              "completed",
-              "pending",
-              "cancelled"
+            "minLength": 1,
+            "maxLength": 64
+          },
+          "pobill": {
+            "type": "string",
+            "maxLength": 100
+          },
+          "pobilldate": {
+            "anyOf": [
+              {
+                "type": "string"
+              },
+              {
+                "type": "string",
+                "format": "date-time"
+              }
             ]
           },
-          "notes": {
+          "posupplier": {
             "type": "string",
-            "maxLength": 1000
+            "minLength": 1,
+            "maxLength": 200
           },
-          "note": {
+          "supplier": {
+            "anyOf": [
+              {
+                "$ref": "#/definitions/PurchaseOrder/properties/_id"
+              },
+              {
+                "type": "object",
+                "properties": {
+                  "_id": {
+                    "$ref": "#/definitions/PurchaseOrder/properties/_id"
+                  },
+                  "name": {
+                    "type": "string"
+                  },
+                  "code": {
+                    "type": "string"
+                  },
+                  "shortCode": {
+                    "type": "string"
+                  }
+                },
+                "additionalProperties": true
+              }
+            ]
+          },
+          "organizationId": {
+            "$ref": "#/definitions/PurchaseOrder/properties/_id"
+          },
+          "transactionType": {
             "type": "string",
-            "maxLength": 1000
+            "enum": [
+              "進貨",
+              "退貨",
+              "支出"
+            ]
           },
-          "cashier": {
-            "$ref": "#/definitions/SaleCreateRequest/properties/customer"
+          "selectedAccountIds": {
+            "type": "array",
+            "items": {
+              "$ref": "#/definitions/PurchaseOrder/properties/_id"
+            }
           },
-          "createdBy": {
-            "$ref": "#/definitions/SaleCreateRequest/properties/customer"
+          "accountingEntryType": {
+            "type": "string",
+            "enum": [
+              "expense-asset",
+              "asset-liability"
+            ]
           },
-          "date": {
+          "orderDate": {
             "anyOf": [
+              {
+                "type": "string"
+              },
               {
                 "type": "string",
                 "format": "date-time"
+              }
+            ]
+          },
+          "expectedDeliveryDate": {
+            "anyOf": [
+              {
+                "type": "string"
               },
               {
                 "type": "string",
                 "format": "date-time"
               }
             ]
-          }
-        },
-        "required": [
-          "items",
-          "totalAmount",
-          "paymentMethod"
-        ],
-        "additionalProperties": false
-      },
-      "SaleUpdateRequest": {
-        "type": "object",
-        "properties": {
-          "saleNumber": {
-            "type": "string"
           },
-          "customer": {
-            "type": "string",
-            "minLength": 24,
-            "maxLength": 24
+          "actualDeliveryDate": {
+            "anyOf": [
+              {
+                "type": "string"
+              },
+              {
+                "type": "string",
+                "format": "date-time"
+              }
+            ]
           },
           "items": {
             "type": "array",
             "items": {
               "type": "object",
               "properties": {
+                "_id": {
+                  "$ref": "#/definitions/PurchaseOrder/properties/_id"
+                },
                 "product": {
-                  "$ref": "#/definitions/SaleUpdateRequest/properties/customer"
+                  "anyOf": [
+                    {
+                      "$ref": "#/definitions/PurchaseOrder/properties/_id"
+                    },
+                    {
+                      "type": "object",
+                      "properties": {
+                        "_id": {
+                          "$ref": "#/definitions/PurchaseOrder/properties/_id"
+                        },
+                        "name": {
+                          "type": "string"
+                        },
+                        "code": {
+                          "type": "string"
+                        }
+                      },
+                      "additionalProperties": true
+                    }
+                  ]
                 },
-                "quantity": {
+                "did": {
+                  "type": "string",
+                  "minLength": 1,
+                  "maxLength": 64
+                },
+                "dname": {
+                  "type": "string",
+                  "minLength": 1,
+                  "maxLength": 200
+                },
+                "dquantity": {
                   "type": "number",
-                  "minimum": 0.001,
+                  "exclusiveMinimum": 0,
+                  "minimum": 0,
                   "maximum": 999999
                 },
-                "price": {
+                "dtotalCost": {
                   "type": "number",
                   "minimum": 0,
                   "maximum": 999999.99
                 },
                 "unitPrice": {
-                  "type": "number",
-                  "minimum": 0,
-                  "maximum": 999999.99
+                  "anyOf": [
+                    {
+                      "type": "number",
+                      "minimum": 0,
+                      "maximum": 999999.99
+                    },
+                    {
+                      "not": {}
+                    },
+                    {
+                      "type": "object"
+                    },
+                    {
+                      "type": "string",
+                      "const": ""
+                    }
+                  ]
                 },
-                "discount": {
-                  "type": "number",
-                  "minimum": 0,
-                  "maximum": 999999.99
+                "receivedQuantity": {
+                  "anyOf": [
+                    {
+                      "type": "number",
+                      "minimum": 0,
+                      "maximum": 999999
+                    },
+                    {
+                      "not": {}
+                    },
+                    {
+                      "type": "object"
+                    },
+                    {
+                      "type": "string",
+                      "const": ""
+                    }
+                  ]
                 },
-                "subtotal": {
-                  "type": "number",
-                  "minimum": 0,
-                  "maximum": 9999999.99
+                "batchNumber": {
+                  "type": "string",
+                  "maxLength": 100
+                },
+                "packageQuantity": {
+                  "anyOf": [
+                    {
+                      "type": "number",
+                      "minimum": 0,
+                      "maximum": 999999
+                    },
+                    {
+                      "not": {}
+                    },
+                    {
+                      "type": "object"
+                    },
+                    {
+                      "type": "string",
+                      "const": ""
+                    }
+                  ]
+                },
+                "boxQuantity": {
+                  "anyOf": [
+                    {
+                      "type": "number",
+                      "minimum": 0,
+                      "maximum": 999999
+                    },
+                    {
+                      "not": {}
+                    },
+                    {
+                      "type": "object"
+                    },
+                    {
+                      "type": "string",
+                      "const": ""
+                    }
+                  ]
                 },
                 "notes": {
                   "type": "string",
@@ -1477,332 +2981,244 @@
                 }
               },
               "required": [
-                "product",
-                "quantity",
-                "price",
-                "subtotal"
+                "did",
+                "dname",
+                "dquantity",
+                "dtotalCost"
               ],
               "additionalProperties": false
-            },
-            "minItems": 1
+            }
           },
           "totalAmount": {
             "type": "number",
-            "minimum": 0,
-            "maximum": 9999999.99
-          },
-          "discount": {
-            "type": "number",
-            "minimum": 0,
-            "maximum": 9999999.99
-          },
-          "paymentMethod": {
-            "type": "string",
-            "enum": [
-              "cash",
-              "card",
-              "credit_card",
-              "debit_card",
-              "transfer",
-              "mobile_payment",
-              "other"
-            ]
+            "minimum": 0
           },
-          "paymentStatus": {
+          "status": {
             "type": "string",
             "enum": [
-              "paid",
               "pending",
-              "partial",
+              "approved",
+              "received",
+              "completed",
               "cancelled"
             ]
           },
-          "status": {
+          "paymentStatus": {
             "type": "string",
             "enum": [
-              "completed",
-              "pending",
-              "cancelled"
+              "未付",
+              "已付款",
+              "已下收",
+              "已匯款"
             ]
           },
           "notes": {
             "type": "string",
             "maxLength": 1000
           },
-          "note": {
-            "type": "string",
-            "maxLength": 1000
-          },
-          "cashier": {
-            "$ref": "#/definitions/SaleUpdateRequest/properties/customer"
-          },
           "createdBy": {
-            "$ref": "#/definitions/SaleUpdateRequest/properties/customer"
+            "anyOf": [
+              {
+                "$ref": "#/definitions/PurchaseOrder/properties/_id"
+              },
+              {
+                "type": "object",
+                "properties": {
+                  "_id": {
+                    "$ref": "#/definitions/PurchaseOrder/properties/_id"
+                  },
+                  "username": {
+                    "type": "string"
+                  },
+                  "name": {
+                    "type": "string"
+                  }
+                },
+                "additionalProperties": true
+              }
+            ]
           },
-          "date": {
+          "relatedTransactionGroupId": {
+            "$ref": "#/definitions/PurchaseOrder/properties/_id"
+          },
+          "createdAt": {
             "anyOf": [
+              {
+                "type": "string"
+              },
               {
                 "type": "string",
                 "format": "date-time"
+              }
+            ]
+          },
+          "updatedAt": {
+            "anyOf": [
+              {
+                "type": "string"
               },
               {
                 "type": "string",
                 "format": "date-time"
               }
             ]
-          },
-          "_id": {
-            "$ref": "#/definitions/SaleUpdateRequest/properties/customer"
           }
         },
         "required": [
-          "_id"
+          "_id",
+          "poid",
+          "orderNumber",
+          "posupplier",
+          "items",
+          "totalAmount",
+          "status",
+          "createdAt",
+          "updatedAt"
         ],
         "additionalProperties": false
       },
-      "SaleSearchQuery": {
+      "PurchaseOrderItem": {
         "type": "object",
         "properties": {
-          "saleNumber": {
-            "type": "string"
-          },
-          "customer": {
-            "type": "string"
-          },
-          "startDate": {
-            "type": "string",
-            "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
-          },
-          "endDate": {
+          "_id": {
             "type": "string",
-            "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
+            "pattern": "^[0-9a-fA-F]{24}$"
           },
-          "paymentMethod": {
-            "type": "string",
-            "enum": [
-              "cash",
-              "card",
-              "credit_card",
-              "debit_card",
-              "transfer",
-              "mobile_payment",
-              "other"
-            ]
+          "product": {
+            "$ref": "#/definitions/PurchaseOrderItem/properties/_id"
           },
-          "paymentStatus": {
+          "did": {
             "type": "string",
-            "enum": [
-              "paid",
-              "pending",
-              "partial",
-              "cancelled"
-            ]
+            "minLength": 1,
+            "maxLength": 64
           },
-          "status": {
+          "dname": {
             "type": "string",
-            "enum": [
-              "completed",
-              "pending",
-              "cancelled"
-            ]
+            "minLength": 1,
+            "maxLength": 200
           },
-          "minAmount": {
+          "dquantity": {
             "type": "number",
-            "minimum": 0
+            "exclusiveMinimum": 0,
+            "minimum": 0,
+            "maximum": 999999
           },
-          "maxAmount": {
+          "dtotalCost": {
             "type": "number",
-            "minimum": 0
-          },
-          "cashier": {
-            "type": "string"
-          },
-          "createdBy": {
-            "type": "string"
-          }
-        },
-        "additionalProperties": false
-      },
-      "Customer": {
-        "type": "object",
-        "properties": {
-          "name": {
-            "type": "string",
-            "minLength": 1,
-            "maxLength": 100
-          },
-          "code": {
-            "type": "string"
-          },
-          "phone": {
-            "type": "string",
-            "pattern": "^[\\d\\s\\-+()]+$",
-            "minLength": 8,
-            "maxLength": 20
-          },
-          "email": {
-            "type": "string",
-            "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
-            "maxLength": 254
-          },
-          "address": {
-            "type": "string"
-          },
-          "idCardNumber": {
-            "type": "string",
-            "pattern": "^[A-Z][12]\\d{8}$"
+            "minimum": 0,
+            "maximum": 999999.99
           },
-          "birthdate": {
+          "unitPrice": {
             "anyOf": [
               {
-                "type": "string"
+                "type": "number",
+                "minimum": 0,
+                "maximum": 999999.99
+              },
+              {
+                "not": {}
+              },
+              {
+                "type": "object"
               },
               {
                 "type": "string",
-                "format": "date-time"
+                "const": ""
               }
             ]
           },
-          "gender": {
-            "type": "string",
-            "enum": [
-              "male",
-              "female",
-              "other"
-            ]
-          },
-          "allergies": {
-            "type": "array",
-            "items": {
-              "type": "string"
-            }
-          },
-          "membershipLevel": {
-            "type": "string",
-            "enum": [
-              "regular",
-              "silver",
-              "gold",
-              "platinum"
+          "receivedQuantity": {
+            "anyOf": [
+              {
+                "type": "number",
+                "minimum": 0,
+                "maximum": 999999
+              },
+              {
+                "not": {}
+              },
+              {
+                "type": "object"
+              },
+              {
+                "type": "string",
+                "const": ""
+              }
             ]
           },
-          "medicalHistory": {
-            "type": "string"
-          },
-          "notes": {
-            "type": "string"
-          }
-        },
-        "required": [
-          "name"
-        ],
-        "additionalProperties": false
-      },
-      "CustomerCreateRequest": {
-        "type": "object",
-        "properties": {
-          "name": {
+          "batchNumber": {
             "type": "string",
-            "minLength": 1,
             "maxLength": 100
           },
-          "code": {
-            "type": "string"
-          },
-          "phone": {
-            "type": "string",
-            "pattern": "^[\\d\\s\\-+()]+$",
-            "minLength": 8,
-            "maxLength": 20
-          },
-          "email": {
-            "type": "string",
-            "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
-            "maxLength": 254
-          },
-          "address": {
-            "type": "string"
-          },
-          "idCardNumber": {
-            "type": "string",
-            "pattern": "^[A-Z][12]\\d{8}$"
-          },
-          "birthdate": {
+          "packageQuantity": {
             "anyOf": [
               {
-                "type": "string"
+                "type": "number",
+                "minimum": 0,
+                "maximum": 999999
+              },
+              {
+                "not": {}
+              },
+              {
+                "type": "object"
               },
               {
                 "type": "string",
-                "format": "date-time"
+                "const": ""
               }
             ]
           },
-          "gender": {
-            "type": "string",
-            "enum": [
-              "male",
-              "female",
-              "other"
-            ]
-          },
-          "allergies": {
-            "type": "array",
-            "items": {
-              "type": "string"
-            }
-          },
-          "membershipLevel": {
-            "type": "string",
-            "enum": [
-              "regular",
-              "silver",
-              "gold",
-              "platinum"
+          "boxQuantity": {
+            "anyOf": [
+              {
+                "type": "number",
+                "minimum": 0,
+                "maximum": 999999
+              },
+              {
+                "not": {}
+              },
+              {
+                "type": "object"
+              },
+              {
+                "type": "string",
+                "const": ""
+              }
             ]
           },
-          "medicalHistory": {
-            "type": "string"
-          },
           "notes": {
-            "type": "string"
+            "type": "string",
+            "maxLength": 500
           }
         },
         "required": [
-          "name"
+          "did",
+          "dname",
+          "dquantity",
+          "dtotalCost"
         ],
         "additionalProperties": false
       },
-      "CustomerUpdateRequest": {
+      "PurchaseOrderCreateRequest": {
         "type": "object",
         "properties": {
-          "name": {
+          "poid": {
             "type": "string",
             "minLength": 1,
-            "maxLength": 100
-          },
-          "code": {
-            "type": "string"
-          },
-          "phone": {
-            "type": "string",
-            "pattern": "^[\\d\\s\\-+()]+$",
-            "minLength": 8,
-            "maxLength": 20
+            "maxLength": 64
           },
-          "email": {
+          "orderNumber": {
             "type": "string",
-            "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
-            "maxLength": 254
-          },
-          "address": {
-            "type": "string"
+            "minLength": 1,
+            "maxLength": 64
           },
-          "idCardNumber": {
+          "pobill": {
             "type": "string",
-            "pattern": "^[A-Z][12]\\d{8}$"
+            "maxLength": 100
           },
-          "birthdate": {
+          "pobilldate": {
             "anyOf": [
               {
                 "type": "string"
@@ -1813,78 +3229,62 @@
               }
             ]
           },
-          "gender": {
+          "posupplier": {
             "type": "string",
-            "enum": [
-              "male",
-              "female",
-              "other"
+            "minLength": 1,
+            "maxLength": 200
+          },
+          "supplier": {
+            "anyOf": [
+              {
+                "type": "string",
+                "pattern": "^[0-9a-fA-F]{24}$"
+              },
+              {
+                "type": "object",
+                "properties": {
+                  "_id": {
+                    "$ref": "#/definitions/PurchaseOrderCreateRequest/properties/supplier/anyOf/0"
+                  },
+                  "name": {
+                    "type": "string"
+                  },
+                  "code": {
+                    "type": "string"
+                  },
+                  "shortCode": {
+                    "type": "string"
+                  }
+                },
+                "additionalProperties": true
+              }
             ]
           },
-          "allergies": {
-            "type": "array",
-            "items": {
-              "type": "string"
-            }
+          "organizationId": {
+            "$ref": "#/definitions/PurchaseOrderCreateRequest/properties/supplier/anyOf/0"
           },
-          "membershipLevel": {
+          "transactionType": {
             "type": "string",
             "enum": [
-              "regular",
-              "silver",
-              "gold",
-              "platinum"
+              "進貨",
+              "退貨",
+              "支出"
             ]
           },
-          "medicalHistory": {
-            "type": "string"
-          },
-          "notes": {
-            "type": "string"
-          }
-        },
-        "additionalProperties": false
-      },
-      "CustomerSearchQuery": {
-        "type": "object",
-        "properties": {
-          "search": {
-            "type": "string"
-          },
-          "wildcardSearch": {
-            "type": "string"
-          },
-          "page": {
-            "type": "number",
-            "minimum": 1
-          },
-          "limit": {
-            "type": "number",
-            "minimum": 1,
-            "maximum": 100
-          },
-          "sortBy": {
-            "type": "string"
+          "selectedAccountIds": {
+            "type": "array",
+            "items": {
+              "$ref": "#/definitions/PurchaseOrderCreateRequest/properties/supplier/anyOf/0"
+            }
           },
-          "sortOrder": {
+          "accountingEntryType": {
             "type": "string",
             "enum": [
-              "asc",
-              "desc"
+              "expense-asset",
+              "asset-liability"
             ]
-          }
-        },
-        "additionalProperties": false
-      },
-      "CustomerQuickCreateRequest": {
-        "type": "object",
-        "properties": {
-          "name": {
-            "type": "string",
-            "minLength": 1,
-            "maxLength": 100
           },
-          "birthdate": {
+          "orderDate": {
             "anyOf": [
               {
                 "type": "string"
@@ -1895,203 +3295,551 @@
               }
             ]
           },
-          "idCardNumber": {
-            "type": "string",
-            "pattern": "^[A-Z][12]\\d{8}$"
-          },
-          "notes": {
-            "type": "string"
-          }
-        },
-        "required": [
-          "name",
-          "birthdate",
-          "idCardNumber"
-        ],
-        "additionalProperties": false
-      },
-      "Supplier": {
-        "type": "object",
-        "properties": {
-          "name": {
-            "type": "string",
-            "minLength": 1,
-            "maxLength": 100
-          },
-          "code": {
-            "type": "string",
-            "minLength": 1,
-            "maxLength": 50
-          },
-          "shortCode": {
-            "type": "string",
-            "minLength": 1,
-            "maxLength": 20
-          },
-          "contactPerson": {
-            "type": "string",
-            "minLength": 1,
-            "maxLength": 100
+          "expectedDeliveryDate": {
+            "anyOf": [
+              {
+                "type": "string"
+              },
+              {
+                "type": "string",
+                "format": "date-time"
+              }
+            ]
           },
-          "phone": {
-            "type": "string",
-            "pattern": "^[\\d\\s\\-+()]+$",
-            "minLength": 8,
-            "maxLength": 20
+          "actualDeliveryDate": {
+            "anyOf": [
+              {
+                "type": "string"
+              },
+              {
+                "type": "string",
+                "format": "date-time"
+              }
+            ]
           },
-          "email": {
-            "type": "string",
-            "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
-            "maxLength": 254
+          "items": {
+            "type": "array",
+            "items": {
+              "type": "object",
+              "properties": {
+                "_id": {
+                  "$ref": "#/definitions/PurchaseOrderCreateRequest/properties/supplier/anyOf/0"
+                },
+                "product": {
+                  "$ref": "#/definitions/PurchaseOrderCreateRequest/properties/supplier/anyOf/0"
+                },
+                "did": {
+                  "type": "string",
+                  "minLength": 1,
+                  "maxLength": 64
+                },
+                "dname": {
+                  "type": "string",
+                  "minLength": 1,
+                  "maxLength": 200
+                },
+                "dquantity": {
+                  "type": "number",
+                  "exclusiveMinimum": 0,
+                  "minimum": 0,
+                  "maximum": 999999
+                },
+                "dtotalCost": {
+                  "type": "number",
+                  "minimum": 0,
+                  "maximum": 999999.99
+                },
+                "unitPrice": {
+                  "anyOf": [
+                    {
+                      "type": "number",
+                      "minimum": 0,
+                      "maximum": 999999.99
+                    },
+                    {
+                      "not": {}
+                    },
+                    {
+                      "type": "object"
+                    },
+                    {
+                      "type": "string",
+                      "const": ""
+                    }
+                  ]
+                },
+                "receivedQuantity": {
+                  "anyOf": [
+                    {
+                      "type": "number",
+                      "minimum": 0,
+                      "maximum": 999999
+                    },
+                    {
+                      "not": {}
+                    },
+                    {
+                      "type": "object"
+                    },
+                    {
+                      "type": "string",
+                      "const": ""
+                    }
+                  ]
+                },
+                "batchNumber": {
+                  "type": "string",
+                  "maxLength": 100
+                },
+                "packageQuantity": {
+                  "anyOf": [
+                    {
+                      "type": "number",
+                      "minimum": 0,
+                      "maximum": 999999
+                    },
+                    {
+                      "not": {}
+                    },
+                    {
+                      "type": "object"
+                    },
+                    {
+                      "type": "string",
+                      "const": ""
+                    }
+                  ]
+                },
+                "boxQuantity": {
+                  "anyOf": [
+                    {
+                      "type": "number",
+                      "minimum": 0,
+                      "maximum": 999999
+                    },
+                    {
+                      "not": {}
+                    },
+                    {
+                      "type": "object"
+                    },
+                    {
+                      "type": "string",
+                      "const": ""
+                    }
+                  ]
+                },
+                "notes": {
+                  "type": "string",
+                  "maxLength": 500
+                }
+              },
+              "required": [
+                "did",
+                "dname",
+                "dquantity",
+                "dtotalCost"
+              ],
+              "additionalProperties": false
+            },
+            "minItems": 1
           },
-          "address": {
-            "type": "string",
-            "maxLength": 200
+          "totalAmount": {
+            "anyOf": [
+              {
+                "type": "number",
+                "minimum": 0,
+                "maximum": 999999.99
+              },
+              {
+                "not": {}
+              },
+              {
+                "type": "object"
+              },
+              {
+                "type": "string",
+                "const": ""
+              }
+            ]
           },
-          "taxId": {
+          "status": {
             "type": "string",
-            "pattern": "^\\d{8}$"
+            "enum": [
+              "pending",
+              "approved",
+              "received",
+              "completed",
+              "cancelled"
+            ]
           },
-          "paymentTerms": {
+          "paymentStatus": {
             "type": "string",
-            "maxLength": 200
+            "enum": [
+              "未付",
+              "已付款",
+              "已下收",
+              "已匯款"
+            ]
           },
           "notes": {
             "type": "string",
-            "maxLength": 500
-          },
-          "isActive": {
-            "type": "boolean"
+            "maxLength": 1000
           }
         },
         "required": [
-          "name"
+          "poid",
+          "posupplier",
+          "items"
         ],
         "additionalProperties": false
       },
-      "SupplierCreateRequest": {
+      "PurchaseOrderUpdateRequest": {
         "type": "object",
         "properties": {
-          "name": {
+          "poid": {
             "type": "string",
             "minLength": 1,
-            "maxLength": 100
+            "maxLength": 64
           },
-          "code": {
+          "orderNumber": {
             "type": "string",
             "minLength": 1,
-            "maxLength": 50
+            "maxLength": 64
           },
-          "shortCode": {
+          "pobill": {
             "type": "string",
-            "minLength": 1,
-            "maxLength": 20
+            "maxLength": 100
           },
-          "contactPerson": {
+          "pobilldate": {
+            "anyOf": [
+              {
+                "type": "string"
+              },
+              {
+                "type": "string",
+                "format": "date-time"
+              }
+            ]
+          },
+          "posupplier": {
             "type": "string",
             "minLength": 1,
-            "maxLength": 100
+            "maxLength": 200
           },
-          "phone": {
-            "type": "string",
-            "pattern": "^[\\d\\s\\-+()]+$",
-            "minLength": 8,
-            "maxLength": 20
+          "supplier": {
+            "anyOf": [
+              {
+                "type": "string",
+                "pattern": "^[0-9a-fA-F]{24}$"
+              },
+              {
+                "type": "object",
+                "properties": {
+                  "_id": {
+                    "$ref": "#/definitions/PurchaseOrderUpdateRequest/properties/supplier/anyOf/0"
+                  },
+                  "name": {
+                    "type": "string"
+                  },
+                  "code": {
+                    "type": "string"
+                  },
+                  "shortCode": {
+                    "type": "string"
+                  }
+                },
+                "additionalProperties": true
+              }
+            ]
           },
-          "email": {
+          "organizationId": {
+            "$ref": "#/definitions/PurchaseOrderUpdateRequest/properties/supplier/anyOf/0"
+          },
+          "transactionType": {
             "type": "string",
-            "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
-            "maxLength": 254
+            "enum": [
+              "進貨",
+              "退貨",
+              "支出"
+            ]
           },
-          "address": {
+          "selectedAccountIds": {
+            "type": "array",
+            "items": {
+              "$ref": "#/definitions/PurchaseOrderUpdateRequest/properties/supplier/anyOf/0"
+            }
+          },
+          "accountingEntryType": {
             "type": "string",
-            "maxLength": 200
+            "enum": [
+              "expense-asset",
+              "asset-liability"
+            ]
           },
-          "taxId": {
+          "orderDate": {
+            "anyOf": [
+              {
+                "type": "string"
+              },
+              {
+                "type": "string",
+                "format": "date-time"
+              }
+            ]
+          },
+          "expectedDeliveryDate": {
+            "anyOf": [
+              {
+                "type": "string"
+              },
+              {
+                "type": "string",
+                "format": "date-time"
+              }
+            ]
+          },
+          "actualDeliveryDate": {
+            "anyOf": [
+              {
+                "type": "string"
+              },
+              {
+                "type": "string",
+                "format": "date-time"
+              }
+            ]
+          },
+          "items": {
+            "type": "array",
+            "items": {
+              "type": "object",
+              "properties": {
+                "_id": {
+                  "$ref": "#/definitions/PurchaseOrderUpdateRequest/properties/supplier/anyOf/0"
+                },
+                "product": {
+                  "$ref": "#/definitions/PurchaseOrderUpdateRequest/properties/supplier/anyOf/0"
+                },
+                "did": {
+                  "type": "string",
+                  "minLength": 1,
+                  "maxLength": 64
+                },
+                "dname": {
+                  "type": "string",
+                  "minLength": 1,
+                  "maxLength": 200
+                },
+                "dquantity": {
+                  "type": "number",
+                  "exclusiveMinimum": 0,
+                  "minimum": 0,
+                  "maximum": 999999
+                },
+                "dtotalCost": {
+                  "type": "number",
+                  "minimum": 0,
+                  "maximum": 999999.99
+                },
+                "unitPrice": {
+                  "anyOf": [
+                    {
+                      "type": "number",
+                      "minimum": 0,
+                      "maximum": 999999.99
+                    },
+                    {
+                      "not": {}
+                    },
+                    {
+                      "type": "object"
+                    },
+                    {
+                      "type": "string",
+                      "const": ""
+                    }
+                  ]
+                },
+                "receivedQuantity": {
+                  "anyOf": [
+                    {
+                      "type": "number",
+                      "minimum": 0,
+                      "maximum": 999999
+                    },
+                    {
+                      "not": {}
+                    },
+                    {
+                      "type": "object"
+                    },
+                    {
+                      "type": "string",
+                      "const": ""
+                    }
+                  ]
+                },
+                "batchNumber": {
+                  "type": "string",
+                  "maxLength": 100
+                },
+                "packageQuantity": {
+                  "anyOf": [
+                    {
+                      "type": "number",
+                      "minimum": 0,
+                      "maximum": 999999
+                    },
+                    {
+                      "not": {}
+                    },
+                    {
+                      "type": "object"
+                    },
+                    {
+                      "type": "string",
+                      "const": ""
+                    }
+                  ]
+                },
+                "boxQuantity": {
+                  "anyOf": [
+                    {
+                      "type": "number",
+                      "minimum": 0,
+                      "maximum": 999999
+                    },
+                    {
+                      "not": {}
+                    },
+                    {
+                      "type": "object"
+                    },
+                    {
+                      "type": "string",
+                      "const": ""
+                    }
+                  ]
+                },
+                "notes": {
+                  "type": "string",
+                  "maxLength": 500
+                }
+              },
+              "required": [
+                "did",
+                "dname",
+                "dquantity",
+                "dtotalCost"
+              ],
+              "additionalProperties": false
+            },
+            "minItems": 1
+          },
+          "totalAmount": {
+            "anyOf": [
+              {
+                "type": "number",
+                "minimum": 0,
+                "maximum": 999999.99
+              },
+              {
+                "not": {}
+              },
+              {
+                "type": "object"
+              },
+              {
+                "type": "string",
+                "const": ""
+              }
+            ]
+          },
+          "status": {
             "type": "string",
-            "pattern": "^\\d{8}$"
+            "enum": [
+              "pending",
+              "approved",
+              "received",
+              "completed",
+              "cancelled"
+            ]
           },
-          "paymentTerms": {
+          "paymentStatus": {
             "type": "string",
-            "maxLength": 200
+            "enum": [
+              "未付",
+              "已付款",
+              "已下收",
+              "已匯款"
+            ]
           },
           "notes": {
             "type": "string",
-            "maxLength": 500
-          },
-          "isActive": {
-            "type": "boolean"
+            "maxLength": 1000
           }
         },
-        "required": [
-          "name"
-        ],
         "additionalProperties": false
       },
-      "SupplierUpdateRequest": {
+      "PurchaseOrderSearchQuery": {
         "type": "object",
         "properties": {
-          "name": {
-            "type": "string",
-            "minLength": 1,
-            "maxLength": 100
-          },
-          "code": {
+          "poid": {
             "type": "string",
             "minLength": 1,
-            "maxLength": 50
-          },
-          "shortCode": {
-            "type": "string",
-            "minLength": 1,
-            "maxLength": 20
+            "maxLength": 64
           },
-          "contactPerson": {
+          "pobill": {
             "type": "string",
             "minLength": 1,
             "maxLength": 100
           },
-          "phone": {
-            "type": "string",
-            "pattern": "^[\\d\\s\\-+()]+$",
-            "minLength": 8,
-            "maxLength": 20
-          },
-          "email": {
-            "type": "string",
-            "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
-            "maxLength": 254
-          },
-          "address": {
+          "posupplier": {
             "type": "string",
+            "minLength": 1,
             "maxLength": 200
           },
-          "taxId": {
-            "type": "string",
-            "pattern": "^\\d{8}$"
+          "startDate": {
+            "anyOf": [
+              {
+                "type": "string"
+              },
+              {
+                "type": "string",
+                "format": "date-time"
+              }
+            ]
           },
-          "paymentTerms": {
-            "type": "string",
-            "maxLength": 200
+          "endDate": {
+            "anyOf": [
+              {
+                "type": "string"
+              },
+              {
+                "type": "string",
+                "format": "date-time"
+              }
+            ]
           },
-          "notes": {
+          "status": {
             "type": "string",
-            "maxLength": 500
-          },
-          "isActive": {
-            "type": "boolean"
-          }
-        },
-        "additionalProperties": false
-      },
-      "SupplierSearchQuery": {
-        "type": "object",
-        "properties": {
-          "search": {
-            "type": "string"
+            "enum": [
+              "pending",
+              "approved",
+              "received",
+              "completed",
+              "cancelled"
+            ]
           },
-          "active": {
-            "type": "boolean"
+          "paymentStatus": {
+            "type": "string",
+            "enum": [
+              "未付",
+              "已付款",
+              "已下收",
+              "已匯款"
+            ]
           },
           "page": {
             "type": "integer",

````

## shared/api/paths/purchaseOrders.ts (A)
````diff
diff --git a/shared/api/paths/purchaseOrders.ts b/shared/api/paths/purchaseOrders.ts
new file mode 100644
index 00000000..1db2989e
--- /dev/null
+++ b/shared/api/paths/purchaseOrders.ts
@@ -0,0 +1,487 @@
+/**
+ * OpenAPI path descriptors for Purchase Order endpoints
+ * Keep responses referencing shared schemas via $ref to ensure SSOT alignment
+ */
+
+const PurchaseOrdersPaths = {
+  "/purchase-orders": {
+    get: {
+      summary: "List purchase orders",
+      operationId: "listPurchaseOrders",
+      tags: ["Purchase Orders"],
+      responses: {
+        "200": {
+          description: "OK",
+          content: {
+            "application/json": {
+              schema: {
+                allOf: [
+                  { $ref: "#/components/schemas/ApiResponse" },
+                  {
+                    type: "object",
+                    properties: {
+                      data: {
+                        type: "array",
+                        items: { $ref: "#/components/schemas/PurchaseOrder" }
+                      }
+                    }
+                  }
+                ]
+              },
+              examples: {
+                purchaseOrders: {
+                  summary: "Purchase order list",
+                  value: {
+                    success: true,
+                    message: "OK",
+                    data: [
+                      {
+                        _id: "64f0a1b2c3d4e5f678901234",
+                        poid: "PO-2025-0001",
+                        orderNumber: "PO-2025-0001",
+                        posupplier: "Acme Pharma",
+                        supplier: {
+                          _id: "64f0a1b2c3d4e5f678909999",
+                          name: "Acme Pharma"
+                        },
+                        items: [
+                          {
+                            _id: "64f0a1b2c3d4e5f678901999",
+                            did: "SKU-1001",
+                            dname: "Vitamin C 500mg",
+                            dquantity: 10,
+                            dtotalCost: 2500,
+                            unitPrice: 250
+                          }
+                        ],
+                        totalAmount: 2500,
+                        status: "pending",
+                        paymentStatus: "���I",
+                        createdAt: "2025-01-01T00:00:00.000Z",
+                        updatedAt: "2025-01-01T00:00:00.000Z"
+                      }
+                    ],
+                    timestamp: "2025-01-01T00:00:00.000Z"
+                  }
+                }
+              }
+            }
+          }
+        },
+        "500": {
+          description: "Server error",
+          content: {
+            "application/json": {
+              schema: { $ref: "#/components/schemas/ErrorResponse" }
+            }
+          }
+        }
+      }
+    },
+    post: {
+      summary: "Create a purchase order",
+      operationId: "createPurchaseOrder",
+      tags: ["Purchase Orders"],
+      requestBody: {
+        required: true,
+        content: {
+          "application/json": {
+            schema: { $ref: "#/components/schemas/PurchaseOrderCreateRequest" }
+          }
+        }
+      },
+      responses: {
+        "200": {
+          description: "Created",
+          content: {
+            "application/json": {
+              schema: {
+                allOf: [
+                  { $ref: "#/components/schemas/ApiResponse" },
+                  {
+                    type: "object",
+                    properties: {
+                      data: { $ref: "#/components/schemas/PurchaseOrder" }
+                    }
+                  }
+                ]
+              },
+              examples: {
+                created: {
+                  summary: "Created purchase order",
+                  value: {
+                    success: true,
+                    message: "Created",
+                    data: {
+                      _id: "64f0a1b2c3d4e5f678901235",
+                      poid: "PO-2025-0002",
+                      orderNumber: "PO-2025-0002",
+                      posupplier: "Acme Pharma",
+                      items: [
+                        {
+                          _id: "64f0a1b2c3d4e5f678902000",
+                          did: "SKU-1002",
+                          dname: "Pain Relief Tablets",
+                          dquantity: 20,
+                          dtotalCost: 4000,
+                          unitPrice: 200
+                        }
+                      ],
+                      totalAmount: 4000,
+                      status: "pending",
+                      paymentStatus: "���I",
+                      createdAt: "2025-01-02T00:00:00.000Z",
+                      updatedAt: "2025-01-02T00:00:00.000Z"
+                    },
+                    timestamp: "2025-01-02T00:00:00.000Z"
+                  }
+                }
+              }
+            }
+          }
+        },
+        "400": {
+          description: "Validation error",
+          content: {
+            "application/json": {
+              schema: { $ref: "#/components/schemas/ErrorResponse" }
+            }
+          }
+        },
+        "401": {
+          description: "Unauthorized",
+          content: {
+            "application/json": {
+              schema: { $ref: "#/components/schemas/ErrorResponse" }
+            }
+          }
+        },
+        "500": {
+          description: "Server error",
+          content: {
+            "application/json": {
+              schema: { $ref: "#/components/schemas/ErrorResponse" }
+            }
+          }
+        }
+      }
+    }
+  },
+  "/purchase-orders/{id}": {
+    get: {
+      summary: "Get purchase order by ID",
+      operationId: "getPurchaseOrderById",
+      tags: ["Purchase Orders"],
+      parameters: [
+        { in: "path", name: "id", required: true, schema: { type: "string" } }
+      ],
+      responses: {
+        "200": {
+          description: "OK",
+          content: {
+            "application/json": {
+              schema: {
+                allOf: [
+                  { $ref: "#/components/schemas/ApiResponse" },
+                  { properties: { data: { $ref: "#/components/schemas/PurchaseOrder" } } }
+                ]
+              },
+              examples: {
+                purchaseOrder: {
+                  summary: "Purchase order",
+                  value: {
+                    success: true,
+                    message: "OK",
+                    data: {
+                      _id: "64f0a1b2c3d4e5f678901234",
+                      poid: "PO-2025-0001",
+                      orderNumber: "PO-2025-0001",
+                      posupplier: "Acme Pharma",
+                      items: [
+                        {
+                          _id: "64f0a1b2c3d4e5f678901999",
+                          did: "SKU-1001",
+                          dname: "Vitamin C 500mg",
+                          dquantity: 10,
+                          dtotalCost: 2500,
+                          unitPrice: 250
+                        }
+                      ],
+                      totalAmount: 2500,
+                      status: "pending",
+                      paymentStatus: "���I",
+                      createdAt: "2025-01-01T00:00:00.000Z",
+                      updatedAt: "2025-01-01T00:00:00.000Z"
+                    },
+                    timestamp: "2025-01-01T00:00:00.000Z"
+                  }
+                }
+              }
+            }
+          }
+        },
+        "404": {
+          description: "Not found",
+          content: {
+            "application/json": {
+              schema: { $ref: "#/components/schemas/ErrorResponse" }
+            }
+          }
+        },
+        "500": {
+          description: "Server error",
+          content: {
+            "application/json": {
+              schema: { $ref: "#/components/schemas/ErrorResponse" }
+            }
+          }
+        }
+      }
+    },
+    put: {
+      summary: "Update a purchase order",
+      operationId: "updatePurchaseOrder",
+      tags: ["Purchase Orders"],
+      parameters: [
+        { in: "path", name: "id", required: true, schema: { type: "string" } }
+      ],
+      requestBody: {
+        required: true,
+        content: {
+          "application/json": {
+            schema: { $ref: "#/components/schemas/PurchaseOrderUpdateRequest" }
+          }
+        }
+      },
+      responses: {
+        "200": {
+          description: "Updated",
+          content: {
+            "application/json": {
+              schema: {
+                allOf: [
+                  { $ref: "#/components/schemas/ApiResponse" },
+                  { properties: { data: { $ref: "#/components/schemas/PurchaseOrder" } } }
+                ]
+              }
+            }
+          }
+        },
+        "400": {
+          description: "Validation error",
+          content: {
+            "application/json": {
+              schema: { $ref: "#/components/schemas/ErrorResponse" }
+            }
+          }
+        },
+        "401": {
+          description: "Unauthorized",
+          content: {
+            "application/json": {
+              schema: { $ref: "#/components/schemas/ErrorResponse" }
+            }
+          }
+        },
+        "404": {
+          description: "Not found",
+          content: {
+            "application/json": {
+              schema: { $ref: "#/components/schemas/ErrorResponse" }
+            }
+          }
+        },
+        "500": {
+          description: "Server error",
+          content: {
+            "application/json": {
+              schema: { $ref: "#/components/schemas/ErrorResponse" }
+            }
+          }
+        }
+      }
+    },
+    delete: {
+      summary: "Delete a purchase order",
+      operationId: "deletePurchaseOrder",
+      tags: ["Purchase Orders"],
+      parameters: [
+        { in: "path", name: "id", required: true, schema: { type: "string" } }
+      ],
+      responses: {
+        "200": {
+          description: "Deleted",
+          content: {
+            "application/json": {
+              schema: { $ref: "#/components/schemas/ApiResponse" }
+            }
+          }
+        },
+        "404": {
+          description: "Not found",
+          content: {
+            "application/json": {
+              schema: { $ref: "#/components/schemas/ErrorResponse" }
+            }
+          }
+        },
+        "500": {
+          description: "Server error",
+          content: {
+            "application/json": {
+              schema: { $ref: "#/components/schemas/ErrorResponse" }
+            }
+          }
+        }
+      }
+    }
+  },
+  "/purchase-orders/supplier/{supplierId}": {
+    get: {
+      summary: "List purchase orders by supplier",
+      operationId: "getPurchaseOrdersBySupplier",
+      tags: ["Purchase Orders"],
+      parameters: [
+        { in: "path", name: "supplierId", required: true, schema: { type: "string" } }
+      ],
+      responses: {
+        "200": {
+          description: "OK",
+          content: {
+            "application/json": {
+              schema: {
+                allOf: [
+                  { $ref: "#/components/schemas/ApiResponse" },
+                  {
+                    properties: {
+                      data: {
+                        type: "array",
+                        items: { $ref: "#/components/schemas/PurchaseOrder" }
+                      }
+                    }
+                  }
+                ]
+              }
+            }
+          }
+        },
+        "404": {
+          description: "Supplier not found",
+          content: {
+            "application/json": {
+              schema: { $ref: "#/components/schemas/ErrorResponse" }
+            }
+          }
+        },
+        "500": {
+          description: "Server error",
+          content: {
+            "application/json": {
+              schema: { $ref: "#/components/schemas/ErrorResponse" }
+            }
+          }
+        }
+      }
+    }
+  },
+  "/purchase-orders/product/{productId}": {
+    get: {
+      summary: "List purchase orders by product",
+      operationId: "getPurchaseOrdersByProduct",
+      tags: ["Purchase Orders"],
+      parameters: [
+        { in: "path", name: "productId", required: true, schema: { type: "string" } }
+      ],
+      responses: {
+        "200": {
+          description: "OK",
+          content: {
+            "application/json": {
+              schema: {
+                allOf: [
+                  { $ref: "#/components/schemas/ApiResponse" },
+                  {
+                    properties: {
+                      data: {
+                        type: "array",
+                        items: { $ref: "#/components/schemas/PurchaseOrder" }
+                      }
+                    }
+                  }
+                ]
+              }
+            }
+          }
+        },
+        "404": {
+          description: "Product not found",
+          content: {
+            "application/json": {
+              schema: { $ref: "#/components/schemas/ErrorResponse" }
+            }
+          }
+        },
+        "500": {
+          description: "Server error",
+          content: {
+            "application/json": {
+              schema: { $ref: "#/components/schemas/ErrorResponse" }
+            }
+          }
+        }
+      }
+    }
+  },
+  "/purchase-orders/recent/list": {
+    get: {
+      summary: "List recent purchase orders",
+      operationId: "getRecentPurchaseOrders",
+      tags: ["Purchase Orders"],
+      parameters: [
+        {
+          in: "query",
+          name: "limit",
+          required: false,
+          schema: {
+            type: "integer",
+            minimum: 1,
+            maximum: 100,
+            default: 10
+          }
+        }
+      ],
+      responses: {
+        "200": {
+          description: "OK",
+          content: {
+            "application/json": {
+              schema: {
+                allOf: [
+                  { $ref: "#/components/schemas/ApiResponse" },
+                  {
+                    properties: {
+                      data: {
+                        type: "array",
+                        items: { $ref: "#/components/schemas/PurchaseOrder" }
+                      }
+                    }
+                  }
+                ]
+              }
+            }
+          }
+        },
+        "500": {
+          description: "Server error",
+          content: {
+            "application/json": {
+              schema: { $ref: "#/components/schemas/ErrorResponse" }
+            }
+          }
+        }
+      }
+    }
+  }
+} as const;
+
+export default PurchaseOrdersPaths;

````

## shared/constants/actionTypes.js (A)
````diff
diff --git a/shared/constants/actionTypes.js b/shared/constants/actionTypes.js
new file mode 100644
index 00000000..9902633e
--- /dev/null
+++ b/shared/constants/actionTypes.js
@@ -0,0 +1,2 @@
+﻿// Runtime bridge for ts-node: redirect .js specifiers to the TypeScript source.
+module.exports = require('./actionTypes.ts');

````

## shared/constants/index.ts (M)
````diff
diff --git a/shared/constants/index.ts b/shared/constants/index.ts
index a2cd6387..5620090c 100644
--- a/shared/constants/index.ts
+++ b/shared/constants/index.ts
@@ -4,8 +4,8 @@
  */
 
 // Redux Action Types
-export * from './actionTypes';
-export { ActionTypes } from './actionTypes';
+export * from './actionTypes.js';
+export { ActionTypes } from './actionTypes.js';
 
 /**
  * API 相關常數

````

## shared/schemas/zod/purchaseOrder.ts (A)
````diff
diff --git a/shared/schemas/zod/purchaseOrder.ts b/shared/schemas/zod/purchaseOrder.ts
new file mode 100644
index 00000000..b1d4e9bb
--- /dev/null
+++ b/shared/schemas/zod/purchaseOrder.ts
@@ -0,0 +1,208 @@
+﻿import { z } from 'zod';
+import { API_CONSTANTS, BUSINESS_CONSTANTS } from '../../constants/index.js';
+
+const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
+
+const objectIdSchema = z
+  .string()
+  .regex(OBJECT_ID_REGEX, { message: 'Must be a valid 24-character hex string.' });
+
+const trimmedString = (field: string, maxLength: number, minLength = 1) =>
+  z
+    .string()
+    .trim()
+    .min(minLength, { message: `${field} must contain at least ${minLength} character${minLength > 1 ? 's' : ''}.` })
+    .max(maxLength, { message: `${field} must not exceed ${maxLength} characters.` });
+
+const coerceRequiredNumber = (field: string, options: { min?: number; max?: number; positive?: boolean } = {}) => {
+  const { min, max, positive } = options;
+  let schema = z.coerce.number({ invalid_type_error: `${field} must be a number.` });
+  if (positive) {
+    schema = schema.gt(0, { message: `${field} must be greater than 0.` });
+  }
+  if (min !== undefined) {
+    schema = schema.min(min, { message: `${field} must be greater than or equal to ${min}.` });
+  }
+  if (max !== undefined) {
+    schema = schema.max(max, { message: `${field} must be less than or equal to ${max}.` });
+  }
+  return schema;
+};
+
+const coerceOptionalNumber = (field: string, options: { min?: number; max?: number; positive?: boolean } = {}) =>
+  z
+    .union([
+      coerceRequiredNumber(field, options),
+      z.undefined(),
+      z.literal(null),
+      z.literal(''),
+    ])
+    .transform((value) => {
+      if (value === '' || value === null || value === undefined) return undefined;
+      return value as number;
+    });
+
+const purchaseOrderStatusEnum = z.enum(['pending', 'approved', 'received', 'completed', 'cancelled']);
+const paymentStatusEnum = z.enum(['未付', '已付款', '已下收', '已匯款']);
+const transactionTypeEnum = z.enum(['進貨', '退貨', '支出']);
+const accountingEntryTypeEnum = z.enum(['expense-asset', 'asset-liability']);
+
+const quantityLimits = {
+  min: Math.max(0, BUSINESS_CONSTANTS.QUANTITY?.MIN_QUANTITY ?? 0),
+  max: BUSINESS_CONSTANTS.QUANTITY?.MAX_QUANTITY ?? 999999,
+};
+
+const priceLimits = {
+  min: BUSINESS_CONSTANTS.PRICING?.MIN_PRICE ?? 0,
+  max: BUSINESS_CONSTANTS.PRICING?.MAX_PRICE ?? 9_999_999.99,
+};
+
+export const purchaseOrderItemSchema = z
+  .object({
+    _id: objectIdSchema.optional(),
+    product: objectIdSchema.optional(),
+    did: trimmedString('Item code', 64),
+    dname: trimmedString('Item name', 200),
+    dquantity: coerceRequiredNumber('Quantity', { min: quantityLimits.min, max: quantityLimits.max, positive: true }),
+    dtotalCost: coerceRequiredNumber('Total cost', { min: priceLimits.min, max: priceLimits.max }),
+    unitPrice: coerceOptionalNumber('Unit price', { min: priceLimits.min, max: priceLimits.max }).optional(),
+    receivedQuantity: coerceOptionalNumber('Received quantity', { min: 0, max: quantityLimits.max }).optional(),
+    batchNumber: z.string().trim().max(100, { message: 'Batch number must not exceed 100 characters.' }).optional(),
+    packageQuantity: coerceOptionalNumber('Package quantity', { min: 0, max: quantityLimits.max }).optional(),
+    boxQuantity: coerceOptionalNumber('Box quantity', { min: 0, max: quantityLimits.max }).optional(),
+    notes: z.string().trim().max(500, { message: 'Notes must not exceed 500 characters.' }).optional(),
+  })
+  .strict();
+
+const supplierReferenceSchema = z
+  .union([
+    objectIdSchema,
+    z
+      .object({
+        _id: objectIdSchema.optional(),
+        name: z.string().trim().optional(),
+        code: z.string().trim().optional(),
+        shortCode: z.string().trim().optional(),
+      })
+      .passthrough(),
+  ])
+  .optional();
+
+const userReferenceSchema = z
+  .union([
+    objectIdSchema,
+    z
+      .object({
+        _id: objectIdSchema.optional(),
+        username: z.string().trim().optional(),
+        name: z.string().trim().optional(),
+      })
+      .passthrough(),
+  ])
+  .optional();
+
+const purchaseOrderCoreSchema = z.object({
+  poid: trimmedString('Purchase order code', 64),
+  orderNumber: trimmedString('Order number', 64).optional(),
+  pobill: z.string().trim().max(100, { message: 'Invoice number must not exceed 100 characters.' }).optional(),
+  pobilldate: z.union([z.string(), z.date()]).optional(),
+  posupplier: trimmedString('Supplier name', 200),
+  supplier: supplierReferenceSchema,
+  organizationId: objectIdSchema.optional(),
+  transactionType: transactionTypeEnum.optional(),
+  selectedAccountIds: z.array(objectIdSchema).optional(),
+  accountingEntryType: accountingEntryTypeEnum.optional(),
+  orderDate: z.union([z.string(), z.date()]).optional(),
+  expectedDeliveryDate: z.union([z.string(), z.date()]).optional(),
+  actualDeliveryDate: z.union([z.string(), z.date()]).optional(),
+  items: z.array(purchaseOrderItemSchema).min(1, { message: 'At least one purchase item is required.' }),
+  totalAmount: coerceOptionalNumber('Total amount', { min: priceLimits.min, max: priceLimits.max }).optional(),
+  status: purchaseOrderStatusEnum.optional(),
+  paymentStatus: paymentStatusEnum.optional(),
+  notes: z.string().trim().max(1000, { message: 'Notes must not exceed 1000 characters.' }).optional(),
+});
+
+export const createPurchaseOrderSchema = purchaseOrderCoreSchema;
+export const updatePurchaseOrderSchema = purchaseOrderCoreSchema.partial();
+
+const purchaseOrderResponseItemSchema = purchaseOrderItemSchema.extend({
+  product: z
+    .union([
+      objectIdSchema,
+      z
+        .object({
+          _id: objectIdSchema.optional(),
+          name: z.string().trim().optional(),
+          code: z.string().trim().optional(),
+        })
+        .passthrough(),
+    ])
+    .optional(),
+});
+
+export const purchaseOrderSchema = z.object({
+  _id: objectIdSchema,
+  poid: trimmedString('Purchase order code', 64),
+  orderNumber: trimmedString('Order number', 64),
+  pobill: z.string().trim().max(100, { message: 'Invoice number must not exceed 100 characters.' }).optional(),
+  pobilldate: z.union([z.string(), z.date()]).optional(),
+  posupplier: trimmedString('Supplier name', 200),
+  supplier: supplierReferenceSchema,
+  organizationId: objectIdSchema.optional(),
+  transactionType: transactionTypeEnum.optional(),
+  selectedAccountIds: z.array(objectIdSchema).optional(),
+  accountingEntryType: accountingEntryTypeEnum.optional(),
+  orderDate: z.union([z.string(), z.date()]).optional(),
+  expectedDeliveryDate: z.union([z.string(), z.date()]).optional(),
+  actualDeliveryDate: z.union([z.string(), z.date()]).optional(),
+  items: z.array(purchaseOrderResponseItemSchema),
+  totalAmount: z.number().min(priceLimits.min, { message: 'Total amount must be greater than or equal to 0.' }),
+  status: purchaseOrderStatusEnum,
+  paymentStatus: paymentStatusEnum.optional(),
+  notes: z.string().trim().max(1000, { message: 'Notes must not exceed 1000 characters.' }).optional(),
+  createdBy: userReferenceSchema,
+  relatedTransactionGroupId: objectIdSchema.optional(),
+  createdAt: z.union([z.string(), z.date()]),
+  updatedAt: z.union([z.string(), z.date()]),
+});
+
+export const purchaseOrderSearchSchema = z.object({
+  poid: trimmedString('Purchase order code', 64).optional(),
+  pobill: trimmedString('Invoice number', 100).optional(),
+  posupplier: trimmedString('Supplier name', 200).optional(),
+  startDate: z.union([z.string(), z.date()]).optional(),
+  endDate: z.union([z.string(), z.date()]).optional(),
+  status: purchaseOrderStatusEnum.optional(),
+  paymentStatus: paymentStatusEnum.optional(),
+  page: z.coerce.number({ invalid_type_error: 'Page must be a number.' }).int().min(1).optional(),
+  limit: z
+    .coerce.number({ invalid_type_error: 'Limit must be a number.' })
+    .int()
+    .min(1)
+    .max(API_CONSTANTS.PAGINATION?.MAX_LIMIT ?? 100)
+    .optional(),
+  sortBy: z.string().trim().max(50, { message: 'Sort by must not exceed 50 characters.' }).optional(),
+  sortOrder: z.enum(['asc', 'desc']).optional(),
+});
+
+export const purchaseOrderIdSchema = z.object({
+  id: objectIdSchema,
+});
+
+export const purchaseOrderStatusValues = purchaseOrderStatusEnum.options;
+export const purchaseOrderPaymentStatusValues = paymentStatusEnum.options;
+export const purchaseOrderTransactionTypeValues = transactionTypeEnum.options;
+
+export default {
+  purchaseOrderSchema,
+  createPurchaseOrderSchema,
+  updatePurchaseOrderSchema,
+  purchaseOrderItemSchema,
+  purchaseOrderSearchSchema,
+  purchaseOrderIdSchema,
+  purchaseOrderStatusValues,
+  purchaseOrderPaymentStatusValues,
+  purchaseOrderTransactionTypeValues,
+};
+
+

````

## shared/scripts/generate-openapi.ts (M)
````diff
diff --git a/shared/scripts/generate-openapi.ts b/shared/scripts/generate-openapi.ts
index 9399f59e..3a855f89 100644
--- a/shared/scripts/generate-openapi.ts
+++ b/shared/scripts/generate-openapi.ts
@@ -8,7 +8,7 @@ import path from 'path';
 import { z } from 'zod';
 import { zodToJsonSchema } from 'zod-to-json-schema';
 
-type SupportedSchemaModule = 'sale' | 'customer' | 'supplier';
+type SupportedSchemaModule = 'sale' | 'customer' | 'supplier' | 'purchaseOrder';
 
 function resolveZodModule(name: SupportedSchemaModule): any {
   const fileName = `${name}.js`;
@@ -38,6 +38,7 @@ async function main() {
   const saleMod = resolveZodModule('sale');
   const customerMod = resolveZodModule('customer');
   const supplierMod = resolveZodModule('supplier');
+  const purchaseOrderMod = resolveZodModule('purchaseOrder');
 
   const saleItemSchema = saleMod.saleItemSchema as z.ZodTypeAny | undefined;
   const createSaleSchema = saleMod.createSaleSchema as z.ZodTypeAny | undefined;
@@ -55,6 +56,12 @@ async function main() {
   const updateSupplierSchema = supplierMod.updateSupplierSchema as z.ZodTypeAny | undefined;
   const supplierSearchSchema = supplierMod.supplierSearchSchema as z.ZodTypeAny | undefined;
 
+  const purchaseOrderSchema = purchaseOrderMod.purchaseOrderSchema as z.ZodTypeAny | undefined;
+  const purchaseOrderItemSchema = purchaseOrderMod.purchaseOrderItemSchema as z.ZodTypeAny | undefined;
+  const createPurchaseOrderSchema = purchaseOrderMod.createPurchaseOrderSchema as z.ZodTypeAny | undefined;
+  const updatePurchaseOrderSchema = purchaseOrderMod.updatePurchaseOrderSchema as z.ZodTypeAny | undefined;
+  const purchaseOrderSearchSchema = purchaseOrderMod.purchaseOrderSearchSchema as z.ZodTypeAny | undefined;
+
   if (!saleItemSchema || !createSaleSchema || !updateSaleSchema || !saleSearchSchema) {
     throw new Error('Missing sale schemas from shared module.');
   }
@@ -66,6 +73,10 @@ async function main() {
     throw new Error('Missing supplier schemas from shared module.');
   }
 
+  if (!purchaseOrderSchema || !purchaseOrderItemSchema || !createPurchaseOrderSchema || !updatePurchaseOrderSchema || !purchaseOrderSearchSchema) {
+    throw new Error('Missing purchase order schemas from shared module.');
+  }
+
   const document = {
     openapi: '3.0.3',
     info: {
@@ -77,7 +88,8 @@ async function main() {
     tags: [
       { name: 'Sales', description: 'Sales endpoints' },
       { name: 'Customers', description: 'Customer management endpoints' },
-      { name: 'Suppliers', description: 'Supplier management endpoints' }
+      { name: 'Suppliers', description: 'Supplier management endpoints' },
+      { name: 'Purchase Orders', description: 'Purchase order management endpoints' }
     ],
     paths: {},
     components: {
@@ -128,7 +140,12 @@ async function main() {
         Supplier: toJsonSchema(supplierSchema!, 'Supplier'),
         SupplierCreateRequest: toJsonSchema(createSupplierSchema!, 'SupplierCreateRequest'),
         SupplierUpdateRequest: toJsonSchema(updateSupplierSchema!, 'SupplierUpdateRequest'),
-        SupplierSearchQuery: toJsonSchema(supplierSearchSchema!, 'SupplierSearchQuery')
+        SupplierSearchQuery: toJsonSchema(supplierSearchSchema!, 'SupplierSearchQuery'),
+        PurchaseOrder: toJsonSchema(purchaseOrderSchema!, 'PurchaseOrder'),
+        PurchaseOrderItem: toJsonSchema(purchaseOrderItemSchema!, 'PurchaseOrderItem'),
+        PurchaseOrderCreateRequest: toJsonSchema(createPurchaseOrderSchema!, 'PurchaseOrderCreateRequest'),
+        PurchaseOrderUpdateRequest: toJsonSchema(updatePurchaseOrderSchema!, 'PurchaseOrderUpdateRequest'),
+        PurchaseOrderSearchQuery: toJsonSchema(purchaseOrderSearchSchema!, 'PurchaseOrderSearchQuery')
       }
     }
   } as const;
@@ -136,7 +153,7 @@ async function main() {
   const docAny = document as any;
 
   // Merge static path descriptors (LLM-friendly)
-  for (const descriptor of ['sales', 'customers', 'suppliers']) {
+  for (const descriptor of ['sales', 'customers', 'suppliers', 'purchaseOrders']) {
     try {
       const modPath = path.resolve(__dirname, `../api/paths/${descriptor}`);
       // eslint-disable-next-line @typescript-eslint/no-var-requires

````

## shared/types/api.ts (M)
````diff
diff --git a/shared/types/api.ts b/shared/types/api.ts
index c3ae0bc9..710fd2ed 100644
--- a/shared/types/api.ts
+++ b/shared/types/api.ts
@@ -3,6 +3,9 @@
  * 統一前後端的 API 介面規範
  */
 
+
+import type { PurchaseOrder as SharedPurchaseOrder, PurchaseOrderRequest as SharedPurchaseOrderCreateRequest, PurchaseOrderUpdateRequest as SharedPurchaseOrderUpdateRequest } from './purchase-order';
+
 /**
  * 基礎 API 回應型別
  */
@@ -269,69 +272,10 @@ export interface SaleResponse {
 /**
  * 採購訂單相關 API 型別
  */
-export interface PurchaseOrderCreateRequest {
-  orderNumber?: string;
-  supplier: string;
-  organizationId?: string;
-  transactionType?: string;
-  selectedAccountIds?: string[];
-  orderDate?: string;
-  expectedDeliveryDate?: string;
-  items: Array<{
-    product: string;
-    quantity: number;
-    price?: number;
-    unitPrice?: number;
-    subtotal?: number;
-    notes?: string;
-  }>;
-  totalAmount?: number;
-  status?: 'pending' | 'approved' | 'received' | 'cancelled' | 'completed';
-  paymentStatus?: '未付' | '已下收' | '已匯款';
-  notes?: string;
-}
-
-export interface PurchaseOrderResponse {
-  _id: string;
-  orderNumber: string;
-  supplier: {
-    _id: string;
-    name: string;
-  };
-  organizationId?: string;
-  items: Array<{
-    _id?: string;
-    product: {
-      _id: string;
-      name: string;
-      code?: string;
-    };
-    quantity: number;
-    price: number;
-    unitPrice?: number;
-    subtotal: number;
-    receivedQuantity?: number;
-    notes?: string;
-  }>;
-  totalAmount: number;
-  status: string;
-  orderDate: Date | string;
-  expectedDeliveryDate?: Date | string;
-  actualDeliveryDate?: Date | string;
-  createdBy?: {
-    _id: string;
-    username: string;
-  };
-  notes?: string;
-  createdAt: Date | string;
-  updatedAt: Date | string;
-}
-
-export interface PurchaseOrderUpdateRequest extends Partial<PurchaseOrderCreateRequest> {}
+export type PurchaseOrderCreateRequest = SharedPurchaseOrderCreateRequest;
+export type PurchaseOrderUpdateRequest = SharedPurchaseOrderUpdateRequest;
+export type PurchaseOrderResponse = SharedPurchaseOrder;
 
-/**
- * 出貨訂單相關 API 型別
- */
 export interface ShippingOrderCreateRequest {
   soid?: string;
   orderNumber?: string;

````

## shared/types/index.ts (M)
````diff
diff --git a/shared/types/index.ts b/shared/types/index.ts
index 0cd45d89..01e484e6 100644
--- a/shared/types/index.ts
+++ b/shared/types/index.ts
@@ -36,7 +36,11 @@ export * from './theme';
 export type {
   PurchaseOrderStatus,
   PaymentStatus,
-  PurchaseOrderRequest
+  PurchaseOrderRequest,
+  PurchaseOrderUpdateRequest,
+  PurchaseOrder,
+  PurchaseOrderItem,
+  PurchaseOrderSearchParams
 } from './purchase-order';
 
 // 業務邏輯型別 (避免與 api 衝突) - 使用重構後的版本

````

## shared/types/purchase-order.ts (M)
````diff
diff --git a/shared/types/purchase-order.ts b/shared/types/purchase-order.ts
index 903e7bc1..d413dc2b 100644
--- a/shared/types/purchase-order.ts
+++ b/shared/types/purchase-order.ts
@@ -1,147 +1,81 @@
 /**
- * 採購訂單相關型別定義
- * 統一前後端使用的型別，避免不一致問題
+ * Purchase order domain types aligned with shared Zod schemas (SSOT)
  */
 
-// 採購訂單狀態枚舉
-export type PurchaseOrderStatus = 'pending' | 'completed' | 'cancelled';
-export type PaymentStatus = '未付' | '已下收' | '已匯款';
+import type { z } from 'zod';
+import {
+  purchaseOrderSchema,
+  purchaseOrderItemSchema,
+  createPurchaseOrderSchema,
+  updatePurchaseOrderSchema,
+  purchaseOrderSearchSchema,
+  purchaseOrderStatusValues,
+  purchaseOrderPaymentStatusValues,
+  purchaseOrderTransactionTypeValues,
+} from '../schemas/zod/purchaseOrder';
 
 /**
- * 採購訂單項目介面
- * 統一使用 dquantity 和 dtotalCost 命名
+ * Enumerations derived from Zod enums
  */
-export interface PurchaseOrderItem {
-  _id?: string;
-  product: string; // 產品ID（字符串形式，適用於前後端）
-  did: string; // 產品代碼
-  dname: string; // 產品名稱
-  dquantity: number; // 數量
-  dtotalCost: number; // 總成本
-  unitPrice?: number; // 單價（自動計算或手動設置）
-  receivedQuantity?: number; // 已收貨數量
-  batchNumber?: string; // 批號（選填）
-  packageQuantity?: number; // 大包裝數量
-  boxQuantity?: number; // 盒裝數量
-  notes?: string; // 備註
-}
+export type PurchaseOrderStatus = typeof purchaseOrderStatusValues[number];
+export type PaymentStatus = typeof purchaseOrderPaymentStatusValues[number];
+export type PurchaseOrderTransactionType = typeof purchaseOrderTransactionTypeValues[number];
 
 /**
- * 採購訂單介面
- * 統一前後端使用的完整採購訂單結構
+ * Core entity types
  */
-export interface PurchaseOrder {
-  _id: string;
-  poid: string; // 進貨單號
-  orderNumber: string; // 系統訂單號
-  pobill?: string; // 發票號碼
-  pobilldate?: string | Date; // 發票日期
-  posupplier: string; // 供應商名稱
-  supplier?: string; // 供應商ID
-  organizationId?: string; // 機構ID
-  transactionType?: string; // 交易類型
-  selectedAccountIds?: string[]; // 選中的會計科目ID
-  accountingEntryType?: 'expense-asset' | 'asset-liability'; // 會計分錄類型
-  orderDate?: string | Date; // 訂單日期（向後兼容）
-  expectedDeliveryDate?: string | Date; // 預期交貨日期
-  actualDeliveryDate?: string | Date; // 實際交貨日期
-  items: PurchaseOrderItem[]; // 採購項目
-  totalAmount: number; // 總金額
-  status: PurchaseOrderStatus; // 訂單狀態
-  paymentStatus: PaymentStatus; // 付款狀態
-  notes?: string; // 備註
-  createdBy?: string; // 創建者ID
-  createdAt: string | Date; // 創建時間
-  updatedAt: string | Date; // 更新時間
-}
+export type PurchaseOrderItem = z.infer<typeof purchaseOrderItemSchema>;
+export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;
 
 /**
- * 前端表單使用的採購訂單資料結構
- * 包含前端特有的欄位和格式
+ * API request payload types
  */
-export interface PurchaseOrderFormData {
-  poid: string;
-  pobill: string;
-  pobilldate: Date;
-  posupplier: string; // 供應商名稱
-  supplier: string; // 供應商ID
-  items: PurchaseOrderItem[];
-  notes: string;
-  status: string;
-  paymentStatus: string;
-  multiplierMode: string | number; // 倍率模式
-}
+export type PurchaseOrderRequest = z.infer<typeof createPurchaseOrderSchema>;
+export type PurchaseOrderUpdateRequest = z.infer<typeof updatePurchaseOrderSchema>;
 
 /**
- * API 請求用的採購訂單資料
- * 用於新增和更新採購訂單
+ * Query parameters type
  */
-export interface PurchaseOrderRequest {
-  poid?: string;
+export type PurchaseOrderSearchParams = z.infer<typeof purchaseOrderSearchSchema>;
+
+/**
+ * Frontend form data model
+ */
+export interface PurchaseOrderFormData {
+  poid: string;
   pobill?: string;
   pobilldate?: Date | string;
   posupplier: string;
   supplier?: string;
   organizationId?: string;
-  transactionType?: string;
-  selectedAccountIds?: string[]; // 選中的會計科目ID
-  accountingEntryType?: 'expense-asset' | 'asset-liability'; // 會計分錄類型
+  transactionType?: PurchaseOrderTransactionType;
+  selectedAccountIds?: string[];
+  accountingEntryType?: 'expense-asset' | 'asset-liability';
+  orderDate?: Date | string;
+  expectedDeliveryDate?: Date | string;
+  actualDeliveryDate?: Date | string;
   items: PurchaseOrderItem[];
   notes?: string;
   status?: PurchaseOrderStatus;
   paymentStatus?: PaymentStatus;
+  multiplierMode?: string | number;
 }
 
 /**
- * 採購訂單列表項目
- * 用於列表顯示的簡化版本
+ * Minimal list item representation
  */
-export interface PurchaseOrderListItem {
-  _id: string;
-  poid: string;
-  orderNumber: string;
-  pobill?: string;
-  pobilldate?: string | Date;
-  posupplier: string;
-  totalAmount: number;
-  status: PurchaseOrderStatus;
-  paymentStatus: PaymentStatus;
-  createdAt: string | Date;
-}
+export type PurchaseOrderListItem = Pick<
+  PurchaseOrder,
+  '_id' | 'poid' | 'orderNumber' | 'pobill' | 'pobilldate' | 'posupplier' | 'totalAmount' | 'status' | 'paymentStatus' | 'createdAt'
+>;
 
 /**
- * 採購訂單搜尋參數
+ * Type guards leveraging Zod safeParse
  */
-export interface PurchaseOrderSearchParams {
-  poid?: string;
-  pobill?: string;
-  posupplier?: string;
-  startDate?: string | Date;
-  endDate?: string | Date;
-  status?: PurchaseOrderStatus;
-  paymentStatus?: PaymentStatus;
-}
-
-/**
- * 型別守衛函數
- */
-export function isPurchaseOrder(obj: any): obj is PurchaseOrder {
-  return obj && 
-         typeof obj._id === 'string' &&
-         typeof obj.poid === 'string' &&
-         typeof obj.orderNumber === 'string' &&
-         typeof obj.posupplier === 'string' &&
-         Array.isArray(obj.items) &&
-         typeof obj.totalAmount === 'number' &&
-         typeof obj.status === 'string' &&
-         typeof obj.paymentStatus === 'string';
-}
+export const isPurchaseOrder = (value: unknown): value is PurchaseOrder => {
+  return purchaseOrderSchema.safeParse(value).success;
+};
 
-export function isPurchaseOrderItem(obj: any): obj is PurchaseOrderItem {
-  return obj &&
-         typeof obj.product === 'string' &&
-         typeof obj.did === 'string' &&
-         typeof obj.dname === 'string' &&
-         typeof obj.dquantity === 'number' &&
-         typeof obj.dtotalCost === 'number';
-}
\ No newline at end of file
+export const isPurchaseOrderItem = (value: unknown): value is PurchaseOrderItem => {
+  return purchaseOrderItemSchema.safeParse(value).success;
+};

````
