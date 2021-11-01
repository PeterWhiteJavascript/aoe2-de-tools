module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/**/*.json')
  eleventyConfig.addPassthroughCopy('src/**/*.ico')
  eleventyConfig.addPassthroughCopy('src/**/*.pdf')
  eleventyConfig.addPassthroughCopy('src/**/*.png')
  eleventyConfig.addPassthroughCopy('src/**/*.jpeg')
  eleventyConfig.addPassthroughCopy('src/**/*.jpg')
  eleventyConfig.addPassthroughCopy('src/**/*.css')
  eleventyConfig.addPassthroughCopy('src/**/*.js')
  return {
    dir: {
      input: 'src',
      output: 'public',
    },
  }
}
