/**
 * OpenAPI path descriptors for Purchase Order endpoints
 * Keep responses referencing shared schemas via $ref to ensure SSOT alignment
 */

const PurchaseOrdersPaths = {
  "/purchase-orders": {
    get: {
      summary: "List purchase orders",
      operationId: "listPurchaseOrders",
      tags: ["Purchase Orders"],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/PurchaseOrder" }
                      }
                    }
                  }
                ]
              },
              examples: {
                purchaseOrders: {
                  summary: "Purchase order list",
                  value: {
                    success: true,
                    message: "OK",
                    data: [
                      {
                        _id: "64f0a1b2c3d4e5f678901234",
                        poid: "PO-2025-0001",
                        orderNumber: "PO-2025-0001",
                        posupplier: "Acme Pharma",
                        supplier: {
                          _id: "64f0a1b2c3d4e5f678909999",
                          name: "Acme Pharma"
                        },
                        items: [
                          {
                            _id: "64f0a1b2c3d4e5f678901999",
                            did: "SKU-1001",
                            dname: "Vitamin C 500mg",
                            dquantity: 10,
                            dtotalCost: 2500,
                            unitPrice: 250
                          }
                        ],
                        totalAmount: 2500,
                        status: "pending",
                        paymentStatus: "¥¼¥I",
                        createdAt: "2025-01-01T00:00:00.000Z",
                        updatedAt: "2025-01-01T00:00:00.000Z"
                      }
                    ],
                    timestamp: "2025-01-01T00:00:00.000Z"
                  }
                }
              }
            }
          }
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        }
      }
    },
    post: {
      summary: "Create a purchase order",
      operationId: "createPurchaseOrder",
      tags: ["Purchase Orders"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PurchaseOrderCreateRequest" }
          }
        }
      },
      responses: {
        "200": {
          description: "Created",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/PurchaseOrder" }
                    }
                  }
                ]
              },
              examples: {
                created: {
                  summary: "Created purchase order",
                  value: {
                    success: true,
                    message: "Created",
                    data: {
                      _id: "64f0a1b2c3d4e5f678901235",
                      poid: "PO-2025-0002",
                      orderNumber: "PO-2025-0002",
                      posupplier: "Acme Pharma",
                      items: [
                        {
                          _id: "64f0a1b2c3d4e5f678902000",
                          did: "SKU-1002",
                          dname: "Pain Relief Tablets",
                          dquantity: 20,
                          dtotalCost: 4000,
                          unitPrice: 200
                        }
                      ],
                      totalAmount: 4000,
                      status: "pending",
                      paymentStatus: "¥¼¥I",
                      createdAt: "2025-01-02T00:00:00.000Z",
                      updatedAt: "2025-01-02T00:00:00.000Z"
                    },
                    timestamp: "2025-01-02T00:00:00.000Z"
                  }
                }
              }
            }
          }
        },
        "400": {
          description: "Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        },
        "401": {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        }
      }
    }
  },
  "/purchase-orders/{id}": {
    get: {
      summary: "Get purchase order by ID",
      operationId: "getPurchaseOrderById",
      tags: ["Purchase Orders"],
      parameters: [
        { in: "path", name: "id", required: true, schema: { type: "string" } }
      ],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  { properties: { data: { $ref: "#/components/schemas/PurchaseOrder" } } }
                ]
              },
              examples: {
                purchaseOrder: {
                  summary: "Purchase order",
                  value: {
                    success: true,
                    message: "OK",
                    data: {
                      _id: "64f0a1b2c3d4e5f678901234",
                      poid: "PO-2025-0001",
                      orderNumber: "PO-2025-0001",
                      posupplier: "Acme Pharma",
                      items: [
                        {
                          _id: "64f0a1b2c3d4e5f678901999",
                          did: "SKU-1001",
                          dname: "Vitamin C 500mg",
                          dquantity: 10,
                          dtotalCost: 2500,
                          unitPrice: 250
                        }
                      ],
                      totalAmount: 2500,
                      status: "pending",
                      paymentStatus: "¥¼¥I",
                      createdAt: "2025-01-01T00:00:00.000Z",
                      updatedAt: "2025-01-01T00:00:00.000Z"
                    },
                    timestamp: "2025-01-01T00:00:00.000Z"
                  }
                }
              }
            }
          }
        },
        "404": {
          description: "Not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        }
      }
    },
    put: {
      summary: "Update a purchase order",
      operationId: "updatePurchaseOrder",
      tags: ["Purchase Orders"],
      parameters: [
        { in: "path", name: "id", required: true, schema: { type: "string" } }
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PurchaseOrderUpdateRequest" }
          }
        }
      },
      responses: {
        "200": {
          description: "Updated",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  { properties: { data: { $ref: "#/components/schemas/PurchaseOrder" } } }
                ]
              }
            }
          }
        },
        "400": {
          description: "Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        },
        "401": {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        },
        "404": {
          description: "Not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        }
      }
    },
    delete: {
      summary: "Delete a purchase order",
      operationId: "deletePurchaseOrder",
      tags: ["Purchase Orders"],
      parameters: [
        { in: "path", name: "id", required: true, schema: { type: "string" } }
      ],
      responses: {
        "200": {
          description: "Deleted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" }
            }
          }
        },
        "404": {
          description: "Not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        }
      }
    }
  },
  "/purchase-orders/supplier/{supplierId}": {
    get: {
      summary: "List purchase orders by supplier",
      operationId: "getPurchaseOrdersBySupplier",
      tags: ["Purchase Orders"],
      parameters: [
        { in: "path", name: "supplierId", required: true, schema: { type: "string" } }
      ],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/PurchaseOrder" }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        "404": {
          description: "Supplier not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        }
      }
    }
  },
  "/purchase-orders/product/{productId}": {
    get: {
      summary: "List purchase orders by product",
      operationId: "getPurchaseOrdersByProduct",
      tags: ["Purchase Orders"],
      parameters: [
        { in: "path", name: "productId", required: true, schema: { type: "string" } }
      ],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/PurchaseOrder" }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        "404": {
          description: "Product not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        }
      }
    }
  },
  "/purchase-orders/recent/list": {
    get: {
      summary: "List recent purchase orders",
      operationId: "getRecentPurchaseOrders",
      tags: ["Purchase Orders"],
      parameters: [
        {
          in: "query",
          name: "limit",
          required: false,
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 10
          }
        }
      ],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/PurchaseOrder" }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        "500": {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        }
      }
    }
  }
} as const;

export default PurchaseOrdersPaths;
