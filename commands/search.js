const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
//  const clientId = process.env.clientId;
//  const wait = require("util").promisify(setTimeout);

//  counter for what result number you are currently at
let queryResultNumber = 0;
let maxResults = 0;
const DELETE_QUERY = -1;
const SAVE_QUERY = -2;

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const createEmbed = async (data, queryNumber = 0, optionFlag = 0) => {
  const embedReply = new MessageEmbed();
  try {
    //  check if data exists
    console.log("check if the data exists", data);
    if (maxResults === 0) {
      embedReply
        .setDescription("No results")
        .setTimestamp()
        .setFooter(
          `via AniList APIv2`,
          "https://raw.githubusercontent.com/GordonLei/Neco-Arc/main/images/profile.png"
        );
    } else if (optionFlag === DELETE_QUERY) {
      embedReply
        .setDescription("Deleted query result")
        .setColor("#E3242B")
        .setTimestamp()
        .setFooter(
          `via AniList APIv2`,
          "https://raw.githubusercontent.com/GordonLei/Neco-Arc/main/images/profile.png"
        );
    }
    //  if data exists, create appropriate embed
    else {
      //  receive the first result for now
      const firstResult = data.data.Page.media[queryNumber];

      //  console.log("description", firstResult.description);
      //  console.log(data.data.Page.media[0].title);

      //  create the embed and return it with the necessary fields

      if (optionFlag === SAVE_QUERY) {
        embedReply.setColor("#00A86B");
      } else {
        embedReply.setColor("#0099ff");
      }
      embedReply
        .setTitle(firstResult.title.romaji || "null")
        .setURL(firstResult.siteUrl || "null")
        .setDescription(firstResult.description || "null")
        .setThumbnail(firstResult.coverImage.large || "null")
        .addFields(
          {
            name: "Type",
            value: `${firstResult.type || "null"}`,
            inline: true,
          },
          {
            name: "Status",
            value: `${firstResult.status || "null"}`,
            inline: true,
          },
          {
            name: "Season",
            value: `${firstResult.season || "null"} ${firstResult.seasonYear || "null"
              }`,
            inline: true,
          },
          {
            name: "Format",
            value: `${firstResult.format || "null"}`,
            inline: true,
          },
          {
            name: "Episodes",
            value: `${firstResult.episodes || "null"}`,
            inline: true,
          },
          {
            name: "Duration",
            value: `${firstResult.duration || "null"} minutes`,
            inline: true,
          },
          {
            name: "AniList Score",
            value: `${firstResult.averageScore || "null"} / 100`,
            inline: true,
          },
          {
            name: "Genres",
            value: `${firstResult.genres.join(" ") || "null"}`,
            inline: true,
          }
        )
        .setImage(firstResult.bannerImage)
        .setTimestamp()
        .setFooter(
          `via AniList APIv2`,
          "https://raw.githubusercontent.com/GordonLei/Neco-Arc/main/images/profile.png"
        );
    }
  } catch (error) {
    console.log(error);
    embedReply
      .setDescription("No results")
      .setTimestamp()
      .setFooter(
        `via AniList APIv2`,
        "https://raw.githubusercontent.com/GordonLei/Neco-Arc/main/images/profile.png"
      );
  }
  return embedReply;
};

//  search all works by using AniList v2 API
const searchAll = async (nameOfWork) => {
  const query = `
query ($id: Int, $page: Int, $perPage: Int, $search: String) {
  Page (page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
      perPage
    }
    media (id: $id, search: $search) {
      id
    title {
      romaji
      english
      native
    }
    startDate {
      year
      month
      day
    }
    endDate {
      year
      month
      day
    }
    coverImage {
      large
      medium
    }
    bannerImage
    format
    type
    status
    episodes
    chapters
    volumes
    season
    description
    averageScore
    meanScore
    genres
    synonyms
    siteUrl
    seasonYear
    duration
    }
  }
}
`;

  const variables = {
    search: nameOfWork,
    page: 1,
    perPage: 10,
  };

  const url = "https://graphql.anilist.co",
    options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: query,
        variables: variables,
      }),
    };

  return fetch(url, options)
    .then(handleResponse)
    .then(handleData)
    .catch(handleError);

  function handleResponse(response) {
    return response.json().then(function (json) {
      return response.ok ? json : Promise.reject(json);
    });
  }

  function handleData(data) {
    console.log(data);
    maxResults = data.data.Page.media.length;
    return data;
  }

  function handleError(error) {
    console.log("Error, check console");
    console.error(error);
    return {};
  }
};

const buttonLogic = async (interaction, data) => {
  const filter = (i) =>
    i.customId === "save" ||
    i.customId === "delete" ||
    i.customId === "left" ||
    i.customId === "right"; /*  && i.user.id === clientId */

  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    time: 15000,
  });

  collector.on("collect", async (i) => {
    if (i.customId === "save") {
      queryResultNumber = 0;
      const embed = await createEmbed(data, queryResultNumber, SAVE_QUERY);
      await i.update({ embeds: [embed], components: [] });
      collector.stop();
    } else if (i.customId === "delete") {
      queryResultNumber = 0;
      const embed = await createEmbed(data, queryResultNumber, DELETE_QUERY);
      await i.update({ embeds: [embed], components: [] });
      collector.stop();
    } else if (i.customId === "left") {
      queryResultNumber -= 1;
      console.log(queryResultNumber);
      const embed = await createEmbed(data, queryResultNumber);
      const row = createButtonRow(queryResultNumber);
      collector.resetTimer();
      console.log("time: ", collector.time);
      await i.update({ embeds: [embed], components: [row] });
    } else if (i.customId === "right") {
      queryResultNumber += 1;
      console.log(queryResultNumber);
      const embed = await createEmbed(data, queryResultNumber);
      const row = createButtonRow(queryResultNumber);
      collector.resetTimer();
      console.log("time: ", collector.time);
      await i.update({ embeds: [embed], components: [row] });
    } else {
      await i.update({ components: [] });
    }
  });

  collector.on("end", async (collected) => {
    queryResultNumber = 0;
    console.log(collected);
    console.log(`Collected ${collected.size} items`);
  });
};

const createButtonRow = (queryNumber) => {
  const buttonRow = new MessageActionRow();
  if (queryNumber) {
    buttonRow.addComponents(
      new MessageButton()
        .setCustomId("left")
        .setLabel("Left")
        .setStyle("SECONDARY")
    );
  }
  if (queryNumber + 1 < maxResults) {
    buttonRow.addComponents(
      new MessageButton()
        .setCustomId("right")
        .setLabel("Right")
        .setStyle("SECONDARY")
    );
  }
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

  return buttonRow;
};

//  this part executes the command
module.exports = {
  //  just parts to describe the command
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Query though AniList API")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("input desired name of the work")
        .setRequired(true)
    ),
  //  execute the command. this is the body so put your functionality
  async execute(interaction) {
    try {
      //  await interaction.deferReply();
      //  search for the anime
      const data = await searchAll(interaction.options.getString("name"));
      //  after receiving the data, create the embed
      const embed = await createEmbed(data, queryResultNumber);
      //  await wait(10000);
      //  await interaction.editReply({ embeds: [embed] });

      //  add the buttons to the reply
      const row = createButtonRow(queryResultNumber);
      //  Neco-Arc replies with the embed
      if (maxResults <= 1) {
        await interaction.reply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], components: [row] });
      }

      //  implement button logic
      await buttonLogic(interaction, data);
    } catch (error) {
      console.log(error);
    }
  },
};
