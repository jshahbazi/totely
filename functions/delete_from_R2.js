import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const onRequestPost = async ({ request, env }) => {
//   try {
    console.log('Request received:', request);
    const { method, fileName } = await request.json();

    if (method !== 'DELETE') {
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

    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: env.REACT_APP_R2_BUCKET_NAME,
      Key: fileName,
    });

    await r2.send(deleteObjectCommand);

    return new Response(JSON.stringify({ message: 'File deleted successfully' }), {
      headers: { 'Content-Type': 'application/json' },
    });
//   } catch (error) {
//     return new Response(JSON.stringify({ error: error.message }), {
//       headers: { 'Content-Type': 'application/json' },
//       status: 500,
//     });
//   }
};
