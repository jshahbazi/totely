import Replicate from 'replicate';



export const onRequestPost = async ({ request, env }) => {

    const replicate = new Replicate({
        auth: env.REPLICATE_API_TOKEN,
      });
      
    const input = {
        input: "https://replicate.delivery/pbxt/IqLXryIoF3aK3loaAUERG2lxnZX8x0yTZ9Nas9JtMxqcgotD/astronaut.png"
      };
    
    const output = await replicate.run("daanelson/imagebind:0383f62e173dc821ec52663ed22a076d9c970549c209666ac3db181618b7a304", { input });
    console.log(output)


  };
  