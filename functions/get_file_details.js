export const onRequestGet = async ({ request, env, params }) => {
    const { id } = params; // Assuming the id is passed as a URL parameter
  
    try {
      const result = await env.TOTELY.prepare("SELECT * FROM files WHERE id = ?").bind(id).run();
  
      if (result.meta.rows_read === 0) {
        return new Response(`File with id ${id} not found`, { status: 404 });
      } else {
        return new Response(JSON.stringify(result.results[0]), { status: 200 });
      }
    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  };
  