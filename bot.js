//region init
const moment = require("moment");
const Pagination = require('discord-paginationembed');
const Discord = require('discord.js');
const githubName = "MiloszBoghePXL/BirthdayBot";
const avatarUrl = "https://cdn.discordapp.com/avatars/";
const gitToken = process.env.github;
const client = new Discord.Client();
let repo = {};
let ownerId = "217373835303976960";
let birthdays = [];
let entry = "";
let headHash = ""
let commit = ""
let tree = ""
let format = "MM/DD/YYYY";
let formath = "MMMM Do";
let currentYear = moment().year();
let nextYear = currentYear + 1;
let run = require("gen-run");
require('js-github/mixins/github-db')(repo, githubName, gitToken);
require('js-git/mixins/create-tree')(repo);
require('js-git/mixins/mem-cache')(repo);
require('js-git/mixins/read-combiner')(repo);
require('js-git/mixins/formats')(repo);


client.on('ready', () => {
    client.user.setActivity(`"Bday" for info :)`);
    run(getBirthdays());
});

//endregion


//region Done, dont touch

function check(channel) {
    next(channel);
    setTimeout(() => {
        check(channel)
    }, 60000*60*24);
}

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
                        .then(() => client.destroy());
                    break;
                case "check":
                    if (message.author.id !== ownerId) return;
                    check(message.channel);
                    break;
                case "restart":
                    if (message.author.id !== ownerId) return;
                    message.channel.send('Restarting...')
                        .then(() => client.destroy())
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
                    nextSend(embed, message.channel);
                    break;
                default:
                    message.channel.send("Not a valid command. Try 'bday help' for info :).");
            }
        }
    }
});

function set(embed, author, channel) {
    embed.addField('Setting your birthday', "\nHi, " + author.username + '\nPlease enter your birthday in the following format:\n MM/DD');
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
        } else {
            wrongInput(channel, author);
            return;
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

function correctInput(embed, author, channel, date) {
    let exists = birthdays.findIndex(member => member.id === parseInt(author.id));
    if (exists >= 0) {
        birthdays.splice(exists, 1);
    }
    let entry = {id: parseInt(author.id), name: author.username, date: date}
    birthdays.push(entry);
    embed.addField("Birthday set", `Your birthday is now set on ${moment(date + "/" + moment().year(), format).format(formath)}`);
    channel.send(embed);
    run(updateBirthdays());
}

function wrongInput(channel, author) {
    const embed = new Discord.MessageEmbed();
    embed.addField("Wrong input", "\nMake sure you use the right format:\n MM/DD\nPlease try again :)\n\n Write 'stop' to cancel");
    channel.send(embed).then(() => {
        requestDateInput(channel, author);
    });
}

function getList() {
    //make an array with the next birthdays and days left for each.
    return birthdays.map(b => {
        return {
            id: b.id,
            name: b.name,
            date: calcNext(moment(b.date, format)),
            daysLeft: daysLeft(calcNext(moment(b.date, format)))
        }
    });
}

function next(channel) {
    let temp = getList();

    //find the closest birthday:
    let next = temp[0];
    temp.forEach(entry => {
        let min = next.daysLeft;
        let days = entry.daysLeft;
        days < min ? next = entry : null;
    })

    //find all users with this birthday:
    let users = "";
    let ids = ""
    temp.forEach(entry => {
        if (entry.date === next.date) {
            users += "\n" + entry.name;
            ids += "<@" + entry.id + ">" + " ";
        }
    })

    if (next.daysLeft === 0) {
        announce(channel, ids);
        return;
    }
    return {next: next, users: users};

}

function nextSend(embed, channel) {
    let upcoming = next(channel);

    if (upcoming) {
        embed.setThumbnail("http://icongal.com/gallery/image/65396/birthday_clock_cake.png");
        embed.addField('Next Birthday', upcoming.next.date.format(format));
        embed.addField('Days left', upcoming.next.daysLeft);
        embed.addField('User(s)', upcoming.users);
        channel.send(embed);
    }
}

function announce(channel, ids) {
    channel.send("Today: " + ids +
        "\nHappy birthday! :partying_face:"
    );
}

function profile(embed, author, channel) {
    let member = birthdays.find(member => member.id === parseInt(author.id));
    if (!member) {
        showProfile(embed, author, channel, "Not set", "/");
        return;
    }
    let birthday = moment(member.date, format).year(currentYear);
    //time to next:
    let nextBirthday = calcNext(birthday);
    let days = daysLeft(nextBirthday);
    showProfile(embed, author, channel, birthday, days);
}

function calcNext(birthday) {
    return moment() > birthday ? birthday.year(nextYear) : birthday;
}

function daysLeft(birthday) {
    let left = Math.ceil(birthday.diff(moment(), "days", true));
    return left === 365 || left === 366 ? 0 : left;
}

function showProfile(embed, author, channel, birthday, days) {
    embed.setThumbnail(getAvatar(author))
        .addFields(
            {name: 'Name', value: author.username},
            {name: 'Birthday', value: moment(birthday).format(formath)},
            {name: 'Days until next birthday', value: days > 0 ? days : days === 0 ? "Today :partying_face:" : "/"},
        );
    channel.send(embed);
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
    headHash = yield repo.readRef("refs/heads/master");
    commit = yield repo.loadAs("commit", headHash);
    tree = yield repo.loadAs("tree", commit.tree);
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
}

function showHelp(embed, channel) {
    embed.addFields(
        {name: 'Bday profile (@user optional)', value: "Displays someones birthday profile."},
        {name: 'Bday set MM/DD', value: 'Allows you to set your own birthday.'},
        {name: 'Bday next', value: 'Shows the next upcoming birthday(s).'},
        {name: 'Bday list', value: 'Shows the list of users and their birthdays.'},
    );
    channel.send(embed);
}

function validate(date) {
    if (!date.match(/[0-9]{1,2}\/[0-9]{1,2}/g)) return false;
    let parts = date.split("/");
    let month = parseInt(parts[0]);
    let day = parseInt(parts[1]);
    return !(day < 1 || day > 31 || month < 1 || month > 12);
}

function getAvatar(author) {
    return avatarUrl + author.id + "/" + author.avatar + ".png"
}

client.login(process.env.token);

//endregion
