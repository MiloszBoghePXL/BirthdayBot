let repo = {};
const githubName = "MiloszBoghePXL/BirthdayBot";
const gitToken = process.env.github;
const Discord = require('discord.js');
const fetch = require("node-fetch");
let run = require("gen-run");
require('js-github/mixins/github-db')(repo, githubName, gitToken);
require('js-git/mixins/create-tree')(repo);
require('js-git/mixins/mem-cache')(repo);
require('js-git/mixins/read-combiner')(repo);
require('js-git/mixins/formats')(repo);

run(function* () {
    let headHash = yield repo.readRef("refs/heads/master");
    let commit = yield repo.loadAs("commit", headHash);
    let tree = yield repo.loadAs("tree", commit.tree);
    let entry = tree["birthdays.json"];
    let birthdays = yield repo.loadAs("text", entry.hash);
    console.log(birthdays);

    // Build the updates array
    let satan = {"id": 217373835303976960, "BirthDate": "27/07/1995"}
    let updates = [
        {
            path: "birthdays.json", // Update the existing entry
            mode: entry.mode,  // Preserve the mode (it might have been executible)
            content: JSON.stringify(satan)
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
})
;

const client = new Discord.Client();

const avatarUrl = "https://cdn.discordapp.com/avatars/";
const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

client.on('ready', () => {
    client.user.setActivity(`"Bday help" for info :)`);
});

client.on("message", async message => {
    if (message.author.bot) return;
    const embed = new Discord.MessageEmbed();
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
            case "testing":
                let url = "https://raw.githubusercontent.com/MiloszBoghePXL/BirthdayBot/master/birthdays.json";
                fetch(url,
                    {
                        method: "GET",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    }).then((response) => {
                    response.json().then((data) => {
                        console.log(data);
                    })
                });
                break;
            case "set":
                set(message);
                break;
            case "next":
                next(message);
                break;
            case "list":
                list(message);
                break;
            default:
                message.channel.send("Not a valid command. Try 'bday help' for info :).");
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

function set(message) {
    message.channel.send("Hi, " + message.author.username + '\nPlease enter your birthday. (DD/MM)').then(() => {
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

function getAvatar(author) {
    return avatarUrl + author.id + "/" + author.avatar + ".png"
}

client.login(process.env.token);
