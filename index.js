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

const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS"] });

// Cola de usuarios
let queue = [];
let lastQueueMessageId = null;
const queueChannelId = '1171224716506300446'; // ID del canal de la cola
const founderId = '429377907216089088'; // ID del fundador
const exemptCategoryIds = ['828363533401849896', '1232721077130498088']; // ID de la categoría exenta

client.on("messageCreate", async message => {
  // Evitar hacer nada si el mensaje proviene de un bot
  if (message.author.bot) return;

  // Verificar si el mensaje menciona al fundador y si el canal no está en la categoría exenta
  if (message.mentions.users.has(founderId) && !exemptCategoryIds.includes(message.channel.parentId)) {
    const member = message.guild.members.cache.get(message.author.id);

    // Aplicar un timeout de 5 minutos (300000 ms)
    try {
      await member.timeout(300000, "No mencionar al fundador");
      await member.send(`**ESP** 🇪🇸\nNo menciones al fundador 👿 ||Solo puedes mencionar en ticket||\n\n**EN** 🇬🇧\nDo not mention the founder 👿 ||You can only mention in a ticket||`);
      await message.delete(); // Borrar el mensaje que menciona al fundador
    } catch (error) {
      console.error("Error al aplicar el timeout, enviar el mensaje o borrar el mensaje:", error);
    }
  }

  if (message.content === "ping") {
    message.channel.send("pong");
  }

  if (message.content === ".paypal") {
    // Verificar si el usuario tiene permisos de administrador
    if (message.member.permissions.has("ADMINISTRATOR")) {
      let paypal = new Discord.MessageEmbed()
        .setTitle("Pago mediante PayPal")
        .setDescription(`**ESP 🇪🇸**\nA la hora de hacer el pago **aceptas** los <#1060201345073815612>.\nPara realizar el pago debe enviar el pago por amigos y familiares y sin concepto, cuando lo haya realizado deberá mandar captura.\n**(En caso de que algo se incumpla no se te dará el producto)**\n\n**EN 🇬🇧**\nBy making the payment, you accept the <#1060201345073815612>.\nTo make the payment, you must send it as friends and family without any description. Once you have done this, you must send a screenshot.\n**(In case any of these conditions are not met, the product will not be given to you)**\n\nhttps://www.paypal.com/paypalme/GFXDREKO`)
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
        .setDescription(`**ESP 🇪🇸**\n\n> - Cantidad mínima: **25€ eur**\n> \n> - Número: **657 153 522**\n> \n> - Envíar **captura de pantalla** al realizar el pago\n\n**EN 🇬🇧**\n\n> - Minimum amount: **25€ EUR**\n> \n> - Number: **657 153 522**\n> \n> - Send a **screenshot** when making the payment`)
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
    // Permitir el uso solo al fundador
    if (message.author.id !== founderId) {
      return message.channel.send("No tienes permisos para usar este comando.");
    }

    const args = message.content.split(" ").slice(1);
    const position = parseInt(args[0]);
    const user = message.mentions.users.first();

    if (!user) {
      return message.channel.send("Por favor, menciona al usuario.");
    }

    const reason = args.slice(1).filter(arg => !arg.startsWith("<@")).join(" ") || "No se especificó una razón";

    if (isNaN(position)) {
      // Añadir usuario a la última posición de la cola
      queue.push({ user, reason });
    } else {
      // Añadir usuario a la cola en la posición especificada
      queue.splice(position - 1, 0, { user, reason });
    }

    // Notificar a todos los usuarios sus nuevas posiciones en la cola
    notifyAllUsersInQueue();

    // Mostrar la cola en un embed en el canal especificado
    const queueChannel = await client.channels.fetch(queueChannelId);
    displayQueue(queueChannel);

    message.delete(); // Borra el mensaje que invocó el comando
  }

  if (message.content.startsWith(".dequeue")) {
    // Permitir el uso solo al fundador
    if (message.author.id !== founderId) {
      return message.channel.send("No tienes permisos para usar este comando.");
    }

    const args = message.content.split(" ").slice(1);
    const position = parseInt(args[0]);

    if (isNaN(position) || position < 1 || position > queue.length) {
      return message.channel.send("Por favor, proporciona una posición válida dentro de la cola.");
    }

    // Eliminar el usuario de la cola en la posición especificada
    queue.splice(position - 1, 1);

    // Notificar a todos los usuarios sus nuevas posiciones en la cola
    notifyAllUsersInQueue();

    // Mostrar la cola actualizada en un embed en el canal especificado
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

  if (message.content.startsWith(".say")) {
    // Permitir el uso solo al fundador
    if (message.author.id !== founderId) {
      return message.channel.send("No tienes permisos para usar este comando.");
    }

    const args = message.content.split(" ").slice(1);
    const user = message.mentions.users.first();
    const text = args.slice(1).join(" ");

    if (!user) {
      return message.channel.send("Por favor, menciona al usuario.");
    }

    if (!text) {
      return message.channel.send("Por favor, proporciona el mensaje a enviar.");
    }

    try {
      await user.send(text);
      message.channel.send(`Mensaje enviado a ${user.tag}.`);
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      message.channel.send("Hubo un error al intentar enviar el mensaje.");
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

async function notifyUserInQueue(user) {
  const position = queue.findIndex(entry => entry.user.id === user.id) + 1;
  if (position) {
    try {
      await user.send(`**ESP** 🇪🇸\nTu posición en la cola se ha actualizado. Ahora estás en la posición ${position}.\n\n**EN** 🇬🇧\nYour position in the queue has been updated. You are now in position ${position}.`);
    } catch (error) {
      console.error("Error al enviar el mensaje directo al usuario:", error);
    }
  }
}

async function notifyAllUsersInQueue() {
  for (const [index, entry] of queue.entries()) {
    try {
      await entry.user.send(`**ESP** 🇪🇸\nTu posición en la cola se ha actualizado. Ahora estás en la posición ${index + 1}.\n\n**EN** 🇬🇧\nYour position in the queue has been updated. You are now in position ${index + 1}.`);
    } catch (error) {
      console.error(`Error al enviar el mensaje directo al usuario ${entry.user.tag}:`, error);
    }
  }
}

client.login(process.env.token);
