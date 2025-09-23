/**
 * OpenAPI path descriptors for Customer endpoints
 * Keep minimal and reference Zod-derived components via $ref
 */

const CustomersPaths = {
  "/customers": {
    get: {
      summary: "List customers",
      operationId: "listCustomers",
      tags: ["Customers"],
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              examples: {
                customers: {
                  summary: "Customer list",
                  value: {
                    success: true,
                    message: "OK",
                    data: [
                      { _id: "64f0a1b2c3d4e5f678901234", code: "C00001", name: "John Doe", membershipLevel: "regular" }
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
      summary: "Create a customer",
      operationId: "createCustomer",
      tags: ["Customers"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CustomerCreateRequest" }
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
                    data: { _id: "64f0a1b2c3d4e5f678901234", code: "C00001", name: "John Doe" },
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
  "/customers/quick": {
    post: {
      summary: "Quick create or update customer",
      operationId: "quickCreateCustomer",
      tags: ["Customers"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CustomerQuickCreateRequest" },
            examples: {
              example: {
                summary: "Quick create payload",
                value: {
                  name: "鄭暄瀚",
                  birthdate: "1995/06/19",
                  idCardNumber: "Hxxxxxxxxx",
                  notes: "測試備註"
                }
              }
            }
          },
          "application/x-www-form-urlencoded": {
            schema: {
              type: "object",
              required: ["name", "birthdate", "idCardNumber"],
              properties: {
                name: { type: "string", description: "客戶姓名", example: "鄭暄瀚" },
                birthdate: { type: "string", description: "生日 (YYYY/MM/DD)", example: "1995/06/19" },
                idCardNumber: { type: "string", description: "身分證字號", example: "Hxxxxxxxxx" },
                notes: { type: "string", description: "備註", example: "測試備註" }
              }
            }
          }
        }
      },
      responses: {
        "200": {
          description: "Created or updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              examples: {
                success: {
                  summary: "Customer upserted",
                  value: {
                    success: true,
                    message: "Customer saved successfully",
                    data: { _id: "64f0a1b2c3d4e5f678901234", name: "王小明", idCardNumber: "H201627336" },
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
  "/customers/{id}": {
    get: {
      summary: "Get customer by ID",
      operationId: "getCustomerById",
      tags: ["Customers"],
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
                customer: {
                  summary: "Customer",
                  value: {
                    success: true,
                    message: "OK",
                    data: { _id: "64f0a1b2c3d4e5f678901234", code: "C00001", name: "John Doe" },
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
      summary: "Update a customer",
      operationId: "updateCustomer",
      tags: ["Customers"],
      parameters: [
        { in: "path", name: "id", required: true, schema: { type: "string" } }
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CustomerUpdateRequest" }
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
                    data: { _id: "64f0a1b2c3d4e5f678901234", code: "C00001", name: "John Doe", membershipLevel: "gold" },
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
      summary: "Delete a customer",
      operationId: "deleteCustomer",
      tags: ["Customers"],
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

export default CustomersPaths;
