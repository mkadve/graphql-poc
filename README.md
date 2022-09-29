## Installation

This POC requires [Node.js](https://nodejs.org/) v12+ to run.
Install the dependencies to start the server.

```sh
clone the project
cd project_directory
npm i
npm run dev
```

## Run GraphQl through UI

Please enter the following url to launch graphiQL UI.

```sh
http://localhost:3000/graphql?
```

After that, you may run the command below to run query to check the desired results.

```sh
{
  records(message: "@bob @john (success) such a cool feature; http://www.nbcolympics.com") {
    mentions, emoticons, links
  }
}

```
