const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
require("dotenv").config();
const riotDevKey = process.env.riotDevKey;
const axios = require("axios");

//  temporary information
const ddragonURL = "http://ddragon.leagueoflegends.com/cdn/11.21.1/";

const createEmbed = async (infoData, masteryData) => {
  const embedReply = new MessageEmbed();
  try {
    //  check if data exists
    if (!infoData || !masteryData) {
      embedReply
        .setDescription("No results; summoner name is probably wrong")
        .setTimestamp()
        .setFooter(
          `via Data Dragon`,
          "https://raw.githubusercontent.com/GordonLei/Neco-Arc/main/images/profile.png"
        );
    }
    //  if data exists, create appropriate embed
    else {
      //console.log(infoData, masteryData);
      //console.log(infoData.name);
      const name = infoData.name || "";
      //  create the embed and return it with the necessary fields
      embedReply.setColor("#0099ff");
      //  console.log(await getSummonerIcon(infoData.profileIconId));
      //  console.log(data.title);

      const champNameArray = await getChampionName([
        masteryData[0].championId || -1,
        masteryData[1].championId || -1,
        masteryData[2].championId || -1,
        masteryData[3].championId || -1,
        masteryData[4].championId || -1,
      ]);

      const masterySums = getMasterySums(masteryData);

      embedReply
        .setTitle(name + "'s Masteries" || "")
        .setDescription("Top Five Masteries are:")
        .setThumbnail(await getSummonerIcon(infoData.profileIconId))
        .addFields(
          {
            name: "Champion",
            value: `
              ${champNameArray[0] || ""}
              ${champNameArray[1] || ""}
              ${champNameArray[2] || ""}
              ${champNameArray[3] || ""}
              ${champNameArray[4] || ""}
            `,
            inline: true,
          },
          {
            name: "Level / Points",
            value: `
              ${masteryData[0].championLevel || ""} - ${
              masteryData[0].championPoints || ""
            }
              ${masteryData[1].championLevel || ""} - ${
              masteryData[1].championPoints || ""
            }
              ${masteryData[2].championLevel || ""} - ${
              masteryData[2].championPoints || ""
            }
              ${masteryData[3].championLevel || ""} - ${
              masteryData[3].championPoints || ""
            }
              ${masteryData[4].championLevel || ""} - ${
              masteryData[4].championPoints || ""
            }
            `,
            inline: true,
          },
          {
            name: "Chest Unlocked?",
            value: `
              ${masteryData[0].chestGranted || "false"}
              ${masteryData[1].chestGranted || "false"}
              ${masteryData[2].chestGranted || "false"}
              ${masteryData[3].chestGranted || "false"}
              ${masteryData[4].chestGranted || "false"}
            `,
            inline: true,
          },
          {
            name: "\u200b",
            value: `
              **Champions**: ${masterySums[0]} 
              **Total Levels**: ${masterySums[1]} 
              **Total Mastery Points**: ${masterySums[2]}
              `,
            inline: true,
          }
        )
        .setTimestamp()
        .setFooter(
          `via Riot API`,
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

const getSummonerInfo = async (axiosBase, name) => {
  return await axiosBase
    .get("/summoner/v4/summoners/by-name/" + name + "?api_key=" + riotDevKey)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log(error);
    });
};

const getSummonerMasteries = async (axiosBase, id) => {
  //console.log(id);
  return await axiosBase
    .get(
      "/champion-mastery/v4/champion-masteries/by-summoner/" +
        id +
        "?api_key=" +
        riotDevKey
    )
    .then((response) => {
      //console.log(response.data);
      return response.data;
    })
    .catch((error) => {
      console.log(error);
    });
};

const getSummonerIcon = async (id) => {
  return await axios
    .get(ddragonURL + "img/profileicon/" + id + ".png")
    .then((response) => {
      return ddragonURL + "img/profileicon/" + id + ".png";
    })
    .catch(() => {});
};

const getChampionName = async (idArray) => {
  let nameArray = [];
  const championData = await axios
    .get(ddragonURL + "data/en_US/champion.json")
    .then((response) => {
      return response.data.data;
    })
    .catch((error) => {
      console.log(error);
    });
  let championDict = {};
  for (const [key, value] of Object.entries(championData)) {
    championDict[value["key"]] = key;
  }
  idArray.forEach((id) => {
    if (id !== -1) {
      nameArray.push(championDict[id]);
    }
  });
  return nameArray;
};

const getMasterySums = (masteryData) => {
  totalChamps = 0;
  totalLevels = 0;
  totalPoints = 0;
  masteryData.forEach((championMastery) => {
    totalChamps++;
    totalLevels += championMastery.championLevel;
    totalPoints += championMastery.championPoints;
  });
  return [totalChamps, totalLevels, totalPoints];
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lol_search_player_mastery")
    .setDescription("Queries through Riot API to show player's mastery")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("input summoner name")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("region")
        .setDescription("select region of player")
        .setRequired(true)
        .addChoice("BR1", "BR1")
        .addChoice("EUN1", "EUN1")
        .addChoice("EUW1", "EUW1")
        .addChoice("JP1", "JP1")
        .addChoice("KR", "KR")
        .addChoice("LA1", "LA1")
        .addChoice("LA2", "LA2")
        .addChoice("NA1", "NA1")
        .addChoice("OC1", "OC1")
        .addChoice("RU", "RU")
        .addChoice("TR1", "TR1")
    ),
  async execute(interaction) {
    try {
      const axiosBase = axios.create({
        baseURL:
          "https://" +
          interaction.options.getString("region") +
          ".api.riotgames.com/lol",
      });

      let summonerInfo = await getSummonerInfo(
        axiosBase,
        interaction.options.getString("name")
      );

      //console.log(summonerInfo);
      let summonerMasteries = null;
      if (summonerInfo) {
        summonerMasteries = await getSummonerMasteries(
          axiosBase,
          summonerInfo.id
        );
      }

      const embed = await createEmbed(summonerInfo, summonerMasteries);
      //  console.log(championData);
      let message = { embeds: [embed] } || {
        content: "Pong!",
      };
      await interaction.reply(message);
    } catch (error) {
      console.log(error);
    }
  },
};
