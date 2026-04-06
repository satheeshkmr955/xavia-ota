import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import {
  CloudFrontKeyValueStoreClient,
  PutKeyCommand,
  DescribeKeyValueStoreCommand,
} from '@aws-sdk/client-cloudfront-keyvaluestore';

import { SignatureV4a } from '@aws-sdk/signature-v4a';

// The SDK automatically checks for IAM Role credentials on EC2
const cfClient = new CloudFrontClient({
  region: process.env.AWS_REGION,
});

export const invalidateCDNCache = async () => {
  const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;

  if (!distributionId) {
    console.log('Missing CLOUDFRONT_DISTRIBUTION_ID in environment variables');
    return;
  }

  const command = new CreateInvalidationCommand({
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: `invalidate-${Date.now()}`,
      Paths: {
        Quantity: 1,
        Items: ['/api/manifest*'],
      },
    },
  });

  try {
    const response = await cfClient.send(command);
    console.log('Invalidation created:', response.Invalidation?.Id);
    return response;
  } catch (error) {
    console.error('CloudFront Invalidation Error:', error);
    throw error;
  }
};

const kvsClient = new CloudFrontKeyValueStoreClient({
  region: process.env.AWS_REGION,
  signerConstructor: SignatureV4a,
});
const KVS_ARN = process.env.CLOUDFRONT_KVS_ARN || '';
const KVS_Key = process.env.CLOUDFRONT_KVS_KEY || '';

export async function syncRolloutToEdge({ percentage }: { percentage: number }) {
  const value = percentage.toString();

  if (!KVS_ARN) {
    console.log('Missing CLOUDFRONT_KVS_ARN in environment variables');
    return;
  }

  if (!KVS_Key) {
    console.log('Missing CLOUDFRONT_KVS_KEY in environment variables');
    return;
  }

  try {
    // 1. Get ETag (required for updates)
    const describe = await kvsClient.send(new DescribeKeyValueStoreCommand({ KvsARN: KVS_ARN }));

    // 2. Update Key
    const command = new PutKeyCommand({
      IfMatch: describe.ETag,
      Key: KVS_Key,
      KvsARN: KVS_ARN,
      Value: value,
    });
    await kvsClient.send(command);

    console.log(`Synced production rollout to ${value}% at Edge`);
  } catch (error) {
    console.error('KVS Sync Failed:', error);
    throw error;
  }
}
