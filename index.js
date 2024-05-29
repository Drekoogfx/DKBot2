const keep_alive = require('./keep_alive.js');
const express = require('express');
const app = express();

app.listen(3000, () => {
  console.log('Project is running!');
});

app.get('/', (req, res) => {
  res.send('Hello world!');
});

const Discord = require("discord.js");
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

client.on("messageCreate", async message => {
  if (message.content === "ping") {
    message.channel.send("pong");
  }

  if (message.content === "!paypal") {
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

  if (message.content === "!bizum") {
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
});

client.login(process.env.token);
