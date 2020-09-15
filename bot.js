let repo = {};
let birthdays = [];
let entry = "";
let headHash = ""
let commit = ""
let tree = ""

const githubName = "MiloszBoghePXL/BirthdayBot";
const gitToken = process.env.github;
const Discord = require('discord.js');
let run = require("gen-run");
require('js-github/mixins/github-db')(repo, githubName, gitToken);
require('js-git/mixins/create-tree')(repo);
require('js-git/mixins/mem-cache')(repo);
require('js-git/mixins/read-combiner')(repo);
require('js-git/mixins/formats')(repo);

const client = new Discord.Client();

const avatarUrl = "https://cdn.discordapp.com/avatars/";
const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

client.on('ready', () => {
    client.user.setActivity(`"Bday help" for info :)`);
    run(getBirthdays());
});

client.on("message", async message => {
    if (message.author.bot) return;
    const embed = new Discord.MessageEmbed();
    if (message.content === "bday") {
        showHelp(embed, message.channel)
    } else {
        const command = message.content.split(" ");
        if (command[0].toLowerCase() === "bday") {
            switch (command[1].toLowerCase()) {
                case "help":
                    showHelp(embed, message.channel);
                    break;
                case "profile":
                    if (command[2]) {
                        let user = message.mentions.users.toJSON()[0];
                        profile(embed, user, message.channel);
                    } else {
                        profile(embed, message.author, message.channel);
                    }
                    break;
                case "set":
                    set(embed, message.author, message.channel);
                    break;
                case "next":
                    next(embed, message.author, message.channel);
                    break;
                case "list":
                    list(embed, message.author, message.channel);
                    break;
                default:
                    message.channel.send("Not a valid command. Try 'bday help' for info :).");
            }
        }
    }
});

function showHelp(embed, channel) {
    embed.addFields(
        {name: 'Bday profile (@user optional)', value: "Displays someones birthday profile."},
        {name: 'Bday set', value: 'Allows you to set your own birthday.'},
        {name: 'Bday next', value: 'Shows the next upcoming birthday(s).'},
        {name: 'Bday list', value: 'Shows the list of users and their birthdays.'},
    );
    channel.send(embed);
}

function profile(embed, author, channel) {
    embed.setThumbnail(getAvatar(author))
        .addFields(
            {name: 'Name', value: author.username},
            {name: 'Birthday', value: 'something'},
            {name: 'Days until next birthday', value: 'something'},
        );
    channel.send(embed);
}

function set(embed, author, channel) {
    embed.addField('Setting your birthday', "\nHi, " + author.username + '\nPlease enter your birthday in the following format:\n DD/MM/YYYY');
    channel.send(embed).then(() => {
        requestDateInput(channel, author);
    });
}

function next(embed, author, channel) {

}

function list(embed, author, channel) {

}

function requestDateInput(channel, author) {
    const embed = new Discord.MessageEmbed();
    const filter = m => author.id === m.author.id;
    channel.awaitMessages(filter, {time: 60000, max: 1, errors: ['time']})
        .then(messages => {
            let date = messages.first().content;
            if (date.startsWith("bday")) return;
            if (!validate(date)) {
                wrongInput(channel, author)
            } else {
                let exists = birthdays.findIndex(member => member.id === parseInt(author.id));
                if (exists >= 0) {
                    birthdays.splice(exists, 1);
                }
                let entry = {id: parseInt(author.id), BirthDate: date}
                birthdays.push(entry);
                run(updateBirthdays());
                embed.addField("Birthday set", `Your birthday is now set on ${date}`);
                channel.send(embed);
            }
        });
}

function wrongInput(channel, author) {
    const embed = new Discord.MessageEmbed();
    embed.addField("Wrong input", "\nMake sure you use the right format:\n DD/MM/YYYY\nPlease try again :)\n(year can't be greater than current year.");
    channel.send(embed).then(() => {
        requestDateInput(channel, author);
    });
}

function validate(date) {
    if (!date.match(/[0-9]{2}\/[0-9]{2}\/[0-9]+/g)) return false;
    let parts = date.split("/");
    let day = parseInt(parts[0]);
    let month = parseInt(parts[1]);
    let year = parseInt(parts[2]);
    return !(day < 1 || day > 31 || month < 1 || month > 12 || year >= parseInt(new Date().getFullYear().toString()));
}


function getAvatar(author) {
    return avatarUrl + author.id + "/" + author.avatar + ".png"
}

function* getBirthdays() {
    headHash = yield repo.readRef("refs/heads/master");
    commit = yield repo.loadAs("commit", headHash);
    tree = yield repo.loadAs("tree", commit.tree);
    entry = tree["test.json"];
    birthdays = JSON.parse(yield repo.loadAs("text", entry.hash));
    console.log(birthdays);
}

function* updateBirthdays() {
    let updates = [
        {
            path: "test.json", // Update the existing entry
            mode: entry.mode,  // Preserve the mode
            content: JSON.stringify(birthdays)
        }
    ]

    // Based on the existing tree, we only want to update, not replace.
    updates.base = commit.tree;

    // Create the new file and the updated tree.
    let treeHash = yield repo.createTree(updates);
    let commitHash = yield repo.saveAs("commit", {
        tree: treeHash,
        author: {
            name: "Milosz Boghe",
            email: "milly.boghe@gmail.com"
        },
        parent: headHash,
        message: "test"
    });

    // Now we can browse to this commit by hash, but it's still not in master.
    // We need to update the ref to point to this new commit.
    yield repo.updateRef("refs/heads/master", commitHash);
}

client.login(process.env.token);
