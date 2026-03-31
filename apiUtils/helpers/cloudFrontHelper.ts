import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

// The SDK automatically checks for IAM Role credentials on EC2
const cfClient = new CloudFrontClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export const invalidateCDNCache = async () => {
  const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;

  if (!distributionId) {
    console.error('Missing CLOUDFRONT_DISTRIBUTION_ID in environment variables');
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
