const fs = require('fs')
const mime = require('mime-types')
const venom = require('venom-bot')
const axios = require("axios");
const imageToBase64 = require('image-to-base64');

const util = require('util')
const sagiri = require("sagiri");

venom
	.create()
	.then((client) => start(client))
	.catch((erro) => {
		console.log(erro);
	});

function start(client) {
	client.onMessage(async (message) => {
		console.log(message);

		if (message.body === '!gawr' || message.body === '!menu') {
			// ==========  Menu List
			await client
				.sendText(message.from, `
┏❧   ㋡  GawrZu Bot  ㋡   ☄️
╿
┷┯╾╾❧  Group Commands ╼╼╼
   ╽
   ┠❧ ☾ Maintainence... ☽
   ┠❥ !add 62xxxxxxxx
   ┠❥ !kick @tagmember
   ┠❥ !promote @tagmember
   ┠❥ !demote @tagadmin
   ┠❥ !everyone / @everyone
   ┠❥ !adminList
   ┠❥ !leave
   ┠❥ !linkGroup
   ┠❥ !delete「replyChatBot」
   ┠❥ !kickAll
   ╿
┯┷╾╾❧ Downloader Commands ╼╼╼
╽
┠❧ ☾ Maintainence... ☽
┠❥ !ig「link」
┠❥ !fb「link」
╿
┷┯╾╾❧ Others Commands ╼╼╼
   ╽
   ┠❥ !gawr「anime」
   ┠❥ !sticker「as caption from an image」
   ╿
   ╰╾╼🌌
          `);

		} else if (message.caption === "!sticker" && message.isMedia === true) {
			const buffer = await client.decryptFile(message)
			const fileName = `image.${mime.extension(message.mimetype)}`
			await fs.writeFile('./temp/' + fileName, buffer, async (err) => {
				if (err) {
					console.log(err)
				} else {
					console.log('[L] Image saved successfully')
					await client.sendImageAsSticker(message.from, `./temp/${fileName}`)
						.catch((err) => {})
				}
			})

		} else if (message.body.startsWith("!nyaa ")) {
			let n = 0;
			const one = 0;

			var anime = message.body.split("!nyaa ")[1];
			console.log('Query: ' + anime)

			await si.searchByUser('AkihitoSubsWeeklies', anime, 5)
				.then((data) => {
					for (var name in data) {
						var Name = util.inspect(data[n].name)
						let FINALName = Name.replace(/\'/g, "");
						var Url = util.inspect(data[n].torrent)
						let FINALUrl = Url.replace(/\'/g, "");

						//console.log('Name : ' + FINALName + '\n\nURL : ' + FINALUrl)
            await client.reply('Name : ' + FINALName + '\n\nURL : ' + FINALUrl);
						//msg.reply('Name : ' + FINALName + '\n\nURL : ' + FINALUrl)
						let one = n++; //increments 'n'
					}
				})
				.catch((err) => console.log(err));

		}
		// end.
	});
}
