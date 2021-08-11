// code by InsideHeartz
// github.com/fdciabdul

const fs = require("fs");
const moment = require("moment");
const qrcode = require("qrcode-terminal");
const { Client, MessageMedia } = require("whatsapp-web.js");
const fetch = require("node-fetch");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const SESSION_FILE_PATH = "./session.json";
const urlencode = require("urlencode");

const sagiri = require("sagiri");
const util = require('util')
const yts = require("./lib/cmd.js");
const config = require("./config.js");
const axios = require("axios");
const {si, pantsu} = require('nyaapi')
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
// file is included here
let sessionCfg;
const logo = require('asciiart-logo');
const banner = require('./package.json');
console.log(logo(banner).render());
//const base64ToImage = require('base64-to-image');

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

//YTDL
async function FFMPEGCALL() {
  async function convert(input, output, callback) {
    ffmpeg(input)
      .withNoVideo()
      .withAudioBitrate('320k')
      .toFormat('mp3')
      .output(output)
      .on('end', function() {
          console.log('Conversion ended');
          callback(null);
      }).on('error', function(err){
          console.log('error: ', err);
          callback(err);
      }).run();
    }
  await convert('./mp3/test.mp3', './mp3/output.mp3', function(err){
    if(!err) {
       console.log('Conversion completed successfully (4/4)');
       console.log('Waiting for 5 seconds...')
       }
    });
  }

async function Download() {
  await ytdl('https://www.youtube.com/watch?v=3JmvuPaFbZw', { quality : 'highestaudio' })
    .pipe(fs.createWriteStream('./mp3/test.mp4'));
  }

async function Rename() {fs.renameSync('./mp3/test.mp4', './mp3/test.mp3')}

async function YTDL() {
  await Download();
    console.log('Downloading the video... (1/4)')
  await new Promise((resolve, reject) => setTimeout(resolve, 5000));
    console.log('Assuming the video has done downloading. (2/4)')
  await Rename();
    console.log('File renamed! (3/4)')
  await FFMPEGCALL();
  await new Promise((resolve, reject) => setTimeout(resolve, 5000));
  }
//END OF YTDL

if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionCfg = require(SESSION_FILE_PATH);
}
client = new Client({

	     puppeteer: {
        executablePath: config.chrome_path,
        headless: true,
		args: [
      "--log-level=3", // fatal only

      "--no-default-browser-check",
      "--disable-infobars",
      "--disable-web-security",
      "--disable-site-isolation-trials",
      "--no-experiments",
      "--ignore-gpu-blacklist",
      "--ignore-certificate-errors",
      "--ignore-certificate-errors-spki-list",

      "--disable-extensions",
      "--disable-default-apps",
      "--enable-features=NetworkService",
      "--disable-setuid-sandbox",
      "--no-sandbox",

      "--no-first-run",
      "--no-zygote"
    ]

    },
    session: sessionCfg
});

client.initialize();

// ======================= Begin initialize WAbot

client.on("qr", qr => {
  // NOTE: This event will not be fired if a session is specified.
  qrcode.generate(qr, {
    small: true
  });
  console.log(`[ ${moment().format("HH:mm:ss")} ] Please Scan QR with app!`);
});

client.on("authenticated", session => {
  console.log(`[ ${moment().format("HH:mm:ss")} ] Authenticated Success!`);
  // console.log(session);
  sessionCfg = session;
  fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function(err) {
    if (err) {
      console.error(err);
    }
  });
});

client.on("auth_failure", msg => {
  // Fired if session restore was unsuccessfull
  console.log(
    `[ ${moment().format("HH:mm:ss")} ] AUTHENTICATION FAILURE \n ${msg}`
  );
  fs.unlink("./session.json", function(err) {
    if (err) return console.log(err);
    console.log(
      `[ ${moment().format("HH:mm:ss")} ] Session Deleted, Please Restart!`
    );
    process.exit(1);
  });
});

client.on("ready", async () => {
  console.log(`[ ${moment().format("HH:mm:ss")} ] WhatsApp Web v`, await client.getWWebVersion());
  console.log(`[ ${moment().format("HH:mm:ss")} ] WWebJS v`, require("whatsapp-web.js").version);
  console.log(`[ ${moment().format("HH:mm:ss")} ] Whatsapp bot ready!`);
});

// ======================= Begin initialize mqtt broker


// ======================= WaBot Listen on Event

client.on("message_create", msg => {
  // Fired on all message creations, including your own
  if (msg.fromMe) {
    // do stuff here
  }
});

client.on("message_revoke_everyone", async (after, before) => {
  // Fired whenever a message is deleted by anyone (including you)
  // console.log(after); // message after it was deleted.
  if (before) {
    console.log(before.body); // message before it was deleted.
  }
});

client.on("message_revoke_me", async msg => {
  // Fired whenever a message is only deleted in your own view.
  // console.log(msg.body); // message before it was deleted.
});

client.on("message_ack", (msg, ack) => {
  /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */

  if (ack == 3) {
    // The message was read
  }
});
client.on('group_join', async (notification) => {
    // User has joined or been added to the group.
    console.log('join', notification);
    const botno = notification.chatId.split('@')[0];
    let number = await notification.id.remote;
    client.sendMessage(number, `Hai perkenalkan aku Inside Bot, selamat datang di group ini`);

    const chats = await client.getChats();

// ==== Getting Group Chat === //
    for (i in chats) {
        if (number == chats[i].id._serialized) {
            chat = chats[i];
        }
    }
    var participants = {};
    var admins = {};
    var i;
    for (let participant of chat.participants) {
        if (participant.id.user == botno) { continue; }
        //participants.push(participant.id.user);
        const contact = await client.getContactById(participant.id._serialized);
        participants[contact.pushname] = participant.id.user;
        // participant needs to send a message for it to be defined
        if (participant.isAdmin) {
            //admins.push(participant.id.user);
            admins[contact.pushname] = participant.id.user;
            client.sendMessage(participant.id._serialized, 'Hai admin, ada member baru di group mu');
            const media = MessageMedia.fromFilePath('./test/test.pdf');
            client.sendMessage(participant.id._serialized, media);
        }
    }
    console.log('Group Details');
    console.log('Name: ', chat.name);
    console.log('Participants: ', participants);
    console.log('Admins: ', admins);
    //notification.reply('User joined.'); // sends message to self
});

client.on('group_leave', async (notification) => {
    // User has joined or been added to the group.
    console.log('leave', notification);
    const botno = notification.chatId.split('@')[0];
    let number = await notification.id.remote;
    client.sendMessage(number, `Selamat tinggal kawan`);

    const chats = await client.getChats();
    for (i in chats) {
        if (number == chats[i].id._serialized) {
            chat = chats[i];
        }
    }
    var participants = {};
    var admins = {};
    var i;
    for (let participant of chat.participants) {
        if (participant.id.user == botno) { continue; }
        //participants.push(participant.id.user);
        const contact = await client.getContactById(participant.id._serialized);
        participants[contact.pushname] = participant.id.user;
        // participant needs to send a message for it to be defined
        if (participant.isAdmin) {
            //admins.push(participant.id.user);
            admins[contact.pushname] = participant.id.user;
            client.sendMessage(participant.id._serialized, 'Hai admin, ada member yang keluar di group mu');
            const media = MessageMedia.fromFilePath('./test/test.pdf');
            client.sendMessage(participant.id._serialized, media);
        }
    }
    console.log('Group Details');
    console.log('Name: ', chat.name);
    console.log('Participants: ', participants);
    console.log('Admins: ', admins);
    //notification.reply('User joined.'); // sends message to self
});

client.on("group_update", notification => {
  // Group picture, subject or description has been updated.
  console.log("update", notification);
});

client.on("disconnected", reason => {
  console.log("Client was logged out", reason);
});

// ======================= WaBot Listen on message

client.on("message", async msg => {
	// console.log('MESSAGE RECEIVED', msg);
    const chat = await msg.getChat();
    const users = await msg.getContact()
    const dariGC = msg['author']
    const dariPC = msg['from']
	console.log(`[ ${moment().format("HH:mm:ss")} ]  => New Message : ${msg.body}
	`)
const botTol = () => {
        msg.reply('[!] Maaf, fitur ini hanya untuk admin(owner).')
        return
    }
    const botTol2 = () => {
        msg.reply(`[!] Maaf, fitur ini hanya untuk 'Group Chat'.`)
        return
    }

    if (msg.body.startsWith('!subject ')) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '') == chat.owner.user) {
                let title = msg.body.slice(9)
                chat.setSubject(title)
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body === '!getmember') {
        const chat = await msg.getChat();

        let text = "";
        let mentions = [];

        for(let participant of chat.participants) {
            const contact = await client.getContactById(participant.id._serialized);

            mentions.push(contact);
			text += "Hai ";
            text += `@${participant.id.user} `;
			text += "\n";
        }

        chat.sendMessage(text, { mentions });
    } else if (msg.body.startsWith('!deskripsi ')) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '') == chat.owner.user ) {
                let title = msg.body.split("!deskripsi ")[1]
                chat.setDescription(title)
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body.startsWith('!promote ')) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '') == chat.owner.user) {
                const contact = await msg.getContact();
                const title = msg.mentionedIds[0]
                chat.promoteParticipants([`${title}`])
                chat.sendMessage(`[:] @${title.replace('@c.us', '')} sekarang anda adalah admin sob 🔥`)
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body.startsWith('!demote ')) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '') == chat.owner.user) {
                let title = msg.mentionedIds[0]
                chat.demoteParticipants([`${title}`])
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body.startsWith('!add ')) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '')) {
                let title = msg.body.slice(5)
                if (title.indexOf('62') == -1) {
                    chat.addParticipants([`${title.replace('0', '62')}@c.us`])
                    msg.reply(`[:] Selamat datang @${title}! jangan lupa baca Deskripsi group yah 😎👊🏻`)
                } else {
                    msg.reply('[:] Format nomor harus 0821xxxxxx')
                }
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body.startsWith('!kick ')) {
        if (chat.isGroup) {
            if (dariGC.replace('@c.us', '') == chat.owner.user) {
                let title = msg.mentionedIds
                chat.removeParticipants([...title])
                // console.log([...title]);
            } else {
                botTol()
            }
        } else {
            botTol2()
        }
    } else if (msg.body == '!owner') {
        if (chat.isGroup) {
            msg.reply(JSON.stringify({
                owner: chat.owner.user
            }))
        } else {
            botTol2()
        }
    }


  if (msg.type == "ciphertext") {
    // Send a new message as a reply to the current one
    msg.reply("Hallo kak , salam dari aku Simsimi , ada yang bisa di bantu ?");
  }

// ==========  Menu List

//Join group 9B : https://chat.whatsapp.com/K5LLJLiYy8qAdynsAxQhOl
else if (msg.body == "!menu") {
 client.sendMessage(msg.from,  `
        *Konnichiwa! 😎*

			  ️*List Menu*

➡️ !admin = Menu Khusus Admin Grup🏅
➡️ !menu1 = Fun Menu 🌞
➡️ !menu2 = Downloader Menu🎞
➡️ !menu3 = Horoscope Menu 🎇
➡️ !menu4 = Edukasi Menu 📕

`);
}

// ========= Admin Menu

else if (msg.body == "!admin") {
 client.sendMessage(msg.from,  `
 *!subject* = Ganti nama grup.
 *!kick* = Kick member grup.
 *!promote* = Promote admin grup.
 *!demote* = Menurunkan admin group.
 *!add* = Menambah member group.
 *!deskripsi* = Ganti deskripsi grup.
 `);
 }

 //==========  Menu 1

 else if (msg.body == "!menu1") {
 client.sendMessage(msg.from,  `

   *Welcome To Fun Menu*

*!randomanime* = untuk melihat gambar anime secara random
*!animehd* = untuk melihat gambar anime HD secara random v2
*!quotes* : Melihat quotes dari tokoh terkenal
*!pantun* : Melihat gombalan pantun pakboy
*!fakta* : Melihat fakta unik secara random
*!glowtext [text]* : Glowing text!
*!play [nama lagu]* : Play lagu
*!TTS [text]* : Text-To-Speech!
*!searchimage [kata kunci]* : Cari gambar berdasarkan kata
*!Nyaa [nama anime]* : Search anime
*!RIS* : Reverse image search ( PIXIV )
`);
 }
else if (msg.body == "!menu2") {
 client.sendMessage(msg.from,  `

   *Welcome To Downloader Menu*

~*!yt url* : Mendownload video dari youtube~
~contoh : !yt https://youtu.be/K9jR4hSCbG4~
_Lagi diperbaiki..._

~*!ytmp3 url* : Mendownload mp3 dari youtube~
~contoh : !ytmp3 https://youtu.be/xUVz4nRmxn4~
_Lagi diperbaiki..._

*!fb url* : Mendownload video dari facebook
contoh : !fb url

*!ig url* : Mendownload media foto/video dari instagram
contoh : !ig url

*!pin url* : Mendownload video dari pinterest
contoh : !pin url

`);
}
else if (msg.body == "!menu3") {
	client.sendMessage (msg.from, `
*!nama* : Melihat arti dari nama kamu
 contoh : !nama Bondan

*!pasangan* : Check kecocokan jodoh
 contoh : !pasangan Dimas & Dinda
`);
}
// Download Feature

else if (msg.body.startsWith("!ytmp3 ")) {
//var url = msg.body.split(" ")[1];
//var videoid = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);

//const ytdl = require("ytdl-core")
//const { exec } = require("child_process");
//if(videoid != null) {
//   console.log("video id = ",videoid[1]);
//} else {
//    msg.reply("Videonya gavalid gan.");
//}
//ytdl.getInfo(videoid[1]).then(info => {
//if (info.length_seconds > 3000){
//msg.reply("terlalu panjang.. ")
//}else{

//console.log(info.length_seconds)

//msg.reply(" Tunggu sebentar kak .. Lagi di proses ☺");
//var YoutubeMp3Downloader = require("youtube-mp3-downloader");

////Configure YoutubeMp3Downloader with your settings
//var YD = new YoutubeMp3Downloader({
//    "ffmpegPath": config.ffmpeg_path,
//    "outputPath": "./mp3",    // Where should the downloaded and en>
//    "youtubeVideoQuality": "highest",       // What video quality sho>
//    "queueParallelism": 100,                  // How many parallel down>
//    "progressTimeout": 40                 // How long should be the>
//});

//YD.download(videoid[1]);


//YD.on("finished", function(err, data) {


//var musik = MessageMedia.fromFilePath(data.file);

//msg.reply(`

//   Mp3 Berhasil di download

//  ----------------------------------

//Nama File : *${data.videoTitle}*
//Nama : *${data.title}*
//Artis : *${data.artist}*

//   ----------------------------------
//👾                          👾
//  _Ytmp3 WhatsApp By InsideBot_
//`);
//chat.sendMessage(musik);
//});
//YD.on("error", function(error) {
//    console.log(error);
//});
//}});
msg.reply("Lagi maintainence...");
}

// Youtube Play
  else if (msg.body.startsWith("!play ")) {
//var ytdl = require("ytdl-core");
//var hh = msg.body.split("!play ")[1];
//var keyword = hh.replace(/ /g, "+");
//function foreach(arr, func){
//  for(var i in arr){
//    func(i, arr[i]);
//  }
//}
//////////Calling Async Function//////////
//const id= "";

//(async () => {
//var id = await yts.searchYoutube(keyword);
//let result ="";

//var teks = `
//New Request Song

//Title
//${result} `;
//console.log( "New Request Play Song " +id[0])

//var YoutubeMp3Downloader = require("youtube-mp3-downloader");

//Configure YoutubeMp3Downloader with your settings
//var YD = new YoutubeMp3Downloader({
//    "ffmpegPath": "ffmpeg",
//    "outputPath": "./mp3",    // Where should the downloaded and en>
//    "youtubeVideoQuality": "highest",       // What video quality sho>
//    "queueParallelism": 100,                  // How many parallel down>
//    "progressTimeout": 2000                 // How long should be the>
//});

//Download video and save as MP3 file
//YD.download(id[0]);

//YD.on("finished", function(err, data) {


//const musik = MessageMedia.fromFilePath(data.file);
//var ehe = `


// 🎶 Now Playing 🎶

//🔉  *${data.videoTitle}*

//Youtube Play Songs By InsideHeartz :)
//`;
//let media = MessageMedia.fromFilePath('./zerotwo.jpg');
//	client.sendMessage(msg.from, media, {
//	caption: ehe });
//	chat.sendMessage(musik);
//});
//YD.on("progress", function(data) {
//});
//})();
msg.reply("Maintainence...");
}

// Facebook Downloaderelse if (msg.body.startsWith("!fb ")) {
	else if (msg.body.startsWith("!fb ")) {
var teks = msg.body.split("!fb ")[1];
const { exec } = require("child_process");
var url = "http://api.fdci.se/sosmed/fb.php?url="+ teks;
axios.get(url)
  .then((result) => {
var b = JSON.parse(JSON.stringify(result.data));

 var teks = `
 Berhasil Mendownload

 Judul = ${b.judul}

 Facebook Downloader By Sonicj
 `;

exec('wget "' + b.link + '" -O mp4/fbvid.mp4', (error, stdout, stderr) => {
  let media = MessageMedia.fromFilePath('mp4/fbvid.mp4');
	client.sendMessage(msg.from, media, {
	caption: teks });
	if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});

});
}

// random fakta unik
// pajaar - 2020
else if (msg.body == "!fakta") {
const fetch = require("node-fetch");
fetch('https://raw.githubusercontent.com/pajaar/grabbed-results/master/pajaar-2020-fakta-unik.txt')
    .then(res => res.text())
    .then(body => {
	let tod = body.split("\n");
	let pjr = tod[Math.floor(Math.random() * tod.length)];
	msg.reply(pjr);
	});
}

// random pantun
// pajaar - 2020
else if (msg.body == "!pantun") {
const fetch = require("node-fetch");
fetch('https://raw.githubusercontent.com/pajaar/grabbed-results/master/pajaar-2020-pantun-pakboy.txt')
    .then(res => res.text())
    .then(body => {
	let tod = body.split("\n");
	let pjr = tod[Math.floor(Math.random() * tod.length)];
	msg.reply(pjr.replace(/pjrx-line/g,"\n"));
	});
}

// random anime HD v2
// pajaar 2020
else if (msg.body == "!animehd" ){
const fetch = require("node-fetch");
const imageToBase64 = require('image-to-base64');
fetch('https://raw.githubusercontent.com/pajaar/grabbed-results/master/pajaar-2020-gambar-anime.txt')
    .then(res => res.text())
    .then(body => {
	let tod = body.split("\n");
	let pjr = tod[Math.floor(Math.random() * tod.length)];
imageToBase64(pjr) // Image URL
    .then(
        (response) => {
const media = new MessageMedia('image/jpeg', response);
client.sendMessage(msg.from, media, {
caption: `Hey...` });
        }
    )
    .catch(
        (error) => {
            console.log(error); // Logs an error if there was one
        }
    )
});
}

// Download Youtube Video
else if (msg.body.startsWith("!yt ")) {
  const url = msg.body.split(" ")[1];
  const exec = require('child_process').exec;

  var videoid = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);

  const ytdl = require("ytdl-core")
  if(videoid != null) {
    console.log("video id = ",videoid[1]);
  } else {
    msg.reply("Invalid YT link.");
  }

  msg.reply("Please wait (´･ω･`)... ");
  ytdl.getInfo(videoid[1]).then(info => {
    if (info.length_seconds > 10000){
      msg.reply("terlalu panjang.. \n sebagai gantinya \n kamu bisa klik link dibawah ini \π \n "+ info.formats[0].url)

    } else {
      console.log(info.length_seconds)

      /*
      function os_func() {
        this.execCommand = function (cmd) {
        return new Promise((resolve, reject)=> {
           exec(cmd, (error, stdout, stderr) => {
             if (error) {
                reject(error);
                return;
                }
                resolve(stdout)
            });
          })
        }
      }

      var os = new os_func();

      os.execCommand('ytdl ' + url + ' -q highest -o mp4/'+ videoid[1] +'.mp4').then(res=> {
        var media = MessageMedia.fromFilePath('mp4/'+ videoid[1] +'.mp4');
        chat.sendMessage(media);
        }).catch(err=> {
          console.log("os >>>", err);
          })
      **/

      YTDL();
      var media = MessageMedia.fromFilePath('./mp3/output.mp3');
      chat.sendMessage(media);
      }
  });
//msg.reply("Maintainence...");
}

   // ========= Download Instagram
else if (msg.body.startsWith("!ig ")) {
const imageToBase64 = require('image-to-base64');
var link = msg.body.split("!ig ")[1];
var url = "http://api.fdci.se/sosmed/insta.php?url="+ link;
const { exec } = require("child_process");

function foreach(arr, func){
  for(var i in arr){
    func(i, arr[i]);
  }
}
axios.get(url)
  .then((result) => {
var b = JSON.parse(JSON.stringify(result.data));
 console.log(b.data[0].url)
  var teks = `Download completed!`;
  if(b.url == false){
	  msg.reply(" 404 Not Found. ");
  }else if( b.data[0][0].type == "foto"){

foreach(b.data[0], function(i, v){
imageToBase64(b.data[0][i].url) // Path to the image
    .then(
        (response) => {
            ; // "cGF0aC90by9maWxlLmpwZw=="

const media = new MessageMedia('image/jpeg', response);
client.sendMessage(msg.from, media, {
	caption: teks });
        }
    )
    .catch(
        (error) => {
            console.log(error); // Logs an error if there was one
        }
    )
})
    }else if(b.data[0][0].type == "video"){

foreach(b.data[0], function(i, v){
    	exec('wget "' + b.data[0][i].url + '" -O mp4/insta.mp4', (error, stdout, stderr) => {

let media = MessageMedia.fromFilePath('mp4/insta.mp4');
	client.sendMessage(msg.from, media, {
	caption: teks });
	if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
});
})
}

})
  .catch((err) => {
console.log(err);
  })
}

  /// Fun Menu

  //=========  Glow text maker
  else if (msg.body.startsWith("!glowtext ")) {
    msg.reply("Please wait...")
     var h = msg.body.split("!glowtext ")[1];

      const { exec } = require("child_process");

   (async () => {
     const browser = await puppeteer.launch({
       headless: false,

     });
     const page = await browser.newPage();
     await page
       .goto("https://en.ephoto360.com/advanced-glow-effects-74.html", {
         waitUntil: "networkidle2",
       })
       .then(async () => {
       await page.type("#text-0", h);
     await page.click("#submit");
     await new Promise(resolve => setTimeout(resolve, 10000));
         try {

           await page.waitForSelector(
             "#link-image"
           );
           const element = await page.$(
          "div.thumbnail > img"
           );
           const text = await (await element.getProperty("src")).jsonValue();
          console.log(text);

         exec('wget "' + text + '" -O jpeg/glow.jpg', (error, stdout, stderr) => {
   const media = MessageMedia.fromFilePath('jpeg/glow.jpg');

   chat.sendMessage(media);
   if (error) {
         console.log(`error: ${error.message}`);
         return;
     }
     if (stderr) {
         console.log(`stderr: ${stderr}`);
         return;
     }

     console.log(`stdout: ${stdout}`);
 });
           browser.close();
         } catch (error) {
           console.log(error);


         }
       })
       .catch((err) => {
         console.log(error);

       });


   })();
  }

  //============= Text to mp3
  else if (msg.body.startsWith("!tts")) {

    var texttomp3 = require("text-to-mp3");
      var fs = require("fs");

  var suara = msg.body.split("!tts ")[1];
  var text = suara;
  var fn = "tts/suara.mp3";




  if(process.argv.indexOf("-?")!== -1){

    return;
  }


  if(process.argv.indexOf("-t")!== -1)
    text=suara;

  if(process.argv.indexOf("-f")!== -1)
    fn=suara;

  text = text.replace(/ +(?= )/g,'');//remove all multiple space

  if(typeof text ===  "undefined" || text === ""
    || typeof fn === "undefined" || fn === "") { // just if I have a text I'm gona parse

  }

  //HERE WE GO
  texttomp3.getMp3(text, function(err, data){
    if(err){
      console.log(err);
      return;
    }

    if(fn.substring(fn.length-4, fn.length) !== ".mp3"){ // if name is not well formatted, I add the mp3 extention
      fn+=".mp3";
    }
    var file = fs.createWriteStream(fn); // write it down the file
    file.write(data);

    console.log("MP3 SAVED!");

  });
  await new Promise(resolve => setTimeout(resolve, 500));

    if(text.length > 200){ // check longness of text, because otherways google translate will give me a empty file
    msg.reply("Text to long, split in text of 200 characters")
  }else{
    const media = MessageMedia.fromFilePath(fn);

    chat.sendMessage(media);

  }


  }

	//=========  Search Image

else if (msg.body.startsWith("!searchimage ")) {

var nama = msg.body.split("!searchimage ")[1];
var req = urlencode(nama.replace(/ /g,"+"));
    const imageToBase64 = require('image-to-base64');

    var url = "http://api.fdci.se/rep.php?gambar=" + req;

   axios.get(url)
  .then((result) => {
var b = JSON.parse(JSON.stringify(result.data));

    var cewek =  b[Math.floor(Math.random() * b.length)];
    imageToBase64(cewek) // Path to the image
        .then(
            (response) => {

    const media = new MessageMedia('image/jpeg', response);
    client.sendMessage(msg.from, media, {
      caption: `Image found!`  });
            }
        )
        .catch(
            (error) => {
               msg.reply(`No result found... 🤧`); // Logs an error if there was one
            }
        )

    });
    } else if (msg.body == '!resendmedia' && msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg.hasMedia) {
            const attachmentData = await quotedMsg.downloadMedia();
            client.sendMessage(msg.from, attachmentData, { caption: 'Here\'s your requested media.' });
        }

} else if (msg.body == '!RIS' && msg.hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage();
    if (quotedMsg.hasMedia) {
        const attachmentData = await quotedMsg.downloadMedia();
        //console.log(attachmentData)

        let b64IMG = util.inspect(attachmentData.data, {showHidden: false, depth: null})
          let B64 = b64IMG.replace(/\'/g,"");
        let b64MIME = util.inspect(attachmentData.mimetype, {showHidden: false, depth: null})
          let B64M = b64MIME.replace(/\'/g,"");

        let FinalB64 = 'data:'+B64M+';base64,'+B64
        //console.log(FinalB64)
          //var path ='./jpeg/';
          //var optionalObj = {'fileName': 'out', 'type':'jpeg'};
          //await base64ToImage(FinalB64,path,optionalObj);

          const fsp = require('fs').promises;
          let a = FinalB64
          let m = a.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

          let b =  Buffer.from(m[2],'base64');
          await fsp.writeFile('./jpeg/out.jpeg',b,function(err){
            if(!err){console.log("file is created")}});
            //await new Promise((resolve, reject) => setTimeout(resolve, 10000));

        const sag = sagiri("de7f888de04b1222e9be3493df3f8892a2b1cbf4"); //sagiri token
        const results = await sag("./jpeg/out.jpeg", { mask: [5] }); //mask: [5] = pixiv only

        console.log(util.inspect(results, {showHidden: false, depth: null}))

        let SAUCE = results
        console.log('Results: ')

        const one = 0;
        let n = 0;
        for (var url in SAUCE) {
          console.log(util.inspect(SAUCE[n].url, {showHidden: false, depth: null}))
          console.log(util.inspect(SAUCE[n].raw.data.title, {showHidden: false, depth: null}))
            // skip loop if the property is from prototype
            if (!SAUCE.hasOwnProperty(url)) continue;

              let URL = util.inspect(SAUCE[n].url)
                let FINALURL = URL.replace(/\'/g,"");
              let TITLE = util.inspect(SAUCE[n].raw.data.title)
                let FINALTITLE = TITLE.replace(/\'/g,"");

            msg.reply('Url : ' + FINALURL + '\nTitle : ' + FINALTITLE)
            let one = n++; //increments 'n'
}}

//var nama = msg.body.split("!test ")[1];
//var req = urlencode(nama.replace(/ /g,"+"));
//    const imageToBase64 = require('image-to-base64');

//    var url = "http://api.fdci.se/rep.php?gambar=" + req;

//   axios.get(url)
//  .then((result) => {
//var b = JSON.parse(JSON.stringify(result.data));

//    var cewek =  b[Math.floor(Math.random() * b.length)];
//    imageToBase64(cewek) // Path to the image
//        .then(
//            (response) => {

//    const media = new MessageMedia('image/jpeg', response);
//    client.sendMessage(msg.from, media, {
//    caption: `Image found!`  });
//            }
//        )
//        .catch(
//            (error) => {
//               msg.reply(`No result found... 🤧`); // Logs an error if there was one
//            }
//        )

//    });
} else if (msg.body.startsWith("!Nyaa ")) {
  let n = 0;
  const one = 0;

    var anime = msg.body.split("!Nyaa ")[1];
    console.log('Query: '+anime)

    await si.searchByUser('AkihitoSubsWeeklies', anime, 5)
    .then((data) => {
      for (var name in data) {
        var Name = util.inspect(data[n].name)
          let FINALName = Name.replace(/\'/g,"");
        var Url = util.inspect(data[n].torrent)
          let FINALUrl = Url.replace(/\'/g,"");

        console.log('Name : '+FINALName+'\n\nURL : '+FINALUrl)
        msg.reply('Name : '+FINALName+'\n\nURL : '+FINALUrl)
        let one = n++; //increments 'n'
      }
    })
    .catch((err) => console.log(err));

}  // ======= Random Anime

  else if (msg.body == "!randomanime" ){
    const imageToBase64 = require('image-to-base64');
    var items = ["anime aesthetic", "anime cute", "anime", "kawaii anime"];
    var cewe = items[Math.floor(Math.random() * items.length)];
    var url = "http://api.fdci.se/rep.php?gambar=" + cewe;

  axios.get(url)
  .then((result) => {
var b = JSON.parse(JSON.stringify(result.data));

    var cewek =  b[Math.floor(Math.random() * b.length)];
    imageToBase64(cewek) // Path to the image
        .then(
            (response) => {

    const media = new MessageMedia('image/jpeg', response);
    client.sendMessage(msg.from, media, {
      caption: `Image found!` });
            }
        )
        .catch(
            (error) => {
                console.log(error); // Logs an error if there was one
            }
        )

    });
    }

	//=======  Quotes Terkenal

	else if (msg.body == "!quotes") {
const request = require('request');

var url = 'https://jagokata.com/kata-bijak/acak.html'
axios.get(url)
  .then((result) => {
   let $ = cheerio.load(result.data);
    var author = $('a[class="auteurfbnaam"]').contents().first().text();
   var kata = $('q[class="fbquote"]').contents().first().text();

client.sendMessage(
        msg.from,
        `
     _${kata}_



	*~${author}*
         `
      );

});
}


// Horoscope Menu

//====== Arti Nama

else if (msg.body.startsWith("!nama ")) {

var nama = msg.body.split("!nama ")[1];
var req = urlencode(nama.replace(/ /g,"+"));
var url = 'http://www.primbon.com/arti_nama.php?nama1='+ req +'&proses=+Submit%21+';
axios.get(url)
  .then((result) => {
    let $ = cheerio.load(result.data);
    var y = $.html().split('arti:')[1];
    var t = y.split('method="get">')[1];
    var f = y.replace(t ," ");
    var x = f.replace(/<br\s*[\/]?>/gi, "\n");
    var h  = x.replace(/<[^>]*>?/gm, '');
console.log(""+ h);
msg.reply(
            `
      *Arti Dari Namamu*

  ----------------------------------
         Nama _*${nama}*_ ${h}
  ----------------------------------

        *_Arti Nama By InsideHeartz_*
`
        );
});
}

//========  Cek Kecocokan Pasangan
else if (msg.body.startsWith("!pasangan ")) {
var req = msg.body;
var gh = req.split("!pasangan ")[1];

var namamu = urlencode(gh.split("&")[0]);
var pasangan = urlencode(gh.split("&")[1]);
var url= 'http://www.primbon.com/kecocokan_nama_pasangan.php?nama1='+ namamu +'&nama2='+ pasangan +'&proses=+Submit%21+';
axios.get(url)
  .then((result) => {

    let $ = cheerio.load(result.data);
var y = $.html().split('<b>KECOCOKAN JODOH BERDASARKAN NAMA PASANGAN</b><br><br>')[1];
    var t = y.split('.<br><br>')[1];
    var f = y.replace(t ," ");
    var x = f.replace(/<br\s*[\/]?>/gi, "\n");
    var h  = x.replace(/<[^>]*>?/gm, '');
    var d = h.replace("&amp;", '&')

msg.reply(`

-----------------------------------

 *Cek Kecocokan Jodoh Berdasarkan Nama ~*


 ${d}


 ----------------------------------
  _Cek Kecocokan Pasangan mu_

 `);
});
}

//=====  Berita Indonesia

	  else if (msg.body.startsWith("!berita ")) {
	   const keyword = msg.body.split("!berita ")[1];
const { Detik } = require('indo-news-scraper');
const imageToBase64 = require('image-to-base64');
var nomorlink = Math.floor(Math.random() * 5);
Detik.scrap(keyword).then(res => {
 console.log(res);
 var gambar = res[0].img;
 var judul = res[0].title;
 var url = res[0].url;

   imageToBase64(gambar) // Path to the image
        .then(
            (response) => {

    const media = new MessageMedia('image/jpeg', response);
    client.sendMessage(msg.from, media, {
      caption: `
Judul Berita :
 *${judul}*

Baca Berita Disini:
${url}
` });
            }

        )
        .catch(
            (error) => {
                console.log(error); // Logs an error if there was one
            }
        )

});
   }


// === Edukasi menu

else if (msg.body.startsWith("!wiki ")) {
const cheerio = require('cheerio');
const request = require('request');
var yos = msg.body.split("!wiki ")[1]
var jokowi = urlencode(yos.replace(/ /g, "%20"));
var url = "https://id.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles="+ jokowi
axios.get(url)
  .then((result) => {
var d = JSON.parse(JSON.stringify(result.data));
console.log(d.query.normalized[0]);
var id = d.query.pages;
id = Object.keys(id)[0];
//console.log(d.query.pages[id].extract);
msg.reply(d.query.pages[id].extract)
});

}

// Chat Bot SimSimi

// FITUR PREMIUM INI HEHE

	// Soalnya pake API PREMIUM >:(

else if (msg.body) {
   if (chat.isGroup) {
	   //
   }else{
var teks = msg.body;
const gan = require("urlencode");
const regex = gan(teks);


var url = "https://simsumi.herokuapp.com/api?text="+ regex +"&lang=ina";

axios.get(url)
  .then((result) => {
   var b = JSON.parse(JSON.stringify(result.data));
if (b.success == ""){
	msg.reply(" Maaf kak , simi ga ngerti \n coba ketik *!menu* untuk nikmatin fitur lain ");

}else{
client.sendMessage(
      msg.from,b.success)
}
})
  .catch((err) => {
console.log(err);
  })
   }
  }



})
