const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
require("dotenv").config();
const riotDevKey = process.env.riotDevKey;
const axios = require("axios");

//  temporary information
let queryResultNumber = 0;
let maxResults = 0;
const DELETE_QUERY = -1;
const SAVE_QUERY = -2;

const createEmbed = async (data, queryNumber = 0, optionFlag = 0) => {
  const embedReply = new MessageEmbed();
  try {
    //  check if data exists
    //  console.log("check if the data exists", data);
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
    }
    //  if data exists, create appropriate embed
    else {
      //  create the embed and return it with the necessary fields

      if (optionFlag === SAVE_QUERY) {
        embedReply.setColor("#00A86B");
      } else {
        embedReply.setColor("#0099ff");
      }
      console.log(data.title);
      embedReply
        .setTitle(data.name || "null")
        .setDescription(data.title || "null")
        .setThumbnail(
          "http://ddragon.leagueoflegends.com/cdn/11.21.1/img/champion/" +
            data.name +
            ".png" || "null"
        )
        .addFields(
          {
            name: "Blurb",
            value: `${data.blurb || "null"}`,
            inline: false,
          },
          {
            name: "Tags",
            value: `${data.tags || "null"}`,
            inline: false,
          }
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

const getChampionNamesArray = (response) => {
  const data = response.data.data;
  const nameArray = [];
  for (let key of Object.keys(data)) {
    nameArray.push(data[key].name);
  }
  return nameArray;
};

const getClosestChampName = (nameArray, queryName) => {
  //simple check if you typed the correct champion name
  //  but first, make the query all lower-case then capitalize the first letter
  const fixedQueryName =
    queryName.toLowerCase()[0].toUpperCase() + queryName.slice(1).toLowerCase();
  if (nameArray.includes(new_name)) {
    return fixedQueryName;
  }
  //else try to find the champion name that closest fits
  else {
    console.log("void");
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lol_search_champion")
    .setDescription("Queries through Riot API to show ")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("input desired name of the champion")
        .setRequired(true)
    ),
  async execute(interaction) {
    let championData = await axios
      .get(
        "http://ddragon.leagueoflegends.com/cdn/11.21.1/data/en_US/champion.json"
      )
      .then((response) => {
        const nameArray = getChampionNamesArray(response);
        const closestName = getClosestChampName(
          nameArray,
          interaction.options.getString("name")
        );
        console.log(closestName);
        return response.data.data[closestName];
      })
      .catch();
    const embed = await createEmbed(championData);
    //  console.log(championData);
    let message = { embeds: [embed] } || {
      content: "Pong!",
    };
    await interaction.reply(message);
  },
};
