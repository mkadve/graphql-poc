const express = require("express");
const app = express();
const { graphqlHTTP } = require("express-graphql");
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLSchema,
  GraphQLScalarType,
} = require("graphql");
const fetch = require("node-fetch");
const jsdom = require("jsdom");

const { JSDOM } = jsdom;
const seedData = {
  mentions: [],
  emoticons: [],
  links: [],
};

const mentionRegex = /\B@\w+/g;
const emoticonRegex = /\((.*?)\)/g;
const urlRegex =
  /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim;

const linkType = new GraphQLObjectType({
  name: "Links",
  fields: () => ({
    urls: { type: GraphQLString },
    title: { type: GraphQLString },
  }),
});

const recordType = new GraphQLObjectType({
  name: "Records",
  description: "Records",
  fields: {
    mentions: {
      type: new GraphQLList(GraphQLString),
    },
    emoticons: {
      type: new GraphQLList(GraphQLString),
    },
    links: {
      type: new GraphQLScalarType(linkType),
    },
  },
});

const rootQuery = new GraphQLObjectType({
  name: "RootQuery",
  description: "This is rootQuery",
  fields: {
    records: {
      type: new GraphQLList(recordType),
    },
    records: {
      type: recordType,
      args: {
        message: { type: GraphQLString },
      },
      resolve: async (_, { message }) => {
        // mentions
        const matchedMentions = message.match(mentionRegex);
        if (matchedMentions && matchedMentions.length) {
          seedData.mentions = [...matchedMentions];
        }

        // emoticons
        if (
          message.match(emoticonRegex)
        ) {
          const matchedEmoticons = message
            .match(emoticonRegex)
            .map((b) => b.replace(/\(|(.*?)\)/g, "$1"));
            if (matchedEmoticons && matchedEmoticons.length) {
              seedData.emoticons = matchedEmoticons.filter(
                (emote) => emote.length <= 15
              );
            }
        }

        // urls
        seedData.links = [];
        const matchedUrls = message.match(urlRegex);
        if (message.match(urlRegex) && matchedUrls && matchedUrls.length) {
          try {
            const data = await Promise.all(
              matchedUrls.map((url) => getTitle(url))
            );
            seedData.links = data;
            return Promise.resolve(seedData);
          } catch (error) {
            return Promise.reject("Unable to fetch links");
          }
        }
        return Promise.resolve(seedData);
      },
    },
  },
});

async function getTitle(url) {
  try {
    const response = await fetch(
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    );
    if (response.ok) {
      const data = await response.json();
      // console.log('response :: ', data);
      const dom = new JSDOM(data.contents, { conntentType: "text/html" });
      const title =
        dom.window.document.querySelectorAll("title")[0].textContent;
      return Promise.resolve({
        url,
        title,
      });
    } else {
      return Promise.reject("Network response was not ok.");
    }
  } catch (error) {
    return Promise.reject("Unable to fetch url title.");
  }
}

const schema = new GraphQLSchema({ query: rootQuery });

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true,
  })
);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
