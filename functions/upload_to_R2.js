import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const onRequestPost = async ({ request }) => {
  if (request.method === 'POST') {
    try {
      const { fileName, fileType } = await request.json();

      // Ensure environment variables are properly accessed
      const accountId = env.REACT_APP_R2_ACCOUNT_ID;
      const accessKeyId = env.REACT_APP_R2_ACCESS_KEY_ID;
      const secretAccessKey = env.REACT_APP_R2_SECRET_ACCESS_KEY;
      const bucketName = env.REACT_APP_R2_BUCKET_NAME;

      if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
        throw new Error("Missing required environment variables");
      }

      const r2 = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      const putObjectCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        ContentType: fileType,
      });

      const signedUrl = await getSignedUrl(r2, putObjectCommand, { expiresIn: 60 });

      return new Response(JSON.stringify({ signedUrl }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error("Error generating signed URL:", error); // Add detailed logging
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  } else {
    return new Response('Method Not Allowed', { status: 405 });
  }
};
