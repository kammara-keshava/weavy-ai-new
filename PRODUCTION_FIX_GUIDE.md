# Trigger.dev Production Fix Guide

## Problem Identified ✅

Your application only works when running `npx trigger.dev dev` because you're using a **DEVELOPMENT secret key** (`tr_dev_*`).

### Current Configuration (INCORRECT for Production)
```
TRIGGER_SECRET_KEY=tr_dev_RxsiTbVVWh6kCcSwJcH0  ❌ Development key
```

Development keys (`tr_dev_*`) only work with the local dev worker, which is why your app requires `npx trigger.dev dev` to be running.

## Solution: Use Production Secret Key

### Step 1: Get Your Production Secret Key

1. Go to Trigger.dev Dashboard: https://cloud.trigger.dev
2. Navigate to your project: `proj_lxdchdchuhbkpdskfpaa`
3. Go to **Settings** → **API Keys**
4. Find or create a **Production Secret Key** (starts with `tr_prod_*`)
5. Copy the production secret key

### Step 2: Update Environment Variables

#### Local Development (.env and .env.local)
```bash
# Replace this line:
TRIGGER_SECRET_KEY=tr_dev_RxsiTbVVWh6kCcSwJcH0

# With your production key:
TRIGGER_SECRET_KEY=tr_prod_YOUR_PRODUCTION_KEY_HERE
```

#### Vercel Production Environment
1. Go to Vercel Dashboard: https://vercel.com
2. Select your project: `weavy-ai-new`
3. Go to **Settings** → **Environment Variables**
4. Update or add:
   ```
   TRIGGER_SECRET_KEY=tr_prod_YOUR_PRODUCTION_KEY_HERE
   TRIGGER_API_URL=https://api.trigger.dev
   TRIGGER_PROJECT_ID=proj_lxdchdchuhbkpdskfpaa
   GOOGLE_AI_API_KEY=AIzaSyCSOoKgXYtT9LKqLEHEHElD_eDcEBUJ2ns
   ```
5. Redeploy your application

### Step 3: Verify Deployment

Your tasks are already deployed (version 20260313.2):
- ✅ `execute-llm`
- ✅ `execute-crop-image`
- ✅ `execute-extract-frame`

View deployment: https://cloud.trigger.dev/projects/v3/proj_lxdchdchuhbkpdskfpaa/deployments/a1j9wqez

## How It Works (Architecture Overview)

### Development Mode (Local Worker)
```
Your App → tasks.trigger() → Local Worker (npx trigger.dev dev) → Task Execution
```
- Uses `tr_dev_*` key
- Requires `npx trigger.dev dev` running
- Good for local testing

### Production Mode (Cloud Worker) ✅
```
Your App → tasks.trigger() → Trigger.dev Cloud API → Cloud Worker → Task Execution
```
- Uses `tr_prod_*` key
- No local worker needed
- Works on Vercel/production

## Code Analysis (Already Correct) ✅

### 1. Task Definitions (trigger/index.ts)
```typescript
export const executeLLMTask = task({
  id: 'execute-llm',
  run: async (payload) => { /* ... */ }
});
```
✅ Correctly using `task()` from v3 SDK

### 2. Task Triggering (lib/workflow-execution.ts)
```typescript
import { tasks, runs } from "@trigger.dev/sdk/v3";

const run = await tasks.trigger(taskId, payload);
while (true) {
  const result = await runs.retrieve(run.id);
  if (result.status === "COMPLETED") {
    return result.output;
  }
}
```
✅ Correctly using `tasks.trigger()` and `runs.retrieve()`

### 3. Configuration (trigger.config.ts)
```typescript
export const config: TriggerConfig = {
  project: process.env.TRIGGER_PROJECT_ID || 'proj_lxdchdchuhbkpdskfpaa',
  dirs: ['./trigger'],
};
```
✅ Correct configuration

## Testing After Fix

### 1. Test Locally (Optional)
```bash
# Update .env with production key
npm run dev
# Test workflows - should work WITHOUT npx trigger.dev dev
```

### 2. Test on Vercel
1. Update environment variables in Vercel
2. Redeploy
3. Test workflows at: https://weavy-ai-new.vercel.app/workflow

## Expected Behavior After Fix

### Before (Current - BROKEN)
- ❌ Works only with `npx trigger.dev dev` running
- ❌ Fails in production with 404 errors
- ❌ Cannot deploy to Vercel successfully

### After (Fixed - WORKING)
- ✅ Works without any local worker
- ✅ Works in production on Vercel
- ✅ Tasks execute on Trigger.dev Cloud
- ✅ No need to run `npx trigger.dev dev`

## Key Differences: Dev vs Prod Keys

| Feature | Development Key (`tr_dev_*`) | Production Key (`tr_prod_*`) |
|---------|------------------------------|------------------------------|
| Local Worker | Required (`npx trigger.dev dev`) | Not needed |
| Cloud Worker | Not used | Used automatically |
| Production | ❌ Doesn't work | ✅ Works |
| Vercel | ❌ Doesn't work | ✅ Works |

## Troubleshooting

### Issue: Still getting 404 errors
**Solution**: Make sure you're using the production key (`tr_prod_*`), not dev key

### Issue: "Task not found"
**Solution**: Verify tasks are deployed with `npx trigger.dev@latest deploy`

### Issue: Environment variables not updating
**Solution**: 
1. Clear Vercel cache
2. Redeploy from Vercel dashboard
3. Check environment variables are set correctly

## Summary

**What was wrong**: Using development secret key (`tr_dev_*`)  
**What to fix**: Replace with production secret key (`tr_prod_*`)  
**Where to fix**: `.env`, `.env.local`, and Vercel environment variables  
**Result**: App works in production without local worker

---

**Next Step**: Get your production secret key from Trigger.dev dashboard and update all environment variables.
