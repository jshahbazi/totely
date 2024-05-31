export const onRequestGet = async ({ request, env, params }) => {
    const { id } = params; // Assuming the id is passed as a URL parameter
  
    try {
      const result = await env.TOTELY.prepare("SELECT * FROM files WHERE id = ?").bind(id).run();
  
      if (result.meta.rows_read === 0) {
        return new Response(`File with id ${id} not found`, { status: 404 });
      } else {
        // Convert last_modified timestamp to ISO string
        console.log(result.results[0].last_modified); // should log 1717138739000


        const lastModified = Number(result.results[0].last_modified);
        console.log(lastModified); // should log 1717138739000
        const date = new Date(lastModified);
        console.log(date); // should log a valid Date object
        const isoString = date.toISOString();
        console.log(isoString); // should log 2024-05-31T15:18:59.000Z
                
        result.results[0].last_modified = isoString;

        return new Response(JSON.stringify(result.results[0]), { status: 200 });
      }
    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  };
  