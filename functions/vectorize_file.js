import Replicate from 'replicate';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const onRequestPost = async ({ request, env }) => {
    const replicate = new Replicate({
        auth: env.REPLICATE_API_TOKEN,
    });

    // here's what's passed in: { filePath: file.filePath, fileType: file.type, fileId: file.id, fileName: file.name, bucket: file.bucket });
    // retrieve values
    const { filePath, fileType, fileId, fileName, bucket } = await request.json();
    

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

    const vector_output = await replicate.run("daanelson/imagebind:0383f62e173dc821ec52663ed22a076d9c970549c209666ac3db181618b7a304", { input });

    // convert vector_output to a number[] array
    const vector_output_array = vector_output.split(',').map(Number);
    

    const vector =
        { id: fileId, 
          values: vector_output_array, 
          metadata: 
            { path: filePath, 
              format: fileType, 
              name: fileName,
              bucket: bucket
            } 
        };

    console.log(vector);

    const inserted = await env.VECTORIZE_INDEX.insert(vector);


    return new Response(JSON.stringify({ inserted: inserted }), {
        headers: { 'Content-Type': 'application/json' },
    });
};
