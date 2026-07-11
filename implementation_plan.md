# Phase 4: Auth + Client Wizard

## Files to create

### Auth routes: (auth) group
- src/app/(auth)/layout.tsx            - centered branded auth shell
- src/app/(auth)/login/page.tsx        - sign in form
- src/app/(auth)/signup/page.tsx       - sign up form
- src/app/api/auth/signup/route.ts     - API handler for user creation

### Wizard routes: (client) group  
- src/app/(client)/layout.tsx          - sidebar + session guard
- src/app/(client)/wizard/layout.tsx   - wizard shell with stepper
- src/app/(client)/wizard/region/page.tsx      - Step 1
- src/app/(client)/wizard/details/page.tsx     - Step 2
- src/app/(client)/wizard/upload/page.tsx      - Step 3
- src/app/(client)/wizard/processing/page.tsx  - Processing screen

### Server actions
- src/app/actions/wizard.ts            - createDraft, updateDraft, processUpload, runProcessing

### Wizard state persistence
- Stored in DB as MeetingRequest with status=DRAFT (no client-only state)
- wizardDraftId cookie written after Step 1 creation
