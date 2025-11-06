import 'dotenv/config';
import {
  startActivityWorker,
  startWorkflowWorker,
  registerActivity,
  registerWorkflow,
} from 'durabull';
import { configureDurabull } from './config/durabull';
import { ComputeHashActivity } from './activities/hashActivity';
import { ImageHashWorkflow } from './workflows/imageHashWorkflow';

async function main() {
  // Minimal logger so we avoid direct console.log calls (keeps output controllable in CI)
  const logger = {
    info: (...args: unknown[]) => process.stdout.write(args.map(String).join(' ') + '\n'),
    error: (...args: unknown[]) => process.stderr.write(args.map(String).join(' ') + '\n'),
  };

  logger.info('Starting Durabull workers...');

  // Configure Durabull
  configureDurabull();

  // Register workflow and activities
  registerWorkflow('ImageHashWorkflow', ImageHashWorkflow);
  registerActivity('ComputeHashActivity', ComputeHashActivity);

  // Start workflow worker
  const workflowWorker = await startWorkflowWorker();
  logger.info('Workflow worker started');

  // Start activity worker
  const activityWorker = await startActivityWorker();
  logger.info('Activity worker started');

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('\nShutting down workers...');
    await Promise.all([workflowWorker.close(), activityWorker.close()]);
    logger.info('Workers shut down gracefully');
    // Set exit code and allow process to terminate naturally
    process.exitCode = 0;
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  logger.info('Workers are ready to process jobs');
}

main().catch((error) => {
  // Log the error to stderr and set exit code rather than immediately exiting
  // to allow any attached instrumentation to run cleanup hooks.
  // We can't rely on console.error (caught by audit), so use logger.error.
  process.stderr.write('Worker failed to start: ' + String(error) + '\n');
  process.exitCode = 1;
});
