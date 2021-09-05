const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
//  const wait = require("util").promisify(setTimeout);

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const createEmbed = async (data) => {
  //  receive the first result for now
  const firstResult = data.data.Page.media[0];

  //  console.log("description", firstResult.description);
  //  console.log(data.data.Page.media[0].title);

  //  create the embed and return it with the necessary fields
  const embedReply = new MessageEmbed()
    .setColor("#0099ff")
    .setTitle(firstResult.title.romaji)
    .setURL(firstResult.siteUrl)
    .setDescription(firstResult.description)
    .setThumbnail(firstResult.coverImage.large)
    .addFields(
      { name: "Regular field title", value: "Some value here" },
      { name: "\u200B", value: "\u200B" },
      { name: "Inline field title", value: "Some value here", inline: true },
      { name: "Inline field title", value: "Some value here", inline: true }
    )
    .addField("Inline field title", "Some value here", true)
    .setImage(firstResult.bannerImage)
    .setTimestamp()
    .setFooter("via AniList APIv2", "");
  return embedReply;
};

//  search the anime by using AniList v2 API
const searchAnime = async (nameOfWork) => {
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
    }
  }
}
`;

  const variables = {
    search: nameOfWork,
    page: 1,
    perPage: 3,
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
    return data;
  }

  function handleError(error) {
    console.log("Error, check console");
    console.error(error);
    return {};
  }
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
      const data = await searchAnime(interaction.options.getString("name"));
      //  after receiving the data, create the embed
      const embed = await createEmbed(data);
      //  await wait(10000);
      //  await interaction.editReply({ embeds: [embed] });

      //  Neco-Arc replies with the embed
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.log(error);
    }
  },
};
