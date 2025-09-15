/**
 * OpenAPI path descriptors for Sales endpoints
 * Keep minimal and reference Zod-derived components via $ref
 */

const SalesPaths = {
  "/sales": {
    get: {
      summary: "List sales with optional search",
      tags: ["Sales"],
      parameters: [
        { in: "query", name: "search", schema: { type: "string" } },
        { in: "query", name: "wildcardSearch", schema: { type: "string" } }
      ],
      responses: {
        "200": { description: "OK" }
      }
    },
    post: {
      summary: "Create a sale",
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
        "400": { description: "Validation error" }
      }
    }
  },
  "/sales/{id}": {
    get: {
      summary: "Get sale by ID",
      tags: ["Sales"],
      parameters: [
        { in: "path", name: "id", required: true, schema: { type: "string" } }
      ],
      responses: {
        "200": { description: "OK" },
        "404": { description: "Not found" }
      }
    },
    put: {
      summary: "Update a sale",
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
        "404": { description: "Not found" }
      }
    },
    delete: {
      summary: "Delete a sale",
      tags: ["Sales"],
      parameters: [
        { in: "path", name: "id", required: true, schema: { type: "string" } }
      ],
      responses: {
        "200": { description: "Deleted" },
        "404": { description: "Not found" }
      }
    }
  }
} as const;

export default SalesPaths;

