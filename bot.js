//region init
const moment = require("moment");
const cron = require("node-cron");
const Discord = require('discord.js');
const avatarUrl = "https://cdn.discordapp.com/avatars/";
const client = new Discord.Client();
let birthdays = [];
//id's
let ownerId = "217373835303976960";
let nella = "470350669283328000";

//git stuff
const githubName = "MiloszBoghePXL/BirthdayBot";
const gitToken = process.env.github;
let repo = {};
let entry = "";
let headHash = ""
let commit = ""
let tree = ""

//date stuff
const format = "MM/DD/YYYY";
const formath = "MMMM Do";
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
    let channel = client.channels.cache.get("480124306181849100");
    cron.schedule("0 0 10 * * *", () => {
        today(channel);
    }, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
    });
});

//endregion


//region Done, dont touch

client.on("message", async message => {
    if (message.author.bot) return;
    const embed = new Discord.MessageEmbed();
    embed.setDescription("-----------------------------");
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
                case "restart":
                    if (message.author.id !== ownerId) return;
                    message.channel.send('Restarting...')
                        .then(() => client.destroy())
                        .then(() => client.login(process.env.token));
                    break;
                case "set":
                    let user = message.mentions.users.toJSON()[0];
                    if (user) {
                        if (message.author.id === nella || message.author.id === user.id || message.author.id === ownerId) {
                            requestDateInput(message.channel, user, command[3])
                        } else {
                            message.channel.send("I don't take orders from you!");
                        }
                    } else if (command[2]) {
                        requestDateInput(message.channel, message.author, command[2]);
                    } else {
                        set(embed, message.author, message.channel);
                    }
                    break;
                case "next":
                    nextSend(embed, message.channel);
                    break;
                case "today":
                    today(message.channel);
                    break;
                case "test":
                    test(message.channel);
                    break;
                default:
                    break;
            }
        }
    }
});

function test(channel) {
    next(channel);
}

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
    let exists = birthdays.findIndex(member => member.id.toString() === author.id);
    if (exists >= 0) {
        birthdays.splice(exists, 1);
    }
    let entry = {id: author.id, name: author.username, date: date}
    birthdays.push(entry);
    embed.addField("Birthday set", author.username + `'s birthday is now set on ${moment(date + "/" + moment().year(), format).format(formath)}`);
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

function next() {
    let temp = getList();

    //find the closest birthday:
    let next = temp[0];
    temp.forEach(entry => {
        let min = next.daysLeft;
        let days = entry.daysLeft;
        days < min && days > 0 ? next = entry : null;
    })

    //find all users with this birthday:
    let users = "";
    temp.forEach(entry => {
        if (entry.date === next.date) {
            users += "\n" + entry.name;
        }
    })
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

function today(channel) {
    let ids = [];
    birthdays.find(b => {
        let date = moment(b.date, format);
        if (date.format(format) === moment().format(format)) ids.push(b.id);
    })
    if (ids.length === 0) {
        channel.send("No birthdays today :frowning:");
        return;
    }
    let users = "";
    ids.forEach(id => {
        users += "<@" + id + "> "
    })
    announce(channel, users);
}

function announce(channel, ids) {
    let fireworks =
        ":fireworks::fireworks::fireworks::fireworks::fireworks:\n" +
        ":fireworks::fireworks::fireworks::fireworks::fireworks:\n" +
        ":fireworks::fireworks::fireworks::fireworks::fireworks:\n" +
        ":fireworks::fireworks::fireworks::fireworks::fireworks:\n"
    channel.send(fireworks).then(() => {
        channel.send("Today: " + ids +
            "\nHappy birthday! :partying_face:"
        ).then(() => {
            channel.send(fireworks);
        })
    });
}

function profile(embed, author, channel) {
    let member = birthdays.find(member => member.id.toString() === author.id);
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
    embed.setThumbnail("https://www.pngkey.com/png/full/12-125599_question-mark-png-blue-question-mark.png")
        .addFields(
            {name: 'Bday profile (@user optional)', value: "Displays someones birthday profile."},
            {name: 'Bday set MM/DD', value: 'Allows you to set your own birthday.'},
            {name: 'Bday next', value: 'Shows the next upcoming birthday(s).'},
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
