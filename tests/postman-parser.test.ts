import { describe, it, expect } from "vitest";
import { parsePostmanCollection, parsePostmanEnvironment } from "../server/postman-parser";

describe("Postman Parser", () => {
  describe("Postman Collection Parsing", () => {
    it("should parse the provided FCN collection sample", () => {
      const collection = {
        info: {
          _postman_id: "24ed4e10-0610-4224-9e59-127327903fda",
          name: "FCN",
          schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
          _exporter_id: "15672818",
        },
        item: [
          {
            name: "classify",
            item: [
              {
                name: "APIM",
                item: [
                  {
                    name: "llm/classification",
                    request: {
                      method: "POST",
                      header: [
                        {
                          key: "subscription-key",
                          value: "{{apim_subscription_key}}",
                          type: "text",
                        },
                      ],
                      body: {
                        mode: "raw",
                        raw: '{\n    "input": "i need labs"\n}',
                        options: {
                          raw: {
                            language: "json",
                          },
                        },
                      },
                      url: {
                        raw: "{{apim_base_url}}/llm/classification",
                        host: ["{{apim_base_url}}"],
                        path: ["llm", "classification"],
                      },
                    },
                    response: [],
                  },
                ],
              },
              {
                name: "classify",
                request: {
                  method: "POST",
                  header: [
                    {
                      key: "api-key",
                      value: "{{api-key}}",
                      type: "text",
                    },
                  ],
                  body: {
                    mode: "raw",
                    raw: '{\n    "input": "cough and chills"\n}',
                    options: {
                      raw: {
                        language: "json",
                      },
                    },
                  },
                  url: {
                    raw: "{{base_url}}/classify",
                    host: ["{{base_url}}"],
                    path: ["classify"],
                  },
                },
                response: [],
              },
            ],
          },
          {
            name: "system",
            item: [
              {
                name: "health",
                request: {
                  method: "GET",
                  header: [],
                  url: {
                    raw: "{{base_url}}/system/health",
                    host: ["{{base_url}}"],
                    path: ["system", "health"],
                  },
                },
                response: [],
              },
            ],
          },
        ],
      };

      const parsed = parsePostmanCollection(collection);

      expect(parsed.name).toBe("FCN");
      expect(parsed.folders).toHaveLength(2);

      // Check first folder (classify)
      const classifyFolder = parsed.folders.find((f) => f.name === "classify");
      expect(classifyFolder).toBeDefined();
      expect(classifyFolder!.requests).toHaveLength(2);

      // Check nested folder handling (APIM subfolder should be flattened)
      const apimRequest = classifyFolder!.requests.find((r) =>
        r.name.includes("llm/classification")
      );
      expect(apimRequest).toBeDefined();
      expect(apimRequest!.method).toBe("POST");
      expect(apimRequest!.headers).toHaveLength(1);
      expect(apimRequest!.headers[0].key).toBe("subscription-key");
      expect(apimRequest!.body?.type).toBe("json");

      // Check second folder (system)
      const systemFolder = parsed.folders.find((f) => f.name === "system");
      expect(systemFolder).toBeDefined();
      expect(systemFolder!.requests).toHaveLength(1);
      expect(systemFolder!.requests[0].method).toBe("GET");
    });

    it("should handle URLs with query parameters", () => {
      const collection = {
        info: {
          name: "Test Collection",
        },
        item: [
          {
            name: "Test Request",
            request: {
              method: "GET",
              url: {
                raw: "{{base_url}}/test?param1=value1&param2=value2",
                host: ["{{base_url}}"],
                path: ["test"],
                query: [
                  {
                    key: "param1",
                    value: "value1",
                  },
                  {
                    key: "param2",
                    value: "value2",
                    disabled: true,
                  },
                ],
              },
            },
          },
        ],
      };

      const parsed = parsePostmanCollection(collection);
      const request = parsed.folders[0].requests[0];

      expect(request.params).toHaveLength(2);
      expect(request.params[0].key).toBe("param1");
      expect(request.params[0].enabled).toBe(true);
      expect(request.params[1].key).toBe("param2");
      expect(request.params[1].enabled).toBe(false);
    });

    it("should handle disabled headers", () => {
      const collection = {
        info: {
          name: "Test",
        },
        item: [
          {
            name: "Request",
            request: {
              method: "GET",
              header: [
                {
                  key: "Authorization",
                  value: "Bearer token",
                  disabled: false,
                },
                {
                  key: "X-Custom",
                  value: "value",
                  disabled: true,
                },
              ],
              url: "{{baseUrl}}/test",
            },
          },
        ],
      };

      const parsed = parsePostmanCollection(collection);
      const request = parsed.folders[0].requests[0];

      expect(request.headers).toHaveLength(2);
      expect(request.headers[0].enabled).toBe(true);
      expect(request.headers[1].enabled).toBe(false);
    });

    it("should handle different body types", () => {
      const collection = {
        info: {
          name: "Test",
        },
        item: [
          {
            name: "JSON Request",
            request: {
              method: "POST",
              body: {
                mode: "raw",
                raw: '{"key": "value"}',
                options: {
                  raw: {
                    language: "json",
                  },
                },
              },
              url: "{{baseUrl}}/test",
            },
          },
          {
            name: "Form Request",
            request: {
              method: "POST",
              body: {
                mode: "formdata",
                raw: "key=value",
              },
              url: "{{baseUrl}}/test",
            },
          },
        ],
      };

      const parsed = parsePostmanCollection(collection);

      expect(parsed.folders[0].requests[0].body?.type).toBe("json");
      expect(parsed.folders[0].requests[1].body?.type).toBe("form");
    });

    it("should flatten nested folders", () => {
      const collection = {
        info: {
          name: "Test",
        },
        item: [
          {
            name: "Parent Folder",
            item: [
              {
                name: "Child Folder",
                item: [
                  {
                    name: "Nested Request",
                    request: {
                      method: "GET",
                      url: "{{baseUrl}}/test",
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      const parsed = parsePostmanCollection(collection);

      expect(parsed.folders).toHaveLength(1);
      expect(parsed.folders[0].name).toBe("Parent Folder");
      expect(parsed.folders[0].requests).toHaveLength(1);
      expect(parsed.folders[0].requests[0].name).toBe("Child Folder / Nested Request");
    });

    it("should put standalone requests in General folder", () => {
      const collection = {
        info: {
          name: "Test",
        },
        item: [
          {
            name: "Standalone Request",
            request: {
              method: "GET",
              url: "{{baseUrl}}/test",
            },
          },
          {
            name: "Folder",
            item: [
              {
                name: "Folder Request",
                request: {
                  method: "POST",
                  url: "{{baseUrl}}/test",
                },
              },
            ],
          },
        ],
      };

      const parsed = parsePostmanCollection(collection);

      expect(parsed.folders).toHaveLength(2);
      const generalFolder = parsed.folders.find((f) => f.name === "General");
      expect(generalFolder).toBeDefined();
      expect(generalFolder!.requests).toHaveLength(1);
      expect(generalFolder!.requests[0].name).toBe("Standalone Request");
    });
  });

  describe("Postman Environment Parsing", () => {
    it("should parse the provided dev environment sample", () => {
      const environment = {
        id: "df1e986c-a100-486e-af18-ca248bfdab81",
        name: "dev",
        values: [
          {
            key: "base_url",
            value: "https://bsw-category.azurewebsites.net",
            type: "default",
            enabled: true,
          },
          {
            key: "fn_base_url",
            value: "https://bswbakeofffunc-tst2-sc.azurewebsites.net/api",
            type: "default",
            enabled: true,
          },
          {
            key: "apim_subscription_key",
            value: "5581ae28bf4d4779aa4db952222e7b72",
            type: "default",
            enabled: true,
          },
          {
            key: "user_token",
            value: "",
            type: "any",
            enabled: true,
          },
        ],
        _postman_variable_scope: "environment",
        _postman_exported_at: "2025-11-19T17:22:01.654Z",
        _postman_exported_using: "Postman/11.72.3",
      };

      const parsed = parsePostmanEnvironment(environment);

      expect(parsed.name).toBe("dev");
      expect(parsed.variables).toHaveLength(4);
      expect(parsed.variables[0].key).toBe("base_url");
      expect(parsed.variables[0].value).toBe("https://bsw-category.azurewebsites.net");
      expect(parsed.variables[0].enabled).toBe(true);
      expect(parsed.variables[0].scope).toBe("global");
    });

    it("should handle empty variables", () => {
      const environment = {
        name: "Test Environment",
        values: [
          {
            key: "empty_var",
            value: "",
            enabled: true,
          },
        ],
        _postman_variable_scope: "environment",
      };

      const parsed = parsePostmanEnvironment(environment);

      expect(parsed.variables).toHaveLength(1);
      expect(parsed.variables[0].value).toBe("");
      expect(parsed.variables[0].enabled).toBe(true);
    });

    it("should handle disabled variables", () => {
      const environment = {
        name: "Test",
        values: [
          {
            key: "enabled_var",
            value: "value1",
            enabled: true,
          },
          {
            key: "disabled_var",
            value: "value2",
            enabled: false,
          },
        ],
        _postman_variable_scope: "environment",
      };

      const parsed = parsePostmanEnvironment(environment);

      expect(parsed.variables[0].enabled).toBe(true);
      expect(parsed.variables[1].enabled).toBe(false);
    });

    it("should throw error for invalid environment format", () => {
      const invalidEnvironment = {
        name: "Test",
        // Missing values array
      };

      expect(() => parsePostmanEnvironment(invalidEnvironment)).toThrow(
        "Invalid Postman environment format"
      );
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should throw error for invalid collection format", () => {
      const invalidCollection = {
        // Missing info and item
      };

      expect(() => parsePostmanCollection(invalidCollection)).toThrow(
        "Invalid Postman collection format"
      );
    });

    it("should handle collection with no items", () => {
      const collection = {
        info: {
          name: "Empty Collection",
        },
        item: [],
      };

      const parsed = parsePostmanCollection(collection);

      expect(parsed.name).toBe("Empty Collection");
      expect(parsed.folders).toHaveLength(0);
    });

    it("should handle URLs as strings", () => {
      const collection = {
        info: {
          name: "Test",
        },
        item: [
          {
            name: "Request",
            request: {
              method: "GET",
              url: "https://api.example.com/test",
            },
          },
        ],
      };

      const parsed = parsePostmanCollection(collection);

      expect(parsed.folders[0].requests[0].url).toBe("https://api.example.com/test");
    });

    it("should handle complex URL objects with host arrays", () => {
      const collection = {
        info: {
          name: "Test",
        },
        item: [
          {
            name: "Request",
            request: {
              method: "GET",
              url: {
                host: ["api", "example", "com"],
                path: ["v1", "users"],
              },
            },
          },
        ],
      };

      const parsed = parsePostmanCollection(collection);

      expect(parsed.folders[0].requests[0].url).toContain("api.example.com");
      expect(parsed.folders[0].requests[0].url).toContain("/v1/users");
    });
  });
});
