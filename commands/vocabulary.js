/*  jshint esversion: 8 */

const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  Message,
} = require("discord.js");
const fs = require("fs");
//  open the GREvocab.json and get all of the words
const rawdata = fs.readFileSync("GREvocab.json");
const GREvocab = JSON.parse(rawdata);
//  do a psuedo-random shuffling of the array
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

//  given a random_word, create the choices
const createChoices = (random_word) => {
  const choices = [];
  choices.push(random_word.definition);
  //    this while loop should just make sure the 4 options are different
  while (choices.length < 4) {
    const option = GREvocab[Math.floor(Math.random() * GREvocab.length)];
    //  console.log(option.name, random_word.name);
    if (option.name !== random_word.name) {
      choices.push(option.definition);
    }
  }
  //    shuffle the options and return this new array
  shuffleArray(choices);
  console.log(choices);
  return choices;
};

//  create the embed. OptionFlag is type of embed
const createEmbed = async (random_word, choices, optionFlag = 0) => {
  const embedReply = new MessageEmbed();
  embedReply.setDescription(random_word.name).setTimestamp();
  switch (optionFlag) {
    //0 is when you are playing the game
    case 0:
      embedReply.addFields(
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
        }
      );

      break;
    //1 is when you are correct
    case 1:
      embedReply
        .setColor("#00A86B")
        .addField("Answer:", `${choices[0]}`, false);
      break;
    //1 is when you are wrong
    case 2:
      embedReply.setColor("#E3242B").addFields(
        {
          name: "Answer:",
          value: `${choices[0]}`,
        },
        {
          name: "You selected",
          value: `${choices[1]}`,
        }
      );
      break;
    //3 is when you are done playing
    case 3:
      embedReply.setColor("#00A86B").setDescription("game is done");
      break;
    //4 is when you timed out
    case 4:
      embedReply.setColor("#E3242B").addFields(
        {
          name: "Answer:",
          value: `${choices[0]}`,
        },
        {
          name: "You selected",
          value: "No Answer",
          inline: false,
        }
      );
      break;
  }
  //    just the footer information
  embedReply.setFooter(
    `via custom JSON`,
    "https://raw.githubusercontent.com/GordonLei/Neco-Arc/main/images/profile.png"
  );
  //return the embed
  return embedReply;
};

//  create the row of buttons
const createButtonRow = (optionFlag = 0) => {
  const buttonRow = new MessageActionRow();
  console.log(optionFlag);
  switch (optionFlag) {
    //    if you are playing the game
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
        new MessageButton().setCustomId("D").setLabel("D").setStyle("SECONDARY")
      );
      break;
    //    if you are wrong / right
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
  //    return this row
  return buttonRow;
};

//    button logic; what happens when you press a button
const buttonLogic = async (interaction, random_word, choices) => {
  let current_random_word = random_word;
  let current_choices = choices;
  let time_out = false;

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
    if (i.customId === "A") {
      selectedChoice = current_choices[0];
    } else if (i.customId === "B") {
      selectedChoice = current_choices[1];
    } else if (i.customId === "C") {
      selectedChoice = current_choices[2];
    } else if (i.customId === "D") {
      selectedChoice = current_choices[3];
    }

    switch (i.customId) {
      case "A":
      case "B":
      case "C":
      case "D":
        //    if your selected option == correct definition, just update with a new embed saying you are correct
        //    this shows that you picked the correct defintion + shows that definition
        if (selectedChoice === current_random_word.definition) {
          const new_choices = [selectedChoice];
          const embed = await createEmbed(current_random_word, new_choices, 1);
          const row = createButtonRow(1);
          collector.resetTimer();
          console.log("time: ", collector.time);
          await i.update({ embeds: [embed], components: [row] });
        } else {
          //    if your selected option != correct definition, just update with a new embed saying you are wrong
          //    this shows the option you picked and the right answer
          const new_choices = [current_random_word.definition, selectedChoice];
          const embed = await createEmbed(current_random_word, new_choices, 2);
          const row = createButtonRow(2);
          collector.resetTimer();
          console.log("time: ", collector.time);
          //  await i.update({ embeds: [embed] });
          await i.update({ embeds: [embed], components: [row] });
        }
        break;
      //    If you press to continue the game, then reset the game-state basically
      case "Continue":
        console.log("???");
        console.log(current_random_word);
        if (current_random_word != "") {
          current_random_word =
            GREvocab[Math.floor(Math.random() * GREvocab.length)];
          //  const answer = random_word.definition;
          current_choices = createChoices(current_random_word);
          //  console.log(choices);
          const embed = await createEmbed(current_random_word, current_choices);
          const row = createButtonRow();
          await i.update({ embeds: [embed], components: [row] });
        }

        break;
      //    if you choose to stop, then just update the embed with no button row
      case "Stop":
        if (current_random_word != "") {
          const new_embed = await createEmbed(random_word, choices, 3);
          await i.update({ embeds: [new_embed], components: [] });
        }

        break;
    }
  });

  //  if you time out, update the embed with no button row while saying you timed out
  collector.on("end", async (collected) => {
    console.log(collected);
    const new_embed = await createEmbed(random_word, choices, 4);
    //  const row = createButtonRow(2);
    await interaction.editReply({ embeds: [new_embed], components: [] });
    console.log(`Collected ${collected.size} items`);
  });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vocab")
    .setDescription("Test your GRE vocabulary knowledge!"),
  async execute(interaction) {
    //  get a random word
    const random_word = GREvocab[Math.floor(Math.random() * GREvocab.length)];
    //  create the choices for the word
    const choices = createChoices(random_word);
    //  console.log(choices);

    //  create the embed with the correct button row
    const embed = await createEmbed(random_word, choices);
    const row = createButtonRow();
    //  wait for a reply and apply the button logic
    await interaction.reply({ embeds: [embed], components: [row] });
    await buttonLogic(interaction, random_word, choices);
  },
};
