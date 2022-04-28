const { execSync } = require('child_process');
const cheerio = require('cheerio');

module.exports = function markdownItGraphVizExec(md, options = {}) {
  
  const openMarker = options.openMarker || '```graphviz'
  const openChar = openMarker.charCodeAt(0)
  const closeMarker = options.closeMarker || '```'
  const closeChar = closeMarker.charCodeAt(0)
  
  function render(tokens, idx, options, env, slf) {
    try {
      const { content, info } = tokens[idx]
      const info_obj = JSON.parse(info.length ? info : '{}')
      const attrs = info_obj.attrs || {}
      const cmd = [
        'dot',
        'neato',
        'twopi',
        'circo',
        'fdp',
        'sfdp',
        'patchwork',
        'osage',
      ].includes(info_obj.cmd) ? info_obj.cmd : 'dot'
      info_obj.cmd = undefined
      const svg = execSync(`${cmd} -Tsvg`, { input: content })
      const $svg = cheerio.load(svg, { xmlMode: true })('svg')
      
      for (const [key, value] of Object.entries(attrs)) {
        $svg.attr(key, value)
      }
      // TODO: Implement block options
      
      return $svg.toString()
    }
    catch (error) {
      return `<p style="border: 2px dashed red">Failed to render graphviz<span>${md.utils.escapeHtml(error.toString())}</span></p>`
    }
  }

  function graphviz(state, startLine, endLine, silent) {
    let nextLine
    let i
    let autoClosed = false
    let start = state.bMarks[startLine] + state.tShift[startLine]
    let max = state.eMarks[startLine]

    // Check out the first character quickly,
    // this should filter out most of non-uml blocks
    if (openChar !== state.src.charCodeAt(start)) {
      return false
    }

    // Check out the rest of the marker string
    for (i = 0; i < openMarker.length; ++i) {
      if (openMarker[i] !== state.src[start + i]) {
        return false
      }
    }

    const markup = state.src.slice(start, start + i)
    const params = state.src.slice(start + i, max)

    // Since start is found, we can report success here in validation mode
    if (silent) {
      return true
    }

    // Search for the end of the block
    nextLine = startLine

    for (; ;) {
      nextLine++
      if (nextLine >= endLine) {
        // unclosed block should be autoclosed by end of document.
        // also block seems to be autoclosed by end of parent
        break
      }

      start = state.bMarks[nextLine] + state.tShift[nextLine]
      max = state.eMarks[nextLine]

      if (start < max && state.sCount[nextLine] < state.blkIndent) {
        // non-empty line with negative indent should stop the list:
        // - ```
        //  test
        break
      }

      if (closeChar !== state.src.charCodeAt(start)) {
        // didn't find the closing fence
        continue
      }

      if (state.sCount[nextLine] > state.sCount[startLine]) {
        // closing fence should not be indented with respect of opening fence
        continue
      }

      let closeMarkerMatched = true
      for (i = 0; i < closeMarker.length; ++i) {
        if (closeMarker[i] !== state.src[start + i]) {
          closeMarkerMatched = false
          break
        }
      }

      if (!closeMarkerMatched) {
        continue
      }

      // make sure tail has spaces only
      if (state.skipSpaces(start + i) < max) {
        continue
      }

      // found!
      autoClosed = true
      break
    }

    const contents = state.src
      .split('\n')
      .slice(startLine + 1, nextLine)
      .join('\n')

    const token = state.push('graphviz', 'fence', 0)
    // token.block = true
    token.info = params
    token.content = contents
    //token.map = [startLine, nextLine]
    // token.markup = markup

    state.line = nextLine + (autoClosed ? 1 : 0)

    return true
  }
  
  md.block.ruler.before('fence', 'graphviz', graphviz, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  })
  
  md.renderer.rules.graphviz = render
}
