const keep_alive = require('./keep_alive.js');
const Discord = require("discord.js");
const express = require('express');
const app = express();

app.listen(3000, () => {
  console.log('Project is running!');
});

app.get('/', (req, res) => {
  res.send('Hello world!');
});

const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

// Cola de usuarios
let queue = [];
let lastQueueMessageId = null;
const queueChannelId = '1171224716506300446'; // ID del canal de la cola

client.on("messageCreate", async message => {
  if (message.content === "ping") {
    message.channel.send("pong");
  }

  if (message.content === ".paypal") {
    // Verificar si el usuario tiene permisos de administrador
    if (message.member.permissions.has("ADMINISTRATOR")) {
      let paypal = new Discord.MessageEmbed()
        .setTitle("Pago mediante PayPal")
        .setDescription(`**ESP :flag_es:**
                    A la hora de hacer el pago **aceptas** los <#1060201345073815612>.
                    Para realizar el pago debe enviar el pago por amigos y familiares y sin concepto, cuando lo haya realizado deberá mandar captura.
                    **(En caso de que algo se incumpla no se te dará el producto)**

                   **ENG :flag_gb:**
                    By making the payment, you accept the <#1060201345073815612>.
                    To make the payment, you must send it as friends and family without any description. Once you have done this, you must send a screenshot.
                    **(In case any of these conditions are not met, the product will not be given to you)**

                    https://www.paypal.com/paypalme/GFXDREKO`)
        .setFooter("No se admiten devoluciones")
        .setColor("#FFFFFF")
        .setThumbnail("https://pngimg.com/uploads/paypal/paypal_PNG7.png");

      // Borrar el mensaje anterior enviado por el bot
      const messages = await message.channel.messages.fetch({ limit: 1 });
      const botMessage = messages.filter(msg => msg.author.id === client.user.id).first();
      if (botMessage) {
        botMessage.delete();
      }

      message.channel.send({ embeds: [paypal] });
    } else {
      try {
        await message.author.send("No tienes permisos para usar este comando.");
        await message.delete();
      } catch (error) {
        console.error("Error al enviar el mensaje directo o eliminar el mensaje:", error);
      }
    }
  }

  if (message.content === ".bizum") {
    // Verificar si el usuario tiene permisos de administrador
    if (message.member.permissions.has("ADMINISTRATOR")) {
      let bizum = new Discord.MessageEmbed()
        .setTitle("Pago mediante Bizum")
        .setDescription(`**ESP** :flag_es:

    > - Cantidad mínima: **25€ eur**
    > 
    > - Número: **657 153 522**
    > 
    > - Envíar **captura de pantalla** al realizar el pago

    ** ENG :flag_gb:**

    > - Minimum amount: **25€ EUR**
    > 
   > - Number: **657 153 522**
    > 
   > - Send a **screenshot** when making the payment
    `)
        .setFooter("No se admiten devoluciones")
        .setColor("#FFFFFF")
        .setThumbnail("https://upload.wikimedia.org/wikipedia/commons/2/24/Bizum.png");

      // Borrar el mensaje anterior enviado por el bot
      const messages = await message.channel.messages.fetch({ limit: 1 });
      const botMessage = messages.filter(msg => msg.author.id === client.user.id).first();
      if (botMessage) {
        botMessage.delete();
      }

      message.channel.send({ embeds: [bizum] });
    } else {
      try {
        await message.author.send("No tienes permisos para usar este comando.");
        await message.delete();
      } catch (error) {
        console.error("Error al enviar el mensaje directo o eliminar el mensaje:", error);
      }
    }
  }

  if (message.content.startsWith(".addqueue")) {
    // Verificar si el usuario tiene permisos de administrador
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.channel.send("No tienes permisos para usar este comando.");
    }

    const args = message.content.split(" ").slice(1);
    const user = message.mentions.users.first();
    if (!user) return message.channel.send("Por favor, menciona al usuario.");

    const reason = args.slice(1).join(" ") || "No se especificó una razón";

    // Añadir usuario a la cola con razón
    queue.push({ user, reason });

    // Mostrar la cola en un embed en el canal especificado
    const queueChannel = await client.channels.fetch(queueChannelId);
    displayQueue(queueChannel);

    message.delete(); // Borra el mensaje que invocó el comando
  }

  if (message.content.startsWith(".clear")) {
    // Verificar si el usuario tiene permisos de administrador
    if (message.member.permissions.has("ADMINISTRATOR")) {
      const args = message.content.split(" ").slice(1); // Obtener el número de mensajes a borrar
      const amount = args.join(" ");

      if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
        return message.reply("Por favor, especifica una cantidad válida de mensajes a borrar.");
      }

      const deleteAmount = parseInt(amount) > 100 ? 100 : parseInt(amount);

      try {
        await message.channel.bulkDelete(deleteAmount, true);
        message.channel.send(`Se han borrado ${deleteAmount} mensajes.`).then(msg => {
          setTimeout(() => msg.delete(), 5000);
        });
      } catch (error) {
        console.error("Error al borrar los mensajes:", error);
        message.reply("Hubo un error al intentar borrar los mensajes.");
      }
    } else {
      try {
        await message.author.send("No tienes permisos para usar este comando.");
        await message.delete();
      } catch (error) {
        console.error("Error al enviar el mensaje directo o eliminar el mensaje:", error);
      }
    }
  }
});

async function displayQueue(channel) {
  // Borrar el mensaje anterior de la cola si existe
  if (lastQueueMessageId) {
    try {
      const lastQueueMessage = await channel.messages.fetch(lastQueueMessageId);
      if (lastQueueMessage) {
        await lastQueueMessage.delete();
      }
    } catch (error) {
      console.error("Error al borrar el mensaje anterior de la cola:", error);
    }
  }

  // Crear el embed
  const embed = new Discord.MessageEmbed()
    .setTitle("Cola de Usuarios")
    .setDescription(queue.map((entry, index) => `${index + 1}. ${entry.user} - ${entry.reason}`).join("\n"))
    .setColor("#FFFFFF")
    .setThumbnail("https://cdn.discordapp.com/attachments/1115062933114851369/1245421684597723136/Sin-tituldsadao-1.png?ex=6658b0d4&is=66575f54&hm=c0b681f1b3c2000a81292ba152c5cf6682d617750a2d9e6f4ae19bc105720114&");

  // Enviar el embed al canal y almacenar el ID del mensaje
  const queueMessage = await channel.send({ embeds: [embed] });
  lastQueueMessageId = queueMessage.id;
}

client.login(process.env.token);
