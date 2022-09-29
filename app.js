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

let seedData = {
  mentions: [],
  emoticons: [],
  links: [linkObj],
};

var linkObj = {
  urls: "",
  title: "",
};

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
        let mentionregEx = /\B@\w+/g;
        let mentions = message.match(mentionregEx);
        if (mentions && mentions.length) {
          seedData.mentions = [...mentions];
        }
        let emoticonRegex = message
          .match(/\((.*?)\)/g)
          .map((b) => b.replace(/\(|(.*?)\)/g, "$1"));
        if (emoticonRegex && emoticonRegex.length) {
          seedData.emoticons = emoticonRegex.filter(emote => emote.length <= 15)
        }
        let urlRegex = message.match(
          /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim
        );
        seedData.links = [];
        if (urlRegex && urlRegex.length) {
          try {
            const data = await Promise.all(
              urlRegex.map((url) => getTitle(url))
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

function getTitle(url) {
  return fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
    .then((response) => {
      if (response.ok) return response.json();
      throw new Error("Network response was not ok.");
    })
    .then((data) => {
      const dom = new JSDOM(data.contents, { conntentType: "text/html" });
      const title =
        dom.window.document.querySelectorAll("title")[0].textContent;
      linkObj.urls = url;
      linkObj.title = title;
      seedData.links.push(linkObj);
      return linkObj;
    });
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
