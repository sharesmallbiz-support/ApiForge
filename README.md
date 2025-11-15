# 🚀 ApiForge

**A professional REST API testing tool** - Test, debug, and document your APIs with ease.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- 🎯 **Full HTTP Support** - GET, POST, PUT, DELETE, PATCH and more
- 📁 **Smart Organization** - Collections and folders to keep your APIs tidy
- 🌍 **Environment Management** - Switch between Dev, Test, and Production seamlessly
- 🔧 **Variable Substitution** - Use `{{variables}}` in URLs, headers, and body
- 📜 **Post-Response Scripting** - Chain requests and extract data automatically
- 📥 **Import APIs** - From OpenAPI specs or CURL commands
- 🎨 **Modern UI** - Clean, intuitive interface with dark mode
- 📊 **Request History** - Track all your API calls with full details
- 🔐 **Authentication** - Bearer tokens, Basic Auth, and API keys
- ⚡ **Lightning Fast** - Built with React, TypeScript, and Vite

---

## 🚦 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The application will open at `http://localhost:5000`

### First Time User?

When you first open ApiForge, you'll see a **Getting Started** walkthrough that guides you through:
1. Understanding the layout
2. Core concepts (Collections, Requests, Environments)
3. Using variables
4. Sample collection to try

**Or skip straight to the sample collection** by clicking "Load Sample Collection" on the welcome screen!

---

## 📖 User Guide

### Creating Your First Request

1. **Create a Collection**
   - Click the `+` button next to "Collections" in the sidebar
   - Enter a name (e.g., "My API")
   - Click "Create"

2. **Add a Request**
   - Right-click on your collection
   - Select "Add Request"
   - Enter details:
     - **Name**: "Get Users"
     - **Method**: GET
     - **URL**: `https://jsonplaceholder.typicode.com/users`
   - Click "Create"

3. **Send the Request**
   - Click on your request in the sidebar
   - Click the blue "Send" button
   - View the response on the right panel!

### Using Environments

Environments let you switch between different API servers without changing your requests.

**Create an Environment:**
1. Click the `+` next to "Environments" in sidebar
2. Enter name (e.g., "Development")
3. Add variables:
   - **Key**: `baseUrl`
   - **Value**: `https://api-dev.example.com`
   - **Scope**: Collection
4. Click "Create"

**Use Variables in Requests:**
```
URL: {{baseUrl}}/api/users
Header: Authorization: Bearer {{token}}
```

### Variable Scopes

- **Global**: Available everywhere (e.g., `apiKey`, `timeout`)
- **Workspace**: Available across all collections (e.g., `token`)
- **Collection**: Specific to one collection (e.g., `baseUrl`)

### Post-Response Scripts

Extract data from responses and chain requests together:

```javascript
// Extract authentication token
const response = pm.response.json();
if (response.token) {
  pm.environment.set("token", response.token);
  console.log("Token saved:", response.token);
}
```

```javascript
// Save created user ID
const response = pm.response.json();
if (response.id) {
  pm.environment.set("userId", response.id);
}
```

### Importing APIs

**From OpenAPI Spec:**
1. Click "Import" in sidebar
2. Go to "OpenAPI" tab
3. Enter OpenAPI spec URL
4. Click "Import from OpenAPI"
5. All endpoints created automatically!

**From CURL Command:**
1. Click "Import" in sidebar
2. Go to "CURL" tab
3. Paste your CURL command:
   ```bash
   curl -X POST https://api.example.com/users \
     -H 'Content-Type: application/json' \
     -d '{"name": "John"}'
   ```
4. Click "Import from CURL"

---

## 🎨 Application Layout

### 1. Sidebar (Left)
- **Collections Tab**: Browse your API collections, folders, and requests
- **Environments Tab**: Manage environment variables
- **Search**: Find requests quickly (coming soon)
- **Import**: Load APIs from OpenAPI or CURL

### 2. Request Builder (Center)
Configure your HTTP request:
- **URL Bar**: Enter endpoint URL
- **Method**: Select HTTP method (GET, POST, etc.)
- **Params**: Add query parameters
- **Headers**: Custom HTTP headers
- **Body**: JSON request body
- **Auth**: Authentication settings
- **Scripts**: Post-response scripts

### 3. Response Viewer (Right)
View API responses:
- **Status**: HTTP status code and response time
- **Body**: Formatted response body
- **Headers**: Response headers
- **History**: Past executions

---

## 💡 Pro Tips

1. **Keyboard Shortcuts** (coming soon)
   - `Cmd/Ctrl + Enter`: Send request
   - `Cmd/Ctrl + S`: Save request
   - `Cmd/Ctrl + K`: Focus search

2. **Organization Best Practices**
   - Use folders to group related endpoints
   - Create separate collections for different APIs
   - Use descriptive names for requests

3. **Environment Strategy**
   - Create environments for Dev, Test, and Production
   - Use collection-scoped variables for `baseUrl`
   - Use workspace-scoped variables for auth tokens

4. **Scripting Power**
   - Chain requests by extracting IDs
   - Validate responses programmatically
   - Debug with `console.log()`

5. **Reusability**
   - Define common headers in environments
   - Use variables for everything that changes
   - Create request templates in a "Templates" collection

---

## 🔧 Advanced Features

### Environment Headers
Add headers that apply to all requests when an environment is active:
1. Edit an environment
2. Add headers in the "Headers" section
3. Perfect for global authentication headers!

### Request History
Every request execution is saved:
1. Click on a request
2. View the "History" tab in the response panel
3. Click on past executions to review

### Script API Reference
Available in post-response scripts:

```javascript
// Response
pm.response.json()        // Parse JSON response
pm.response.text()        // Get response as text
pm.response.headers       // Response headers
pm.response.status        // Status code

// Environment
pm.environment.set(key, value)  // Set variable
pm.environment.get(key)         // Get variable

// Debugging
console.log(message)      // Output to console
```

---

## 📊 Example Workflows

### Testing a REST API

**Scenario**: Test a user management API

1. Create collection "User API"
2. Create requests:
   - GET `/users` - List all users
   - GET `/users/:id` - Get user details
   - POST `/users` - Create user (save ID to `userId` variable)
   - PUT `/users/{{userId}}` - Update user
   - DELETE `/users/{{userId}}` - Delete user
3. Create environment with `baseUrl` variable
4. Test the complete CRUD flow!

### OAuth Authentication Flow

**Scenario**: Get token, then make authenticated requests

1. Create "Login" request:
   - POST `{{authUrl}}/oauth/token`
   - Add script to save token:
     ```javascript
     const res = pm.response.json();
     pm.environment.set("token", res.access_token);
     ```

2. Create "Get Profile" request:
   - GET `{{apiUrl}}/me`
   - Add header: `Authorization: Bearer {{token}}`

3. Run Login request first, then Profile request uses saved token!

---

## 🎯 Sample Collection

The built-in sample collection uses **JSONPlaceholder** (a free fake REST API) to demonstrate:

- ✅ GET requests with query parameters
- ✅ POST requests with JSON body
- ✅ PUT and DELETE operations
- ✅ Using variables in URLs
- ✅ Post-response scripts to extract data
- ✅ Environment configuration

**Try it**: Click "Load Sample Collection" on the welcome screen!

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: TanStack Query v5
- **Backend**: Express.js, TypeScript
- **Database**: SQLite with Drizzle ORM
- **Validation**: Zod schemas
- **Styling**: Tailwind CSS with dark mode

---

## 📝 Roadmap

### Coming Soon
- [ ] Keyboard shortcuts
- [ ] Request duplication
- [ ] Search functionality
- [ ] File upload for form data
- [ ] Cookie management
- [ ] Response comparison
- [ ] Code generation (cURL, fetch, axios)
- [ ] WebSocket support
- [ ] GraphQL support

### Under Development
- [x] CURL import
- [x] OpenAPI import
- [x] Environment-scoped headers
- [x] Post-response scripting
- [x] Request history

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License - feel free to use this in your projects!

---

## 🆘 Help & Support

### In-App Help
- Click the **Help** button in the top-right corner
- View the **Getting Started** guide
- Load the **Sample Collection** for examples

### Common Issues

**Q: My requests aren't saving**
- Make sure to click the "Save" button after editing
- Check browser console for errors

**Q: Variables aren't being substituted**
- Ensure you've selected an environment from the dropdown
- Verify variable names match exactly (case-sensitive)
- Check variable scope matches the request context

**Q: Import from OpenAPI failed**
- Verify the URL is accessible
- Ensure it's a valid OpenAPI 3.0 spec
- Check browser console for detailed error

---

## 🌟 Star History

If you find ApiForge useful, please consider giving it a star! ⭐

---

Made with ❤️ for API developers everywhere
