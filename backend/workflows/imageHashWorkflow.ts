import { Workflow, ActivityStub } from 'durabull';
import { ComputeHashActivity, HashAlgorithm, HashResult } from '../activities/hashActivity';

export interface ImageHashWorkflowInput {
  imageBuffer: Buffer;
  algorithms: HashAlgorithm[];
}

export interface ImageHashWorkflowOutput {
  fileName: string;
  fileSize: number;
  hashes: HashResult[];
  startedAt: string;
  completedAt: string;
}

/**
 * Workflow to orchestrate parallel hash computation for an uploaded image
 */
export class ImageHashWorkflow extends Workflow<
  [ImageHashWorkflowInput, string],
  ImageHashWorkflowOutput
> {
  async *execute(
    input: ImageHashWorkflowInput,
    fileName: string
  ): AsyncGenerator<unknown, ImageHashWorkflowOutput, unknown> {
    const startedAt = new Date().toISOString();

    // Execute all hash computations in parallel
    const hashStubs = input.algorithms.map((algorithm) =>
      ActivityStub.make(ComputeHashActivity, input.imageBuffer, algorithm)
    );

    const hashes = (yield ActivityStub.all(hashStubs)) as HashResult[];

    const completedAt = new Date().toISOString();

    return {
      fileName,
      fileSize: input.imageBuffer.length,
      hashes,
      startedAt,
      completedAt,
    };
  }
}
