const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
require("dotenv").config();
const riotDevKey = process.env.riotDevKey;
const axios = require("axios");

//  temporary information
let queryResultNumber = 0;
let maxResults = 0;
let timeout = true;
const DELETE_QUERY = -1;
const SAVE_QUERY = -2;
const ddragonURL = "http://ddragon.leagueoflegends.com/cdn/11.21.1/";

const reset = () => {
  queryResultNumber = 0;
  maxResults = 0;
  timeout = true;
};

const createEmbed = async (data, optionFlag = 0) => {
  const embedReply = new MessageEmbed();
  try {
    //  check if data exists
    //  console.log("check if the data exists", data);
    console.log(optionFlag);
    if (!data) {
      embedReply
        .setDescription("No results")
        .setTimestamp()
        .setFooter(
          `via Data Dragon`,
          "https://raw.githubusercontent.com/GordonLei/Neco-Arc/main/images/profile.png"
        );
    } else if (optionFlag === DELETE_QUERY) {
      embedReply
        .setDescription("Deleted query result")
        .setColor("#E3242B")
        .setTimestamp()
        .setFooter(
          `via Data Dragon`,
          "https://raw.githubusercontent.com/GordonLei/Neco-Arc/main/images/profile.png"
        );
    } else if (optionFlag === 0) {
      //  this will show the beginning skill descriptions
      embedReply
        .setTitle(data.name || "null")
        .setDescription(data.title || "null")
        .setThumbnail(
          ddragonURL + "img/champion/" + data.name + ".png" || "null"
        )
        .addFields({
          name: "Skills",
          value: `
              **< P >**: ${data.passive.name || "null"}
              ${data.passive.description || "null"}
              
              **< Q >**: ${data.spells[0].name || "null"}
              ${data.spells[0].description || "null"}
              
              **< W >**: ${data.spells[1].name || "null"}
              ${data.spells[1].description || "null"}
              
              **< E >**: ${data.spells[2].name || "null"}
              ${data.spells[2].description || "null"}
              
              **< R >**: ${data.spells[3].name || "null"}
              ${data.spells[3].description || "null"}
            `,
        })
        .setTimestamp()
        .setFooter(
          `via Data Dragon`,
          "https://raw.githubusercontent.com/GordonLei/Neco-Arc/main/images/profile.png"
        );
    } else if (optionFlag === "P") {
      //  this will show the passive
      if (optionFlag === SAVE_QUERY) {
        embedReply.setColor("#00A86B");
      } else {
        embedReply.setColor("#0099ff");
      }
      console.log(ddragonURL + "img/passive/" + data.passive.image.full);
      embedReply
        .setTitle(data.name || "null")
        .setDescription(data.title || "null")
        .setThumbnail(
          ddragonURL + "img/passive/" + data.passive.image.full || "null"
        )
        .addFields({
          name: data.passive.name,
          value: data.passive.description,
        })
        .setTimestamp()
        .setFooter(
          `via Data Dragon`,
          "https://raw.githubusercontent.com/GordonLei/Neco-Arc/main/images/profile.png"
        );
    } else {
      //  only other options are the skills
      if (optionFlag === SAVE_QUERY) {
        embedReply.setColor("#00A86B");
      } else {
        embedReply.setColor("#0099ff");
      }
      //  console.log(data.title);

      let tempSpell;
      switch (optionFlag) {
        case "Q":
          tempSpell = data.spells[0];
          break;
        case "W":
          tempSpell = data.spells[1];
          break;
        case "E":
          tempSpell = data.spells[2];
          break;
        case "R":
          tempSpell = data.spells[3];
          break;
      }

      embedReply
        .setTitle(data.name || "null")
        .setDescription(data.title || "null")
        .setThumbnail(
          ddragonURL + "img/spell/" + tempSpell.image.full || "null"
        )
        .addFields({
          name: `** ${tempSpell.name} **`,
          value: `${tempSpell.tooltip} `,
        })
        .setImage(
          //"https://d28xe8vt774jo5.cloudfront.net/champion-abilities/{champ}/ability_{champ}_{skill}1.webm"
          "https://media1.giphy.com/media/JOiVbcrColZo1oaXDT/giphy.gif?cid=790b7611b8128278e636447c41aa2f0003df04f4ba6e9e21&rid=giphy.gif&ct=g"
        )
        .setTimestamp()
        .setFooter(
          `via Data Dragon`,
          "https://raw.githubusercontent.com/GordonLei/Neco-Arc/main/images/profile.png"
        );
    }
  } catch (error) {
    console.log(error);
    embedReply
      .setDescription("No results")
      .setTimestamp()
      .setFooter(
        `via Data Dragon`,
        "https://raw.githubusercontent.com/GordonLei/Neco-Arc/main/images/profile.png"
      );
  }
  return embedReply;
};

const createButtonRow = (optionFlag = 0) => {
  const buttonRow = new MessageActionRow();
  buttonRow.addComponents(
    new MessageButton()
      .setCustomId("P")
      .setLabel("Passive")
      .setStyle("SECONDARY"),
    new MessageButton().setCustomId("Q").setLabel("Q").setStyle("SECONDARY"),
    new MessageButton().setCustomId("W").setLabel("W").setStyle("SECONDARY"),
    new MessageButton().setCustomId("E").setLabel("E").setStyle("SECONDARY"),
    new MessageButton().setCustomId("R").setLabel("R").setStyle("SECONDARY")
  );
  return buttonRow;
};

//  control what happens depending on what button you pressed
const buttonLogic = async (interaction, data) => {
  let time_out = false;

  const filter = (i) =>
    i.customId === "Q" ||
    i.customId === "W" ||
    i.customId === "E" ||
    i.customId === "R" ||
    i.customId === "P";

  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    time: 15000,
  });

  collector.on("collect", async (i) => {
    let selectedChoice = "";
    switch (i.customId) {
      case "Q":
      case "W":
      case "E":
      case "R":
      case "P":
        //    if your selected option != correct definition, just update with a new embed saying you are wrong
        //    this shows the option you picked and the right answer
        const embed = await createEmbed(data, i.customId);
        const row = createButtonRow();
        collector.resetTimer();
        console.log("time: ", collector.time);
        //  await i.update({ embeds: [embed] });
        await i.update({ embeds: [embed], components: [row] });
        break;
    }
  });

  //  if you time out, update the embed with no button row while saying you timed out
  collector.on("end", async (collected) => {
    const new_embed = await createEmbed(data);
    await interaction.editReply({ embeds: [new_embed], components: [] });
    console.log(`Collected ${collected.size} items`);
  });
};

const getChampionNamesArray = (response) => {
  const data = response.data.data;
  const nameArray = [];
  for (let key of Object.keys(data)) {
    nameArray.push(data[key].name);
  }
  return nameArray;
};

//  the levenshteinDistance and the similarity was taken from StackOverflow
//    will probably be changed later for own code
const levenshteinDistance = (s1, s2) => {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  let costs = new Array();
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
};

const similarity = (championName, queryName) => {
  let long = championName;
  let short = queryName;
  if (championName.length < queryName.length) {
    long = queryName;
    short = championName;
  }
  let long_length = long.length;
  if (long_length === 0) {
    return 1.0;
  }
  return (
    (long_length - levenshteinDistance(long, short)) / parseFloat(long_length)
  );
};

const getClosestChampName = (nameArray, queryName) => {
  //simple check if you typed the correct champion name
  //  but first, make the query all lower-case then capitalize the first letter
  const fixedQueryName =
    queryName.toLowerCase()[0].toUpperCase() + queryName.slice(1).toLowerCase();
  if (nameArray.includes(fixedQueryName)) {
    return fixedQueryName;
  }
  //else try to find the champion name that closest fits
  else {
    let namePercentage = nameArray.map((champName) => [
      champName,
      similarity(champName, queryName),
    ]);

    namePercentage
      .sort((name1, name2) => {
        return name1[1] - name2[1];
      });
    namePercentage.reverse();
    //console.log(namePercentage);
    return namePercentage[0][0];
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lol_search_champion_skill")
    .setDescription(
      "Queries through Riot's Data Dragon to show champion skill + passive"
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("input desired name of the champion")
        .setRequired(true)
    ),
  async execute(interaction) {
    try {
      let championName = await axios
        .get(ddragonURL + "data/en_US/champion.json")
        .then((response) => {
          const nameArray = getChampionNamesArray(response);
          const closestName = getClosestChampName(
            nameArray,
            interaction.options.getString("name")
          );
          return closestName;
        })
        .catch();
      let championData = await axios
        .get(ddragonURL + "data/en_US/champion/" + championName + ".json")
        .then((response) => response.data.data[championName])
        .catch();
      const embed = await createEmbed(championData);
      const buttonRow = createButtonRow();
      let message = { embeds: [embed], components: [buttonRow] } || {
        content: "Pong!",
      };
      await interaction.reply(message);
      await buttonLogic(interaction, championData);
    } catch (error) {
      console.log(error);
    }
  },
};
