import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const onRequestPost = async ({ request }) => {
    if (request.method === 'POST') {
      try {
        const { fileName, fileType, method } = await request.json();

        if (method !== 'POST') {
          return new Response('Method Not Allowed', { status: 405 });
        }

        const r2 = new S3Client({
          region: "auto",
          endpoint: `https://${env.REACT_APP_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: env.REACT_APP_R2_ACCESS_KEY_ID,
            secretAccessKey: env.REACT_APP_R2_SECRET_ACCESS_KEY,
          },
        });

        const putObjectCommand = new PutObjectCommand({
          Bucket: env.REACT_APP_R2_BUCKET_NAME,
          Key: fileName,
          ContentType: fileType,
        });

        const signedUrl = await getSignedUrl(r2, putObjectCommand, { expiresIn: 60 });

        return new Response(JSON.stringify({ signedUrl }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    } else {
      return new Response('Method Not Allowed', { status: 405 });
    }
};
