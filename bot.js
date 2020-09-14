const Discord = require('discord.js');
const config = require("./config.json");

const client = new Discord.Client();

client.on('ready', () => {
    console.log('I am ready!');
    client.user.setActivity(`Serving Nunu :)`);
});


client.on("message", async message => {
    if (message.author.bot) return;
    const embed = new Discord.MessageEmbed();

    switch (message.content.toLowerCase()) {
        case "testing":
            embed.setTitle("test");
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
        embed.setColor('#0099ff')
        .setTitle('Some title')
        .setURL('https://discord.js.org/')
        .setAuthor(message.author.username, message.author.avatar)
        .setDescription('Some description here')
        .setThumbnail('https://i.imgur.com/wSTFkRM.png')
        .addFields(
            { name: 'Regular field title', value: 'Some value here' },
            { name: '\u200B', value: '\u200B' },
            { name: 'Inline field title', value: 'Some value here', inline: true },
            { name: 'Inline field title', value: 'Some value here', inline: true },
        )
        .addField('Inline field title', 'Some value here', true)
        .setImage('https://i.imgur.com/wSTFkRM.png')
        .setTimestamp()
        .setFooter('Some footer text here', 'https://i.imgur.com/wSTFkRM.png');

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

client.login(config.token);
