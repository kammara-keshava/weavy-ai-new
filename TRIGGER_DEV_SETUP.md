# Trigger.dev Setup & Configuration

## Overview

This project uses **Trigger.dev v3** for background task execution. Tasks run on Trigger.dev Cloud Workers, not locally.

## Architecture

```
Next.js App (Vercel)
    ↓
tasks.trigger() → Trigger.dev Cloud API
    ↓
Cloud Worker executes task
    ↓
runs.retrieve() polls for result
    ↓
Result returned to Next.js App
```

## Environment Variables

### Required for Production

```bash
TRIGGER_SECRET_KEY=tr_prod_YOUR_KEY_HERE  # Must be production key!
TRIGGER_API_URL=https://api.trigger.dev
TRIGGER_PROJECT_ID=proj_lxdchdchuhbkpdskfpaa
GOOGLE_AI_API_KEY=your_gemini_api_key
```

### Key Types

| Key Type | Format | Usage | Worker |
|----------|--------|-------|--------|
| Development | `tr_dev_*` | Local testing only | Local (`npx trigger.dev dev`) |
| Production | `tr_prod_*` | Production & Vercel | Cloud (automatic) |

⚠️ **IMPORTANT**: Never use `tr_dev_*` keys in production or Vercel!

## Available Tasks

### 1. execute-llm
Generates text using Google Gemini AI with optional image inputs.

```typescript
await tasks.trigger('execute-llm', {
  nodeId: 'node-123',
  userMessage: 'Describe this image',
  systemPrompt: 'You are a helpful assistant',
  images: ['https://example.com/image.jpg']
});
```

### 2. execute-crop-image
Crops images using Sharp library.

```typescript
await tasks.trigger('execute-crop-image', {
  nodeId: 'node-456',
  image_url: 'https://example.com/image.jpg',
  x_percent: 10,
  y_percent: 10,
  width_percent: 80,
  height_percent: 80
});
```

### 3. execute-extract-frame
Extracts frames from videos using FFmpeg.

```typescript
await tasks.trigger('execute-extract-frame', {
  nodeId: 'node-789',
  video_url: 'https://example.com/video.mp4',
  timestamp: '50%' // or timestamp in seconds: 5.5
});
```

## Deployment

### Initial Setup

1. **Install Trigger.dev CLI**
   ```bash
   npm install -g @trigger.dev/cli
   ```

2. **Login to Trigger.dev**
   ```bash
   npx trigger.dev login
   ```

3. **Deploy Tasks**
   ```bash
   npx trigger.dev@latest deploy
   ```

### Updating Tasks

Whenever you modify tasks in `trigger/index.ts`:

```bash
npx trigger.dev@latest deploy
```

This creates a new deployment version on Trigger.dev Cloud.

## Development Workflow

### Option 1: Use Production Keys (Recommended)
```bash
# .env
TRIGGER_SECRET_KEY=tr_prod_YOUR_KEY

# Run Next.js
npm run dev

# Tasks execute on Cloud Workers automatically
```

### Option 2: Use Local Worker (Optional)
```bash
# .env
TRIGGER_SECRET_KEY=tr_dev_YOUR_KEY

# Terminal 1: Start local worker
npx trigger.dev dev

# Terminal 2: Run Next.js
npm run dev

# Tasks execute on local worker
```

## Vercel Deployment

### 1. Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
TRIGGER_SECRET_KEY=tr_prod_YOUR_PRODUCTION_KEY
TRIGGER_API_URL=https://api.trigger.dev
TRIGGER_PROJECT_ID=proj_lxdchdchuhbkpdskfpaa
GOOGLE_AI_API_KEY=your_gemini_api_key
DATABASE_URL=your_postgres_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
TRANSLOADIT_KEY=your_transloadit_key
TRANSLOADIT_SECRET=your_transloadit_secret
```

### 2. Deploy

```bash
git push origin main
```

Vercel auto-deploys. Tasks execute on Trigger.dev Cloud Workers.

## Monitoring & Debugging

### View Task Runs

**Dashboard**: https://cloud.trigger.dev/projects/v3/proj_lxdchdchuhbkpdskfpaa

**Test Tasks**: https://cloud.trigger.dev/projects/v3/proj_lxdchdchuhbkpdskfpaa/test?environment=prod

### Check Logs

1. Go to Trigger.dev Dashboard
2. Select your project
3. Click "Runs" to see all task executions
4. Click individual runs to see logs and errors

### Common Issues

#### Issue: 404 errors when triggering tasks
**Cause**: Using development key (`tr_dev_*`) without local worker  
**Fix**: Use production key (`tr_prod_*`)

#### Issue: "Task not found"
**Cause**: Tasks not deployed  
**Fix**: Run `npx trigger.dev@latest deploy`

#### Issue: Tasks timeout
**Cause**: Task taking longer than maxDuration (300s)  
**Fix**: Increase `maxDuration` in `trigger.config.ts`

## Code Structure

```
trigger/
  index.ts              # Task definitions
trigger.config.ts       # Trigger.dev configuration
lib/
  workflow-execution.ts # Task triggering logic
```

### Task Definition Pattern

```typescript
import { task } from '@trigger.dev/sdk/v3';

export const myTask = task({
  id: 'my-task-id',
  run: async (payload) => {
    // Task logic here
    return { output: result };
  },
});
```

### Task Triggering Pattern

```typescript
import { tasks, runs } from '@trigger.dev/sdk/v3';

// Trigger task
const run = await tasks.trigger('my-task-id', payload);

// Poll for completion
while (true) {
  const result = await runs.retrieve(run.id);
  
  if (result.status === 'COMPLETED') {
    return result.output;
  }
  
  if (result.status === 'FAILED') {
    throw new Error(result.error);
  }
  
  await new Promise(r => setTimeout(r, 1000));
}
```

## Best Practices

1. ✅ Always use production keys (`tr_prod_*`) in production
2. ✅ Deploy tasks before deploying Next.js app
3. ✅ Monitor task runs in Trigger.dev Dashboard
4. ✅ Set appropriate `maxDuration` for long-running tasks
5. ✅ Handle task failures gracefully
6. ✅ Use environment variables for API keys
7. ❌ Never commit secret keys to git
8. ❌ Never use dev keys in production

## Resources

- **Trigger.dev Docs**: https://trigger.dev/docs
- **v3 Migration Guide**: https://trigger.dev/docs/v3/migration
- **Dashboard**: https://cloud.trigger.dev
- **Support**: https://trigger.dev/discord

---

**Current Deployment**: Version 20260313.2  
**Status**: ✅ All tasks deployed and ready
