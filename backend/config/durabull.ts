import { Durabull } from 'durabull';

export function configureDurabull() {
  Durabull.configure({
    redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
    queues: {
      workflow: 'durabull-workflow',
      activity: 'durabull-activity',
    },
    serializer: 'json',
    pruneAge: '30 days',
  });
}
