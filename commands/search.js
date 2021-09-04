const { SlashCommandBuilder } = require("@discordjs/builders");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const searchAnime = async () => {
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
      }
    }
  }
}
`;

  const variables = {
    search: "Fate/Zero",
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

  fetch(url, options).then(handleResponse).then(handleData).catch(handleError);

  function handleResponse(response) {
    return response.json().then(function (json) {
      return response.ok ? json : Promise.reject(json);
    });
  }

  function handleData(data) {
    console.log(data);
    //  console.log(data.data.Media.title);
    console.log(data.data.Page.media[0].title);
  }

  function handleError(error) {
    console.log("Error, check console");
    console.error(error);
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Query though AniList API"),
  async execute(interaction) {
    searchAnime();
    await interaction.reply(
      `Your tag: ${interaction.user.tag}\nYour id: ${interaction.user.id}`
    );
  },
};
