import Replicate from 'replicate';

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

    const results = searchResults.matches.map(match => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata
    }));

    return new Response(JSON.stringify({ results }), {
        headers: { 'Content-Type': 'application/json' },
    });
};
