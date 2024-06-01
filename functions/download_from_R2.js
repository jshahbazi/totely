import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const onRequestGet = async ({ request, env }) => {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('fileName');

  if (!fileName) {
    return new Response('Bad Request', { status: 400 });
  }

  try {
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
      Key: fileName,
    });

    const signedUrl = await getSignedUrl(r2, getObjectCommand, { 
      expiresIn: 60,
      headers: {
        'Content-Disposition': `attachment; filename="${fileName}"` // Ensure the correct filename is suggested
      }
    });

    return new Response(JSON.stringify({ signedUrl }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};
