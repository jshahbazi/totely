export const onRequestPost = async ({ request, env, ctx }) => {
  const dataToSave = await request.json();

  // {
  //   results: array | null, // [] if empty, or null if it doesn't apply
  //   success: boolean, // true if the operation was successful, false otherwise
  //   meta: {
  //     duration: number, // duration of the operation in milliseconds
  //     rows_read: number, // the number of rows read (scanned) by this query
  //     rows_written: number // the number of rows written by this query
  //   }
  // }

  try {
    const result = await env.SKYCHECK_DB.prepare(
      `insert into images (hash, bucket, file_path, mime_type) values 
     (?, ?, ?, ?)`
    )
      .bind(
        dataToSave.imageHash,
        dataToSave.bucket,        
        dataToSave.filePath,
        dataToSave.mimeType,
      )
      .run();
    
      // {
      //   results: [],
      //   success: true,
      //   meta: {
      //     served_by: 'v3-prod',
      //     duration: 0.23815499991178513,
      //     changes: 1,
      //     last_row_id: 2,
      //     changed_db: true,
      //     size_after: 20480,
      //     rows_read: 0,
      //     rows_written: 2
      //   }
      // }
    
    console.log("result1: ", JSON.stringify(result));

    let response = null;
    if (result.meta.changes !== 1) {
      response = new Response(`Failed to insert image ${dataToSave.imageHash} into database`, { status: 500 });
    } else {
      let responseMessage = { action: "add", filePath: dataToSave.filePath};
      response = new Response(JSON.stringify(responseMessage), { status: 200 });
    }
    return response;

  } catch (e) {
    // Error: "D1_ERROR: Error: UNIQUE constraint failed: images.hash"
    if (e.message.includes("UNIQUE constraint failed")) {
      const d1_response = await env.SKYCHECK_DB.prepare("SELECT file_path FROM images WHERE hash = ?").bind(dataToSave.imageHash).run();
      const file_location = d1_response.results[0].file_path;
      let response = null;
      if (d1_response.meta.rows_read === 0) {
        response = new Response(`Failed to get file_path for ${dataToSave.imageHash}: ` + JSON.stringify(d1_response), { status: 500 });
      } else {
        let responseMessage = { action: "retrieve", filePath: file_location};
        response = new Response(JSON.stringify(responseMessage), { status: 200 });
      }
      return response;      
    } else {
      return new Response(e.message, { status: 500 });
    }
  }

};
