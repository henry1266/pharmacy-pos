/**
 * OpenAPI path descriptors for Supplier endpoints
 * Keep minimal and reference Zod-derived components via $ref
 */

const SuppliersPaths = {
  "/suppliers": {
    get: {
      summary: "List suppliers",
      operationId: "listSuppliers",
      tags: ["Suppliers"],
      parameters: [
        { in: "query", name: "search", schema: { type: "string" } },
        { in: "query", name: "active", schema: { type: "boolean" } },
        { in: "query", name: "page", schema: { type: "integer", minimum: 1 } },
        { in: "query", name: "limit", schema: { type: "integer", minimum: 1, maximum: 100 } },
        { in: "query", name: "sortBy", schema: { type: "string" } },
        { in: "query", name: "sortOrder", schema: { type: "string", enum: ["asc", "desc"] } }
      ],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              examples: {
                suppliers: {
                  summary: "Supplier list",
                  value: {
                    success: true,
                    message: "OK",
                    data: [
                      {
                        _id: "64f0a1b2c3d4e5f678900001",
                        code: "S00001",
                        shortCode: "S1",
                        name: "Medicare Supplies Co.",
                        contactPerson: "Alice Lee",
                        phone: "+886-2-1234-5678"
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
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
        }
      }
    },
    post: {
      summary: "Create a supplier",
      operationId: "createSupplier",
      tags: ["Suppliers"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SupplierCreateRequest" }
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
                    data: {
                      _id: "64f0a1b2c3d4e5f678900001",
                      code: "S00002",
                      name: "Good Health Distributors"
                    },
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
  "/suppliers/{id}": {
    get: {
      summary: "Get supplier by ID",
      operationId: "getSupplierById",
      tags: ["Suppliers"],
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
                supplier: {
                  summary: "Supplier",
                  value: {
                    success: true,
                    message: "OK",
                    data: {
                      _id: "64f0a1b2c3d4e5f678900001",
                      code: "S00001",
                      name: "Medicare Supplies Co.",
                      phone: "+886-2-1234-5678"
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
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
        },
        "500": {
          description: "Server error",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
        }
      }
    },
    put: {
      summary: "Update a supplier",
      operationId: "updateSupplier",
      tags: ["Suppliers"],
      parameters: [
        { in: "path", name: "id", required: true, schema: { type: "string" } }
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SupplierUpdateRequest" }
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
                    data: {
                      _id: "64f0a1b2c3d4e5f678900001",
                      code: "S00001",
                      name: "Medicare Supplies Co.",
                      phone: "+886-2-0000-0000"
                    },
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
      summary: "Delete a supplier",
      operationId: "deleteSupplier",
      tags: ["Suppliers"],
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
                  value: {
                    success: true,
                    message: "Deleted",
                    data: null,
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
    }
  }
} as const;

export default SuppliersPaths;
