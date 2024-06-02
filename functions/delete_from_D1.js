export const onRequestPost = async ({ request, env }) => {
    try {
      const { id } = await request.json();
  
      if (!id) {
        throw new Error("Missing file id in request");
      }
  
      console.log(`Deleting file with id: ${id} from D1 database`); // Debug logging
  
      const result = await env.TOTELY_D1.prepare(
        `DELETE FROM files WHERE id = ?`
      )
        .bind(id)
        .run();
  
      if (result.meta.changes !== 1) {
        console.error(`Failed to delete file with id ${id} from the database`); // Debug logging
        return new Response(`Failed to delete file with id ${id} from the database`, { status: 500 });
      } else {
        console.log(`File with id ${id} deleted successfully`); // Debug logging
        return new Response(`File with id ${id} deleted successfully`, { status: 200 });
      }
    } catch (e) {
      console.error(`Error deleting file: ${e.message}`); // Debug logging
      return new Response(e.message, { status: 500 });
    }
  };
  