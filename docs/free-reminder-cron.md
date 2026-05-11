# Free Reminder Cron Setup

Vercel Hobby only supports daily cron jobs, so production reminder pushes should be triggered by a free external scheduler.

## Recommended: cron-job.org

Use cron-job.org to call the existing reminder endpoint every minute.

1. Create a free account at `https://cron-job.org`.
2. Create a new cron job.
3. Set the URL to:

```text
https://YOUR_VERCEL_DOMAIN/api/cron/send-reminders
```

4. Set the schedule to every minute:

```text
* * * * *
```

5. Set method to `GET`.
6. Add this request header:

```text
Authorization: Bearer YOUR_CRON_SECRET
```

7. In Vercel, add the same secret as an environment variable:

```text
CRON_SECRET=YOUR_CRON_SECRET
```

8. Redeploy the app, then run a manual test from cron-job.org.

The endpoint should respond with JSON similar to:

```json
{
  "success": true,
  "time": "18:30",
  "message": "Reminders processed."
}
```

## Alternative: Supabase Cron

If you prefer keeping scheduling inside Supabase, enable Supabase Cron and `pg_net`, then create a job that calls the same endpoint every minute with the `Authorization` header above.

Supabase SQL example:

```sql
select cron.schedule(
  'send-myfitness-reminders',
  '* * * * *',
  $$
  select net.http_get(
    url := 'https://YOUR_VERCEL_DOMAIN/api/cron/send-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_CRON_SECRET'
    ),
    timeout_milliseconds := 10000
  );
  $$
);
```

## Less Ideal: GitHub Actions

GitHub Actions scheduled workflows are free for many projects, but the shortest interval is 5 minutes. That is usable for coarse reminders, but it is not ideal for minute-accurate meal/workout notifications.
