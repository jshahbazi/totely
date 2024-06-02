import Replicate from 'replicate';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const onRequestPost = async ({ request, env }) => {
  const replicate = new Replicate({
    auth: env.REPLICATE_API_TOKEN,
  });

  const { filePath } = await request.json();

  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${env.REACT_APP_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.REACT_APP_R2_ACCESS_KEY_ID,
      secretAccessKey: env.REACT_APP_R2_SECRET_ACCESS_KEY,
    },
  });

  const getObjectCommand = new GetObjectCommand({
    Bucket: env.REACT_APP_R2_BUCKET_NAME,
    Key: filePath,
  });

  const signedUrl = await getSignedUrl(r2, getObjectCommand, { 
    expiresIn: 60,
    headers: {
      'Content-Disposition': `attachment; filename="${filePath}"` // Ensure the correct filename is suggested
    }
  });  

  const input = {
    input: signedUrl
  };

  const output = await replicate.run("daanelson/imagebind:0383f62e173dc821ec52663ed22a076d9c970549c209666ac3db181618b7a304", { input });

  return new Response(JSON.stringify({ vector: output }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
