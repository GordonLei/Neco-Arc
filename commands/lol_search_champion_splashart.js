const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
require("dotenv").config();
//  const riotDevKey = process.env.riotDevKey;
const axios = require("axios");
const leaguePatch = process.env.leaguePatch;
//  temporary information
let queryResultNumber = 0;
let maxResults = 0;
let timeout = true;
const DELETE_QUERY = -1;
const SAVE_QUERY = -2;
const ddragonURL = `http://ddragon.leagueoflegends.com/cdn/${leaguePatch}/`;

const reset = () => {
  queryResultNumber = 0;
  maxResults = 0;
  timeout = true;
};

const createEmbed = async (data, queryNumber = 0, optionFlag = 0) => {
  const embedReply = new MessageEmbed();
  console.log(data, queryNumber, optionFlag);
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
    } else {
      console.log("BEFORE SAVE_QUERY ");
      if (optionFlag === SAVE_QUERY) {
        embedReply.setColor("#00A86B");
      } else {
        embedReply.setColor("#0099ff");
      }
      //  this will show the skins
      console.log("PREPRIING SKIN LINK");
      console.log(
        "http://ddragon.leagueoflegends.com/cdn/img/champion/splash/" +
          data.name +
          `_${queryNumber}.jpg` || "null"
      );
      embedReply
        .setTitle(data.skins[queryNumber].name || "null")
        .setDescription(`Akali Skin #${queryNumber}`)
        .setImage(
          "http://ddragon.leagueoflegends.com/cdn/img/champion/splash/" +
            data.name +
            `_${queryNumber}.jpg` || "null"
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

const createButtonRow = (queryNumber) => {
  const buttonRow = new MessageActionRow();
  //  if the queryNumber > 0, then add the left button
  if (queryNumber) {
    buttonRow.addComponents(
      new MessageButton()
        .setCustomId("left")
        .setLabel("Left")
        .setStyle("SECONDARY")
    );
  }
  //  if you are still one before the maxResults, then still add the right button
  if (queryNumber + 1 < maxResults) {
    buttonRow.addComponents(
      new MessageButton()
        .setCustomId("right")
        .setLabel("Right")
        .setStyle("SECONDARY")
    );
  }
  //  if you have at least one result, add the save and delete button
  if (maxResults > 1) {
    buttonRow.addComponents(
      new MessageButton()
        .setCustomId("save")
        .setLabel("save")
        .setStyle("SUCCESS")
        .setEmoji("440700482672132096"),
      new MessageButton()
        .setCustomId("delete")
        .setLabel("delete")
        .setStyle("DANGER")
        .setEmoji("440700481627750401")
    );
  }
  //  return the button row
  return buttonRow;
};

//  control what happens depending on what button you pressed
const buttonLogic = async (interaction, data) => {
  const filter = (i) =>
    i.customId === "save" ||
    i.customId === "delete" ||
    i.customId === "left" ||
    i.customId === "right";
  //  collector for what button you pressed.
  //    ENDS when 15 seconds have passed
  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    time: 15000,
  });
  //  when the collector is collecting button presses...
  collector.on("collect", async (i) => {
    //  if the button id was "save"...
    if (i.customId === "save") {
      //  update the embed but do the option for SAVE_QUERY / saving the query
      const embed = await createEmbed(data, queryResultNumber, SAVE_QUERY);
      await i.update({ embeds: [embed], components: [] });
      timeout = false;
      collector.stop();
    } else if (i.customId === "delete") {
      //  update the embed but do the option for DELETE_QUERY / deleting the query
      queryResultNumber = 0;
      const embed = await createEmbed(data, queryResultNumber, DELETE_QUERY);
      await i.update({ embeds: [embed], components: [] });
      timeout = false;
      console.log("TIMEOUT FALSE");
      collector.stop();
    } else if (i.customId === "left") {
      //  update the embed by back to the previous option
      queryResultNumber -= 1;
      console.log(queryResultNumber);
      const embed = await createEmbed(data, queryResultNumber);
      const row = createButtonRow(queryResultNumber);
      collector.resetTimer();
      console.log("time: ", collector.time);
      await i.update({ embeds: [embed], components: [row] });
    } else if (i.customId === "right") {
      //  update the embed by back to the next option
      queryResultNumber += 1;
      console.log(queryResultNumber);
      const embed = await createEmbed(data, queryResultNumber);
      const row = createButtonRow(queryResultNumber);
      collector.resetTimer();
      console.log("time: ", collector.time);
      await i.update({ embeds: [embed], components: [row] });
    } else {
      //  if you do something invalid, then update with nothing for now
      await i.update({ components: [] });
    }
  });
  //  when the collector ends, do nothing for now
  collector.on("end", async (collected) => {
    console.log(`Collected ${collected.size} items`);
    if (timeout) {
      console.log("HERE !!!");
      const new_embed = await createEmbed(data, queryResultNumber, SAVE_QUERY);
      //  const row = createButtonRow(2);
      await interaction.editReply({
        embeds: [new_embed],
        components: [],
      });
    }
    reset();
  });
};

const getChampionNamesArray = (response) => {
  const data = response.data.data;
  const nameArray = [];
  for (const key of Object.keys(data)) {
    nameArray.push(data[key].name);
  }
  return nameArray;
};

//  the levenshteinDistance and the similarity was taken from StackOverflow
//    will probably be changed later for own code
const levenshteinDistance = (s1, s2) => {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = new Array();
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) != s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
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
  const long_length = long.length;
  if (long_length === 0) {
    return 1.0;
  }
  return (
    (long_length - levenshteinDistance(long, short)) / parseFloat(long_length)
  );
};

const getClosestChampName = (nameArray, queryName) => {
  //  simple check if you typed the correct champion name
  //  but first, make the query all lower-case then capitalize the first letter
  const fixedQueryName =
    queryName.toLowerCase()[0].toUpperCase() + queryName.slice(1).toLowerCase();
  if (nameArray.includes(fixedQueryName)) {
    return fixedQueryName;
  }
  //  else try to find the champion name that closest fits
  else {
    const namePercentage = nameArray.map((champName) => [
      champName,
      similarity(champName, queryName),
    ]);

    namePercentage.sort((name1, name2) => {
      return name1[1] - name2[1];
    });
    namePercentage.reverse();
    //  console.log(namePercentage);
    return namePercentage[0][0];
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lol_search_champion_splashart")
    .setDescription(
      "Queries through Riot's Data Dragon to show champion splash art"
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("input desired name of the champion")
        .setRequired(true)
    ),
  async execute(interaction) {
    try {
      let caughtError = false;
      const championName = await axios
        .get(ddragonURL + "data/en_US/champion.json")
        .then((response) => {
          const nameArray = getChampionNamesArray(response);
          const closestName = getClosestChampName(
            nameArray,
            interaction.options.getString("name")
          );
          return closestName;
        })
        .catch((error) => {
          console.log(error);
          caughtError = true;
        });
      const championData = await axios
        .get(ddragonURL + "data/en_US/champion/" + championName + ".json")
        .then((response) => response.data.data[championName])
        .catch((error) => {
          console.log(error);
          caughtError = true;
        });
      let embed;
      if (!caughtError) {
        maxResults = championData.skins.length;
        console.log(maxResults);
        embed = await createEmbed(championData, 0);
      } else {
        embed = new MessageEmbed();
        embed
          .setDescription("No results")
          .setTimestamp()
          .setFooter(
            `via Data Dragon`,
            "https://raw.githubusercontent.com/GordonLei/Neco-Arc/main/images/profile.png"
          );
      }
      const row = createButtonRow(queryResultNumber);
      /*
      const message = caughtError
        ? {
            embeds: [embed],
          } || {
            content: "Pong!",
          }
        : {
            embeds: [embed],
            components: [row],
          } || {
            content: "Pong!",
          };
          */
      //  Neco-Arc replies with the embed
      if (maxResults <= 1) {
        await interaction.reply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], components: [row] });
      }

      await buttonLogic(interaction, championData);
    } catch (error) {
      console.log("HERE?");
      console.log(error);
    }
  },
};
