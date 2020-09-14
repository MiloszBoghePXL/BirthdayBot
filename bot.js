const Discord = require('discord.js');
const config = require("./config.json");

const client = new Discord.Client();

client.on('ready', () => {
    console.log('I am ready!');
    client.user.setActivity(`Serving Nunu :)`);
});


client.on("message", async message => {
    if(message.author.bot) return;

    switch(message.content.toLowerCase()) {
        case "bday set":

            break;
        case "bday next":

            break;
        case "bday list":

            break;
        case "bday reset":

            break;
        default:
            break;
    }
});

function set(){

}

function next(){

}

function list(){

}

function reset(){

}

client.login(config.token);
