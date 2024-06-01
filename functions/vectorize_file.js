import Replicate from 'replicate';

export const onRequestPost = async ({ request, env }) => {
  const replicate = new Replicate({
    auth: env.REPLICATE_API_TOKEN,
  });

  const { filePath, bucket } = await request.json();
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;

  const input = {
    input: `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${filePath}`
  };

  const output = await replicate.run("daanelson/imagebind:0383f62e173dc821ec52663ed22a076d9c970549c209666ac3db181618b7a304", { input });

  return new Response(JSON.stringify({ vector: output }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
