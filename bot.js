const Discord = require('discord.js');
const config = require("./config.json");
const client = new Discord.Client();
const avatarUrl = "https://cdn.discordapp.com/avatars/";

client.on('ready', () => {
    console.log('I am ready!');
    client.user.setActivity(`"Bday help" for info :)`);
});


client.on("message", async message => {
    if (message.author.bot) return;
    const embed = new Discord.MessageEmbed();

    switch (message.content.toLowerCase()) {
        case "bday help":
            showHelp(embed, message.channel);
            break;
        case "bday":
            profile(embed, message);
            break;
        case "testing":
            console.log(message.author);
            test(embed, message);
            break;
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


function test(embed, message) {

}

function showHelp(embed,channel) {
    embed.addFields(
            {name: 'Bday profile', value: "Displays your own birthday profile."},
            {name: 'Bday set', value: 'Allows you to set your own birthday.'},
            {name: 'Bday next', value: 'Shows the next upcoming birthday(s).'},
            {name: 'Bday list', value: 'Shows the list of users and their birthdays.'},
        );
    channel.send(embed);
}

function profile(embed, message){
    embed.setThumbnail(getAvatar(message.author))
        .addFields(
            {name: 'Name', value: message.author.username},
            {name: 'Birthday', value: 'something'},
            {name: 'Days until next birthday', value: 'something'},
        );
    message.channel.send(embed);
}

function set(message) {
    message.channel.send("Hi, " + message.author.username + 'Please enter your birthday. (DD/MM)').then(() => {
        const filter = m => message.author.id === m.author.id;

        message.channel.awaitMessages(filter, {time: 60000, max: 1, errors: ['time']})
            .then(messages => {
                message.channel.send(`Birthday set: ${messages.first().content}`);
            })
            .catch(() => {
                message.channel.send('You did not enter any input!');
            });
    });
}

function next(message) {

}

function list(message) {

}

function reset(message) {

}

function getAvatar(author) {
    return avatarUrl + author.id + "/" + author.avatar + ".png"
}

client.login(config.token);
