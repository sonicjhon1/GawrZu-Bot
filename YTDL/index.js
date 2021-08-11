const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

async function FFMPEGCALL() {
/**
 *    input - string, path of input file
 *    output - string, path of output file
 *    callback - function, node-style callback fn (error, result)
 */

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

await convert('./test.mp3', './output.mp3', function(err){
   if(!err) {
       console.log('Conversion completed successfully');
   }
});
}


async function Download() {
  await ytdl('https://www.youtube.com/watch?v=3JmvuPaFbZw', { quality : 'highestaudio' })
    .pipe(fs.createWriteStream('test.mp4'));
    }


async function Rename() {fs.renameSync('./test.mp4', './test.mp3')}


async function OrderingCalls() {
await Download();
console.log('Downloading the video.')
await new Promise((resolve, reject) => setTimeout(resolve, 5000));
console.log('Assuming the video has done downloading.')
await Rename();
console.log('File renamed!')
await FFMPEGCALL();
}

OrderingCalls();
//await OrderingCalls();
