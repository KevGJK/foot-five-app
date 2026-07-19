export async function sendFirebasePush(
  tokens: string[],
  title: string,
  body: string
) {

  console.log("Envoi Firebase");

  console.log("Titre :", title);

  console.log("Message :", body);

  console.log("Nombre d'appareils :", tokens.length);

  return {
    success: true
  };

}