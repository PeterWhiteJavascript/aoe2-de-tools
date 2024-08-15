module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/**/*.json')
  eleventyConfig.addPassthroughCopy('src/**/*.ico')
  eleventyConfig.addPassthroughCopy('src/**/*.pdf')
  eleventyConfig.addPassthroughCopy('src/**/*.webp')
  eleventyConfig.addPassthroughCopy('src/**/*.jpeg')
  eleventyConfig.addPassthroughCopy('src/**/*.jpg')
  eleventyConfig.addPassthroughCopy('src/**/*.css')
  eleventyConfig.addPassthroughCopy('src/**/*.js')
  eleventyConfig.addPassthroughCopy('src/**/*.txt')
  return {
    dir: {
      input: 'src',
      output: 'public',
    },
  }
}
