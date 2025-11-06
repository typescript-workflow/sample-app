import 'dotenv/config';
import fastify from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { WorkflowStub } from 'durabull';
import { configureDurabull } from './config/durabull';
import { ImageHashWorkflow } from './workflows/imageHashWorkflow';
import { HashAlgorithm } from './activities/hashActivity';
import path from 'path';

const app = fastify({ logger: true });

// Configure Durabull
configureDurabull();

// Register plugins
app.register(fastifyCors, {
  origin: true, // Allow all origins in development
});

app.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  app.register(fastifyStatic, {
    root: path.join(__dirname, '../frontend/dist'),
    prefix: '/',
  });
}

// Health check endpoint
app.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Upload and hash image endpoint
app.post('/api/upload', async (request, reply) => {
  try {
    const data = await request.file();

    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    // Read file buffer
    const buffer = await data.toBuffer();

    // Validate it's an image
    const mimeType = data.mimetype;
    if (!mimeType.startsWith('image/')) {
      return reply.code(400).send({ error: 'File must be an image' });
    }

    // All hash algorithms to compute
    const algorithms: HashAlgorithm[] = ['md5', 'sha1', 'sha256', 'sha512', 'blake3'];

    // Create and start workflow
    const workflow = await WorkflowStub.make(ImageHashWorkflow);
    await workflow.start(
      {
        imageBuffer: buffer,
        algorithms,
      },
      data.filename
    );

    // Get workflow ID
    const workflowId = workflow.id();

    return reply.send({
      workflowId,
      message: 'Image uploaded and hash computation started',
      fileName: data.filename,
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to process upload' });
  }
});

// Get workflow result endpoint
app.get<{ Params: { workflowId: string } }>('/api/result/:workflowId', async (request, reply) => {
  try {
    const { workflowId } = request.params;

    // Load existing workflow
    const workflow = await WorkflowStub.load(workflowId, ImageHashWorkflow);

    // Check if workflow is complete
    const status = await workflow.status();

    if (status === 'completed') {
      const result = await workflow.output();
      return reply.send({
        status: 'completed',
        result,
      });
    } else if (status === 'failed') {
      return reply.code(500).send({
        status: 'failed',
        error: 'Workflow execution failed',
      });
    } else {
      return reply.send({
        status: status,
        message: 'Workflow is still running',
      });
    }
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to get workflow result' });
  }
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });
    // Use Fastify logger instead of console.log to avoid noisy stdout in library code
    app.log.info(`API Server running at http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    // Set exit code so the caller/CI can detect failure without forcing an immediate exit
    process.exitCode = 1;
    return;
  }
};

start();
