/*  jshint esversion: 8 */

const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const fs = require('fs');

const rawdata = fs.readFileSync('GREvocab.json');
const GREvocab = JSON.parse(rawdata);


const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

const createChoices = (random_word) => {
    const choices = [];
    choices.push(random_word.definition);

    while (choices.length < 4) {
        const option = GREvocab[Math.floor(Math.random() * GREvocab.length)];
        //  console.log(option.name, random_word.name);
        if (option.name !== random_word.name) {
            choices.push(option.definition);
        }
    }
    shuffleArray(choices);
    console.log(choices);
    return choices;
};

const createEmbed = async (random_word, choices, optionFlag = 0) => {
    const embedReply = new MessageEmbed();
    embedReply
        .setDescription(random_word.name)
        .setTimestamp();
    switch (optionFlag) {
        case 0:
            embedReply
                .addFields(
                    {
                        name: "A",
                        value: `${choices[0]}`,

                    },
                    {
                        name: "B",
                        value: `${choices[1]}`,

                    },
                    {
                        name: "C",
                        value: `${choices[2]}`,

                    },
                    {
                        name: "D",
                        value: `${choices[3]}`,

                    });

            break;
        case 1:
            embedReply
                .setColor("#00A86B")
                .addField("Answer:", `${choices[0]}`, false);
            break;
        case 2:
            embedReply
                .setColor("#E3242B")
                .addFields(
                    {
                        name: "Answer:",
                        value: `${choices[0]}`,

                    },
                    {
                        name: "You selected",
                        value: `${choices[1]}`,

                    });
            break;
        case 3:
            embedReply
                .setColor("#00A86B")
                .setDescription("game is done");
            break;

    }
    embedReply.setFooter(
        `via custom JSON`,
        "https://raw.githubusercontent.com/GordonLei/Neco-Arc/main/images/profile.png"
    );

    return embedReply;
};

const createButtonRow = (optionFlag = 0) => {
    const buttonRow = new MessageActionRow();
    console.log(optionFlag);
    switch (optionFlag) {
        case 0:
            buttonRow.addComponents(
                new MessageButton()
                    .setCustomId("A")
                    .setLabel("A")
                    .setStyle("SECONDARY"),
                new MessageButton()
                    .setCustomId("B")
                    .setLabel("B")
                    .setStyle("SECONDARY"),
                new MessageButton()
                    .setCustomId("C")
                    .setLabel("C")
                    .setStyle("SECONDARY"),
                new MessageButton()
                    .setCustomId("D")
                    .setLabel("D")
                    .setStyle("SECONDARY")
            );
            break;
        case 1:
        case 2:
            console.log("triggered this");
            buttonRow.addComponents(
                new MessageButton()
                    .setCustomId("Continue")
                    .setLabel("Continue")
                    .setStyle("SECONDARY"),
                new MessageButton()
                    .setCustomId("Stop")
                    .setLabel("Stop")
                    .setStyle("SECONDARY")
            );
            break;
    }

    return buttonRow;
};

const buttonLogic = async (interaction, random_word, choices) => {
    let current_random_word = random_word;
    let current_choices = choices;

    const filter = (i) =>
        i.customId === "A" ||
        i.customId === "B" ||
        i.customId === "C" ||
        i.customId === "D" ||
        i.customId === "Continue" ||
        i.customId === "Stop";

    const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 15000,
    });

    collector.on("collect", async (i) => {
        let selectedChoice = "";
        if (i.customId === "A") { selectedChoice = current_choices[0]; }
        else if (i.customId === "B") { selectedChoice = current_choices[1]; }
        else if (i.customId === "C") { selectedChoice = current_choices[2]; }
        else if (i.customId === "D") { selectedChoice = current_choices[3]; }

        switch (i.customId) {
            case "A":
            case "B":
            case "C":
            case "D":
                if (selectedChoice === current_random_word.definition) {
                    const new_choices = [selectedChoice];
                    const embed = await createEmbed(current_random_word, new_choices, 1);
                    const row = createButtonRow(1);
                    collector.resetTimer();
                    console.log("time: ", collector.time);
                    await i.update({ embeds: [embed], components: [row] });
                }
                else {
                    //  console.log(random_word.definition);
                    const new_choices = [current_random_word.definition, selectedChoice];
                    const embed = await createEmbed(current_random_word, new_choices, 2);
                    const row = createButtonRow(2);
                    collector.resetTimer();
                    console.log("time: ", collector.time);
                    //  await i.update({ embeds: [embed] });
                    await i.update({ embeds: [embed], components: [row] });
                }
                break;
            case "Continue":
                if (current_random_word != "") {
                    current_random_word = GREvocab[Math.floor(Math.random() * GREvocab.length)];
                    //  const answer = random_word.definition;
                    current_choices = createChoices(current_random_word);
                    //  console.log(choices);
                    const embed = await createEmbed(current_random_word, current_choices);
                    const row = createButtonRow();
                    await i.update({ embeds: [embed], components: [row] });
                }

                break;
            case "Stop":
                if (current_random_word != "") {
                    const new_embed = await createEmbed(random_word, choices, 3);
                    await i.update({ embeds: [new_embed], components: [] });
                }

                break;
        }


    });


    collector.on("end", async (collected) => {
        console.log(`Collected ${collected.size} items`);
    });
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("vocab")
        .setDescription("Test your GRE vocabulary knowledge!"),
    async execute(interaction) {

        const random_word = GREvocab[Math.floor(Math.random() * GREvocab.length)];
        //  const answer = random_word.definition;
        const choices = createChoices(random_word);
        //  console.log(choices);
        const embed = await createEmbed(random_word, choices);
        const row = createButtonRow();
        await interaction.reply({ embeds: [embed], components: [row] });
        await buttonLogic(interaction, random_word, choices);
    },
};
