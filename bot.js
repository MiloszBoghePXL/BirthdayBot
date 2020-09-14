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
        case "testing":
            test(message);
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

function test(message) {
    message.guild.members.fetch().then(fetchedMembers => {
        const totalOnline = fetchedMembers.filter(member => member.presence.status === 'online');
        // We now have a collection with all online member objects in the totalOnline variable
        message.channel.send(`There are currently ${totalOnline.size} members online in this guild!`);
    });
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
