export const onRequestGet = async ({ env }) => {
    try {
      const result = await env.TOTELY_D1.prepare("SELECT * FROM files").run();
  
      if (result.meta.rows_read === 0) {
        return new Response(JSON.stringify([]), { status: 200 });
      } else {
        return new Response(JSON.stringify(result.results), { status: 200 });
      }
    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  };
  