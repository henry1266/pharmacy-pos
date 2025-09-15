/**
 * OpenAPI path descriptors for Sales endpoints
 * Keep minimal and reference Zod-derived components via $ref
 */

const SalesPaths = {
  "/sales": {
    get: {
      summary: "List sales with optional search",
      operationId: "listSales",
      tags: ["Sales"],
      parameters: [
        { in: "query", name: "search", schema: { type: "string" } },
        { in: "query", name: "wildcardSearch", schema: { type: "string" } }
      ],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              examples: {
                success: {
                  summary: "Sales list",
                  value: {
                    success: true,
                    message: "OK",
                    data: [
                      { _id: "64f0a1b2c3d4e5f678901234", saleNumber: "20250101001", totalAmount: 1234.56 }
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
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
        }
      }
    },
    post: {
      summary: "Create a sale",
      operationId: "createSale",
      tags: ["Sales"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SaleCreateRequest" }
          }
        }
      },
      responses: {
        "200": {
          description: "Created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              examples: {
                created: {
                  summary: "Created",
                  value: {
                    success: true,
                    message: "Created",
                    data: { _id: "64f0a1b2c3d4e5f678901234", saleNumber: "20250101001", totalAmount: 100 },
                    timestamp: "2025-01-01T00:00:00.000Z"
                  }
                }
              }
            }
          }
        },
        "400": {
          description: "Validation error",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
        },
        "500": {
          description: "Server error",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
        }
      }
    }
  },
  "/sales/{id}": {
    get: {
      summary: "Get sale by ID",
      operationId: "getSaleById",
      tags: ["Sales"],
      parameters: [
        { in: "path", name: "id", required: true, schema: { type: "string" } }
      ],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              examples: {
                success: {
                  summary: "Single sale",
                  value: {
                    success: true,
                    message: "OK",
                    data: { _id: "64f0a1b2c3d4e5f678901234", saleNumber: "20250101001", totalAmount: 123.45 },
                    timestamp: "2025-01-01T00:00:00.000Z"
                  }
                }
              }
            }
          }
        },
        "404": {
          description: "Not found",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
        },
        "500": {
          description: "Server error",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
        }
      }
    },
    put: {
      summary: "Update a sale",
      operationId: "updateSale",
      tags: ["Sales"],
      parameters: [
        { in: "path", name: "id", required: true, schema: { type: "string" } }
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SaleUpdateRequest" }
          }
        }
      },
      responses: {
        "200": {
          description: "Updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              examples: {
                updated: {
                  summary: "Updated",
                  value: {
                    success: true,
                    message: "Updated",
                    data: { _id: "64f0a1b2c3d4e5f678901234", saleNumber: "20250101001" },
                    timestamp: "2025-01-01T00:00:00.000Z"
                  }
                }
              }
            }
          }
        },
        "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
      }
    },
    delete: {
      summary: "Delete a sale",
      operationId: "deleteSale",
      tags: ["Sales"],
      parameters: [
        { in: "path", name: "id", required: true, schema: { type: "string" } }
      ],
      responses: {
        "200": {
          description: "Deleted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              examples: {
                deleted: {
                  summary: "Deleted",
                  value: { success: true, message: "Deleted", data: { id: "64f0a1b2c3d4e5f678901234" }, timestamp: "2025-01-01T00:00:00.000Z" }
                }
              }
            }
          }
        },
        "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
      }
    }
  }
} as const;

export default SalesPaths;
