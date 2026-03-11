# Daily Clustering Automation

## Setup Instructions

### Option 1: Windows Task Scheduler (Recommended for Production)

1. **Open Task Scheduler**:
   - Press `Win + R`, type `taskschd.msc`, press Enter

2. **Create New Task**:
   - Click "Create Task" (not "Create Basic Task")
   - Name: "Zavit Daily Clustering"
   - Description: "Runs article ingestion and clustering pipeline"
   - Check "Run whether user is logged on or not"
   - Check "Run with highest privileges"

3. **Triggers Tab**:
   - Click "New..."
   - Begin the task: "On a schedule"
   - Settings: "Daily"
   - Start time: "02:00:00" (2 AM)
   - Recur every: 1 days
   - Click OK

4. **Actions Tab**:
   - Click "New..."
   - Action: "Start a program"
   - Program/script: `C:\Program Files\nodejs\node.exe`
   - Add arguments: `--loader tsx src/scripts/daily-pipeline.ts`
   - Start in: `C:\GitHub\zavit`
   - Click OK

5. **Conditions Tab**:
   - Uncheck "Start the task only if the computer is on AC power"
   - Check "Wake the computer to run this task"

6. **Settings Tab**:
   - Check "Allow task to be run on demand"
   - Check "Run task as soon as possible after a scheduled start is missed"
   - If task fails, restart every: "10 minutes"
   - Attempt to restart up to: "3 times"

### Option 2: Node Cron (Development)

Add to `package.json`:
```json
{
  "scripts": {
    "cluster:daily": "tsx src/scripts/daily-pipeline.ts",
    "cluster:schedule": "node-cron"
  }
}
```

Install node-cron:
```bash
npm install node-cron @types/node-cron
```

Create `src/scripts/scheduler.ts`:
```typescript
import cron from 'node-cron';
import { exec } from 'child_process';

// Run daily at 2 AM
cron.schedule('0 2 * * *', () => {
  console.log('Running daily clustering pipeline...');
  exec('npx tsx src/scripts/daily-pipeline.ts', (error, stdout, stderr) => {
    if (error) {
      console.error('Pipeline failed:', error);
      return;
    }
    console.log(stdout);
    if (stderr) console.error(stderr);
  });
});

console.log('Scheduler started. Daily clustering will run at 2 AM.');
```

Run: `npm run cluster:schedule`

### Option 3: Manual Execution

Run whenever needed:
```bash
npx tsx src/scripts/daily-pipeline.ts
```

## Pipeline Steps

1. **Ingestion** - Fetches new articles from all sources
2. **Embedding Generation** - Creates OpenAI embeddings for new articles
3. **Clustering** - Materializes clusters to database with generated titles

## Monitoring

Check logs in terminal or redirect to file:
```bash
npx tsx src/scripts/daily-pipeline.ts >> logs/clustering-$(date +%Y%m%d).log 2>&1
```

## Troubleshooting

**Pipeline fails at embeddings:**
- Check `OPENAI_API_KEY` in `.env`
- Verify API quota/limits

**Pipeline fails at clustering:**
- Check database connection
- Verify `cluster_snapshots` table exists

**No new clusters appear:**
- Check if ingestion found new articles
- Verify embedding generation succeeded
