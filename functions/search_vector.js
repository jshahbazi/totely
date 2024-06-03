import Replicate from 'replicate';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const onRequestPost = async ({ request, env }) => {
    const replicate = new Replicate({
        auth: env.REPLICATE_API_TOKEN,
    });

    const { query } = await request.json();

    const input = {
        input: query
    };

    const vector_output = await replicate.run("daanelson/text-to-vector:0383f62e173dc821ec52663ed22a076d9c970549c209666ac3db181618b7a304", { input });

    const searchResults = await env.TOTELY_VECTORIZE_INDEX.query(vector_output, { topK: 3 });

    const results = [];
    for (const match of searchResults.matches) {
        const id = match.id;
        const result = await env.TOTELY_D1.prepare("SELECT * FROM files WHERE id = ?").bind(id).run();
        if (result.meta.rows_read === 0) {
            continue;
        }
        const fileDetails = result.results[0];
        fileDetails.last_modified = new Date(Number(fileDetails.last_modified)).toISOString();
        
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
            Key: fileDetails.file_path,
        });

        const signedUrl = await getSignedUrl(r2, getObjectCommand, { 
            expiresIn: 60,
            headers: {
                'Content-Disposition': `attachment; filename="${fileDetails.file_path}"`
            }
        });

        fileDetails.signedUrl = signedUrl;

        results.push({
            ...fileDetails,
            score: match.score
        });
    }

    return new Response(JSON.stringify({ results }), {
        headers: { 'Content-Type': 'application/json' },
    });
};
