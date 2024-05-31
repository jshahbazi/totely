export const onRequestPost = async ({ request, env, ctx }) => {
  const dataToSave = await request.json();

  try {
    const result = await env.TOTELY.prepare(
      `INSERT INTO files (id, name, size, type, last_modified, hash, extension, file_path, bucket) VALUES 
     (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        dataToSave.id,
        dataToSave.name,
        dataToSave.size,
        dataToSave.type,
        dataToSave.lastModified,
        dataToSave.hash,
        dataToSave.extension,
        dataToSave.filePath,
        dataToSave.bucket
      )
      .run();

    let response = null;
    if (result.meta.changes !== 1) {
      response = new Response(`Failed to insert image ${dataToSave.hash} into the database`, { status: 500 });
    } else {
      let responseMessage = { action: "add", filePath: dataToSave.filePath };
      response = new Response(JSON.stringify(responseMessage), { status: 200 });
    }
    return response;

  } catch (e) {
    if (e.message.includes("UNIQUE constraint failed")) {
      const d1_response = await env.TOTELY.prepare("SELECT file_path FROM files WHERE hash = ?").bind(dataToSave.hash).run();
      const file_location = d1_response.results[0].file_path;
      let response = null;
      if (d1_response.meta.rows_read === 0) {
        response = new Response(`Failed to get file_path for ${dataToSave.hash}: ` + JSON.stringify(d1_response), { status: 500 });
      } else {
        let responseMessage = { action: "retrieve", filePath: file_location };
        response = new Response(JSON.stringify(responseMessage), { status: 200 });
      }
      return response;
    } else {
      return new Response(e.message, { status: 500 });
    }
  }
};
