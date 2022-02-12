# AOE2: DE Tools

Hosted at https://aoe2-de-tools.herokuapp.com/

## Local development

### Requirements

* [Node.js](https://nodejs.org/en/download/)
* [npx](https://www.npmjs.com/package/npx)

### Running the app

1. In the command line:

```shell
npm install # Install dependencies
npx @11ty/eleventy # Build static files
node app.js # Start the server
```

2. Visit http://localhost:5000/ (or whichever port is indicated by the last command's output)

### Lossless images

Images in the PNG format were replaced in [#20](https://github.com/PeterWhiteJavascript/aoe2-de-tools/pull/20), but can still be found [here](https://github.com/PeterWhiteJavascript/aoe2-de-tools/tree/5fbf8a7/src/img) or checked out via:
```shell
git checkout 5fbf8a7 -- src/img
```
