const Discord = require('discord.js');
const config = require("./config.json");

const client = new Discord.Client();

client.on('ready', () => {
    console.log('I am ready!');
    client.user.setActivity(`Serving Nunu :)`);
});


client.on("message", async message => {
    if (message.author.bot) return;

    switch (message.content.toLowerCase()) {
        case "bday set":
            set(message);
            break;
        case "bday next":
            next(message);
            break;
        case "bday list":
            list(message);
            break;
        case "bday reset":
            reset(message);
            break;
        default:
            break;
    }
});

function set(message) {
    message.channel.send(message.author);
}

function next(message) {

}

function list(message) {

}

function reset(message) {

}

client.login(config.token);
