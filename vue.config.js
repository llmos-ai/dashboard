const config = require("./shell/vue.config");

const defaultExcludes = "rancher-components";

const excludes = process.env.EXCLUDES_PKG || defaultExcludes;

module.exports = config(__dirname, {
  excludes: excludes.replace(/\s/g, "").split(","),
});