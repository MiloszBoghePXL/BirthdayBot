//region init
let repo = {};
let ownerId = "217373835303976960";
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

client.on('ready', () => {
    client.user.setActivity(`"Bday help" for info :)`);
    run(getBirthdays());
    setTimeout(() => {
        run(updateBirthdays());
    }, 300000)
});


//endregion

client.on("message", async message => {
    if (message.author.bot) return;
    const embed = new Discord.MessageEmbed();
    if (message.content.toLowerCase() === "bday") {
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
                case "shutdown":
                    if (message.author.id !== ownerId) return;
                    message.channel.send("Shutting down.")
                        .then(m => client.destroy());
                    break;
                case "restart":
                    if (message.author.id !== ownerId) return;
                    message.channel.send('Restarting...')
                        .then(m => client.destroy())
                        .then(() => client.login(process.env.token));
                    break;
                case "set":
                    if (command[2]) {
                        requestDateInput(message.channel, message.author, command[2]);
                    } else {
                        set(embed, message.author, message.channel);
                    }
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

function next(embed, author, channel) {

}

function list(embed, author, channel) {

}

//region Done, dont touch

function set(embed, author, channel) {
    embed.addField('Setting your birthday', "\nHi, " + author.username + '\nPlease enter your birthday in the following format:\n MM/DD/YYYY');
    channel.send(embed).then(() => {
        requestDateInput(channel, author);
    });
}

function requestDateInput(channel, author, date) {
    const embed = new Discord.MessageEmbed();
    const filter = m => author.id === m.author.id;
    if (date) {
        if (validate(date)) {
            correctInput(embed, author, channel, date);
            return;
        }else{
            wrongInput(channel,author);
        }
    }
    channel.awaitMessages(filter, {time: 60000, max: 1, errors: ['time']})
        .then(messages => {
            let date = messages.first().content;
            if (date.toLowerCase() === "stop") return;
            if (date.startsWith("bday")) return;
            if (!validate(date)) {
                wrongInput(channel, author)
            } else {
                correctInput(embed, author, channel, date);
            }
        });
}

function wrongInput(channel, author) {
    const embed = new Discord.MessageEmbed();
    embed.addField("Wrong input", "\nMake sure you use the right format:\n MM/DD/YYYY\nPlease try again :)\n(year can't be greater than current year.\n\n Write 'stop' to cancel");
    channel.send(embed).then(() => {
        requestDateInput(channel, author);
    });
}

function correctInput(embed, author, channel, date) {
    let exists = birthdays.findIndex(member => member.id === parseInt(author.id));
    if (exists >= 0) {
        birthdays.splice(exists, 1);
    }
    let entry = {id: parseInt(author.id), date: date}
    birthdays.push(entry);
    embed.addField("Birthday set", `Your birthday is now set on ${date}`);
    channel.send(embed);
    setTimeout(() => {
        run(updateBirthdays());
    }, 3600000)
}

function profile(embed, author, channel) {
    let member = birthdays.find(member => member.id === parseInt(author.id));
    if (!member) {
        showProfile(embed, author, channel, "Not set", "/");
        return;
    }
    let birthday = new Date(member.date);
    let nextBirthday = calcNext(birthday);

    //time to next:
    let now = new Date();
    let time = nextBirthday.getTime() - now.getTime();
    let days = Math.ceil(time / (1000 * 60 * 60 * 24));

    birthday = birthday.toLocaleDateString("en-US");
    showProfile(embed, author, channel, birthday, days);
}

function showProfile(embed, author, channel, birthday, days) {
    embed.setThumbnail(getAvatar(author))
        .addFields(
            {name: 'Name', value: author.username},
            {name: 'Birthday', value: birthday},
            {name: 'Days until next birthday', value: days},
        );
    channel.send(embed);
}

function calcNext(birthday) {
    let nextBirthday = new Date(birthday.getFullYear(), birthday.getMonth(), birthday.getDate());
    let now = new Date();
    if (now.getMonth() > birthday.getMonth() || (now.getMonth() === birthday.getMonth() && now.getDate() > birthday.getDate())) {
        nextBirthday.setFullYear(now.getFullYear() + 1);
    }
    return nextBirthday;
}

function* getBirthdays() {
    headHash = yield repo.readRef("refs/heads/master");
    commit = yield repo.loadAs("commit", headHash);
    tree = yield repo.loadAs("tree", commit.tree);
    entry = tree["birthdays.json"];
    birthdays = JSON.parse(yield repo.loadAs("text", entry.hash));
}

function* updateBirthdays() {

    let updates = [
        {
            path: "birthdays.json", // Update the existing entry
            mode: entry.mode,  // Preserve the mode
            content: JSON.stringify(birthdays).replace("\\", "")
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
        message: "update birthdays.json"
    });

    // Now we can browse to this commit by hash, but it's still not in master.
    // We need to update the ref to point to this new commit.
    yield repo.updateRef("refs/heads/master", commitHash);
    setTimeout(() => {
        run(updateBirthdays())
    }, 60000);
}

function showHelp(embed, channel) {
    embed.addFields(
        {name: 'Bday profile (@user optional)', value: "Displays someones birthday profile."},
        {name: 'Bday set MM/DD/YYYY', value: 'Allows you to set your own birthday.'},
        {name: 'Bday next', value: 'Shows the next upcoming birthday(s).'},
        {name: 'Bday list', value: 'Shows the list of users and their birthdays.'},
    );
    channel.send(embed);
}

function validate(date) {
    if (!date.match(/[0-9]{1,2}\/[0-9]{1,2}\/[0-9]+/g)) return false;
    let parts = date.split("/");
    let month = parseInt(parts[0]);
    let day = parseInt(parts[1]);
    let year = parseInt(parts[2]);
    return !(day < 1 || day > 31 || month < 1 || month > 12 || year >= parseInt(new Date().getFullYear().toString()));
}

function getAvatar(author) {
    return avatarUrl + author.id + "/" + author.avatar + ".png"
}


//endregion

client.login(process.env.token);
