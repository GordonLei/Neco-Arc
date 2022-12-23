const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
require("dotenv").config();
//  const riotDevKey = process.env.riotDevKey;
const axios = require("axios");
const leaguePatch = process.env.leaguePatch;

//  temporary information
//  let queryResultNumber = 0;
//  let maxResults = 0;
const DELETE_QUERY = -1;
const SAVE_QUERY = -2;
const ddragonURL = `http://ddragon.leagueoflegends.com/cdn/${leaguePatch}/`;

const createEmbed = async (data, optionFlag = 0) => {
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
      //  console.log(data.title);

      embedReply
        .setTitle(data.name || "null")
        .setDescription(data.title || "null")
        .setThumbnail(
          ddragonURL + "img/champion/" + data.name + ".png" || "null"
        )
        .addFields(
          {
            name: "Lore",
            value: `${data.lore || "null"}`,
          },
          {
            name: "Tags",
            value: `${data.tags || "null"}`,
          },
          {
            name: "Stats",
            value: `
              **Health**: ${data.stats.hp}  + (${data.stats.hpperlevel})
              **Health Regen**: ${data.stats.hpregen}  + (${data.stats.hpregenperlevel})
              **Armor**: ${data.stats.armor} + (${data.stats.armorperlevel})
              **Attack Damage**: ${data.stats.attackdamage} + (${data.stats.attackdamageperlevel})
              **Move Speed**: ${data.stats.movespeed} 
              `,
            inline: true,
          },
          {
            name: "\u200b",
            value: `
              **Mana**: ${data.stats.mp} + (${data.stats.mpperlevel})
              **Mana Regen**: ${data.stats.mpregen} + (${data.stats.mpregenperlevel})
              **Magic Resist**: ${data.stats.spellblock} + (${data.stats.spellblockperlevel})
              **Attack Speed**: ${data.stats.attackspeed} + (${data.stats.attackspeedperlevel})
              **Attack Range**: ${data.stats.attackrange}
              `,
            inline: true,
          },
          {
            name: "Skills",
            value: `
              **< P >** ${data.passive.name || "null"}
              **< Q >** ${data.spells[0].name || "null"}
              **< W >** ${data.spells[1].name || "null"}
              **< E >** ${data.spells[2].name || "null"}
              **< R >** ${data.spells[3].name || "null"}
            `,
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
    .setName("lol_search_champion_info")
    .setDescription(
      "Queries through Riot's Data Dragon to show brief champion info"
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("input desired name of the champion")
        .setRequired(true)
    ),
  async execute(interaction) {
    try {
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
        });
      const championData = await axios
        .get(ddragonURL + "data/en_US/champion/" + championName + ".json")
        .then((response) => response.data.data[championName])
        .catch((error) => {
          console.log(error);
        });
      const embed = await createEmbed(championData);
      //  console.log(championData);
      const message = { embeds: [embed] } || {
        content: "Pong!",
      };
      await interaction.reply(message);
    } catch (error) {
      console.log(error);
    }
  },
};
