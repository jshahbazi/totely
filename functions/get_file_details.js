export const onRequestGet = async ({ request, env, params }) => {
    const { id } = params; // Assuming the id is passed as a URL parameter
  
    try {
      const result = await env.TOTELY.prepare("SELECT * FROM files WHERE id = ?").bind(id).run();
  
      if (result.meta.rows_read === 0) {
        return new Response(`File with id ${id} not found`, { status: 404 });
      } else {
        // Convert last_modified to a string in ISO format if it's not already
        if (result.results[0].last_modified instanceof Date) {
          result.results[0].last_modified = result.results[0].last_modified.toISOString();
        }
        return new Response(JSON.stringify(result.results[0]), { status: 200 });
      }
    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
};
  