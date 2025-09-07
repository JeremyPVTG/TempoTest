# Testing Guidelines

## Overview

This project uses a comprehensive testing strategy to ensure code quality and prevent runtime issues. We use **Vitest** as our test runner with **React Testing Library** for component testing.

## Testing Stack

- **Vitest** - Fast test runner optimized for Vite
- **@testing-library/react** - Component testing utilities
- **@testing-library/user-event** - User interaction testing
- **@testing-library/jest-dom** - Enhanced DOM assertions
- **Happy DOM** - Fast DOM implementation for tests
- **MSW (Mock Service Worker)** - API mocking
- **Husky** - Git hooks for pre-commit testing

## Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## Test Structure

### File Organization
- Place test files in `__tests__` folders next to components
- Use naming convention: `ComponentName.test.tsx`
- Global test utilities in `src/test/utils.tsx`
- Mock data in `src/test/mocks/`

### Test Categories

#### 1. Unit Tests (Priority 1)
- Test individual functions and utilities
- Test component props and state changes
- Test custom hooks in isolation
- Test form validations

#### 2. Integration Tests (Priority 2)
- Test component interactions
- Test data flow between components
- Test routing behavior
- Test API integration with MSW

#### 3. E2E Tests (Future)
- Use Playwright for critical user flows
- Test complete user journeys
- Test authentication flows

## Writing Tests

### Best Practices

1. **Test User Behavior, Not Implementation**
   ```tsx
   // ❌ Bad - testing implementation details
   expect(component.state.isLoading).toBe(true)
   
   // ✅ Good - testing user-visible behavior
   expect(screen.getByText('Loading...')).toBeInTheDocument()
   ```

2. **Use Descriptive Test Names**
   ```tsx
   // ❌ Bad
   it('works', () => {})
   
   // ✅ Good
   it('displays user information when props are provided', () => {})
   ```

3. **Keep Tests Isolated**
   - Each test should be independent
   - Use proper setup/cleanup
   - Don't rely on test execution order

4. **Use Custom Render Function**
   ```tsx
   import { render } from '@/test/utils'
   
   render(<Component />) // Includes providers automatically
   ```

### Mock Data

Use the provided mock factories:

```tsx
import { createMockHabitStreak, createMockDailyTask } from '@/test/utils'

const mockHabit = createMockHabitStreak({ currentStreak: 10 })
const mockTask = createMockDailyTask({ completed: true })
```

### API Mocking

MSW handlers are set up in `src/test/mocks/handlers.ts`:

```tsx
import { server } from '@/test/setup'
import { http, HttpResponse } from 'msw'

// Override default handler for specific test
server.use(
  http.get('/api/habits', () => {
    return HttpResponse.json(customMockData)
  })
)
```

## Coverage Goals

| Type | Minimum Coverage | Target |
|------|-----------------|---------|
| Overall | 60% | 75% |
| Critical paths | 80% | 90% |
| Utilities/helpers | 90% | 95% |
| UI components | 50% | 70% |

## Pre-commit Hooks

Tests automatically run before commits via Husky:
- Linting with ESLint
- Type checking with TypeScript
- Test execution
- Only staged files are processed

## Component Testing Checklist

For each new component, ensure tests cover:

- [ ] Renders with default props
- [ ] Renders with custom props
- [ ] Handles user interactions
- [ ] Shows correct states (loading, error, success)
- [ ] Accessibility requirements
- [ ] Edge cases and error boundaries

## Testing New Features

When adding new features:

1. **Write tests alongside development** (TDD when possible)
2. **Test the happy path first**
3. **Add error cases and edge cases**
4. **Verify accessibility**
5. **Update coverage if needed**
6. **Document any special testing considerations**

## Common Patterns

### Testing Forms
```tsx
it('submits form with valid data', async () => {
  const onSubmit = vi.fn()
  render(<MyForm onSubmit={onSubmit} />)
  
  await user.type(screen.getByLabelText('Name'), 'John Doe')
  await user.click(screen.getByRole('button', { name: /submit/i }))
  
  expect(onSubmit).toHaveBeenCalledWith({ name: 'John Doe' })
})
```

### Testing Async Operations
```tsx
it('loads and displays data', async () => {
  render(<DataComponent />)
  
  expect(screen.getByText('Loading...')).toBeInTheDocument()
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  })
})
```

### Testing Error States
```tsx
it('shows error message on failure', async () => {
  server.use(
    http.get('/api/data', () => HttpResponse.error())
  )
  
  render(<DataComponent />)
  
  await waitFor(() => {
    expect(screen.getByText('Error loading data')).toBeInTheDocument()
  })
})
```

## Debugging Tests

### Common Issues

1. **Tests failing due to async operations**
   - Use `waitFor` or `findBy` queries
   - Check for proper cleanup

2. **Mock not working**
   - Verify mock setup in test file
   - Check MSW handler configuration

3. **Component not rendering**
   - Ensure all required props are provided
   - Check for missing providers in test setup

### Debug Mode

```bash
# Run specific test file
npm run test Dashboard.test.tsx

# Run in debug mode
npm run test -- --reporter=verbose

# Open UI for interactive debugging
npm run test:ui
```

## Continuous Integration

Tests run automatically on:
- Every commit (pre-commit hook)
- Pull requests
- Main branch pushes

Build fails if:
- Tests fail
- Coverage drops below threshold
- Linting errors exist
- Type errors exist