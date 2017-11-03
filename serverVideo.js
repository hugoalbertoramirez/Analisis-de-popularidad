const vindexer = require("video-indexer");
const Vindexer = new vindexer("7c3b04e87be44f10be0386b5558dde91");

// Upload video via a URL and generate intelligent insights. If no URL is specified, the file should be passed as a multipart/form body content.
Vindexer.uploadVideo({
    // Optional
    videoUrl: "https://www.youtube.com/watch?v=TCPpXPoOZIk",
    name: 'Enrique Peña Nieto, Presidente de México, presentó 10 objetivos',
    privacy: 'Private', 
    language: 'Spanish', 
    externalId: '69C849FFDFA5521F46E069C849FFDFA5521F46E0',
    description: 'Enrique Peña Nieto, Presidente de México, presentó 10 objetivos de política exterior para hacer frente al gobierno de Donald Trump, asegura que trabajará en la ...',
    partition: 'demos'
}).then( function(result)
{ 
    console.log ("IN \n" + JSON.stringify(JSON.parse(result.body), null, 4)); 
});

// Get full insights from previously-processed video
Vindexer.getBreakdown("69C849FFDFA5521F46E069C849FFDFA5521F46E0").then( function(result)
{ 
    console.log ("OUT \n" + JSON.stringify(JSON.parse(result.body), null, 4)); 
});