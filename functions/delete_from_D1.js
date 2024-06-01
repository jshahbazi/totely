export const onRequestPost = async ({ request, env }) => {
    const { id } = await request.json();
  
    try {
      const result = await env.TOTELY.prepare(
        `DELETE FROM files WHERE id = ?`
      )
        .bind(id)
        .run();
  
      if (result.meta.changes !== 1) {
        return new Response(`Failed to delete file with id ${id} from the database`, { status: 500 });
      } else {
        return new Response(`File with id ${id} deleted successfully`, { status: 200 });
      }
    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  };
  