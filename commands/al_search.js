const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
//  const clientId = process.env.clientId;
//  const wait = require("util").promisify(setTimeout);

//  counter for what result number you are currently at
let queryResultNumber = 0;
let maxResults = 0;
let timeout = true;
const DELETE_QUERY = -1;
const SAVE_QUERY = -2;

//  this just allows fetch to work. will be replaced with axios
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args)); //eslint-disable-line

//  reset the global variables
const reset = () => {
  queryResultNumber = 0;
  maxResults = 0;
  timeout = true;
};

//  function to create embed.
//    queryNumber is which result number (ex. the first result) you are at
//    optionFlag is what type of option you are doing (are you saving, deleting, etc.)
const createEmbed = async (data, queryNumber = 0, optionFlag = 0) => {
  const embedReply = new MessageEmbed();
  try {
    //  check if data exists. if nothing then create embedd where it does not exsit
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
      //  create a red left-border embed that says you deleted the query
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
      //  depending on what the option flag is, change the left-border color
      if (optionFlag === SAVE_QUERY) {
        embedReply.setColor("#00A86B");
      } else {
        embedReply.setColor("#0099ff");
      }
      //  create the embed by parsing through the relevant information
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
            value: `${firstResult.season || "null"} ${
              firstResult.seasonYear || "null"
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
    //  if there is an error, just reply an embed saying that there are no results
    console.log(error);
    embedReply
      .setDescription("No results")
      .setTimestamp()
      .setFooter(
        `via AniList APIv2`,
        "https://raw.githubusercontent.com/GordonLei/Neco-Arc/main/images/profile.png"
      );
  }
  //  return the embed
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
    }`;
  //  just some variables to add to query through GraphQL
  const variables = {
    search: nameOfWork,
    page: 1,
    perPage: 10,
  };
  //  generate query URL on AniList API
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
  //  return the results of the query URL
  return fetch(url, options)
    .then(handleResponse)
    .then(handleData)
    .catch(handleError);
  //  if it works, then return the JSON then parse through the data
  function handleResponse(response) {
    return response.json().then((json) => {
      return response.ok ? json : Promise.reject(json);
    });
  }
  //  parse through the data by going to the data key and returning it
  function handleData(data) {
    console.log(data);
    //  maxResults should only be at most 10 because of our variables we defined for GraphQL query
    maxResults = data.data.Page.media.length;
    return data;
  }
  //  if there is an error, output it
  function handleError(error) {
    console.log("Error, check console");
    console.error(error);
    return {};
  }
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
      const new_embed = await createEmbed(data, queryResultNumber, SAVE_QUERY);
      //  const row = createButtonRow(2);
      await interaction.editReply({ embeds: [new_embed], components: [] });
    }
    reset();
  });
};

//  this creates the row of buttons
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

//  this part executes the command
module.exports = {
  //  just parts to describe the command
  data: new SlashCommandBuilder()
    .setName("al_search")
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
      //  search for a result
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
