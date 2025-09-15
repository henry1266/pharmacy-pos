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
        "200": { description: "OK" },
        "500": { description: "Server error" }
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
        "200": { description: "Created" },
        "400": { description: "Validation error" },
        "500": { description: "Server error" }
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
        "200": { description: "OK" },
        "404": { description: "Not found" },
        "500": { description: "Server error" }
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
        "200": { description: "Updated" },
        "400": { description: "Validation error" },
        "404": { description: "Not found" },
        "500": { description: "Server error" }
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
        "200": { description: "Deleted" },
        "404": { description: "Not found" },
        "500": { description: "Server error" }
      }
    }
  }
} as const;

export default SalesPaths;
