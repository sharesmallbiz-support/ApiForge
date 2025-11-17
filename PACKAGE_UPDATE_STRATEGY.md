# 📦 ApiSpark Package Update Strategy

Generated: 2025-11-16 | **Integrated with Quality Audit**

## Executive Summary

**Current Status:** 71 total dependencies (dependencies + devDependencies)
- **Unused packages identified:** 8 packages (11% of dependencies)
- **Safe updates available:** 15 packages
- **Major updates requiring testing:** 11 packages
- **Complex migrations required:** 4 packages

### Quality Audit Integration

All package updates are now tracked through the quality audit process:

```bash
# Check for outdated dependencies and security vulnerabilities
npm run quality:audit
```

The audit generates a report at `artifacts/quality-audit-report.json` containing:
- Outdated packages with current and latest versions
- Security vulnerabilities with severity ratings
- Recommended remediation steps

**Triage Process:**
1. Run `npm run quality:audit` weekly
2. Review dependency advisories in the report
3. Prioritize high/critical vulnerabilities
4. Plan updates according to phases below
5. Document decisions in this file

---

## 🗑️ Phase 1: Remove Unused Packages (PRIORITY: HIGH)

**Immediate savings:** ~8 packages + 4 type definitions = 12 packages removed

### Packages to Remove

```json
{
  "dependencies": {
    "passport": "^0.7.0",              // ❌ Not used - planned auth but not implemented
    "passport-local": "^1.0.0",        // ❌ Not used - related to passport
    "connect-pg-simple": "^10.0.0",    // ❌ Not used - PostgreSQL session store
    "memorystore": "^1.6.7",           // ❌ Not used - in-memory session store
    "@neondatabase/serverless": "^0.10.4",  // ❌ Not used - using SQLite instead
    "ws": "^8.18.0",                   // ❌ Not used - no WebSocket features
    "react-icons": "^5.4.0",           // ❌ Duplicate - using lucide-react instead
    "tw-animate-css": "^1.2.5"         // ❌ Duplicate - using tailwindcss-animate
  },
  "devDependencies": {
    "@types/passport": "^1.0.16",      // ❌ Related to unused passport
    "@types/passport-local": "^1.0.38", // ❌ Related to unused passport-local
    "@types/connect-pg-simple": "^7.0.3", // ❌ Related to unused connect-pg-simple
    "@types/ws": "^8.5.13"             // ❌ Related to unused ws
  }
}
```

**Impact:** Zero - these packages are not imported anywhere in the codebase.

**Command:**
```bash
npm uninstall passport passport-local connect-pg-simple memorystore @neondatabase/serverless ws react-icons tw-animate-css @types/passport @types/passport-local @types/connect-pg-simple @types/ws
```

---

## ✅ Phase 2: Safe Updates (PRIORITY: HIGH)

**Low risk - patch and minor version updates**

### 2.1 Icon Library (Safe Update)

```bash
# Current: lucide-react@0.453.0 → Latest: 0.553.0
npm install lucide-react@latest
```
**Risk:** Low - icons library, backward compatible within 0.x
**Breaking changes:** None expected
**Testing needed:** Visual check that all icons still render

### 2.2 TypeScript (Safe Update)

```bash
# Current: 5.6.3 → Latest: 5.9.3
npm install -D typescript@latest
```
**Risk:** Low - minor version update
**Breaking changes:** Minimal, mostly new features
**Testing needed:** Run `npm run check` to verify no new type errors

### 2.3 Form Library Updates (Safe)

```bash
# @hookform/resolvers: 3.10.0 → 5.2.2 (check compatibility with react-hook-form first)
# Only update if react-hook-form is also updated or confirms compatibility
```
**Risk:** Medium - major version jump, but should be backward compatible
**Testing needed:** Test all forms (CreateCollectionDialog, CreateRequestDialog, etc.)

---

## ⚠️ Phase 3: Major Updates - Require Testing (PRIORITY: MEDIUM)

### 3.1 Date Library (Major Update)

```bash
# Current: date-fns@3.6.0 → Latest: 4.1.0
```
**Breaking Changes:**
- Some function signatures may have changed
- Date parsing behavior changes
- Need to check official migration guide

**Files to test:**
- `client/src/components/ui/calendar.tsx`
- Any date formatting in RequestHistory
- Timestamp displays

**Migration Strategy:**
1. Review [date-fns v4 migration guide](https://date-fns.org/v4.1.0/docs/Upgrade-Guide)
2. Update and run tests
3. Check all date displays in UI

### 3.2 Drizzle ORM Updates (Major-ish)

```bash
# drizzle-orm: 0.39.3 → 0.44.7
# drizzle-zod: 0.7.1 → 0.8.3
# drizzle-kit: 0.31.4 → Update to match drizzle-orm version
```

**Breaking Changes:**
- Schema API changes possible
- Query builder syntax may differ
- Migration file format changes

**Files to review:**
- All files in `db/schema.ts`
- `server/routes.ts` (database queries)
- `server/sqlite-storage.ts`

**Migration Strategy:**
1. Review Drizzle ORM changelog
2. Test all CRUD operations
3. Verify database migrations still work
4. Run `npm run db:push` to test schema sync

### 3.3 Animation Library (Major)

```bash
# framer-motion: 11.18.2 → 12.23.24
```

**Breaking Changes:**
- Animation API changes between v11 and v12
- Layout animations behavior changed
- Some hooks deprecated

**Files to check:**
- Search for `framer-motion` imports
- Test all animated components

**Migration Strategy:**
1. Check if framer-motion is actually being used (search codebase)
2. If not used, consider removing
3. If used, review v12 migration guide

### 3.4 Resizable Panels (Major - JUST IMPLEMENTED!)

```bash
# react-resizable-panels: 2.1.9 → 3.0.6
```

**Breaking Changes:**
- API changes in v3.x
- Different sizing algorithm
- New props/removed props

**Risk:** HIGH - We just implemented this feature!

**Files affected:**
- `client/src/pages/Home.tsx` (our recent implementation)

**Migration Strategy:**
1. Review [react-resizable-panels v3 changelog](https://github.com/bvaughn/react-resizable-panels/releases)
2. **DEFER** this update until the current implementation is stable
3. Test thoroughly in development first

**Recommendation:** Keep at 2.x for now, update in next sprint

### 3.5 Chart Library (Major)

```bash
# recharts: 2.15.4 → 3.4.1
```

**Breaking Changes:**
- Complete rewrite in v3
- Different TypeScript types
- Component API changes

**Files affected:**
- `client/src/components/ui/chart.tsx`
- Any components using charts

**Migration Strategy:**
1. Check if charts are actually used in production UI
2. Review recharts v3 migration documentation
3. Expect significant code changes

**Recommendation:** If charts aren't in production UI, consider deferring or removing

### 3.6 Tailwind Merge (Major)

```bash
# tailwind-merge: 2.6.0 → 3.4.0
```

**Breaking Changes:**
- Class merging algorithm improvements
- Some edge cases handled differently

**Risk:** Low - mostly internal improvements

**Testing:** Visual regression testing of all components

---

## 🚨 Phase 4: Complex Migrations (PRIORITY: LOW - DEFER)

### 4.1 React 19 Upgrade (COMPLEX - DEFER)

```bash
# react: 18.3.1 → 19.2.0
# react-dom: 18.3.1 → 19.2.0
```

**Why defer:**
- Major ecosystem change
- Many libraries may not be compatible yet
- Breaking changes in core APIs
- Requires updating ALL React-dependent packages

**Dependencies that must be updated first:**
- `@types/react` and `@types/react-dom`
- All Radix UI components (check compatibility)
- `react-resizable-panels`
- `react-hook-form`
- `@tanstack/react-query`
- `framer-motion`
- `recharts`
- `embla-carousel-react`

**Migration Complexity:** VERY HIGH

**Breaking Changes:**
- Server Components changes
- Suspense behavior changes
- useEffect timing changes
- New compiler requirements

**Recommendation:**
- **DEFER to dedicated upgrade sprint**
- Wait for library ecosystem to stabilize
- Current React 18.3.1 is stable and well-supported
- Plan 2-4 weeks for React 19 migration

### 4.2 Zod v4 Upgrade (COMPLEX - DEFER)

```bash
# zod: 3.25.76 → 4.1.12
# zod-validation-error: 3.5.4 → 5.0.0
```

**Why defer:**
- Zod is used for ALL validation in the app
- Breaking changes in schema API
- Must update drizzle-zod simultaneously
- Risk of runtime validation failures

**Files affected (HIGH IMPACT):**
- `shared/schema.ts` (all data models)
- All API route handlers
- Form validation schemas
- Environment variable validation

**Breaking Changes:**
- Schema definition syntax changes
- Error message formatting changes
- Type inference changes
- Refinement API updates

**Migration Complexity:** HIGH

**Recommendation:**
- **DEFER to dedicated validation update sprint**
- Thoroughly test all API endpoints
- Update all error handling
- Test all forms
- Plan 1-2 weeks for Zod v4 migration

### 4.3 Express 5 Upgrade (COMPLEX - DEFER)

```bash
# express: 4.21.2 → 5.1.0
```

**Why defer:**
- Major version upgrade with breaking changes
- All middleware must be compatible
- Session handling changes
- Error handling changes

**Files affected:**
- `server/index.ts`
- All route handlers
- Middleware configuration
- Error handling

**Breaking Changes:**
- Middleware signature changes
- Promise rejection handling
- Route parameter changes
- Response API changes

**Recommendation:**
- **DEFER indefinitely** - Express 4 is LTS and well-supported
- No compelling features in Express 5 for this use case
- Significant migration effort for minimal benefit

### 4.4 React Day Picker v9 (COMPLEX - TEST REQUIRED)

```bash
# react-day-picker: 8.10.1 → 9.11.1
```

**Breaking Changes:**
- Complete API rewrite
- Different prop names
- Styling changes

**Files affected:**
- `client/src/components/ui/calendar.tsx`

**Migration Strategy:**
1. Review v9 migration guide
2. Update Calendar component wrapper
3. Test date selection in all contexts
4. Verify styling still works

**Recommendation:** Medium priority, test in development first

---

## 📋 Recommended Update Plan

### Immediate (This Sprint)

1. **Remove unused packages** (Phase 1)
   ```bash
   npm uninstall passport passport-local connect-pg-simple memorystore @neondatabase/serverless ws react-icons tw-animate-css @types/passport @types/passport-local @types/connect-pg-simple @types/ws
   ```

2. **Update safe packages** (Phase 2)
   ```bash
   npm install lucide-react@latest typescript@latest
   npm run check  # Verify no type errors
   ```

3. **Update Tailwind utilities**
   ```bash
   npm install tailwind-merge@latest
   # Test: Visual regression check
   ```

### Next Sprint (2 weeks)

4. **Update Drizzle ORM**
   ```bash
   npm install drizzle-orm@latest drizzle-zod@latest
   npm install -D drizzle-kit@latest
   # Test: All database operations
   ```

5. **Update date-fns**
   ```bash
   npm install date-fns@latest
   # Test: All date displays and calendar
   ```

6. **Update form resolvers**
   ```bash
   npm install @hookform/resolvers@latest
   # Test: All forms and validation
   ```

### Future (Dedicated Sprints)

7. **React 19 Migration** (2-4 weeks)
   - Dedicated sprint
   - Update all React dependencies
   - Thorough testing
   - Rollback plan

8. **Zod v4 Migration** (1-2 weeks)
   - Dedicated sprint
   - Update all schemas
   - Test all validation
   - Test all API endpoints

### Never (Not Worth It)

9. **Express 5** - Defer indefinitely, no benefit

---

## 🎯 Success Metrics

After each phase:
- ✅ All tests pass
- ✅ Application builds successfully
- ✅ No console errors in browser
- ✅ All features work as expected
- ✅ No visual regressions

---

## 🔄 Rollback Plan

If any update causes issues:

```bash
# Rollback to previous state
git checkout package.json package-lock.json
npm install
```

**Best Practice:** Create a git commit after each successful phase.

---

## 📊 Expected Outcomes

### After Phase 1 (Remove Unused):
- **Bundle size reduction:** ~2-5 MB
- **Install time reduction:** ~10-15 seconds
- **Dependency count:** 71 → 59 packages

### After Phase 2 (Safe Updates):
- **Security improvements:** Latest patches
- **Bug fixes:** Latest stable versions
- **Type safety:** Improved TypeScript types

### After Phase 3 (Major Updates):
- **Performance improvements:** Modern libraries
- **New features available:** Latest APIs
- **Better documentation:** Up-to-date examples

### After Phase 4 (Complex Migrations):
- **Future-proof:** Latest major versions
- **Better performance:** React 19 optimizations
- **Modern patterns:** Latest best practices

---

## 🚀 Getting Started

**Step 1: Create a new branch**
```bash
git checkout -b feature/package-updates
```

**Step 2: Run Phase 1 (Remove unused)**
```bash
npm uninstall passport passport-local connect-pg-simple memorystore @neondatabase/serverless ws react-icons tw-animate-css @types/passport @types/passport-local @types/connect-pg-simple @types/ws
npm run check
npm run dev  # Test app still works
git add package.json package-lock.json
git commit -m "Remove unused dependencies (passport, ws, react-icons, etc.)"
```

**Step 3: Run Phase 2 (Safe updates)**
```bash
npm install lucide-react@latest typescript@latest tailwind-merge@latest
npm run check
npm run dev  # Test app
git add package.json package-lock.json
git commit -m "Update safe dependencies (lucide-react, typescript, tailwind-merge)"
```

**Step 4: Test thoroughly and push**
```bash
git push -u origin feature/package-updates
# Create PR and review changes
```

---

**Document Status:** ✅ Ready for implementation
**Last Updated:** 2025-11-16
**Next Review:** After Phase 1 completion
