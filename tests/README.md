# 🧪 AskTennis Test Suite

This directory contains all test files for the AskTennis application, organized by type and scope.

## 📁 Test Structure

### **`client/`** - Frontend Tests
- **`App.test.tsx`** - React component tests
- **`setupTests.ts`** - Jest testing configuration

### **`integration/`** - Integration Tests
- **`test-enhanced-integration.js`** - End-to-end integration tests
  - Tests complete query flow from frontend to backend
  - Validates AI query processing
  - Tests database interactions

### **`unit/`** - Unit Tests
- **`test-sportsradar.js`** - Sportradar API unit tests
  - Tests API connectivity
  - Validates data fetching
  - Tests error handling

## 🚀 Running Tests

### **Backend Tests**
```bash
# Run all backend tests
npm test

# Run specific test files
node tests/unit/test-sportsradar.js
node tests/integration/test-enhanced-integration.js
```

### **Frontend Tests**
```bash
# Run React tests
cd client
npm test

# Run with coverage
npm test -- --coverage
```

## 📋 Test Categories

### **Unit Tests**
- Test individual functions and modules
- Mock external dependencies
- Fast execution
- High coverage

### **Integration Tests**
- Test component interactions
- Test API endpoints
- Test database operations
- End-to-end workflows

### **Frontend Tests**
- React component rendering
- User interaction testing
- UI state management
- Responsive design validation

## 🎯 Test Coverage Goals

- **Backend**: 80%+ code coverage
- **Frontend**: 70%+ component coverage
- **API**: 100% endpoint coverage
- **Critical Paths**: 100% integration coverage

## 🔧 Test Configuration

Tests use:
- **Jest** for JavaScript testing
- **React Testing Library** for component tests
- **Supertest** for API testing
- **Custom mocks** for external services
